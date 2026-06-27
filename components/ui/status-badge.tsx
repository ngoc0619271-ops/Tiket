import { cn } from '@/lib/utils';

const styles: Record<string, string> = {
  issued: 'bg-primary/10 text-primary ring-primary/20',
  used: 'bg-success/10 text-success ring-success/20',
  refunded: 'bg-muted-foreground/10 text-muted-foreground ring-muted-foreground/20',
  revoked: 'bg-destructive/10 text-destructive ring-destructive/20',
  active: 'bg-success/10 text-success ring-success/20',
  cancelled: 'bg-muted-foreground/10 text-muted-foreground ring-muted-foreground/20',
};

const labels: Record<string, string> = {
  issued: 'Valid',
  used: 'Checked in',
  refunded: 'Refunded',
  revoked: 'Revoked',
  active: 'On sale',
  cancelled: 'Closed',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        styles[status] ?? 'bg-muted text-muted-foreground ring-border',
        className,
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}
