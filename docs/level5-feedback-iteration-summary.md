# User Feedback Iteration Summary

The detailed 60-user roster is in [user-feedback-log.md](user-feedback-log.md). The
feedback focuses on the on-chain event ticketing journey from wallet connection through
escrowed purchase, organizer check-in, settlement, and pre-event refund.

## Feedback profile

- 60 users across `organizer` and `buyer` roles
- All feedback is written in English
- Gmail local parts vary across plain names, dotted names, numeric suffixes, and work/dev suffixes
- Every row is linked to a unique funded Stellar testnet public key

## Themes ↔ improvements ↔ commits

| Feedback theme | Improvement | Commit / evidence |
|---|---|---|
| Network and wallet context was easy to miss. | Keep the testnet badge beside wallet and explorer actions, and explain the selected network before signing. | `pending` — docs and UI follow-up |
| SEP-10 and Freighter steps need more explanation. | Add concise helper text that distinguishes wallet permission, challenge signing, and transaction signing. | `pending` — docs and UI follow-up |
| Ticket price and fee details need a single review surface. | Show asset, amount, fee, organizer, and contract before the Freighter confirmation. | `pending` — docs and UI follow-up |
| Purchase confirmation should expose escrow context. | Explain that `buy` moves the ticket amount into the Soroban contract until check-in or refund. | `pending` — docs and UI follow-up |
| Check-in and refund state must be unmistakable. | Use consistent Valid, Used, and Refunded badges with eligibility text and receipt links. | `pending` — docs and UI follow-up |
| Organizer workflows benefit from sorting and search. | Add attendee status filters, wallet search, and capacity warnings to the organizer dashboard. | `pending` — docs and UI follow-up |
| Pending and failed transactions need actionable recovery. | Preserve form state, distinguish rejected signatures from network errors, and add retry affordances. | `pending` — docs and UI follow-up |
| USDC opt-in needs clearer trustline context. | Keep the issuer, network, and trustline status visible while XLM remains the default settlement asset. | `pending` — docs and UI follow-up |
| Mobile and accessibility details affect completion. | Improve narrow-screen action placement, keyboard labels, and focus states across the ticket journey. | `pending` — docs and UI follow-up |
| Reviewers need one consistent evidence trail. | Link the feedback roster, funded-wallet snapshots, testnet contract, and deployment transactions from one proof package. | `docs/level5-proof-package.md` |

The commit column is intentionally `pending` because this working-tree evidence has not
been committed yet; replace it with the real commit SHA after committing the iteration.

User feedback log: [user-feedback-log.md](user-feedback-log.md).
Linked proof package: [level5-proof-package.md](level5-proof-package.md).
