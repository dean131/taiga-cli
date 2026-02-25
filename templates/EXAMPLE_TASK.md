# Example: Task Description

*This document demonstrates a correctly completed task description using the standard template. Authors should use this as a reference for the expected level of detail, technical precision, and formal tone.*

---

## 1. Technical Objective

**Objective:**
> Implement the `POST /bookings/:id/cancel` REST API endpoint. The endpoint must verify that the authenticated user is the owner of the specified booking, calculate the applicable cancellation penalty by delegating to the `CancellationPolicy` domain service, initiate a refund via `PaymentService.refund()`, and persist the updated booking status atomically within a single database transaction. If the refund initiation raises an exception at any point, the entire operation must be rolled back and the booking record must remain in its prior state.

**Parent User Story:** `[Transaction] Payment Flow (Escrow, Cancellation, Refund & Xendit)`

---

## 2. Execution Steps

- [ ] **Step 1:** Review the Prisma schema and author a migration to introduce the `cancellation_reason: String?` and `cancelled_at: DateTime?` columns on the `Booking` model in `prisma/schema/booking.prisma`. Apply the migration to the development and staging environments.
- [ ] **Step 2:** Define the Zod request validation schema in `src/modules/booking/booking.schema.ts`. The `reason` field must be a required enum restricted to the values: `change_of_plans`, `found_another_place`, `landlord_unresponsive`, `other`.
- [ ] **Step 3:** Implement `BookingRepository.findByIdAndUser(bookingId: string, userId: string)` in `booking.repository.ts`. This method must return the booking record only if the authenticated user is the owner; ownership validation must not be performed in the service or controller layer.
- [ ] **Step 4:** Implement `CancellationPolicy.calculatePenalty(booking: Booking): number` in `src/domain/CancellationPolicy.ts`. The penalty tiers are as follows: 0% of the booking value if cancellation occurs more than 7 days before check-in; 50% if between 3 and 7 days inclusive; 100% if fewer than 3 days before check-in.
- [ ] **Step 5:** Implement `BookingService.cancel(bookingId: string, userId: string, reason: CancellationReason)` in `booking.service.ts`. The implementation must: (1) call `BookingRepository.findByIdAndUser()`, (2) verify the booking is in a cancellable state, (3) call `CancellationPolicy.calculatePenalty()`, (4) wrap the following two operations in `prisma.$transaction()`: call `PaymentService.refund()` and call `BookingRepository.markCancelled()`, (5) emit the `booking.cancelled` domain event.
- [ ] **Step 6:** Implement `BookingController.cancel()` in `booking.controller.ts`. The method must parse and validate the request body against `CancelBookingSchema`, invoke `BookingService.cancel()`, and return the standardised response structure.
- [ ] **Step 7:** Register the route `POST /bookings/:id/cancel` in `booking.routes.ts`, protected by the `AuthGuard` middleware.
- [ ] **Step 8:** Write unit tests for `CancellationPolicy.calculatePenalty()` covering all three penalty tiers and the boundary values (exactly 3 days and exactly 7 days before check-in).
- [ ] **Step 9:** Write unit tests for `BookingService.cancel()` using a mocked `PaymentService`, including the rollback scenario when `PaymentService.refund()` raises an exception.
- [ ] **Step 10:** Write an integration test verifying the full HTTP request lifecycle through to the database, confirming that `cancellation_reason` and `cancelled_at` are persisted correctly upon a successful cancellation.
- [ ] **Step 11:** Validate the endpoint manually via Scalar on the staging environment. Attach a screenshot demonstrating both a successful response and a handled error response as a comment on this task in Taiga.
- [ ] **Step 12:** Submit a pull request to the `dev` branch titled `feat/booking-cancellation-api` with this task's Taiga reference included in the PR description.

---

## 3. Acceptance Criteria

- [ ] The endpoint `POST /bookings/:id/cancel` returns HTTP `200 OK` with the response body `{ bookingId: string, status: "cancelled", refundAmount: number, cancelledAt: string (ISO 8601) }` upon successful execution.
- [ ] The endpoint returns HTTP `403 Forbidden` when the authenticated user is not the owner of the specified booking.
- [ ] The endpoint returns HTTP `409 Conflict` when the booking status is already `cancelled` or `completed`.
- [ ] The endpoint returns HTTP `422 Unprocessable Entity` when the request body is absent, malformed, or contains an invalid cancellation reason value.
- [ ] When `PaymentService.refund()` raises an exception, the `bookings` table record for the specified booking remains unchanged in its entirety, confirming complete transaction rollback.
- [ ] The `cancellation_reason` and `cancelled_at` fields are correctly persisted in the database for all successful cancellation operations.
- [ ] The endpoint response time does not exceed 800 milliseconds on the staging environment under standard load conditions, excluding the external Xendit API call duration.

---

## 4. Dependencies and Blockers

| Relationship | Description | Status |
|---|---|---|
| **Depends on** | `PaymentService.refund(paymentId: string, amount: number)` must be implemented and available (delivered as part of the Payment Initialisation task) | Completed |
| **Depends on** | The `Booking` Prisma model must include an `escrow_payment_id` field (delivered as part of the Escrow foundation task) | Completed |
| **Depends on** | Xendit Refund API credentials must be configured in the staging environment | Completed |
| **Blocks** | `[Task] [Mobile] Integrate Cancellation Action` — the mobile team requires this endpoint to be deployed and accessible on staging before integration can commence | Awaiting completion |
| **Blocks** | `[Task] [Mobile] Display Dynamic Transaction Statuses` — the mobile team requires the `cancelled` status to be returned in booking API responses | Awaiting completion |

