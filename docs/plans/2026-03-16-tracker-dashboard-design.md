# OpenClaw Job Agent Tracker Dashboard Design

## Goal
Add a unified Tracker Dashboard that lets the user monitor both job-level progress and application-level review state from one page.

## Scope

### In Scope
- A new `/dashboard` page in the web app
- Shared tracker DTOs for dashboard metrics, job stages, application rows, and recent activity
- A dashboard API endpoint that aggregates counts and recent activity from existing `jobs`, `job_analysis`, `resume_versions`, and `applications`
- A top-level applications list API for dashboard usage
- A combined dashboard experience with:
  - core metrics
  - pipeline counts
  - jobs board
  - applications table
  - recent activity
- Minimal first-pass filters:
  - filter jobs by derived stage
  - filter applications by approval status

### Out of Scope
- New tracker-specific database tables
- Submission automation
- Arbitrary search, date-range filtering, or advanced reporting
- Charts beyond lightweight counts and stage strips
- Temporal or durable workflow orchestration

## Architecture

### Data Strategy
- Reuse the existing `jobs`, `job_analysis`, `resume_versions`, and `applications` tables.
- Derive job progress from the latest available related records instead of storing a separate job-state column.
- Treat the latest application for a job as the source of truth for that job's current application stage, while still listing full application history separately.

### API Strategy
- Add `GET /dashboard/overview` for aggregated tracker data.
- Add `GET /applications` so the frontend can request full application rows directly, matching the original spec.
- Keep the first version server-aggregated and synchronous. No caching layer is needed yet.

## Data Model & Derived State

### No New Tables
The tracker dashboard should not introduce new persistence structures in the first version.

### Job Stage Mapping
Each job should map to exactly one current stage:
- `imported`
  - job exists but no completed analysis yet
- `analyzed`
  - latest completed analysis exists but no completed resume yet
- `resume_ready`
  - latest completed resume exists but no application yet
- `prefill_run`
  - latest application exists and its execution status is `queued`, `running`, `completed`, or `failed`, but approval is not yet a stronger state
- `pending_review`
  - latest application approval status is `pending_review`
- `approved_for_submit`
  - latest application approval status is `approved_for_submit`
- `needs_revision`
  - latest application approval status is `needs_revision`
- `rejected`
  - latest application approval status is `rejected`

### Dashboard Overview Payload
- `metrics`
  - `totalJobs`
  - `analyzedJobs`
  - `resumeReadyJobs`
  - `totalApplications`
  - `pendingReviewApplications`
- `pipeline`
  - counts by stage:
    - `imported`
    - `analyzed`
    - `resume_ready`
    - `prefill_run`
    - `pending_review`
    - `approved_for_submit`
    - `needs_revision`
    - `rejected`
- `approvalBreakdown`
  - counts by application approval state
- `recentActivity`
  - last few notable events derived from imports, analyses, resume generations, application creations, and approval updates

## API Design

### `GET /dashboard/overview`
Returns all dashboard summary sections:
- metrics
- pipeline counts
- approval breakdown
- job tracker rows
- recent activity

### `GET /applications`
Returns application rows with linked:
- job summary
- resume summary
- status
- approval status
- update timestamps
- review note

## UI Design

### New Dashboard Page
Route:
- `/dashboard`

### Layout Sections

#### Top Metrics
Show high-signal counters:
- total jobs
- analyzed jobs
- resume-ready jobs
- applications created
- approvals pending

#### Pipeline Overview
Show stage counts in a simple strip of cards.

#### Jobs Board
Each job row/card should show:
- title
- company
- location
- current derived stage
- latest analysis score if present
- latest resume readiness if present
- latest application approval state if present
- link to Job Detail

#### Applications Table
Each application row should show:
- company
- job title
- application execution status
- approval status
- resume version headline
- updated timestamp
- link to Application Review

#### Recent Activity
Show the most recent items with human-readable labels such as:
- imported a job
- completed analysis
- generated a resume
- ran prefill
- updated approval

## Filtering

### Jobs Board Filter
- one stage filter

### Applications Table Filter
- one approval-status filter

The first version should avoid multi-filter combinations, free-text search, and date ranges.

## Error Handling
- If dashboard aggregation fails, the page should show a clear load error.
- If one section is empty, render an explicit empty state instead of hiding the section.
- If there are no applications yet, the applications table and approval metrics should still render zero-state UI.

## Acceptance Criteria
1. `/dashboard` loads and renders tracker data from real persisted records.
2. The page shows core metrics, pipeline counts, jobs board, applications table, and recent activity.
3. Each job maps to a single explicit current stage.
4. Application rows link into the Human Approval review page.
5. Stage and approval filters work without reloading the whole app.
6. Root `npm test`, root `npm run build`, and Docker runtime still succeed after the dashboard changes.

## Notes
- This phase is intentionally read-oriented. It surfaces tracker state cleanly before introducing submit automation or timeline persistence.
- The dashboard should feel like an operator console for the existing workflow, not a generic BI page.
