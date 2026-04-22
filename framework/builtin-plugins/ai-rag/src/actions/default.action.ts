import { defineAction } from "@platform/schema";
import { z } from "zod";

import {
  ingestMemoryDocument,
  promoteMemoryCandidate,
  promoteMemoryDocument,
  reindexMemoryCollection,
  retrieveTenantKnowledge,
  upsertKnowledgePipeline,
  reviewMemoryDocument
} from "../services/main.service";

export const ingestMemoryDocumentAction = defineAction({
  id: "ai.memory.ingest",
  input: z.object({
    tenantId: z.string().min(2),
    collectionId: z.string().min(2),
    title: z.string().min(3),
    body: z.string().min(24),
    sourceObjectId: z.string().min(2),
    sourceKind: z.string().min(2),
    classification: z.enum(["public", "internal", "restricted", "confidential"]),
    provenanceUri: z.string().min(4).optional(),
    bindingPluginId: z.string().min(2).optional(),
    trustScore: z.number().int().min(0).max(100).optional(),
    freshnessWindowHours: z.number().int().positive().optional(),
    tags: z.array(z.string().min(1)).optional()
  }),
  output: z.object({
    ok: z.literal(true),
    chunkCount: z.number().int().positive(),
    collectionId: z.string(),
    reviewState: z.enum(["draft", "in-review", "approved", "rejected"])
  }),
  permission: "ai.memory.ingest",
  idempotent: true,
  audit: true,
  ai: {
    purpose: "Ingest a governed document into a tenant-safe memory collection.",
    riskLevel: "moderate",
    approvalMode: "required",
    toolPolicies: ["tool.require_approval"],
    groundingInputs: [{ sourceId: "ai.memory-collections", required: true }],
    resultSummaryHint: "Return the collection id, review state, and number of memory chunks created.",
    replay: {
      deterministic: true,
      includeInputHash: true,
      includeOutputHash: true,
      note: "Ingestion replays are pinned to the submitted body hash and binding metadata."
    }
  },
  handler: ({ input }) => ingestMemoryDocument(input)
});

export const retrieveMemoryAction = defineAction({
  id: "ai.memory.retrieve",
  input: z.object({
    tenantId: z.string().min(2),
    query: z.string().min(3),
    collectionIds: z.array(z.string().min(2)).optional(),
    topK: z.number().int().positive().max(10).optional(),
    runId: z.string().min(2).optional(),
    workflowInstanceId: z.string().min(2).optional()
  }),
  output: z.object({
    ok: z.literal(true),
    citationCount: z.number().int().nonnegative(),
    chunkIds: z.array(z.string()),
    diagnosticId: z.string(),
    degraded: z.boolean(),
    reviewCoverage: z.number().int().min(0).max(100)
  }),
  permission: "ai.memory.read",
  idempotent: true,
  audit: false,
  ai: {
    purpose: "Retrieve grounded memory with persisted diagnostics from approved collections.",
    riskLevel: "low",
    approvalMode: "none",
    toolPolicies: ["tool.allow"],
    groundingInputs: [
      { sourceId: "ai.memory-documents", required: true },
      { sourceId: "ai.retrieval-diagnostics", required: false }
    ],
    resultSummaryHint: "Return citation counts plus the persisted diagnostic id, degraded flag, and review coverage.",
    replay: {
      deterministic: true,
      includeInputHash: true,
      includeOutputHash: true,
      note: "Retrieval responses are anchored to collection selection, freshness policy, and review coverage."
    }
  },
  handler: ({ input }) => retrieveTenantKnowledge(input)
});

