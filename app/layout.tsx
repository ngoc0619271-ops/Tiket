import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { WalletProvider } from '@/components/wallet-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const grotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tiket — On-chain escrow event passes on Stellar',
  description:
    'Event tickets escrowed on a Soroban smart contract. Buyers pay into the contract, organizers settle on check-in, and unused passes refund before the event. No scalping, no forgery — every step verifiable on Stellar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <WalletProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </WalletProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
