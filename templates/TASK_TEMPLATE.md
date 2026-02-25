# Task Description Template

**Instructions:** Copy this template into the description field when creating a new Task in Taiga. A task represents a single, focused unit of work assigned to one discipline (e.g., one backend endpoint, one screen implementation, or one design deliverable). All sections are mandatory. For sections that are not applicable, retain the heading and write "Not applicable."

---

## 1. Technical Objective

Provide a precise and unambiguous description of what this task requires the developer or designer to produce. This is the first section reviewed upon picking up the task — it must be self-contained and leave no room for interpretation.

**Objective:**
> [One to three sentences. State exactly what must be built, configured, or designed. Example: "Implement the `POST /bookings/:id/cancel` endpoint. The endpoint must validate booking ownership, apply the cancellation penalty calculated by `CancellationPolicy`, initiate a refund via `PaymentService`, and update the booking record atomically. If the refund initiation fails, the operation must be fully rolled back."]

**Parent User Story:** [Full name of the parent user story as it appears in Taiga]

---

## 2. Execution Steps

Enumerate the specific, sequential steps required to complete this task. The steps should be granular enough that a team member unfamiliar with the feature can follow them without requiring additional clarification.

- [ ] **Step 1:** [Action — e.g., Review the approved Figma design and identify all interactive states that require implementation.]
- [ ] **Step 2:** [Action — e.g., Author the database migration to add the `cancellation_reason` and `cancelled_at` columns to the `bookings` table.]
- [ ] **Step 3:** [Action — e.g., Define the request validation schema using Zod in `booking.schema.ts`.]
- [ ] **Step 4:** [Action — e.g., Implement the repository method `BookingRepository.markCancelled(bookingId, reason)` using Prisma.]
- [ ] **Step 5:** [Action — e.g., Implement the service method `BookingService.cancel()` encapsulating all business logic within a single database transaction.]
- [ ] **Step 6:** [Action — e.g., Implement the controller method and register the route behind the `AuthGuard` middleware.]
- [ ] **Step 7:** [Action — e.g., Write unit tests for the service and domain service layer.]
- [ ] **Step 8:** [Action — e.g., Validate the endpoint manually via Scalar on the staging environment and attach a screenshot as a comment on this task.]
- [ ] **Step 9:** [Action — e.g., Submit a pull request referencing this task's ID in the PR description.]

---

## 3. Acceptance Criteria

Define the precise, testable conditions under which this task is considered successfully completed. Each criterion must have a deterministic pass or fail outcome.

- [ ] [e.g., The endpoint `POST /bookings/:id/cancel` returns HTTP `200 OK` with the response body `{ bookingId, status: "cancelled", refundAmount, cancelledAt }` upon success.]
- [ ] [e.g., The endpoint returns HTTP `403 Forbidden` when the authenticated user does not own the specified booking.]
- [ ] [e.g., The endpoint returns HTTP `409 Conflict` when the booking status is already `cancelled` or `completed`.]
- [ ] [e.g., The endpoint returns HTTP `422 Unprocessable Entity` when the request body contains an invalid or absent cancellation reason.]
- [ ] [e.g., When `PaymentService.refund()` raises an exception, the booking record remains unchanged in the database, confirming full rollback.]

---

## 4. Dependencies and Blockers

Identify all prerequisites for this task and all work items that cannot proceed until this task is complete.

| Relationship | Description | Status |
|---|---|---|
| **Depends on** | [Task, story, or external resource this task requires before it can begin or be completed] | [Completed / In Progress / Not Started] |
| **Blocks** | [Task or story that cannot be started until this task is completed] | [Awaiting completion] |

---

## 5. Design Reference

Provide direct, specific links to all design and specification assets required for this task. Do not link to a project root — link to the exact frame, page, or endpoint.

- **Figma Frame:** [Direct URL to the specific Figma screen(s) — or "Not applicable" for backend/infrastructure tasks]
- **API Specification:** [URL to the relevant Scalar or OpenAPI documentation page — or "Not applicable" for design tasks]
- **Required States:**
  - [ ] Default / Idle state
  - [ ] Loading state
  - [ ] Success state
  - [ ] Error state
  - [ ] Empty state (if applicable)

---

## 6. Technical Guidance

This section is to be completed by the Technical Lead or a Senior Developer before the task is assigned. It must include sufficient implementation direction to prevent architectural inconsistencies and reduce time spent on clarification.

- **Platform:** [Mobile (Flutter) / Backend (Node.js, TypeScript) / UI/UX (Figma) / Infrastructure (DevOps)]
- **Implementation Patterns to Follow:**
  - [e.g., Adhere to the C-S-R-P layered architecture: Controller → Service → Repository → Prisma. No database access is permitted outside the Repository layer.]
  - [e.g., Use `AppError.forbidden(ERROR_MESSAGES.BOOKING.UNAUTHORIZED)` for authorisation failures. Do not use raw `new Error()` instances.]
  - [e.g., Apply the existing `AuthGuard` middleware. Do not implement a new authentication mechanism for this route.]
- **Relevant Source Files:**
  - `[src/path/to/file.ts]` — [Brief explanation of relevance]
  - `[src/path/to/file.ts]` — [Brief explanation of relevance]
- **Non-Negotiable Constraints:**
  - [e.g., The refund call and the booking status update must be wrapped in a single `prisma.$transaction()` call. Separate awaits will not satisfy the atomicity requirement.]
  - [e.g., Push notifications must not be triggered from within the service layer. Emit a domain event and allow the notification handler to consume it.]

---

## 7. Testing Requirements

The following verifications must be completed before the task can be marked as done. Each item must be independently confirmable.

- [ ] **Unit Tests:** [e.g., `CancellationPolicy.calculatePenalty()` with all three penalty tiers and boundary values (exactly 3 days, exactly 7 days before check-in).]
- [ ] **Unit Tests:** [e.g., `BookingService.cancel()` with a mocked `PaymentService` — including the rollback scenario when the refund call fails.]
- [ ] **Integration Tests:** [e.g., Full HTTP request through to the database, verifying that `cancelled_at` and `cancellation_reason` are persisted correctly.]
- [ ] **Manual Verification:** [e.g., Endpoint validated via Scalar on the staging environment. Screenshot of both a successful and a failed request must be attached to this task as a comment.]
- [ ] **Regression Check:** No existing functionality in related modules has been broken by the changes introduced in this task.
- [ ] **Code Quality:** No `console.log` statements remain in production code. All linting checks pass (`npm run lint`).

---

## 8. Deliverables

Enumerate the tangible outputs that mark this task as complete.

- [ ] [e.g., A pull request merged into the `dev` branch, titled `feat/booking-cancellation-api` and referencing this task ID.]
- [ ] [e.g., Database migration file committed and successfully applied to the staging environment.]
- [ ] [e.g., Endpoint accessible and functional at `https://staging.api.rentverse.com/bookings/:id/cancel`.]
- [ ] [e.g., Manual test evidence (screenshots of success and error responses) posted as a comment on this task in Taiga.]
