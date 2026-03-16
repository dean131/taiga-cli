# Example: User Story Description

**User Story Statement:**
> As a **Tenant**,
> I want to **cancel my booking and review the exact financial impact (penalty and refund amount) before confirming**,
> so that **I can make a fully informed decision and trust the platform's escrow transparency**.

**Summary:**
> This story delivers the cancellation flow for tenants within the mobile app. It guides the user from the cancellation trigger to the outcome screen, providing a transparent breakdown of financial impact prior to confirmation.

---

## 1. Acceptance Criteria

- [ ] Given a Tenant has an active booking, when they view the Transaction Detail, then a "Cancel Booking" action is available.
- [ ] Given the Cancellation Policy modal is shown, then the system presents the Amount Paid, Cancellation Penalty, and Net Refund Amount.
- [ ] Given the final confirmation step, when completion is requested, then a deliberate user action (hold-to-confirm) is required.
- [ ] **Edge Case:** Given the booking is < 24 hours away, when the policy modal is viewed, then the penalty is 100%.
- [ ] **Error Case:** Given the payment gateway refund fails, then the booking status remains unchanged and an error is shown.

---

## 2. Scope & Subtasks

### UI/UX Design
- [ ] Design Cancellation Reason bottom sheet and Policy Modal.
- [ ] Design the final deliberate confirmation mechanism.

### Backend
- [ ] Implement `GET /bookings/:id/cancellation-preview`.
- [ ] Implement `POST /bookings/:id/cancel` with atomic refund processing.
- [ ] Emit `booking.cancelled` domain event.

### Mobile (Flutter)
- [ ] Implement UI flow from Figma.
- [ ] Integrate preview and cancel endpoints with error handling.
- [ ] Implement Riverpod state management for the flow.

---

## 3. Reference Materials

- **Figma Design:** [https://www.figma.com/design/RentVerse_Cancellation]
- **API Spec:** [https://staging.api.rentverse.com/docs]
- **Notes/Constraints:**
  - Must not process cancellation without explicit, deliberate confirmation.
  - Landlord-initiated cancellations are out of scope for this story.