export const reindexMemoryCollectionAction = defineAction({
  id: "ai.memory.reindex",
  input: z.object({
    tenantId: z.string().min(2),
    collectionId: z.string().min(2)
  }),
  output: z.object({
    ok: z.literal(true),
    queuedDocuments: z.number().int().nonnegative()
  }),
  permission: "ai.memory.reindex",
  idempotent: true,
  audit: true,
  ai: {
    purpose: "Queue a memory collection for deterministic reindexing.",
    riskLevel: "moderate",
    approvalMode: "required",
    toolPolicies: ["tool.require_approval"],
    resultSummaryHint: "Return how many documents were queued for reindexing.",
    replay: {
      deterministic: true,
      includeInputHash: true,
      includeOutputHash: true,
      note: "Reindex requests capture the collection id and resulting queue count."
    }
  },
  handler: ({ input }) => reindexMemoryCollection(input)
});

export const reviewMemoryDocumentAction = defineAction({
  id: "ai.memory.review",
  input: z.object({
    tenantId: z.string().min(2),
    documentId: z.string().min(2),
    reviewerId: z.string().min(2),
    decision: z.enum(["approved", "needs-refresh", "rejected"]),
    note: z.string().min(3).optional(),
    trustScore: z.number().int().min(0).max(100).optional(),
    freshnessWindowHours: z.number().int().positive().optional()
  }),
  output: z.object({
    ok: z.literal(true),
    documentId: z.string(),
    reviewState: z.enum(["draft", "in-review", "approved", "rejected"]),
    freshnessStatus: z.enum(["fresh", "warning", "stale"])
  }),
  permission: "ai.memory.review",
  idempotent: true,
  audit: true,
  handler: ({ input }) => reviewMemoryDocument(input)
});

export const promoteMemoryDocumentAction = defineAction({
  id: "ai.memory.promote",
  input: z.object({
    tenantId: z.string().min(2),
    actorId: z.string().min(2),
    documentId: z.string().min(2),
    targetCollectionId: z.string().min(2).optional()
  }),
  output: z.object({
    ok: z.literal(true),
    documentId: z.string(),
    collectionId: z.string(),
    promotionState: z.enum(["candidate", "promoted", "archived"])
  }),
  permission: "ai.memory.promote",
  idempotent: true,
  audit: true,
  handler: ({ input }) => promoteMemoryDocument(input)
});

export const upsertKnowledgePipelineAction = defineAction({
  id: "ai.knowledge-pipelines.upsert",
  input: z.object({
    tenantId: z.string().min(2),
    actorId: z.string().min(2),
    pipelineId: z.string().min(2),
    label: z.string().min(2),
    status: z.enum(["draft", "published", "paused"]),
    collectionId: z.string().min(2),
    sourceConnectorId: z.string().min(2),
    freshnessSlaHours: z.number().int().positive(),
    trustPolicy: z.enum(["strict", "balanced", "exploratory"])
  }),
  output: z.object({
    ok: z.literal(true),
    pipelineId: z.string(),
    status: z.enum(["draft", "published", "paused"])
  }),
  permission: "ai.knowledge-pipelines.write",
  idempotent: true,
  audit: true,
  handler: ({ input }) => upsertKnowledgePipeline(input)
});

export const promoteMemoryCandidateAction = defineAction({
  id: "ai.memory-candidates.promote",
  input: z.object({
    tenantId: z.string().min(2),
    actorId: z.string().min(2),
    candidateId: z.string().min(2),
    targetCollectionId: z.string().min(2).optional()
  }),
  output: z.object({
    ok: z.literal(true),
    candidateId: z.string(),
    documentId: z.string(),
    status: z.enum(["candidate", "promoted", "rejected"])
  }),
  permission: "ai.memory-candidates.promote",
  idempotent: true,
  audit: true,
  handler: ({ input }) => promoteMemoryCandidate(input)
});

export const aiRagActions = [
  ingestMemoryDocumentAction,
  retrieveMemoryAction,
  reindexMemoryCollectionAction,
  reviewMemoryDocumentAction,
  promoteMemoryDocumentAction,
  upsertKnowledgePipelineAction,
  promoteMemoryCandidateAction
] as const;
