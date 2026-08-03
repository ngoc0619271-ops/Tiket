#![cfg(test)]

use crate::{Error, EventStatus, TicketStatus, TiketTicketing, TiketTicketingClient};
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

const NOW: u64 = 1_000;
const START: u64 = 1_000_000;
const FUND: i128 = 1_000_000_000;

struct Harness {
    env: Env,
    admin: Address,
    organizer: Address,
    buyer: Address,
    token: Address,
    contract: TiketTicketingClient<'static>,
}

fn setup() -> Harness {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(NOW);

    let admin = Address::generate(&env);
    let organizer = Address::generate(&env);
    let buyer = Address::generate(&env);

    // Register a SAC token (stands in for the native XLM SAC) and fund the buyer.
    let issuer = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(issuer);
    let token = sac.address();
    StellarAssetClient::new(&env, &token).mint(&buyer, &FUND);

    let contract_id = env.register(TiketTicketing, ());
    let contract = TiketTicketingClient::new(&env, &contract_id);
    contract.initialize(&admin, &token);

    Harness { env, admin, organizer, buyer, token, contract }
}

#[test]
fn test_initialize() {
    let h = setup();
    assert_eq!(h.contract.get_admin(), h.admin);
    assert_eq!(h.contract.get_token(), h.token);
    assert_eq!(h.contract.total_events(), 0);
    assert_eq!(h.contract.total_tickets(), 0);
}

#[test]
fn test_initialize_twice_fails() {
    let h = setup();
    let res = h.contract.try_initialize(&h.admin, &h.token);
    assert_eq!(res, Err(Ok(Error::AlreadyInitialized)));
}

#[test]
fn test_create_event() {
    let h = setup();
    let id = h.contract.create_event(&h.organizer, &100_000, &50, &START);
    assert_eq!(id, 1);
    let ev = h.contract.get_event(&id);
    assert_eq!(ev.organizer, h.organizer);
    assert_eq!(ev.price, 100_000);
    assert_eq!(ev.capacity, 50);
    assert_eq!(ev.sold, 0);
    assert_eq!(ev.status, EventStatus::Active);
    assert_eq!(h.contract.total_events(), 1);
}

#[test]
fn test_create_event_invalid_params() {
    let h = setup();
    assert_eq!(
        h.contract.try_create_event(&h.organizer, &-1, &10, &START),
        Err(Ok(Error::InvalidPrice))
    );
    assert_eq!(
        h.contract.try_create_event(&h.organizer, &100, &0, &START),
        Err(Ok(Error::InvalidCapacity))
    );
    // start_time in the past
    assert_eq!(
        h.contract.try_create_event(&h.organizer, &100, &10, &NOW),
        Err(Ok(Error::InvalidTime))
    );
}

#[test]
fn test_buy_escrows_funds() {
    let h = setup();
    let token = TokenClient::new(&h.env, &h.token);
    let event_id = h.contract.create_event(&h.organizer, &100_000, &50, &START);

    let ticket_id = h.contract.buy(&event_id, &h.buyer);
    assert_eq!(ticket_id, 1);

    // Funds left the buyer and now sit in the contract's escrow.
    assert_eq!(token.balance(&h.buyer), FUND - 100_000);
    assert_eq!(token.balance(&h.contract.address), 100_000);

    let ticket = h.contract.get_ticket(&ticket_id);
    assert_eq!(ticket.event_id, event_id);
    assert_eq!(ticket.owner, h.buyer);
    assert_eq!(ticket.price_paid, 100_000);
    assert_eq!(ticket.status, TicketStatus::Valid);
    assert_eq!(h.contract.get_event(&event_id).sold, 1);
    assert_eq!(h.contract.total_tickets(), 1);
}

#[test]
fn test_buy_sold_out() {
    let h = setup();
    let event_id = h.contract.create_event(&h.organizer, &0, &1, &START);
    h.contract.buy(&event_id, &h.buyer);
    let other = Address::generate(&h.env);
    assert_eq!(h.contract.try_buy(&event_id, &other), Err(Ok(Error::SoldOut)));
}

