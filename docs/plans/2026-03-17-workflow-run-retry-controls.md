# Phase 26: Workflow Run Retry Controls

## Goal

Add a safe retry action for failed workflow runs while preserving the prior failed run as audit evidence.

## Implementation Plan

1. Extend `workflow_runs`
- add `retryOfRunId`
- expose it through shared types

2. Add retry orchestration
- create a `WorkflowRunRetriesService`
- validate `status=failed`
- dispatch direct or Temporal retries through existing execution paths

3. Add retry API
- `POST /workflow-runs/:id/retry`
- return the new workflow run plus job summary

4. Handle failed retries gracefully
- if a retry created a new run and then failed again, return the new failed run

5. Add Job Detail retry controls
- render a retry button for failed runs
- refresh job, applications, and workflow runs after retry completes

6. Verify
- targeted retry tests
- root tests
- workspace build
- direct-mode retry runtime verification
- Temporal-mode retry runtime verification
- restore Docker env to default `TEMPORAL_ENABLED=false`
