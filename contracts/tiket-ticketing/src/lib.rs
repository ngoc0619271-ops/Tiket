#![no_std]
//! # Tiket Ticketing
//!
//! A Soroban smart contract that runs the **core event-ticketing flow on-chain**:
//!
//! 1. An **organizer creates an event** with a price and a capacity.
//! 2. A **buyer buys a ticket** — the price is pulled into the contract's escrow
//!    and an on-chain `Ticket { owner, event, status: Valid }` is recorded.
//! 3. The **organizer checks the holder in** (`check_in`), which marks the ticket
//!    `Used` on-chain and **settles the escrowed price to the organizer**.
//! 4. Before the event starts a buyer can **refund**, reclaiming their escrowed
//!    price; the ticket flips to `Refunded`.
//!
//! Proceeds are forwarded to the organizer only when an attendee actually shows
//! up (check-in), which is exactly what makes the pre-event refund path safe:
//! the money is held by the contract — not the organizer — until then. Money is
//! never stuck, and no intermediary can move it.
//!
//! ## Advanced features
//! - **Token escrow via the Stellar Asset Contract (SAC)** — real value custody
//!   (settlement token is the native XLM SAC; works for any funded wallet, no
//!   trustline required).
//! - **Authorization** — `require_auth` on buyer (buy/refund) and organizer
//!   (create_event/check_in); the contract-as-custodian pays out from itself.
//! - **Capacity enforcement & double-spend guard** — a ticket can be checked in
//!   or refunded exactly once.
//! - **Events** — `init`, `event`, `buy`, `checkin`, `refund` for indexers.
//! - **Storage TTL management** — instance and entry storage are bumped so
//!   escrow never expires out from under a pending check-in or refund.

mod error;
mod storage;
mod types;

#[cfg(test)]
mod test;

use error::Error;
use storage::{
    DataKey, ENTRY_BUMP_AMOUNT, ENTRY_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT,
    INSTANCE_LIFETIME_THRESHOLD,
};
use types::{Event, EventStatus, Ticket, TicketStatus};

use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Env};

#[contract]
pub struct TiketTicketing;

