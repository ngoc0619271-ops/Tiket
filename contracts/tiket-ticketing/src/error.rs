use soroban_sdk::contracterror;

/// All failure modes are explicit, contiguous `u32` codes so the TypeScript
/// client can map them to user-facing messages without guessing.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    InvalidPrice = 4,
    InvalidCapacity = 5,
    InvalidTime = 6,
    EventNotFound = 7,
    EventInactive = 8,
    SoldOut = 9,
    TicketNotFound = 10,
    AlreadyUsed = 11,
    AlreadyRefunded = 12,
    EventStarted = 13,
    NothingToSettle = 14,
}
