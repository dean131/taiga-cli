# Example: Task Description

**Objective:**
> Implement the `POST /bookings/:id/cancel` REST API endpoint. The endpoint must verify booking ownership, calculate the penalty using `CancellationPolicy`, initiate a refund via `PaymentService`, and persist changes atomically in a Prisma transaction. 

**Parent Story:** `[Transaction] Payment Flow (Escrow, Cancellation, Refund & Xendit)`

---

## 1. Implementation Steps

- [ ] **Step 1:** Add `cancellation_reason` and `cancelled_at` to the `Booking` Prisma schema and run migrations.
- [ ] **Step 2:** Implement `calculatePenalty()` in `CancellationPolicy` domain service (0%, 50%, 100% tiers).
- [ ] **Step 3:** Implement `BookingService.cancel()` to wrap penalty calculation, `PaymentService.refund()`, and database updates in `$transaction`.
- [ ] **Step 4:** Implement `BookingController.cancel()`, validate request body, and register the protected route.
- [ ] **Step 5:** Write unit tests for the domain policies and service logic (including refund rollback).
- [ ] **Step 6:** Validate endpoint on staging via Scalar and attach evidence to this Taiga task.

---

## 2. Acceptance Criteria

- [ ] Returns `200 OK` with `{ bookingId, status: "cancelled", refundAmount }` upon success.
- [ ] Returns `403 Forbidden` if the user does not own the booking.
- [ ] Returns `409 Conflict` if the booking is already cancelled or completed.
- [ ] **Error Case:** If `PaymentService.refund()` fails, the database transaction is fully rolled back.
- [ ] **Tests:** Minimum 3 unit tests added for `CancellationPolicy` boundaries (3 and 7 days).

---

## 3. References & Constraints

- **API Spec:** [https://staging.api.rentverse.com/docs#/Bookings/cancel]
- **Notes:** 
  - Must use `AppError` for errors instead of raw `Error()`.
  - Do not trigger notifications directly in the service; emit the `booking.cancelled` domain event instead.
