# Example: User Story Description

*This document demonstrates a correctly completed user story description using the standard template. Authors should use this as a reference for tone, depth, and structure.*

---

## 1. Business Objective

**User Story Statement:**

> As a **Tenant**,
> I want to **cancel my active or pending booking and review the exact financial impact — including any penalties and the expected refund amount — before confirming the cancellation**,
> so that **I can make a fully informed decision and trust that the platform operates with transparency and fairness regarding my escrowed funds**.

**Summary:**
> This story delivers the end-to-end cancellation flow for tenants within the mobile application. The flow must guide the user from the initial cancellation trigger through to the outcome screen, providing a transparent breakdown of any applicable penalty and the net refund amount prior to the point of confirmation. A deliberate confirmation mechanism must be implemented to prevent accidental cancellations.

---

## 2. Acceptance Criteria

- [ ] Given a Tenant has an active or pending booking, when the Tenant navigates to the Transaction Detail screen, then a "Cancel Booking" action is presented as a clearly labelled secondary button.
- [ ] Given the Tenant initiates the cancellation flow, when the Cancellation Policy modal is displayed, then the system presents the following financial breakdown: (1) Total Amount Paid, (2) Cancellation Penalty applied, (3) Net Refund Amount Expected.
- [ ] Given the Tenant proceeds through the policy modal, when the final confirmation step is reached, then completion of the cancellation requires a deliberate user action (such as a hold-to-confirm gesture or an explicit confirmation prompt).
- [ ] Given the Tenant confirms the cancellation, when the system processes the request, then the booking status is updated to `cancelled`, a refund is initiated, and the Tenant is presented with a success screen detailing next steps.
- [ ] Given a booking has already been cancelled, when the Tenant attempts to cancel it again, then the system presents an appropriate error message and does not re-attempt the cancellation.
- [ ] **Edge Case:** Given the booking's check-in date is fewer than 24 hours away, when the Tenant views the Cancellation Policy modal, then the applicable penalty reflects 100% of the total booking value.
- [ ] **Error Case:** Given the refund initiation request fails at the payment gateway, when the system encounters this failure, then the booking status remains unchanged, no partial state is persisted, and the Tenant is presented with an appropriate error message with guidance on next steps.

---

## 3. Scope of Work

### UI/UX Design
- [ ] Design the "Cancel Booking" trigger element within the Transaction Detail screen (secondary, destructive-intent button style).
- [ ] Design the Cancellation Reason selection screen, implemented as a bottom sheet with radio button options.
- [ ] Design the Cancellation Policy and Financial Impact modal, presenting the dynamic financial breakdown (Amount Paid, Penalty, Net Refund) in a clear, readable format.
- [ ] Design the deliberate confirmation mechanism (e.g., hold-to-confirm button or a final confirmation prompt with explicit destructive action labelling).
- [ ] Design the Cancellation Success screen, including a summary of the outcome and the expected refund timeline.
- [ ] Produce an interactive Figma prototype linking all cancellation screens for management review and sign-off.

### Backend
- [ ] Author a database migration to introduce the `cancellation_reason` and `cancelled_at` columns on the `bookings` table.
- [ ] Implement the `GET /bookings/:id/cancellation-preview` endpoint, returning the calculated penalty and expected refund amount without committing the cancellation.
- [ ] Implement the `POST /bookings/:id/cancel` endpoint with full request validation, ownership verification, penalty calculation, and atomic refund initiation.
- [ ] Encapsulate penalty calculation logic within a `CancellationPolicy` domain service, enforcing the defined tier structure.
- [ ] Emit a `booking.cancelled` domain event upon successful cancellation to be consumed by the notification and audit systems.

