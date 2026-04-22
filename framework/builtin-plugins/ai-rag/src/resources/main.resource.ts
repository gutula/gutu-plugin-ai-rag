import { defineResource } from "@platform/schema";
import { z } from "zod";

import {
  knowledgePipelines,
  memoryCandidates,
  memoryCollections,
  memoryDocuments,
  retrievalDiagnostics
} from "../../db/schema";

export const MemoryCollectionResource = defineResource({
  id: "ai.memory-collections",
  table: memoryCollections,
  contract: z.object({
    id: z.string().min(2),
    tenantId: z.string().min(2).nullable(),
    label: z.string().min(2),
    classification: z.enum(["public", "internal", "restricted", "confidential"]),
    sourcePlugin: z.string().min(2),
    reviewState: z.enum(["seeded", "reviewed", "approved"]),
    trustScore: z.number().int().min(0).max(100),
    freshnessWindowHours: z.number().int().positive(),
    ownerDepartment: z.string().min(2).nullable(),
    sourceBindingCount: z.number().int().nonnegative(),
    documentCount: z.number().int().nonnegative(),
    updatedAt: z.string()
  }),
  fields: {
    label: { searchable: true, sortable: true, label: "Label" },
    classification: { filter: "select", label: "Classification" },
    sourcePlugin: { searchable: true, sortable: true, label: "Source" },
    reviewState: { filter: "select", label: "Review" },
    trustScore: { sortable: true, filter: "number", label: "Trust" },
    freshnessWindowHours: { sortable: true, filter: "number", label: "Freshness Window" },
    documentCount: { sortable: true, filter: "number", label: "Documents" },
    updatedAt: { sortable: true, label: "Updated" }
  },
  admin: {
    autoCrud: true,
    defaultColumns: ["label", "reviewState", "trustScore", "sourcePlugin", "documentCount", "updatedAt"]
  },
  portal: { enabled: false },
  ai: {
    curatedReadModel: true,
    purpose: "Approved collections available for retrieval-grounded agent execution.",
    citationLabelField: "label",
    allowedFields: [
      "label",
      "classification",
      "sourcePlugin",
      "reviewState",
      "trustScore",
      "freshnessWindowHours",
      "documentCount",
      "updatedAt"
    ]
  }
});

export const MemoryDocumentResource = defineResource({
  id: "ai.memory-documents",
  table: memoryDocuments,
  contract: z.object({
    id: z.string().min(2),
    tenantId: z.string().min(2).nullable(),
    collectionId: z.string().min(2),
    title: z.string().min(2),
    sourcePlugin: z.string().min(2),
    sourceObjectId: z.string().min(2),
    sourceKind: z.string().min(2),
    classification: z.enum(["public", "internal", "restricted", "confidential"]),
    reviewState: z.enum(["draft", "in-review", "approved", "rejected"]),
    promotionState: z.enum(["candidate", "promoted", "archived"]),
    trustScore: z.number().int().min(0).max(100),
    freshnessWindowHours: z.number().int().positive(),
    freshnessStatus: z.enum(["fresh", "warning", "stale"]),
    provenanceUri: z.string().nullable(),
    lastReviewedAt: z.string().nullable(),
    promotedAt: z.string().nullable(),
    expiresAt: z.string().nullable(),
    updatedAt: z.string()
  }),
  fields: {
    title: { searchable: true, sortable: true, label: "Title" },
    sourcePlugin: { searchable: true, sortable: true, label: "Source plugin" },
    sourceKind: { filter: "select", label: "Source kind" },
    classification: { filter: "select", label: "Classification" },
    reviewState: { filter: "select", label: "Review" },
    promotionState: { filter: "select", label: "Promotion" },
    trustScore: { sortable: true, filter: "number", label: "Trust" },
    freshnessStatus: { filter: "select", label: "Freshness" },
    updatedAt: { sortable: true, label: "Updated" }
  },
  admin: {
    autoCrud: true,
    defaultColumns: ["title", "reviewState", "promotionState", "trustScore", "freshnessStatus", "updatedAt"]
  },
  portal: { enabled: false },
  ai: {
    curatedReadModel: true,
    purpose: "Grounding documents that can be reviewed, promoted, and cited by governed runs.",
    citationLabelField: "title",
    allowedFields: [
      "title",
      "sourcePlugin",
      "sourceObjectId",
      "sourceKind",
      "classification",
      "reviewState",
      "promotionState",
      "trustScore",
      "freshnessStatus",
      "updatedAt"
    ]
  }
});

