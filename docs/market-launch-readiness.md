# Fabhouse market and stay launch readiness

This is an operating checklist, not legal advice or evidence that any market is approved. Assign a named owner and save the evidence before enabling paid stays or agent billing in a market.

## Current product boundary

- Stay requests require an account and selected dates. Hosts can manually block dates; accepted requests hold dates for 24 hours. A unique property/night index prevents two accepted holds or a host block from taking the same night.
- `requested`, `accepted_unpaid`, `declined`, `cancelled`, and `expired` are request states. `accepted_unpaid` is explicitly not a booking confirmation.
- Fabhouse does not collect stay money, promise a refund, or pay hosts. Cancellation of an unpaid request has no payment effect.
- Agent-plan billing is disabled by default. Nigeria has draft prices; Ghana, Kenya, and South Africa have no active prices.

## Stay pilot gate — one city first

Do not switch on stay checkout until every item is signed off for the pilot city.

### Inventory and host readiness

- Confirm host identity and a working local phone, email, and emergency contact.
- Record evidence that the host is authorized to let the property; keep evidence private and state exactly what Fabhouse checked.
- Verify physical location and representative photos through a documented in-person visit or live video walkthrough; log reviewer, date, method, and unresolved claims.
- Confirm actual guest capacity, bed and bath counts, access instructions, check-in/out times, house rules, deposits, fees, taxes, power/water reliability, backup arrangements, security, and accessible facilities.
- Require the host to attest availability and total charges before publishing. Reconfirm listing and contact details on a recurring schedule.
- Keep identity review, authority-to-let review, and property-condition review as separate checks; never use one badge to imply all three.

### Availability and booking operations

- Confirm listing-local time zone, check-in/out time, minimum/maximum stay, lead time, cleaning buffer, and how offline bookings update the Fabhouse calendar.
- Import or reconcile the host's existing calendar before accepting requests. Define a daily process for blocking dates sold elsewhere.
- Decide how a host and guest are notified, response-time expectations, no-response expiry, and how an availability dispute is resolved.
- Test overlapping guest requests, host blocks, expired holds, cancellations, duplicate messages, and a listing becoming inactive while a request is open.
- Set up the unique property/night database index in production and verify the database supports transactions before launch.

### Cancellation, refund, and host settlement decision record

Current unpaid requests can be cancelled by either party and release the date hold. That is the only active cancellation rule.

Before charging, the founder/operator, host representatives, payment provider, and qualified local counsel must approve a versioned table covering:

- guest cancellation cut-offs and refund percentages, including same-day/no-show cases;
- host cancellation, relocation/refund remedy, and repeat-cancellation consequences;
- failed, duplicate, delayed, or disputed payments and chargebacks;
- when funds become payable to the host, any complaint window, transfer failures, reserves, reconciliation, and tax/receipt duties;
- what happens when Fabhouse or a host cannot provide a stay, and which party pays transfer or refund fees.

Do not describe Fabhouse as holding escrow or guaranteeing a refund unless the provider contract and local counsel confirm that exact funds flow is lawful and operational. Agree how the platform fee is calculated and displayed before checkout. Save the signed policy/version and provider confirmation per market.

### Guest and host support

- The app now records stay tickets, supports open/in-progress/resolved states, and emails a staff reply to the reporter. The admin queue is `/admin/stay-support`.
- Before a paid pilot, assign an on-call person, publish support hours and response target, test email delivery, and define escalation for safety, fraud, payment, discrimination, and property-not-as-described reports.
- Provide a way to refund/cancel or move a guest when support agrees a case; the current app cannot do this because it takes no stay payment.
- Review unresolved tickets daily. Record incident outcome and whether listing suspension, host follow-up, or guest follow-up is required.

## Agent pricing and revenue validation

Prices in `config/features.ts` are hypotheses, not market research. Before turning on paid plans in any market:

1. Interview at least 10 independent agents/developers in the intended launch city, including small operators and larger teams. Do not recruit only existing friends or current power users.
2. Ask about current listing/customer-acquisition spend, qualified leads, team workflows, willingness to pay for specific outcomes, preferred billing period and payment method. Show a concrete package and ask for a paid pilot or signed intent, not only “would you use this?”
3. Record role, city, package shown, proposed local-currency price, objection, current alternative, and purchase intent with consent. Do not store personal interview notes in public listing records.
4. Compare demand for paid visibility, verified leads, team seats, bulk tools, and analytics. Test one offer at a time; keep buyer search free.
5. Decide a market price from paid conversion and retention evidence, calculate payment/provider/tax costs and support load, and get approval from the operator before configuring a price.

Track exposures, checkout starts, paid conversions, renewal/churn, qualified leads per paying account, agent response time, and refunds/disputes. Do not infer willingness to pay from page views or free signups.

Revenue order: optional agent tools after lead value is measurable; developer/team packages after repeat usage; a disclosed fee on completed stays only after reliable checkout, cancellation/refund, settlement, and support operations. Never charge for identity badges.

## Per-market launch sign-off

Duplicate this table for each country and city. A blank or unknown cell blocks the relevant paid launch.

| Area | Evidence to collect | Sign-off |
| --- | --- | --- |
| Supply | Live inventory sample, authority-to-let checks, local reviewer and refresh cadence | Market operations owner |
| Addresses | Required address fields, postal conventions, map precision and privacy | Local operations owner |
| Currency and prices | Agent interview record, market price approval, displayed fee/tax examples | Revenue owner |
| Payments | Provider/merchant-country eligibility, supported local methods, settlement, refunds, reconciliation and receipts confirmed in writing | Finance/payment owner |
| Consumer/tenancy rules | Stay, rent, cancellation, deposits, tax, licensing and advertising review | Qualified local counsel |
| Privacy | Controller/processor roles, lawful basis, retention, rights workflow, data residency/transfers, breach response and regulator duties reviewed | Data protection lead and qualified counsel |
| Terms and support | Localized terms/privacy, complaint channel, support coverage, safety escalation and accountable operator | Operations owner |
| Readiness | Test payment, cancellation/refund, host payout, support case and incident drill completed | Founder/operator |

Legal pages are drafts until a qualified lawyer reviews and approves them for the market and product flow actually being launched. Record counsel, jurisdiction, document version, review date, and next review date; code cannot supply that approval.
