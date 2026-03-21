"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, startTransition, useEffect, useMemo, useState } from "react";

import { Panel } from "../../components/panel";
import {
  bulkCancelWorkflowRuns,
  bulkRetryWorkflowRuns,
  fetchWorkflowRuns,
  type WorkflowRunsFilter
} from "../../lib/api";
import {
  defaultWorkflowRunsQueryState,
  parseWorkflowRunsQueryState,
  serializeWorkflowRunsQueryState
} from "../../lib/workflow-runs-query-state";
import {
  getWorkflowRunsEmptyState,
  getWorkflowRunsResultsSummary,
  getWorkflowRunsResultChips
} from "../../lib/workflow-runs-results";
import {
  buildWorkflowRunsSelectionScopeKey,
  countSelectedWorkflowRuns,
  selectAllLoadedWorkflowRuns,
  toggleWorkflowRunSelection
} from "../../lib/workflow-runs-selection";
import {
  buildSelectedJobTargets,
  buildSelectedRunDetailTargets
} from "../../lib/workflow-runs-bulk-actions";
import {
  buildBulkOutcomeFailedReselection,
  buildBulkOutcomeSkippedReselection,
  buildSuccessfulBulkOutcomeRunDetailTargets
} from "../../lib/workflow-runs-bulk-follow-up";
import {
  buildWorkflowRunsEligibilitySummary,
  getWorkflowRunsEligibilityMessages
} from "../../lib/workflow-runs-eligibility";
import {
  buildWorkflowRunsBulkConfirmationCopy,
  getWorkflowRunsBulkLimitMessage,
  type WorkflowRunsBulkControlAction
} from "../../lib/workflow-runs-bulk-controls";
import { buildWorkflowRunsBulkOutcomePanel } from "../../lib/workflow-runs-bulk-outcomes";
import { buildWorkflowRunsBulkPreflight } from "../../lib/workflow-runs-bulk-preflight";
import { getWorkflowRunStatusCopy } from "../../lib/workflow-run-status";

const kindFilters = ["all", "analyze", "generate_resume", "prefill"] as const;
const statusFilters = ["all", "queued", "running", "paused", "completed", "failed", "cancelled"] as const;
const executionModeFilters = ["all", "direct", "temporal"] as const;
const sortByOptions = [
  { value: "createdAt", label: "Created time" },
  { value: "startedAt", label: "Started time" },
  { value: "completedAt", label: "Completed time" },
  { value: "status", label: "Status" },
  { value: "kind", label: "Kind" }
] as const;
const sortOrderOptions = [
  { value: "desc", label: "Descending" },
  { value: "asc", label: "Ascending" }
] as const;