---

## 5. Design Reference

- **Figma Frame:** Not applicable — this is a backend implementation task. Refer to the parent user story for the Figma design link and business context.
- **API Specification:** [https://staging.api.rentverse.com/docs#/Bookings/cancel] (Scalar documentation — staging environment)
- **Required Response States:**
  - [ ] `200 OK` — Successful cancellation, including refund amount and cancellation timestamp.
  - [ ] `403 Forbidden` — Request made by a user who does not own the specified booking.
  - [ ] `409 Conflict` — Booking is in a non-cancellable state (already cancelled or completed).
  - [ ] `422 Unprocessable Entity` — Request body is absent, malformed, or contains an invalid reason value.
  - [ ] `500 Internal Server Error` — Payment gateway failure; booking remains unchanged. Error must be logged but must not expose internal error details in the response body.

---

## 6. Technical Guidance

- **Platform:** Backend (Node.js, TypeScript)
- **Architecture Pattern:** Adhere strictly to the C-S-R-P layered architecture — Controller → Service → Repository → Prisma. No Prisma calls are permitted outside of the Repository layer. No business logic is permitted in the Controller layer.
- **Implementation Patterns to Follow:**
  - All error responses must use the `AppError` factory methods (e.g., `AppError.forbidden(ERROR_MESSAGES.BOOKING.UNAUTHORIZED)`, `AppError.conflict(ERROR_MESSAGES.BOOKING.ALREADY_CANCELLED)`). Raw `new Error()` instances must not be used.
  - The `AuthGuard` middleware must be applied to the route. A new or alternative authentication mechanism must not be introduced for this endpoint.
  - The `CancellationPolicy` domain service must be the sole location for penalty calculation logic. Inline calculation in the service or controller layer is not permitted under any circumstances.
- **Relevant Source Files:**

  | File | Relevance |
  |---|---|
  | `src/modules/booking/booking.controller.ts` | Location for the new `cancel()` controller method |
  | `src/modules/booking/booking.service.ts` | Location for the new `cancel()` service method |
  | `src/modules/booking/booking.repository.ts` | Location for `findByIdAndUser()` and `markCancelled()` repository methods |
  | `src/modules/booking/booking.schema.ts` | Location for the `CancelBookingSchema` Zod definition |
  | `src/modules/booking/booking.routes.ts` | Route registration file |
  | `src/modules/payment/payment.service.ts` | Contains `refund()` method — consume, do not modify |
  | `src/domain/CancellationPolicy.ts` | To be created — location for `calculatePenalty()` domain logic |

- **Non-Negotiable Constraints:**
  - The `PaymentService.refund()` call and the `BookingRepository.markCancelled()` call must be executed within a single `prisma.$transaction()` block. Separate sequential `await` calls do not satisfy the atomicity requirement.
  - Push notifications must not be dispatched from within `BookingService.cancel()`. The service must emit a `booking.cancelled` domain event. The notification handler is responsible for processing this event and dispatching communications.
  - If the Xendit API response latency causes the endpoint response time to exceed the 800ms threshold, the refund call must be extracted to an asynchronous background job. This architectural decision must be flagged in the pull request for team review and approval.

---

## 7. Testing Requirements

- [ ] **Unit Test:** `CancellationPolicy.calculatePenalty()` must cover all three penalty tiers and the exact boundary values — cancellations occurring at exactly 3 days and exactly 7 days before check-in must be tested explicitly.
- [ ] **Unit Test:** `BookingService.cancel()` must be tested with a mocked `PaymentService`. The test must include a scenario in which `PaymentService.refund()` raises an exception, and must assert that the booking record remains unchanged in the database following the failure.
- [ ] **Integration Test:** Submit a full HTTP `POST` request through the application stack to the database. Assert that the `cancellation_reason` and `cancelled_at` fields are correctly persisted, and that the booking `status` has transitioned to `cancelled`.
- [ ] **Manual Verification on Staging:** The endpoint must be tested via Scalar against the staging environment. Screenshots demonstrating a successful response (`200 OK`) and a handled error response (minimum one error case) must be attached as a comment on this task in Taiga before the task is marked as done.
- [ ] **Regression Verification:** Confirm that `GET /bookings/:id` continues to return the correct booking data and that the `status` field correctly reflects `cancelled` following a successful cancellation.
- [ ] **Code Quality:** All linting checks must pass (`npm run lint`). No `console.log` statements may remain in production-bound code. All outstanding `TODO` comments must either be resolved or converted into tracked Taiga issues before the pull request is approved.

---

## 8. Deliverables

- [ ] A pull request merged into the `dev` branch, titled `feat/booking-cancellation-api`, with this task's Taiga ID referenced in the pull request description.
- [ ] Database migration file committed to the repository and successfully applied to the staging environment.
- [ ] The endpoint `POST /bookings/:id/cancel` is deployed, accessible, and functional on the staging environment at `https://staging.api.rentverse.com/bookings/:id/cancel`.
- [ ] Manual test evidence — screenshots of a successful response and at least one error response — posted as a comment on this task in Taiga.
