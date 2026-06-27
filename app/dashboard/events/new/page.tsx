'use client';

import { ArrowLeft, Loader2, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConnectButton } from '@/components/connect-button';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/components/wallet-provider';
import { post } from '@/lib/api';
import type { EventDTO } from '@/lib/format';

const field =
  'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring';

export default function NewEventPage() {
  const { status, signXdr } = useWallet();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    venue: '',
    city: '',
    eventDate: '',
    price: '',
    totalCapacity: '',
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.venue || !form.eventDate || !form.totalCapacity) {
      toast.error('Fill in name, venue, date and capacity');
      return;
    }
    const cap = Number(form.totalCapacity);
    if (!Number.isInteger(cap) || cap <= 0) {
      toast.error('Capacity must be a positive whole number');
      return;
    }
    const eventDate = new Date(form.eventDate).toISOString();
    const price = form.price.trim() || '0';
    setSubmitting(true);
    try {
      // 1. Build the organizer-signed Soroban `create_event` invoke.
      const { xdr } = await post<{ xdr: string }>('/api/events/build', {
        eventDate,
        price,
        totalCapacity: cap,
      });
      // 2. Sign with the wallet, then submit on-chain + persist.
      const signedXdr = await signXdr(xdr);
      const { event } = await post<{ event: EventDTO }>('/api/events', {
        name: form.name.trim(),
        description: form.description.trim() || form.name.trim(),
        venue: form.venue.trim(),
        city: form.city.trim(),
        eventDate,
        price,
        totalCapacity: cap,
        signedXdr,
      });
      toast.success('Event created on-chain');
      router.push(`/dashboard/events/${event.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create event');
      setSubmitting(false);
    }
  }

  if (status !== 'connected') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <Wallet className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-xl font-bold text-ink">Connect to create events</h1>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            You sign in with your wallet so passes pay out to your account.
          </p>
          <div className="mt-5 flex justify-center">
            <ConnectButton size="lg" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to console
      </Link>
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Create an event</h1>
      <p className="mt-2 text-muted-foreground">
        You sign one transaction to register the event on the Tiket Soroban contract. Buyers&apos;
        payments are escrowed by the contract and settle to your wallet when you check them in.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="name">
            Event name
          </label>
          <input
            id="name"
            className={field}
            value={form.name}
            maxLength={100}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Stellar Builders Night"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className={`${field} min-h-[88px] resize-y`}
            value={form.description}
            maxLength={600}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What attendees can expect…"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="venue">
              Venue
            </label>
            <input
              id="venue"
              className={field}
              value={form.venue}
              maxLength={200}
              onChange={(e) => set('venue', e.target.value)}
              placeholder="The Foundry"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="city">
              City <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="city"
              className={field}
              value={form.city}
              maxLength={100}
              onChange={(e) => set('city', e.target.value)}
              placeholder="Singapore"
            />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="eventDate">
              Date &amp; time
            </label>
            <input
              id="eventDate"
              type="datetime-local"
              className={field}
              value={form.eventDate}
              onChange={(e) => set('eventDate', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="totalCapacity">
              Capacity
            </label>
            <input
              id="totalCapacity"
              type="number"
              min={1}
              className={field}
              value={form.totalCapacity}
              onChange={(e) => set('totalCapacity', e.target.value)}
              placeholder="100"
            />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="price">
              Price in XLM <span className="text-muted-foreground">(0 = free)</span>
            </label>
            <input
              id="price"
              inputMode="decimal"
              className={field}
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="5"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Settles in native XLM — no trustline needed for buyers.
            </p>
          </div>
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Signing &amp; creating…
            </>
          ) : (
            'Create event'
          )}
        </Button>
      </form>
    </main>
  );
}
