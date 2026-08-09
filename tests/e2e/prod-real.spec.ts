import path from 'node:path';
import { type BrowserContext, type Page, chromium, expect, test } from '@playwright/test';
import {
  approveOnce,
  cleanup,
  FREIGHTER,
  getExtensionId,
  launchWithFreighter,
  onboardFreighter,
} from '../../../../../shared/freighter/freighter-fixture';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://tiket-mu.vercel.app';
const SHOTS = path.resolve(process.cwd(), '..', 'screen-shot');
const shot = (name: string) => path.join(SHOTS, name);
const PUB = FREIGHTER.deployerPublic;

test.describe.configure({ mode: 'serial' });

let context: BrowserContext;
let userDataDir: string;

test.beforeAll(async () => {
  const launched = await launchWithFreighter(chromium);
  context = launched.context;
  userDataDir = launched.userDataDir;
  await onboardFreighter(context);
});

test.afterAll(async () => {
  if (context) await cleanup(context, userDataDir);
});

function walletStatus(page: Page): import('@playwright/test').Locator {
  return page.getByTestId('wallet-address');
}

async function isConnected(page: Page): Promise<boolean> {
  return walletStatus(page).isVisible().catch(() => false);
}

const APPROVAL_ROUTES = ['grant-access', 'sign-transaction', 'sign-auth-entry', 'sign-message'];

function findApprovalPopup(ctx: BrowserContext): Page | null {
  const prefix = `chrome-extension://${getExtensionId(ctx)}`;
  for (const p of ctx.pages()) {
    if (p.isClosed() || !p.url().startsWith(prefix)) continue;
    if (APPROVAL_ROUTES.some((route) => p.url().includes(route))) return p;
  }
  return null;
}

const POPUP_CONTENT_TESTIDS = [
  'grant-access-connect-button',
  'grant-access-connect-anyway-button',
  'sign-transaction-sign',
  'sign-auth-entry-approve-button',
  'sign-message-approve-button',
];

async function popupHasContent(popup: Page): Promise<boolean> {
  for (const tid of POPUP_CONTENT_TESTIDS) {
    const loc = popup.locator(`[data-testid=${tid}]`);
    if ((await loc.count()) > 0 && (await loc.first().isVisible().catch(() => false))) return true;
  }
  return false;
}