#[contractimpl]
impl TiketTicketing {
    /// One-time setup. Records the admin and the settlement token (XLM SAC).
    pub fn initialize(env: Env, admin: Address, token: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::EventCounter, &0u64);
        env.storage().instance().set(&DataKey::TicketCounter, &0u64);
        bump_instance(&env);
        env.events().publish((symbol_short!("init"),), admin);
        Ok(())
    }

    /// Organizer creates an event. Returns the new event id.
    ///
    /// Auth: requires the organizer's signature.
    pub fn create_event(
        env: Env,
        organizer: Address,
        price: i128,
        capacity: u32,
        start_time: u64,
    ) -> Result<u64, Error> {
        organizer.require_auth();
        require_initialized(&env)?;

        if price < 0 {
            return Err(Error::InvalidPrice);
        }
        if capacity == 0 {
            return Err(Error::InvalidCapacity);
        }
        if start_time <= env.ledger().timestamp() {
            return Err(Error::InvalidTime);
        }

        let id = next_event_id(&env);
        let event = Event {
            organizer: organizer.clone(),
            price,
            capacity,
            sold: 0,
            start_time,
            status: EventStatus::Active,
        };
        save_event(&env, id, &event);
        bump_instance(&env);

        env.events()
            .publish((symbol_short!("event"), id), (organizer, price, capacity));
        Ok(id)
    }

    /// Buyer buys a ticket for `event_id`. The price is escrowed into the
    /// contract and an on-chain ticket is recorded. Returns the new ticket id.
    ///
    /// Auth: requires the buyer's signature (the same authorization covers the
    /// inner SAC `transfer(buyer -> contract)`).
    pub fn buy(env: Env, event_id: u64, buyer: Address) -> Result<u64, Error> {
        buyer.require_auth();

        let mut event = load_event(&env, event_id)?;
        if event.status != EventStatus::Active {
            return Err(Error::EventInactive);
        }
        if event.sold >= event.capacity {
            return Err(Error::SoldOut);
        }

        // Escrow the price into the contract (skipped for free events).
        if event.price > 0 {
            token_client(&env).transfer(
                &buyer,
                &env.current_contract_address(),
                &event.price,
            );
        }

        event.sold += 1;
        save_event(&env, event_id, &event);

        let ticket_id = next_ticket_id(&env);
        let ticket = Ticket {
            event_id,
            owner: buyer.clone(),
            price_paid: event.price,
            status: TicketStatus::Valid,
        };
        save_ticket(&env, ticket_id, &ticket);
        bump_instance(&env);

        env.events()
            .publish((symbol_short!("buy"), event_id, ticket_id), (buyer, event.price));
        Ok(ticket_id)
    }

    /// Organizer checks a holder in. Marks the ticket `Used` on-chain and
    /// settles the escrowed price to the organizer.
    ///
    /// Auth: requires the event organizer's signature (organizer-only).
    pub fn check_in(env: Env, ticket_id: u64) -> Result<(), Error> {
        let mut ticket = load_ticket(&env, ticket_id)?;
        let event = load_event(&env, ticket.event_id)?;
        event.organizer.require_auth();

        match ticket.status {
            TicketStatus::Used => return Err(Error::AlreadyUsed),
            TicketStatus::Refunded => return Err(Error::AlreadyRefunded),
            TicketStatus::Valid => {}
        }

        // Settle the escrowed price to the organizer (skipped for free events).
        if ticket.price_paid > 0 {
            token_client(&env).transfer(
                &env.current_contract_address(),
                &event.organizer,
                &ticket.price_paid,
            );
        }

        ticket.status = TicketStatus::Used;
        save_ticket(&env, ticket_id, &ticket);
        bump_instance(&env);

        env.events()
            .publish((symbol_short!("checkin"), ticket.event_id, ticket_id), event.organizer);
        Ok(())
    }

    /// Buyer refunds a ticket before the event starts. Returns the escrowed
    /// price to the owner and flips the ticket to `Refunded`.
    ///
    /// Auth: requires the ticket owner's signature.
    pub fn refund(env: Env, ticket_id: u64) -> Result<i128, Error> {
        let mut ticket = load_ticket(&env, ticket_id)?;
        ticket.owner.require_auth();

        match ticket.status {
            TicketStatus::Used => return Err(Error::AlreadyUsed),
            TicketStatus::Refunded => return Err(Error::AlreadyRefunded),
            TicketStatus::Valid => {}
        }

        let event = load_event(&env, ticket.event_id)?;
        if env.ledger().timestamp() >= event.start_time {
            return Err(Error::EventStarted);
        }

        let amount = ticket.price_paid;
        if amount > 0 {
            token_client(&env).transfer(
                &env.current_contract_address(),
                &ticket.owner,
                &amount,
            );
        }

        ticket.status = TicketStatus::Refunded;
        save_ticket(&env, ticket_id, &ticket);
        bump_instance(&env);

        env.events()
            .publish((symbol_short!("refund"), ticket.event_id, ticket_id), (ticket.owner, amount));
        Ok(amount)
    }

    /// Organizer cancels an event, stopping further sales. Existing tickets can
    /// still be refunded before the start time.
    pub fn cancel_event(env: Env, event_id: u64) -> Result<(), Error> {
        let mut event = load_event(&env, event_id)?;
        event.organizer.require_auth();
        event.status = EventStatus::Cancelled;
        save_event(&env, event_id, &event);
        bump_instance(&env);
        Ok(())
    }

    // --- Views -------------------------------------------------------------

    pub fn get_event(env: Env, event_id: u64) -> Result<Event, Error> {
        load_event(&env, event_id)
    }

    pub fn get_ticket(env: Env, ticket_id: u64) -> Result<Ticket, Error> {
        load_ticket(&env, ticket_id)
    }

    pub fn total_events(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::EventCounter)
            .unwrap_or(0u64)
    }

    pub fn total_tickets(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::TicketCounter)
            .unwrap_or(0u64)
    }

    pub fn get_admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_token(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Token)
            .ok_or(Error::NotInitialized)
    }
}

// --- Internal helpers ------------------------------------------------------

fn require_initialized(env: &Env) -> Result<(), Error> {
    if env.storage().instance().has(&DataKey::Admin) {
        Ok(())
    } else {
        Err(Error::NotInitialized)
    }
}

fn token_client(env: &Env) -> token::Client<'_> {
    let token: Address = env
        .storage()
        .instance()
        .get(&DataKey::Token)
        .expect("token not set");
    token::Client::new(env, &token)
}

fn next_event_id(env: &Env) -> u64 {
    let current: u64 = env
        .storage()
        .instance()
        .get(&DataKey::EventCounter)
        .unwrap_or(0u64);
    let id = current + 1;
    env.storage().instance().set(&DataKey::EventCounter, &id);
    id
}

fn next_ticket_id(env: &Env) -> u64 {
    let current: u64 = env
        .storage()
        .instance()
        .get(&DataKey::TicketCounter)
        .unwrap_or(0u64);
    let id = current + 1;
    env.storage().instance().set(&DataKey::TicketCounter, &id);
    id
}

fn load_event(env: &Env, id: u64) -> Result<Event, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Event(id))
        .ok_or(Error::EventNotFound)
}

fn save_event(env: &Env, id: u64, event: &Event) {
    let key = DataKey::Event(id);
    env.storage().persistent().set(&key, event);
    env.storage()
        .persistent()
        .extend_ttl(&key, ENTRY_LIFETIME_THRESHOLD, ENTRY_BUMP_AMOUNT);
}

fn load_ticket(env: &Env, id: u64) -> Result<Ticket, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Ticket(id))
        .ok_or(Error::TicketNotFound)
}

fn save_ticket(env: &Env, id: u64, ticket: &Ticket) {
    let key = DataKey::Ticket(id);
    env.storage().persistent().set(&key, ticket);
    env.storage()
        .persistent()
        .extend_ttl(&key, ENTRY_LIFETIME_THRESHOLD, ENTRY_BUMP_AMOUNT);
}

fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}
