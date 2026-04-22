import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ingestMemoryDocument,
  listMemoryDocuments,
  listRetrievalDiagnostics,
  promoteMemoryDocument,
  retrieveTenantKnowledge,
  reviewMemoryDocument
} from "../../src/services/main.service";

describe("ai-rag integration", () => {
  let stateDir = "";
  const previousStateDir = process.env.GUTU_STATE_DIR;

  beforeEach(() => {
    stateDir = mkdtempSync(join(tmpdir(), "gutu-ai-rag-integration-"));
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

  it("runs ingest -> review -> promote -> retrieve with replay-linked diagnostics", () => {
    ingestMemoryDocument({
      tenantId: "tenant-platform",
      collectionId: "memory-collection:ops",
      title: "Company builder escalation routing",
      body: "Company builder escalation routing requires approved knowledge and explicit operator handoff evidence.",
      sourceObjectId: "company-builder-escalation-routing",
      sourceKind: "operator-note",
      classification: "internal"
    });

    const documentId =
      listMemoryDocuments().find((document) => document.sourceObjectId === "company-builder-escalation-routing")?.id ?? "";

    const reviewed = reviewMemoryDocument({
      tenantId: "tenant-platform",
      documentId,
      reviewerId: "reviewer-ops",
      decision: "approved",
      trustScore: 96,
      note: "Approved for company-builder routing and escalation."
    });
    const promoted = promoteMemoryDocument({
      tenantId: "tenant-platform",
      actorId: "actor-admin",
      documentId
    });
    const retrieval = retrieveTenantKnowledge({
      tenantId: "tenant-platform",
      query: "company builder escalation routing approved knowledge",
      collectionIds: ["memory-collection:ops"],
      topK: 1,
      runId: "run:integration:ai-rag",
      workflowInstanceId: "workflow:integration:ai-rag"
    });
    const diagnostic = listRetrievalDiagnostics().find((entry) => entry.id === retrieval.diagnosticId);

    expect(reviewed.reviewState).toBe("approved");
    expect(promoted.promotionState).toBe("promoted");
    expect(retrieval.citationCount).toBeGreaterThan(0);
    expect(retrieval.reviewCoverage).toBe(100);
    expect(retrieval.degraded).toBe(false);
    expect(diagnostic?.runId).toBe("run:integration:ai-rag");
    expect(diagnostic?.workflowInstanceId).toBe("workflow:integration:ai-rag");
  });

  it("keeps needs-refresh documents stale and records degraded retrieval diagnostics", () => {
    ingestMemoryDocument({
      tenantId: "tenant-platform",
      collectionId: "memory-collection:ops",
      title: "Stale company recovery note",
      body: "Unique stale company recovery note for escalation review and retrieval degradation.",
      sourceObjectId: "stale-company-recovery-note",
      sourceKind: "operator-note",
      classification: "internal"
    });

    const documentId = listMemoryDocuments().find((document) => document.sourceObjectId === "stale-company-recovery-note")?.id ?? "";
    const reviewed = reviewMemoryDocument({
      tenantId: "tenant-platform",
      documentId,
      reviewerId: "reviewer-ops",
      decision: "needs-refresh",
      trustScore: 40,
      note: "Needs refresh before promotion."
    });
    const retrieval = retrieveTenantKnowledge({
      tenantId: "tenant-platform",
      query: "Unique stale company recovery note for escalation review and retrieval degradation.",
      collectionIds: ["memory-collection:ops"],
      topK: 1,
      runId: "run:integration:stale-rag"
    });
    const diagnostic = listRetrievalDiagnostics().find((entry) => entry.id === retrieval.diagnosticId);

    expect(reviewed.reviewState).toBe("in-review");
    expect(reviewed.freshnessStatus).toBe("stale");
    expect(retrieval.degraded).toBe(true);
    expect(diagnostic?.staleCitationCount).toBeGreaterThan(0);
    expect(diagnostic?.reviewCoverage).toBe(0);
  });

  it("rejects promotion until approval and validates target collections", () => {
    ingestMemoryDocument({
      tenantId: "tenant-platform",
      collectionId: "memory-collection:ops",
      title: "Promotion boundary note",
      body: "Promotion boundary note for invalid target coverage.",
      sourceObjectId: "promotion-boundary-note",
      sourceKind: "operator-note",
      classification: "internal"
    });

    const documentId = listMemoryDocuments().find((document) => document.sourceObjectId === "promotion-boundary-note")?.id ?? "";

    expect(() =>
      promoteMemoryDocument({
        tenantId: "tenant-platform",
        actorId: "actor-admin",
        documentId
      })
    ).toThrow(/must be approved before promotion/);

    reviewMemoryDocument({
      tenantId: "tenant-platform",
      documentId,
      reviewerId: "reviewer-ops",
      decision: "approved",
      trustScore: 92
    });

    expect(() =>
      promoteMemoryDocument({
        tenantId: "tenant-platform",
        actorId: "actor-admin",
        documentId,
        targetCollectionId: "memory-collection:missing"
      })
    ).toThrow(/Unknown target collection/);
  });
});