### Mobile (Flutter)
- [ ] Implement all UI screens from the approved Figma designs, including all loading, success, error, and edge-case states.
- [ ] Integrate the `GET /bookings/:id/cancellation-preview` endpoint to populate the financial breakdown in the policy modal.
- [ ] Integrate the `POST /bookings/:id/cancel` endpoint with appropriate error handling and user-facing feedback.
- [ ] Implement the state management layer for the cancellation flow using the established project pattern (e.g., Riverpod).
- [ ] Dispatch the analytics events `booking_cancellation_initiated` and `booking_cancellation_confirmed` at the appropriate points in the flow.

---

## 4. Dependencies and Blockers

| Relationship | Description | Responsible Party | Status |
|---|---|---|---|
| **Depends on** | Cancellation penalty tier structure and business rules must be finalised by Product | Product Manager | Completed |
| **Depends on** | Payment Flow story (Escrow foundation) must be complete, specifically `PaymentService.refund()` | Backend Team | Completed |
| **Depends on** | Figma designs must receive management approval (Ms. Chia sign-off gate) before mobile implementation commences | UI/UX Designer | In Progress |
| **Blocks** | `[Task] [Mobile] Integrate Cancellation Action` — cannot begin until the cancel endpoint is deployed to staging | Mobile Team | Awaiting completion |
| **Blocks** | `[Task] [Mobile] Display Dynamic Transaction Statuses` — requires the `cancelled` status to be returned from the API | Mobile Team | Awaiting completion |
| **External Dependency** | Xendit Refund API credentials for the staging environment | DevOps | Completed |

---

## 5. Reference Materials

| Resource | Link |
|---|---|
| Figma Design | [https://www.figma.com/design/Cw5NOoreQd8ykOLB2eCd7O/RentVerse?node-id=2776-8259](https://www.figma.com/design/Cw5NOoreQd8ykOLB2eCd7O/RentVerse?node-id=2776-8259) |
| API Reference | [https://staging.api.rentverse.com/docs] (Scalar documentation — staging environment) |
| Related Stories | `[Transaction] Payment Flow (Escrow, Cancellation, Refund & Xendit)` — Parent story |
| Technical Specification | ADR-012: Escrow and Refund Flow (Internal Notion: link) |

---

## 6. Technical Guidance

- **Target Platform(s):** Mobile (Flutter) and Backend (Node.js, TypeScript)
- **Implementation Constraints:**
  - Transparency is the primary design principle for this flow. The user must have full visibility of their financial exposure before confirming the cancellation. Under no circumstance should the cancellation be processed without an explicit, deliberate user confirmation.
  - All cancellation and refund operations must be executed atomically within a single database transaction. A cancelled booking without a corresponding refund initiation is not an acceptable system state.
  - Penalty calculation must be delegated entirely to the `CancellationPolicy` domain service. Inline calculation logic within the controller or service is not permitted.
  - Push notifications triggered by this event must not be dispatched from within the service layer. The `booking.cancelled` domain event must be emitted and consumed by the designated notification handler.
- **Explicit Exclusions (Out of Scope):**
  - Landlord-initiated cancellation flows are addressed in a separate user story and are not part of this scope.
  - The dispute and escalation flow is covered by the `[Support] Dispute System` story.
  - Administrative override and manual refund capability is an Admin Panel feature and is out of scope for this release.

---

## 7. Definition of Done

- [ ] All acceptance criteria have been verified by QA on the staging environment, including all error and edge case scenarios.
- [ ] The Figma designs have received formal management approval (Ms. Chia sign-off) prior to mobile implementation.
- [ ] Code has been reviewed and approved by a minimum of one Senior Developer.
- [ ] The implemented mobile UI is consistent with the approved Figma designs, verified on iOS 16+ and Android 12+ physical devices.
- [ ] Backend API endpoints have been tested for the successful path, penalty tiers, authorisation failure, and refund rollback.
- [ ] The `booking_cancellation_initiated` and `booking_cancellation_confirmed` analytics events are confirmed as firing correctly in the Mixpanel staging environment.
- [ ] No new critical or high-severity defects have been introduced in the transaction or payment flows.
