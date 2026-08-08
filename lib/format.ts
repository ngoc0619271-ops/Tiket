export type EventDTO = {
  id: string;
  organizerPublicKey: string;
  name: string;
  description: string;
  venue: string;
  city: string;
  eventDate: string;
  price: string;
  priceAsset: string;
  totalCapacity: number;
  soldCount: number;
  usedCount: number;
  assetCode: string;
  assetIssuer: string;
  onchainEventId: string | null;
  createTxHash: string | null;
  status: string;
};

export type TicketDTO = {
  id: string;
  eventId: string;
  buyerPublicKey: string;
  buyerName: string;
  assetCode: string;
  assetIssuer: string;
  paymentAsset: string;
  pricePaid: string;
  status: string;
  onchainTicketId: string | null;
  buyTxHash: string | null;
  checkinTxHash: string | null;
  refundTxHash: string | null;
  checkinAt: string | null;
  createdAt: string;
};

export function formatPrice(price: string, asset: string): string {
  const n = Number(price);
  if (!n) return 'Free';
  const trimmed = n.toLocaleString('en-US', { maximumFractionDigits: 7 });
  return `${trimmed} ${asset}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