#[test]
fn test_buy_unknown_event_fails() {
    let h = setup();
    assert_eq!(h.contract.try_buy(&999, &h.buyer), Err(Ok(Error::EventNotFound)));
}

#[test]
fn test_check_in_settles_to_organizer() {
    let h = setup();
    let token = TokenClient::new(&h.env, &h.token);
    let event_id = h.contract.create_event(&h.organizer, &250_000, &50, &START);
    let ticket_id = h.contract.buy(&event_id, &h.buyer);

    h.contract.check_in(&ticket_id);

    // Escrowed price has been forwarded to the organizer.
    assert_eq!(token.balance(&h.organizer), 250_000);
    assert_eq!(token.balance(&h.contract.address), 0);
    assert_eq!(h.contract.get_ticket(&ticket_id).status, TicketStatus::Used);
}

#[test]
fn test_check_in_twice_fails() {
    let h = setup();
    let event_id = h.contract.create_event(&h.organizer, &100_000, &50, &START);
    let ticket_id = h.contract.buy(&event_id, &h.buyer);
    h.contract.check_in(&ticket_id);
    assert_eq!(h.contract.try_check_in(&ticket_id), Err(Ok(Error::AlreadyUsed)));
}

#[test]
fn test_check_in_unknown_ticket_fails() {
    let h = setup();
    assert_eq!(h.contract.try_check_in(&999), Err(Ok(Error::TicketNotFound)));
}

#[test]
fn test_refund_before_start_returns_funds() {
    let h = setup();
    let token = TokenClient::new(&h.env, &h.token);
    let event_id = h.contract.create_event(&h.organizer, &500_000, &50, &START);
    let ticket_id = h.contract.buy(&event_id, &h.buyer);

    // Still before the event start (ledger timestamp = NOW < START).
    let refunded = h.contract.refund(&ticket_id);
    assert_eq!(refunded, 500_000);
    assert_eq!(token.balance(&h.buyer), FUND); // made whole
    assert_eq!(token.balance(&h.contract.address), 0);
    assert_eq!(h.contract.get_ticket(&ticket_id).status, TicketStatus::Refunded);
}

#[test]
fn test_refund_after_start_fails() {
    let h = setup();
    let event_id = h.contract.create_event(&h.organizer, &100_000, &50, &START);
    let ticket_id = h.contract.buy(&event_id, &h.buyer);
    // Move ledger time to the event start.
    h.env.ledger().set_timestamp(START);
    assert_eq!(h.contract.try_refund(&ticket_id), Err(Ok(Error::EventStarted)));
}

#[test]
fn test_refund_after_used_fails() {
    let h = setup();
    let event_id = h.contract.create_event(&h.organizer, &100_000, &50, &START);
    let ticket_id = h.contract.buy(&event_id, &h.buyer);
    h.contract.check_in(&ticket_id);
    assert_eq!(h.contract.try_refund(&ticket_id), Err(Ok(Error::AlreadyUsed)));
}

#[test]
fn test_free_event_buy_and_checkin() {
    let h = setup();
    let token = TokenClient::new(&h.env, &h.token);
    let event_id = h.contract.create_event(&h.organizer, &0, &10, &START);
    let ticket_id = h.contract.buy(&event_id, &h.buyer);

    // No value moved for a free event.
    assert_eq!(token.balance(&h.buyer), FUND);
    assert_eq!(token.balance(&h.contract.address), 0);

    h.contract.check_in(&ticket_id);
    assert_eq!(h.contract.get_ticket(&ticket_id).status, TicketStatus::Used);
    assert_eq!(token.balance(&h.organizer), 0);
}

#[test]
fn test_cancel_event_blocks_sales() {
    let h = setup();
    let event_id = h.contract.create_event(&h.organizer, &100_000, &50, &START);
    h.contract.cancel_event(&event_id);
    assert_eq!(h.contract.get_event(&event_id).status, EventStatus::Cancelled);
    assert_eq!(h.contract.try_buy(&event_id, &h.buyer), Err(Ok(Error::EventInactive)));
}
