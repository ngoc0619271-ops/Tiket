use soroban_sdk::contracttype;

/// Storage keys. `Event` and `Ticket` live in *persistent* storage (they must
/// outlive the contract instance); `Admin`/`Token`/counters live in *instance*
/// storage so they share the instance's TTL.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    /// Stellar Asset Contract address of the settlement token (native XLM SAC).
    Token,
    EventCounter,
    TicketCounter,
    /// event id -> Event
    Event(u64),
    /// ticket id -> Ticket
    Ticket(u64),
}

// Soroban ledgers close ~every 5s → 17,280 ledgers/day.
pub const DAY_IN_LEDGERS: u32 = 17_280;

// Keep the contract instance (admin/config) alive for ~30 days, re-bumped on
// every state-changing call.
pub const INSTANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
pub const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

// Events and tickets are bumped to ~90 days so escrowed funds can never be
// stranded by entry expiry before a check-in or refund.
pub const ENTRY_BUMP_AMOUNT: u32 = 90 * DAY_IN_LEDGERS;
pub const ENTRY_LIFETIME_THRESHOLD: u32 = ENTRY_BUMP_AMOUNT - DAY_IN_LEDGERS;