async function captureApprovalPopup(ctx: BrowserContext, file: string, ms: number): Promise<void> {
  const deadline = Date.now() + ms;
  let latest: Page | null = null;
  while (Date.now() < deadline) {
    const popup = findApprovalPopup(ctx);
    if (popup) {
      latest = popup;
      if (await popupHasContent(popup)) {
        await popup.waitForTimeout(350);
        await popup.screenshot({ path: file, type: 'jpeg', quality: 85 }).catch(() => {});
        return;
      }
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  if (latest) await latest.screenshot({ path: file, type: 'jpeg', quality: 85 }).catch(() => {});
}

async function connectWallet(ctx: BrowserContext, page: Page): Promise<void> {
  const connectBtn = page.getByTestId('connect-button').first();
  await expect(connectBtn).toBeVisible({ timeout: 25_000 });
  await connectBtn.click();

  await captureApprovalPopup(ctx, shot('02-connect-popup.jpg'), 15_000);
  await approveOnce(ctx, { timeout: 60_000 }).catch(() => {});
  await captureApprovalPopup(ctx, shot('03-approve.jpg'), 15_000);
  await approveOnce(ctx, { timeout: 60_000 }).catch(() => {});
  if (await isConnected(page)) return;

  for (let attempt = 0; attempt < 4; attempt++) {
    await approveOnce(ctx, { timeout: 15_000 }).catch(() => {});
    if (await isConnected(page)) return;
    if (await connectBtn.isVisible().catch(() => false)) {
      await connectBtn.click().catch(() => {});
    }
    await page.waitForTimeout(2000);
  }
  await expect(walletStatus(page)).toBeVisible({ timeout: 20_000 });
}

type SignAction = {
  label: string;
  trigger: () => Promise<void>;
  confirm: () => Promise<boolean>;
  capture?: string;
};

async function signOnChainWithRetry(ctx: BrowserContext, page: Page, action: SignAction): Promise<void> {
  for (let attempt = 0; attempt < 4; attempt++) {
    await action.trigger();
    if (action.capture && attempt === 0) {
      await captureApprovalPopup(ctx, action.capture, 12_000);
    }
    await approveOnce(ctx, { timeout: 60_000 }).catch(() => {});
    if (await action.confirm()) return;
    await page.waitForTimeout(4000);
  }
  throw new Error(`on-chain action '${action.label}' did not confirm after 4 attempts`);
}

function eventStamp(): string {
  return Date.now().toString().slice(-6);
}

async function fillEventForm(page: Page, name: string): Promise<void> {
  await page.locator('#name').fill(name);
  await page.locator('#description').fill('Automated real-Freighter verification event.');
  await page.locator('#venue').fill('On-chain Hall');
  await page.locator('#city').fill('Testnet');
  await page.locator('#eventDate').fill('2026-12-01T19:00');
  await page.locator('#totalCapacity').fill('50');
  await page.locator('#price').fill('0');
}

async function createEvent(ctx: BrowserContext, page: Page, name: string): Promise<void> {
  await page.goto(`${BASE_URL}/dashboard/events/new`, { waitUntil: 'domcontentloaded' });
  await fillEventForm(page, name);
  await page.screenshot({ path: shot('04-create-event.jpg'), type: 'jpeg', quality: 85, fullPage: true });

  await signOnChainWithRetry(ctx, page, {
    label: 'create_event',
    trigger: async () => {
      await page.getByRole('button', { name: /create event/i }).click();
    },
    confirm: () =>
      page
        .waitForURL(/\/dashboard\/events\/[0-9a-f-]{36}/, { timeout: 60_000 })
        .then(() => true)
        .catch(() => false),
  });
}

async function openPurchaseDialog(page: Page, name: string): Promise<void> {
  await page.goto(`${BASE_URL}/events`, { waitUntil: 'domcontentloaded' });
  const card = page.locator('article', { hasText: name });
  await expect(card).toBeVisible({ timeout: 25_000 });
  await card.getByRole('button', { name: /get pass/i }).click();
  await page.screenshot({ path: shot('05-buy.jpg'), type: 'jpeg', quality: 85 });
}

async function buyPass(ctx: BrowserContext, page: Page): Promise<void> {
  await signOnChainWithRetry(ctx, page, {
    label: 'buy',
    capture: shot('03-approve.jpg'),
    trigger: async () => {
      await page.getByRole('button', { name: /pay & get pass|connect wallet & buy/i }).click();
    },
    confirm: () =>
      page
        .getByText(/pass is in your wallet/i)
        .waitFor({ state: 'visible', timeout: 60_000 })
        .then(() => true)
        .catch(() => false),
  });
}

async function assertOnChainTx(page: Page): Promise<string> {
  const txLink = page.getByRole('link', { name: /on-chain buy tx/i });
  await expect(txLink).toBeVisible({ timeout: 20_000 });
  const href = await txLink.getAttribute('href');
  expect(href).toMatch(/stellar\.expert\/explorer\/testnet\/tx\/[0-9a-f]{64}/);
  return href?.split('/tx/')[1] ?? '';
}

test('real Freighter: connect (SEP-10) + create event + on-chain ticket buy', async () => {
  test.setTimeout(420_000);
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /spent only once/i })).toBeVisible({
    timeout: 30_000,
  });
  await page.screenshot({ path: shot('01-landing.jpg'), type: 'jpeg', quality: 85, fullPage: true });

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
  await connectWallet(context, page);
  await expect(walletStatus(page)).toBeVisible({ timeout: 20_000 });

  const name = `E2E Real Night ${eventStamp()}`;
  await createEvent(context, page, name);
  await page.waitForTimeout(6000);

  await openPurchaseDialog(page, name);
  await buyPass(context, page);

  const txHash = await assertOnChainTx(page);
  expect(txHash).toMatch(/^[0-9a-f]{64}$/);
  // biome-ignore lint/suspicious/noConsole: surface the hash for the convert report
  console.log('PROD_TX_HASH=' + txHash);
  await page.screenshot({ path: shot('06-success.jpg'), type: 'jpeg', quality: 85, fullPage: true });

  await page.goto(`${BASE_URL}/stats`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /live platform stats/i })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator('main p.text-4xl').first()).toHaveText(/[0-9]/, { timeout: 15_000 });
  await page.screenshot({ path: shot('07-stats.jpg'), type: 'jpeg', quality: 85, fullPage: true });

  expect(PUB).toMatch(/^G[A-Z2-7]{55}$/);
});

test('mobile landing renders without horizontal scroll', async () => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /spent only once/i })).toBeVisible({
    timeout: 30_000,
  });
  const overflow = await page.evaluate(() => document.body.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.screenshot({ path: shot('08-mobile.jpg'), type: 'jpeg', quality: 85, fullPage: true });
});