export const RetrievalDiagnosticResource = defineResource({
  id: "ai.retrieval-diagnostics",
  table: retrievalDiagnostics,
  contract: z.object({
    id: z.string().min(2),
    tenantId: z.string().min(2),
    runId: z.string().nullable(),
    workflowInstanceId: z.string().nullable(),
    query: z.string().min(2),
    citationCount: z.number().int().nonnegative(),
    freshCitationCount: z.number().int().nonnegative(),
    staleCitationCount: z.number().int().nonnegative(),
    reviewCoverage: z.number().int().min(0).max(100),
    degraded: z.boolean(),
    weakestSourceId: z.string().nullable(),
    createdAt: z.string()
  }),
  fields: {
    query: { searchable: true, sortable: true, label: "Query" },
    citationCount: { sortable: true, filter: "number", label: "Citations" },
    staleCitationCount: { sortable: true, filter: "number", label: "Stale citations" },
    reviewCoverage: { sortable: true, filter: "number", label: "Review coverage" },
    degraded: { filter: "select", label: "Degraded" },
    createdAt: { sortable: true, label: "Created" }
  },
  admin: {
    autoCrud: true,
    defaultColumns: ["query", "citationCount", "staleCitationCount", "reviewCoverage", "degraded", "createdAt"]
  },
  portal: { enabled: false },
  ai: {
    curatedReadModel: true,
    purpose: "Persisted retrieval diagnostics linked to runs, workflows, freshness, and review coverage.",
    citationLabelField: "query",
    allowedFields: [
      "query",
      "citationCount",
      "freshCitationCount",
      "staleCitationCount",
      "reviewCoverage",
      "degraded",
      "weakestSourceId",
      "createdAt"
    ]
  }
});

export const KnowledgePipelineResource = defineResource({
  id: "ai.knowledge-pipelines",
  table: knowledgePipelines,
  contract: z.object({
    id: z.string().min(2),
    tenantId: z.string().min(2),
    label: z.string().min(2),
    status: z.enum(["draft", "published", "paused"]),
    collectionId: z.string().min(2),
    sourceConnectorId: z.string().min(2),
    freshnessSlaHours: z.number().int().positive(),
    trustPolicy: z.enum(["strict", "balanced", "exploratory"]),
    lastDiagnosticId: z.string().nullable(),
    lastRunAt: z.string().nullable(),
    nextRunAt: z.string().nullable(),
    updatedAt: z.string()
  }),
  fields: {
    label: { searchable: true, sortable: true, label: "Pipeline" },
    status: { filter: "select", label: "Status" },
    collectionId: { searchable: true, sortable: true, label: "Collection" },
    sourceConnectorId: { searchable: true, sortable: true, label: "Connector" },
    freshnessSlaHours: { sortable: true, filter: "number", label: "Freshness SLA" },
    trustPolicy: { filter: "select", label: "Trust Policy" },
    updatedAt: { sortable: true, label: "Updated" }
  },
  admin: {
    autoCrud: true,
    defaultColumns: ["label", "status", "collectionId", "sourceConnectorId", "trustPolicy", "updatedAt"]
  },
  portal: { enabled: false },
  ai: {
    curatedReadModel: true,
    purpose: "Knowledge pipelines that ingest governed content into retrieval-ready collections.",
    citationLabelField: "label",
    allowedFields: [
      "label",
      "status",
      "collectionId",
      "sourceConnectorId",
      "freshnessSlaHours",
      "trustPolicy",
      "lastDiagnosticId",
      "lastRunAt",
      "nextRunAt",
      "updatedAt"
    ]
  }
});

export const MemoryCandidateResource = defineResource({
  id: "ai.memory-candidates",
  table: memoryCandidates,
  contract: z.object({
    id: z.string().min(2),
    tenantId: z.string().min(2),
    documentId: z.string().min(2),
    targetCollectionId: z.string().min(2),
    sourceConnectorId: z.string().nullable(),
    reviewState: z.enum(["pending", "approved", "rejected"]),
    status: z.enum(["candidate", "promoted", "rejected"]),
    trustScore: z.number().int().min(0).max(100),
    freshnessStatus: z.enum(["fresh", "warning", "stale"]),
    replayRunId: z.string().nullable(),
    diagnosticId: z.string().nullable(),
    discoveredAt: z.string(),
    promotedAt: z.string().nullable(),
    updatedAt: z.string()
  }),
  fields: {
    documentId: { searchable: true, sortable: true, label: "Document" },
    targetCollectionId: { searchable: true, sortable: true, label: "Target Collection" },
    reviewState: { filter: "select", label: "Review" },
    status: { filter: "select", label: "Status" },
    trustScore: { sortable: true, filter: "number", label: "Trust" },
    freshnessStatus: { filter: "select", label: "Freshness" },
    updatedAt: { sortable: true, label: "Updated" }
  },
  admin: {
    autoCrud: true,
    defaultColumns: ["documentId", "targetCollectionId", "reviewState", "status", "freshnessStatus", "updatedAt"]
  },
  portal: { enabled: false },
  ai: {
    curatedReadModel: true,
    purpose: "Memory promotion candidates discovered by knowledge pipelines and runtime ingestion.",
    citationLabelField: "documentId",
    allowedFields: [
      "documentId",
      "targetCollectionId",
      "reviewState",
      "status",
      "trustScore",
      "freshnessStatus",
      "replayRunId",
      "diagnosticId",
      "discoveredAt",
      "promotedAt",
      "updatedAt"
    ]
  }
});

export const aiRagResources = [
  MemoryCollectionResource,
  MemoryDocumentResource,
  RetrievalDiagnosticResource,
  KnowledgePipelineResource,
  MemoryCandidateResource
] as const;