function WorkflowRunsPageContent() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const parsedQueryState = useMemo(
    () => parseWorkflowRunsQueryState(searchParams),
    [searchParams]
  );
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchWorkflowRuns>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [kindFilter, setKindFilter] = useState<(typeof kindFilters)[number]>(parsedQueryState.kindFilter);
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusFilters)[number]>(parsedQueryState.statusFilter);
  const [executionModeFilter, setExecutionModeFilter] =
    useState<(typeof executionModeFilters)[number]>(parsedQueryState.executionModeFilter);
  const [query, setQuery] = useState(parsedQueryState.query);
  const [fromDate, setFromDate] = useState(parsedQueryState.fromDate);
  const [toDate, setToDate] = useState(parsedQueryState.toDate);
  const [sortBy, setSortBy] =
    useState<(typeof sortByOptions)[number]["value"]>(parsedQueryState.sortBy);
  const [sortOrder, setSortOrder] =
    useState<(typeof sortOrderOptions)[number]["value"]>(parsedQueryState.sortOrder);
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [bulkActionError, setBulkActionError] = useState("");
  const [pendingBulkAction, setPendingBulkAction] =
    useState<WorkflowRunsBulkControlAction | null>(null);
  const [bulkMutationLoading, setBulkMutationLoading] = useState(false);
  const [lastBulkAction, setLastBulkAction] =
    useState<WorkflowRunsBulkControlAction | null>(null);
  const [lastBulkResponse, setLastBulkResponse] = useState<Awaited<
    ReturnType<typeof bulkRetryWorkflowRuns>
  > | null>(null);
  const [bulkFollowUpMessage, setBulkFollowUpMessage] = useState("");
  const [bulkFollowUpError, setBulkFollowUpError] = useState("");

  const currentFilters: WorkflowRunsFilter = {
    kind: kindFilter === "all" ? undefined : kindFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    executionMode: executionModeFilter === "all" ? undefined : executionModeFilter,
    q: query.trim() || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    sortBy,
    sortOrder,
    limit: 20
  };

  const currentQueryState = useMemo(
    () => ({
      kindFilter,
      statusFilter,
      executionModeFilter,
      query,
      fromDate,
      toDate,
      sortBy,
      sortOrder
    }),
    [executionModeFilter, fromDate, kindFilter, query, sortBy, sortOrder, statusFilter, toDate]
  );
  const resultChips = useMemo(
    () => getWorkflowRunsResultChips(currentQueryState),
    [currentQueryState]
  );
  const hasActiveFilters = resultChips.length > 0;
  const hasNonDefaultSort =
    sortBy !== defaultWorkflowRunsQueryState.sortBy ||
    sortOrder !== defaultWorkflowRunsQueryState.sortOrder;
  const showClearFilters = hasActiveFilters || hasNonDefaultSort;
  const selectionScopeKey = useMemo(
    () => buildWorkflowRunsSelectionScopeKey(currentQueryState),
    [currentQueryState]
  );

  useEffect(() => {
    setKindFilter(parsedQueryState.kindFilter);
    setStatusFilter(parsedQueryState.statusFilter);
    setExecutionModeFilter(parsedQueryState.executionModeFilter);
    setQuery(parsedQueryState.query);
    setFromDate(parsedQueryState.fromDate);
    setToDate(parsedQueryState.toDate);
    setSortBy(parsedQueryState.sortBy);
    setSortOrder(parsedQueryState.sortOrder);
  }, [parsedQueryState]);

  useEffect(() => {
    const currentUrlQuery = serializeWorkflowRunsQueryState(parsedQueryState).toString();
    const nextUrlQuery = serializeWorkflowRunsQueryState(currentQueryState).toString();

    if (currentUrlQuery === nextUrlQuery) {
      return;
    }

    router.replace(`${pathname}${nextUrlQuery ? `?${nextUrlQuery}` : ""}`, { scroll: false });
  }, [currentQueryState, parsedQueryState, pathname, router]);

  useEffect(() => {
    setSelectedRunIds([]);
  }, [selectionScopeKey]);

  useEffect(() => {
    setBulkActionError("");
    setPendingBulkAction(null);
  }, [selectedRunIds, selectionScopeKey]);

  useEffect(() => {
    setBulkFollowUpMessage("");
    setBulkFollowUpError("");
  }, [selectionScopeKey]);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    startTransition(async () => {
      try {
        const next = await fetchWorkflowRuns(currentFilters);
        if (!cancelled) {
          setData(next);
          setError("");
        }
      } catch (fetchError) {
        if (!cancelled) {
          setData(null);
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load workflow runs");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [kindFilter, statusFilter, executionModeFilter, query, fromDate, toDate, sortBy, sortOrder]);

  function clearAllFilters() {
    setKindFilter(defaultWorkflowRunsQueryState.kindFilter);
    setStatusFilter(defaultWorkflowRunsQueryState.statusFilter);
    setExecutionModeFilter(defaultWorkflowRunsQueryState.executionModeFilter);
    setQuery(defaultWorkflowRunsQueryState.query);
    setFromDate(defaultWorkflowRunsQueryState.fromDate);
    setToDate(defaultWorkflowRunsQueryState.toDate);
    setSortBy(defaultWorkflowRunsQueryState.sortBy);
    setSortOrder(defaultWorkflowRunsQueryState.sortOrder);
    setSelectedRunIds([]);
  }

  function removeChip(key: ReturnType<typeof getWorkflowRunsResultChips>[number]["key"]) {
    switch (key) {
      case "kind":
        setKindFilter(defaultWorkflowRunsQueryState.kindFilter);
        return;
      case "status":
        setStatusFilter(defaultWorkflowRunsQueryState.statusFilter);
        return;
      case "executionMode":
        setExecutionModeFilter(defaultWorkflowRunsQueryState.executionModeFilter);
        return;
      case "query":
        setQuery(defaultWorkflowRunsQueryState.query);
        return;
      case "fromDate":
        setFromDate(defaultWorkflowRunsQueryState.fromDate);
        return;
      case "toDate":
        setToDate(defaultWorkflowRunsQueryState.toDate);
        return;
    }
  }

  async function handleLoadMore() {
    if (!data?.pageInfo.hasMore || !data.pageInfo.nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    try {
      const next = await fetchWorkflowRuns({
        ...currentFilters,
        cursor: data.pageInfo.nextCursor
      });

      setData((current) => {
        if (!current) {
          return next;
        }

        return {
          summary: next.summary,
          pageInfo: next.pageInfo,
          runs: [...current.runs, ...next.runs]
        };
      });
      setError("");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load more workflow runs");
    } finally {
      setLoadingMore(false);
    }
  }

  const metrics = data
    ? [
        { label: "Total runs", value: data.summary.totalRuns },
        { label: "Queued", value: data.summary.queuedRuns },
        { label: "Running", value: data.summary.runningRuns },
        { label: "Completed", value: data.summary.completedRuns },
        { label: "Failed", value: data.summary.failedRuns },
        { label: "Cancelled", value: data.summary.cancelledRuns }
      ]
    : [];
  const summaryCopy = data
    ? getWorkflowRunsResultsSummary({
        loadedCount: data.runs.length,
        totalCount: data.summary.totalRuns,
        sortBy,
        sortOrder,
        activeFilterCount: resultChips.length
      })
    : null;
  const emptyState = getWorkflowRunsEmptyState({
    totalCount: data?.summary.totalRuns ?? 0,
    hasActiveFilters
  });
  const selectedCount = countSelectedWorkflowRuns(selectedRunIds);
  const bulkOutcomePanel = useMemo(
    () => (lastBulkAction ? buildWorkflowRunsBulkOutcomePanel(lastBulkAction, lastBulkResponse) : null),
    [lastBulkAction, lastBulkResponse]
  );
  const loadedRunIds = useMemo(
    () => (data?.runs ?? []).map((item) => item.workflowRun.id),
    [data?.runs]
  );
  const successfulOutcomeTargets = useMemo(
    () => buildSuccessfulBulkOutcomeRunDetailTargets(bulkOutcomePanel),
    [bulkOutcomePanel]
  );
  const skippedOutcomeReselection = useMemo(
    () => buildBulkOutcomeSkippedReselection(bulkOutcomePanel, loadedRunIds),
    [bulkOutcomePanel, loadedRunIds]
  );
  const failedOutcomeReselection = useMemo(
    () => buildBulkOutcomeFailedReselection(bulkOutcomePanel, loadedRunIds),
    [bulkOutcomePanel, loadedRunIds]
  );
  const bulkPreflight = useMemo(
    () =>
      pendingBulkAction
        ? buildWorkflowRunsBulkPreflight(pendingBulkAction, selectedRunIds, data?.runs ?? [])
        : null,
    [data?.runs, pendingBulkAction, selectedRunIds]
  );
  const eligibilitySummary = useMemo(
    () => buildWorkflowRunsEligibilitySummary(data?.runs ?? [], selectedRunIds),
    [data?.runs, selectedRunIds]
  );
  const eligibilityMessages = useMemo(
    () => getWorkflowRunsEligibilityMessages(eligibilitySummary),
    [eligibilitySummary]
  );
  const retryLimitMessage = useMemo(
    () => getWorkflowRunsBulkLimitMessage("retry", eligibilitySummary),
    [eligibilitySummary]
  );
  const cancelLimitMessage = useMemo(
    () => getWorkflowRunsBulkLimitMessage("cancel", eligibilitySummary),
    [eligibilitySummary]
  );
  const retryBulkEnabled =
    eligibilitySummary.retryEligibleCount > 0 &&
    retryLimitMessage == null &&
    !bulkMutationLoading;
  const cancelBulkEnabled =
    eligibilitySummary.cancelEligibleCount > 0 &&
    cancelLimitMessage == null &&
    !bulkMutationLoading;

  function handleSelectAllLoaded() {
    if (!data?.runs.length) {
      return;
    }

    setSelectedRunIds((current) =>
      selectAllLoadedWorkflowRuns(
        current,
        data.runs.map((item) => item.workflowRun.id)
      )
    );
  }

  function openTargets(urls: string[]) {
    urls.forEach((url) => {
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }

  function handleOpenSelectedRunDetails() {
    const result = buildSelectedRunDetailTargets(selectedRunIds);

    if (result.error) {
      setBulkActionError(result.error);
      return;
    }

    setBulkActionError("");
    openTargets(result.urls);
  }

  function handleOpenSelectedJobs() {
    const result = buildSelectedJobTargets(data?.runs ?? [], selectedRunIds);

    if (result.error) {
      setBulkActionError(result.error);
      return;
    }

    if (result.urls.length === 0) {
      setBulkActionError("No selected jobs are available to open.");
      return;
    }

    setBulkActionError("");
    openTargets(result.urls);
  }

  function handleStartBulkAction(action: WorkflowRunsBulkControlAction) {
    setBulkActionError("");
    setBulkFollowUpMessage("");
    setBulkFollowUpError("");
    setPendingBulkAction(action);
  }

  async function handleConfirmBulkAction() {
    if (!pendingBulkAction) {
      return;
    }

    setBulkMutationLoading(true);
    setBulkActionError("");
    setBulkFollowUpMessage("");
    setBulkFollowUpError("");

    try {
      const response =
        pendingBulkAction === "retry"
          ? await bulkRetryWorkflowRuns(selectedRunIds)
          : await bulkCancelWorkflowRuns(selectedRunIds);
      const refreshed = await fetchWorkflowRuns(currentFilters);
      setData(refreshed);
      setSelectedRunIds([]);
      setLastBulkAction(pendingBulkAction);
      setLastBulkResponse(response);
      setPendingBulkAction(null);
    } catch (actionError) {
      setBulkActionError(
        actionError instanceof Error ? actionError.message : "Bulk workflow action failed"
      );
    } finally {
      setBulkMutationLoading(false);
    }
  }

  function handleOpenSuccessfulRuns() {
    if (successfulOutcomeTargets.error) {
      setBulkFollowUpError(successfulOutcomeTargets.error);
      setBulkFollowUpMessage("");
      return;
    }

    setBulkFollowUpError("");
    setBulkFollowUpMessage("");
    openTargets(successfulOutcomeTargets.urls);
  }

  function handleReselectSkippedRuns() {
    if (skippedOutcomeReselection.error) {
      setBulkFollowUpError(skippedOutcomeReselection.error);
      setBulkFollowUpMessage("");
      return;
    }

    setBulkFollowUpError("");
    setBulkFollowUpMessage(skippedOutcomeReselection.message ?? "");
    setSelectedRunIds(skippedOutcomeReselection.runIds);
  }

  function handleReselectFailedResults() {
    if (failedOutcomeReselection.error) {
      setBulkFollowUpError(failedOutcomeReselection.error);
      setBulkFollowUpMessage("");
      return;
    }

    setBulkFollowUpError("");
    setBulkFollowUpMessage(failedOutcomeReselection.message ?? "");
    setSelectedRunIds(failedOutcomeReselection.runIds);
  }

  return (
    <section className="content-grid">
      <Panel
        className="span-12"
        eyebrow="Workflow runs"
        title="Global execution attempts"
        copy="A cross-job view of analyze, resume, and prefill runs. Filter here, then drill into run detail when you need the full lifecycle."
      >
        {loading ? <div className="inline-note">Loading workflow runs...</div> : null}
        {error ? <div className="error-text">{error}</div> : null}
        {data ? (
          <div className="dashboard-metrics">
            {metrics.map((metric) => (
              <div key={metric.label} className="metric-card">
                <div className="eyebrow">{metric.label}</div>
                <div className="panel-metric">{metric.value}</div>
              </div>
            ))}
          </div>
        ) : null}
      </Panel>

      <Panel
        className="span-12"
        eyebrow="Filters"
        title="Narrow the run list"
        copy="These filters apply to the list and the summary cards together."
      >
        <div className="filter-row">
          <input
            className="field-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search run id, job title, company, application id..."
            aria-label="Search workflow runs"
          />
        </div>
        <div className="filter-row">
          <label className="field-label">
            <span>From</span>
            <input
              className="field-input"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>
          <label className="field-label">
            <span>To</span>
            <input
              className="field-input"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>
        </div>
        <div className="filter-row">
          <label className="field-label">
            <span>Sort by</span>
            <select className="field-input" value={sortBy} onChange={(event) => setSortBy(event.target.value as (typeof sortByOptions)[number]["value"])}>
              {sortByOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            <span>Order</span>
            <select
              className="field-input"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as (typeof sortOrderOptions)[number]["value"])}
            >
              {sortOrderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="filter-row">
          {kindFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`button ${kindFilter === filter ? "button-primary" : "button-secondary"}`}
              onClick={() => setKindFilter(filter)}
            >
              {filter === "all" ? "All kinds" : filter.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <div className="filter-row">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`button ${statusFilter === filter ? "button-primary" : "button-secondary"}`}
              onClick={() => setStatusFilter(filter)}
            >
              {filter === "all" ? "All statuses" : filter}
            </button>
          ))}
        </div>
        <div className="filter-row">
          {executionModeFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`button ${executionModeFilter === filter ? "button-primary" : "button-secondary"}`}
              onClick={() => setExecutionModeFilter(filter)}
            >
              {filter === "all" ? "All modes" : filter}
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        className="span-12"
        eyebrow="Run list"
        title="Filtered workflow runs"
        copy="Use the detail page when you need lifecycle events, retry lineage, or per-run controls."
      >
        {data ? (
          <div className="results-summary">
            <strong>{summaryCopy?.countLabel}</strong>
            <p>{summaryCopy?.sortLabel}</p>
            {summaryCopy?.filtersLabel ? <p>{summaryCopy.filtersLabel}</p> : null}
          </div>
        ) : null}
        {data?.runs.length ? (
          <div className="selection-toolbar">
            <div className="inline-note">
              {selectedCount > 0 ? `${selectedCount} runs selected` : "No runs selected"}
            </div>
            {selectedCount > 0 ? (
              <div className="pill-row">
                <span className="mini-pill">{eligibilitySummary.retryEligibleCount} retry eligible</span>
                <span className="mini-pill">{eligibilitySummary.cancelEligibleCount} cancel eligible</span>
                <span className="mini-pill">{eligibilitySummary.ineligibleCount} not eligible</span>
              </div>
            ) : null}
            {selectedCount > 0 ? (
              <div className="button-row">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={handleOpenSelectedRunDetails}
                >
                  Open selected run details
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={handleOpenSelectedJobs}
                >
                  Open selected jobs
                </button>
              </div>
            ) : null}
            {selectedCount > 0 ? (
              <div className="button-row">
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={!retryBulkEnabled}
                  onClick={() => handleStartBulkAction("retry")}
                >
                  Retry eligible runs
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={!cancelBulkEnabled}
                  onClick={() => handleStartBulkAction("cancel")}
                >
                  Cancel eligible runs
                </button>
              </div>
            ) : null}
            {pendingBulkAction ? (
              <>
                <div className="inline-note">
                  {buildWorkflowRunsBulkConfirmationCopy(pendingBulkAction, eligibilitySummary)}
                </div>
                {bulkPreflight ? (
                  <div className="bulk-outcome-panel">
                    <div className="bulk-preflight-groups">
                      <div className="bulk-preflight-group">
                        <div className="inline-note">
                          <strong>Will process</strong>{" "}
                          {bulkPreflight.willProcess.length > 0
                            ? `${bulkPreflight.willProcess.length} selected ${
                                bulkPreflight.willProcess.length === 1 ? "run" : "runs"
                              } will be ${pendingBulkAction === "retry" ? "retried" : "cancelled"}.`
                            : "No selected runs will be processed by this action."}
                        </div>
                        {bulkPreflight.willProcess.length > 0 ? (
                          <div className="bulk-outcome-list">
                            {bulkPreflight.willProcess.map((row) => (
                              <div
                                key={`process-${row.runId}`}
                                className="bulk-outcome-row bulk-outcome-success"
                              >
                                <div className="bulk-outcome-copy">
                                  <div className="pill-row">
                                    <span className="mini-pill">{row.kind.replace(/_/g, " ")}</span>
                                    <span className="mini-pill">{row.status}</span>
                                    <span className="mini-pill">{row.executionMode}</span>
                                    <span className="muted">{row.runId}</span>
                                  </div>
                                  <p>
                                    {pendingBulkAction === "retry"
                                      ? "This run will be retried."
                                      : "This run will be cancelled before execution."}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="bulk-preflight-group">
                        <div className="inline-note">
                          <strong>Will skip</strong>{" "}
                          {bulkPreflight.willSkip.length > 0
                            ? `${bulkPreflight.willSkip.length} selected ${
                                bulkPreflight.willSkip.length === 1 ? "run" : "runs"
                              } will be ignored.`
                            : "No selected runs will be skipped."}
                        </div>
                        {bulkPreflight.willSkip.length > 0 ? (
                          <div className="bulk-outcome-list">
                            {bulkPreflight.willSkip.map((row) => (
                              <div
                                key={`skip-${row.runId}`}
                                className="bulk-outcome-row bulk-outcome-neutral"
                              >
                                <div className="bulk-outcome-copy">
                                  <div className="pill-row">
                                    <span className="mini-pill">{row.kind.replace(/_/g, " ")}</span>
                                    <span className="mini-pill">{row.status}</span>
                                    <span className="mini-pill">{row.executionMode}</span>
                                    <span className="muted">{row.runId}</span>
                                  </div>
                                  <p>{row.reason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="button-row">
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={handleConfirmBulkAction}
                    disabled={bulkMutationLoading}
                  >
                    {bulkMutationLoading
                      ? "Working..."
                      : pendingBulkAction === "retry"
                        ? "Confirm retry"
                        : "Confirm cancel"}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setPendingBulkAction(null)}
                    disabled={bulkMutationLoading}
                  >
                    Go back
                  </button>
                </div>
              </>
            ) : null}
            <div className="button-row">
              <button type="button" className="button button-secondary" onClick={handleSelectAllLoaded}>
                Select all loaded
              </button>
              {selectedCount > 0 ? (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setSelectedRunIds([])}
                >
                  Clear selection
                </button>
              ) : null}
            </div>
            {bulkActionError ? <div className="error-text">{bulkActionError}</div> : null}
            {retryLimitMessage ? <div className="inline-note">{retryLimitMessage}</div> : null}
            {cancelLimitMessage ? <div className="inline-note">{cancelLimitMessage}</div> : null}
            {eligibilityMessages.map((message) => (
              <div key={message} className="inline-note">
                {message}
              </div>
            ))}
          </div>
        ) : null}
        {bulkOutcomePanel ? (
          <div className="bulk-outcome-panel">
            <div className="bulk-outcome-header">
              <div>
                <strong>{bulkOutcomePanel.title}</strong>
                <div className="inline-note">{bulkOutcomePanel.summary}</div>
              </div>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setLastBulkAction(null);
                  setLastBulkResponse(null);
                  setBulkFollowUpMessage("");
                  setBulkFollowUpError("");
                }}
              >
                Dismiss results
              </button>
            </div>
            <div className="bulk-outcome-list">
              {bulkOutcomePanel.rows.map((row) => (
                <div
                  key={`${row.status}-${row.runId}-${row.message}`}
                  className={`bulk-outcome-row bulk-outcome-${row.tone}`}
                >
                  <div className="bulk-outcome-copy">
                    <div className="pill-row">
                      <span className="mini-pill">{row.status}</span>
                      <span className="muted">{row.runId}</span>
                    </div>
                    <p>{row.message}</p>
                  </div>
                  {row.runDetailHref ? (
                    <Link className="button button-secondary" href={row.runDetailHref}>
                      Open run detail
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="button-row">
              {successfulOutcomeTargets.urls.length > 0 ? (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={handleOpenSuccessfulRuns}
                >
                  Open successful runs
                </button>
              ) : null}
              {bulkOutcomePanel.rows.some((row) => row.status === "skipped") ? (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={handleReselectSkippedRuns}
                >
                  Reselect skipped runs
                </button>
              ) : null}
              {bulkOutcomePanel.rows.some((row) => row.status === "failed") ? (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={handleReselectFailedResults}
                >
                  Reselect failed results
                </button>
              ) : null}
            </div>
            {bulkFollowUpMessage ? <div className="success-text">{bulkFollowUpMessage}</div> : null}
            {bulkFollowUpError ? <div className="error-text">{bulkFollowUpError}</div> : null}
          </div>
        ) : null}
        {showClearFilters ? (
          <div className="results-toolbar">
            {hasActiveFilters ? (
              <div className="pill-row">
                {resultChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    className="mini-pill filter-chip"
                    onClick={() => removeChip(chip.key)}
                  >
                    {chip.label}
                    <span aria-hidden="true">x</span>
                  </button>
                ))}
              </div>
            ) : null}
            <button type="button" className="button button-secondary" onClick={clearAllFilters}>
              Clear filters
            </button>
          </div>
        ) : null}
        {data && data.runs.length > 0 ? (
          <div className="job-list">
            {data.runs.map((item) => {
              const statusCopy = getWorkflowRunStatusCopy(item.workflowRun);
              const isSelected = selectedRunIds.includes(item.workflowRun.id);

              return (
                <div
                  key={item.workflowRun.id}
                  className={`job-card ${isSelected ? "job-card-selected" : ""}`}
                >
                  <label className="selection-row">
                    <input
                      className="selection-checkbox"
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        setSelectedRunIds((current) =>
                          toggleWorkflowRunSelection(current, item.workflowRun.id)
                        )
                      }
                    />
                    <span className="muted">Select this run</span>
                  </label>
                  <div className="pill-row">
                    <span className="mini-pill">{item.workflowRun.kind.replace(/_/g, " ")}</span>
                    <span className="mini-pill">{statusCopy.label}</span>
                    <span className="mini-pill">{item.workflowRun.executionMode}</span>
                  </div>
                  <h3>{item.job.title}</h3>
                  <p className="muted">{item.job.company}</p>
                  <p className="muted">{statusCopy.detail}</p>
                  <p className="muted">
                    Started{" "}
                    {item.workflowRun.startedAt
                      ? new Date(item.workflowRun.startedAt).toLocaleString()
                      : "not started yet"}
                    {item.workflowRun.completedAt
                      ? ` · Completed ${new Date(item.workflowRun.completedAt).toLocaleString()}`
                      : ""}
                  </p>
                  <div className="button-row">
                    <Link className="button button-secondary" href={`/workflow-runs/${item.workflowRun.id}`}>
                      Open run detail
                    </Link>
                    <Link className="button button-secondary" href={`/jobs/${item.job.id}`}>
                      Open job
                    </Link>
                    {item.application ? (
                      <Link className="button button-secondary" href={`/applications/${item.application.id}`}>
                        Open application
                      </Link>
                    ) : null}
                    {item.resumeVersion ? (
                      <Link className="button button-secondary" href={`/resume-versions/${item.resumeVersion.id}`}>
                        Open resume
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="inline-note">
            <strong>{emptyState.title}</strong> {emptyState.detail}
          </div>
        )}
        {data?.pageInfo.hasMore ? (
          <div className="button-row">
            <button type="button" className="button button-secondary" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? "Loading more..." : "Load more"}
            </button>
          </div>
        ) : null}
      </Panel>
    </section>
  );
}

export default function WorkflowRunsPage() {
  return (
    <Suspense
      fallback={
        <section className="content-grid">
          <Panel
            className="span-12"
            eyebrow="Workflow runs"
            title="Global execution attempts"
            copy="Loading the current workflow-runs view..."
          >
            <div className="inline-note">Loading workflow runs...</div>
          </Panel>
        </section>
      }
    >
      <WorkflowRunsPageContent />
    </Suspense>
  );
}
