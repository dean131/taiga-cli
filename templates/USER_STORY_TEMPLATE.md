# User Story Description Template

**Instructions:** Copy this template into the description field when creating a new User Story in Taiga. All sections are mandatory. For sections that are not applicable, retain the heading and write "Not applicable" beneath it — do not delete the heading, as its presence confirms the section was reviewed.

---

## 1. Business Objective

Provide a concise explanation of the purpose and expected value of this user story. Write from the perspective of the end user or the business, using plain, non-technical language.

**User Story Statement:**

> As a **[Role: Tenant / Landlord / Administrator / System]**,
> I want to **[action or capability]**,
> so that **[measurable benefit or outcome]**.

**Summary:**
> Provide one to two sentences summarising the business rationale and what success looks like for this story.

---

## 2. Acceptance Criteria

Define the precise conditions that must be satisfied for this user story to be considered complete. Each criterion must be independently verifiable. Use the Given–When–Then format where applicable.

- [ ] Given [precondition], when [action is performed], then [expected system behaviour].
- [ ] Given [precondition], when [action is performed], then [expected system behaviour].
- [ ] Given [precondition], when [action is performed], then [expected system behaviour].
- [ ] **Edge Case:** [Describe the expected behaviour under an edge condition.]
- [ ] **Error Case:** [Describe the expected behaviour when an error or failure occurs.]

---

## 3. Scope of Work

Enumerate the deliverables required from each discipline. Every sub-item must be achievable within a single sprint. If a discipline has no deliverables for this story, state "Not applicable."

### UI/UX Design
- [ ] [Deliverable — e.g., High-fidelity screens covering the primary user flow]
- [ ] [Deliverable — e.g., Error, empty, and loading state designs]
- [ ] [Deliverable — e.g., Interactive Figma prototype for management review]

### Backend
- [ ] [Deliverable — e.g., Database schema update and migration file]
- [ ] [Deliverable — e.g., REST API endpoint implementation and validation]
- [ ] [Deliverable — e.g., Business logic encapsulated in the service layer]

### Mobile (Flutter)
- [ ] [Deliverable — e.g., UI implementation from approved Figma designs]
- [ ] [Deliverable — e.g., API integration with error and loading state handling]
- [ ] [Deliverable — e.g., State management implementation]

---

## 4. Dependencies and Blockers

Identify all items that this story depends on and all items that this story blocks. Incomplete dependency tracking is a primary cause of sprint delays.

| Relationship | Description | Responsible Party | Status |
|---|---|---|---|
| **Depends on** | [Story, task, resource, or decision this story requires] | [Team or individual] | [Completed / In Progress / Blocked] |
| **Blocks** | [Story or task that cannot begin until this story is complete] | [Team or individual] | [Awaiting completion] |
| **External Dependency** | [Third-party API, credentials, approval, or external deliverable] | [Team or individual] | [Status] |

---

## 5. Reference Materials

Provide direct links to all assets relevant to this story. Generic or top-level links (e.g., linking to an entire Figma project rather than the specific frame) are not acceptable.

| Resource | Link |
|---|---|
| Figma Design | [URL to the specific Figma frame] |
| API Reference | [URL to the relevant API documentation or Scalar page] |
| Related Stories or Tasks | [Taiga links] |
| Technical Specification or ADR | [Link, or "Not applicable"] |

---

## 6. Technical Guidance

This section is to be completed by the Technical Lead or a Senior Developer prior to the story being picked up. It provides implementation direction and prevents guesswork during development.

- **Target Platform(s):** [Mobile (Flutter) / Backend (Node.js, TypeScript) / Web / All platforms]
- **Implementation Constraints:**
  - [e.g., This feature must integrate with the existing `AuthService`. No new authentication flow should be introduced.]
  - [e.g., All data operations must be executed within a database transaction to prevent partial state.]
- **Explicit Exclusions (Out of Scope):**
  - [Clearly state what this story does NOT cover. This prevents scope creep and manages expectations.]

---

## 7. Definition of Done

This story is considered complete only when all of the following conditions are met without exception.

- [ ] All acceptance criteria have been verified by QA on the staging environment.
- [ ] Code has been reviewed and approved by a minimum of one peer reviewer.
- [ ] No new critical or high-severity defects have been introduced.
- [ ] The implemented UI is consistent with the approved Figma designs across all target screen sizes.
- [ ] API endpoints have been tested covering both the successful path and all defined error cases.
- [ ] All relevant documentation has been updated where applicable.
- [ ] The feature has been verified on both iOS and Android physical devices (if applicable to mobile).
