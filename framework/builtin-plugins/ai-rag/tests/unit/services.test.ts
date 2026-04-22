import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ingestMemoryDocument,
  listKnowledgePipelines,
  listMemoryCandidates,
  listRetrievalDiagnostics,
  listMemoryCollections,
  listMemoryDocuments,
  promoteMemoryCandidate,
  promoteMemoryDocument,
  reindexMemoryCollection,
  reviewMemoryDocument,
  retrieveTenantKnowledge,
  upsertKnowledgePipeline
} from "../../src/services/main.service";

describe("ai-rag services", () => {
  let stateDir = "";
  const previousStateDir = process.env.GUTU_STATE_DIR;

  beforeEach(() => {
    stateDir = mkdtempSync(join(tmpdir(), "gutu-ai-rag-state-"));
    process.env.GUTU_STATE_DIR = stateDir;
  });

  afterEach(() => {
    rmSync(stateDir, { recursive: true, force: true });
    if (previousStateDir === undefined) {
      delete process.env.GUTU_STATE_DIR;
      return;
    }
    process.env.GUTU_STATE_DIR = previousStateDir;
  });

  it("persists ingested documents and updates collection counts", () => {
    const ingested = ingestMemoryDocument({
      tenantId: "tenant-platform",
      collectionId: "memory-collection:ops",
      title: "Approval recovery playbook",
      body: "Recovery playbook for approval queues and escalation checkpoints.",
      sourceObjectId: "ops-approval-recovery",
      sourceKind: "operator-note",
      classification: "internal"
    });

    expect(ingested.chunkCount).toBeGreaterThan(0);
    expect(ingested.reviewState).toBe("draft");
    expect(listMemoryDocuments()[0]?.sourceObjectId).toBe("ops-approval-recovery");
    expect(listMemoryCollections().find((collection) => collection.id === "memory-collection:ops")?.metadata?.documentCount).toBe(3);
  });

  it("retrieves citations with persisted diagnostics and tracks reindex requests", () => {
    ingestMemoryDocument({
      tenantId: "tenant-platform",
      collectionId: "memory-collection:ops",
      title: "Retrieval guidance",
      body: "Use retrieval diagnostics and approval checkpoints during incident review.",
      sourceObjectId: "retrieval-guidance",
      sourceKind: "operator-note",
      classification: "internal"
    });

    const retrieval = retrieveTenantKnowledge({
      tenantId: "tenant-platform",
      query: "retrieval diagnostics approval checkpoints",
      collectionIds: ["memory-collection:ops"],
      runId: "run:ops-triage:test"
    });
    const reindex = reindexMemoryCollection({
      tenantId: "tenant-platform",
      collectionId: "memory-collection:ops"
    });

    expect(retrieval.citationCount).toBeGreaterThan(0);
    expect(retrieval.chunkIds.length).toBeGreaterThan(0);
    expect(retrieval.diagnosticId).toContain("retrieval-diagnostic:");
    expect(listRetrievalDiagnostics()[0]?.runId).toBe("run:ops-triage:test");
    expect(reindex.queuedDocuments).toBeGreaterThanOrEqual(3);
  });

  it("requires approval before promotion and allows review-driven promotion", () => {
    const ingested = ingestMemoryDocument({
      tenantId: "tenant-platform",
      collectionId: "memory-collection:ops",
      title: "Department routing playbook",
      body: "Route high risk work to finance approvals, then promote the updated playbook once it is reviewed.",
      sourceObjectId: "department-routing-playbook",
      sourceKind: "operator-note",
      classification: "internal"
    });

    const documentId = listMemoryDocuments().find((document) => document.sourceObjectId === "department-routing-playbook")?.id ?? "";

    const reviewed = reviewMemoryDocument({
      tenantId: "tenant-platform",
      documentId,
      reviewerId: "reviewer-1",
      decision: "approved",
      trustScore: 93,
      note: "Reviewed for company builder routing."
    });
    const promoted = promoteMemoryDocument({
      tenantId: "tenant-platform",
      actorId: "actor-admin",
      documentId
    });

    expect(ingested.reviewState).toBe("draft");
    expect(reviewed.reviewState).toBe("approved");
    expect(reviewed.freshnessStatus).toBe("fresh");
    expect(promoted.promotionState).toBe("promoted");
  });

  it("tracks knowledge pipelines and promotes memory candidates through governed review", () => {
    const ingested = ingestMemoryDocument({
      tenantId: "tenant-platform",
      collectionId: "memory-collection:ops",
      title: "Connector sync policy",
      body: "Pipeline syncs must preserve provenance, freshness budgets, and approval-safe recovery notes.",
      sourceObjectId: "connector-sync-policy",
      sourceKind: "connector-note",
      classification: "internal",
      bindingPluginId: "integration-core"
    });
    const documentId = listMemoryDocuments().find((document) => document.sourceObjectId === "connector-sync-policy")?.id ?? "";
    const candidateId = listMemoryCandidates().find((candidate) => candidate.documentId === documentId)?.id ?? "";

    const pipeline = upsertKnowledgePipeline({
      tenantId: "tenant-platform",
      actorId: "actor-admin",
      pipelineId: "knowledge-pipeline:integration-sync",
      label: "Integration Sync Pipeline",
      status: "published",
      collectionId: "memory-collection:ops",
      sourceConnectorId: "connector:crm",
      freshnessSlaHours: 24,
      trustPolicy: "balanced"
    });
    reviewMemoryDocument({
      tenantId: "tenant-platform",
      documentId,
      reviewerId: "reviewer-ops",
      decision: "approved",
      note: "Approved for integration routing."
    });
    const promotedCandidate = promoteMemoryCandidate({
      tenantId: "tenant-platform",
      actorId: "actor-admin",
      candidateId
    });

    expect(ingested.chunkCount).toBeGreaterThan(0);
    expect(pipeline.status).toBe("published");
    expect(listKnowledgePipelines().some((entry) => entry.id === "knowledge-pipeline:integration-sync")).toBe(true);
    expect(promotedCandidate.status).toBe("promoted");
    expect(listMemoryCandidates().find((entry) => entry.id === candidateId)?.status).toBe("promoted");
  });
});
