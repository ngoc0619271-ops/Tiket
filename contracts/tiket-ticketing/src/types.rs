use soroban_sdk::{contracttype, Address};

/// Lifecycle of an event. Created `Active`; an organizer may `Cancel` it, which
/// stops further sales (existing tickets can still be refunded before start).
#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum EventStatus {
    Active = 0,
    Cancelled = 1,
}

/// Lifecycle of a single ticket.
/// - `Valid`    : bought, escrowed, not yet used.
/// - `Used`     : the organizer checked the holder in; price settled to organizer.
/// - `Refunded` : the buyer reclaimed the price before the event started.
#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum TicketStatus {
    Valid = 0,
    Used = 1,
    Refunded = 2,
}

/// An on-chain event. Funds for its tickets are escrowed in the contract until
/// each ticket is either checked in (settles to the organizer) or refunded
/// (returns to the buyer).
#[contracttype]
#[derive(Clone)]
pub struct Event {
    /// Creator and the only address allowed to check attendees in.
    pub organizer: Address,
    /// Ticket price in the token's minor units (XLM = 7 decimals / stroops).
    /// `0` = free entry.
    pub price: i128,
    /// Maximum number of tickets that can be sold.
    pub capacity: u32,
    /// Tickets sold so far.
    pub sold: u32,
    /// Unix timestamp (ledger time). Refunds are allowed strictly before this.
    pub start_time: u64,
    pub status: EventStatus,
}

/// A single ticket. The contract custodies `price_paid` of the event token
/// until the ticket is used (paid out to the organizer) or refunded.
#[contracttype]
#[derive(Clone)]
pub struct Ticket {
    pub event_id: u64,
    /// Wallet that bought (and owns) the ticket; the only address that can refund.
    pub owner: Address,
    /// Amount escrowed for this ticket (the event price at purchase time).
    pub price_paid: i128,
    pub status: TicketStatus,
}
