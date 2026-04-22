import {
  chunkMemoryDocument,
  defineMemoryCollection,
  defineMemoryDocument,
  defineMemoryPolicy,
  retrieveMemory,
  type MemoryCollection,
  type MemoryDocument
} from "@platform/ai-memory";
import { loadJsonState, updateJsonState } from "@platform/ai-runtime";
import { normalizeActionInput } from "@platform/schema";

export type CollectionReviewState = "seeded" | "reviewed" | "approved";
export type DocumentReviewState = "draft" | "in-review" | "approved" | "rejected";
export type MemoryPromotionState = "candidate" | "promoted" | "archived";
export type MemoryFreshnessStatus = "fresh" | "warning" | "stale";

export type GovernedMemoryCollection = MemoryCollection & {
  reviewState: CollectionReviewState;
  trustScore: number;
  freshnessWindowHours: number;
  ownerDepartment: string | null;
  sourceBindings: Array<{
    pluginId: string;
    resourceId: string;
  }>;
};

export type GovernedMemoryDocument = MemoryDocument & {
  reviewState: DocumentReviewState;
  promotionState: MemoryPromotionState;
  trustScore: number;
  freshnessWindowHours: number;
  freshnessStatus: MemoryFreshnessStatus;
  lastReviewedAt: string | null;
  promotedAt: string | null;
  expiresAt: string | null;
  provenanceUri: string | null;
  bindingPluginId: string;
  bindingObjectId: string;
  reviewNote: string | null;
};

export type RetrievalDiagnostic = {
  id: string;
  tenantId: string;
  runId: string | null;
  workflowInstanceId: string | null;
  query: string;
  collectionIds: string[];
  chunkIds: string[];
  citationCount: number;
  freshCitationCount: number;
  staleCitationCount: number;
  reviewCoverage: number;
  degraded: boolean;
  weakestSourceId: string | null;
  createdAt: string;
};

export type KnowledgePipelineStatus = "draft" | "published" | "paused";
export type KnowledgePipelineTrustPolicy = "strict" | "balanced" | "exploratory";

export type KnowledgePipelineRecord = {
  id: string;
  tenantId: string;
  label: string;
  status: KnowledgePipelineStatus;
  collectionId: string;
  sourceConnectorId: string;
  freshnessSlaHours: number;
  trustPolicy: KnowledgePipelineTrustPolicy;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastDiagnosticId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MemoryCandidateReviewState = "pending" | "approved" | "rejected";
export type MemoryCandidateStatus = "candidate" | "promoted" | "rejected";

export type MemoryCandidateRecord = {
  id: string;
  tenantId: string;
  documentId: string;
  targetCollectionId: string;
  sourceConnectorId: string | null;
  reviewState: MemoryCandidateReviewState;
  status: MemoryCandidateStatus;
  trustScore: number;
  freshnessStatus: MemoryFreshnessStatus;
  replayRunId: string | null;
  diagnosticId: string | null;
  discoveredAt: string;
  promotedAt: string | null;
  updatedAt: string;
};

export type IngestMemoryDocumentInput = {
  tenantId: string;
  collectionId: string;
  title: string;
  body: string;
  sourceObjectId: string;
  sourceKind: string;
  classification: "public" | "internal" | "restricted" | "confidential";
  provenanceUri?: string | undefined;
  bindingPluginId?: string | undefined;
  trustScore?: number | undefined;
  freshnessWindowHours?: number | undefined;
  tags?: string[] | undefined;
};

export type RetrievalRequestInput = {
  tenantId: string;
  query: string;
  collectionIds?: string[] | undefined;
  topK?: number | undefined;
  runId?: string | undefined;
  workflowInstanceId?: string | undefined;
};

export type ReindexMemoryCollectionInput = {
  tenantId: string;
  collectionId: string;
};

export type ReviewMemoryDocumentInput = {
  tenantId: string;
  documentId: string;
  reviewerId: string;
  decision: "approved" | "needs-refresh" | "rejected";
  note?: string | undefined;
  trustScore?: number | undefined;
  freshnessWindowHours?: number | undefined;
};

export type PromoteMemoryDocumentInput = {
  tenantId: string;
  actorId: string;
  documentId: string;
  targetCollectionId?: string | undefined;
};

export type UpsertKnowledgePipelineInput = {
  tenantId: string;
  actorId: string;
  pipelineId: string;
  label: string;
  status: KnowledgePipelineStatus;
  collectionId: string;
  sourceConnectorId: string;
  freshnessSlaHours: number;
  trustPolicy: KnowledgePipelineTrustPolicy;
};

export type PromoteMemoryCandidateInput = {
  tenantId: string;
  actorId: string;
  candidateId: string;
  targetCollectionId?: string | undefined;
};

function defineGovernedMemoryCollection(
  input: Omit<GovernedMemoryCollection, "metadata"> & { metadata?: Record<string, unknown> | undefined }
): GovernedMemoryCollection {
  const base = defineMemoryCollection({
    id: input.id,
    label: input.label,
    policyScope: input.policyScope,
    sourcePlugin: input.sourcePlugin,
    tenantId: input.tenantId,
    classification: input.classification,
    metadata: {
      ...(input.metadata ?? {})
    }
  });

  return Object.freeze({
    ...base,
    reviewState: input.reviewState,
    trustScore: Math.max(0, Math.min(100, Math.round(input.trustScore))),
    freshnessWindowHours: Math.max(1, input.freshnessWindowHours),
    ownerDepartment: input.ownerDepartment,
    sourceBindings: [...input.sourceBindings].sort((left, right) => left.pluginId.localeCompare(right.pluginId))
  });
}

function defineGovernedMemoryDocument(input: GovernedMemoryDocument): GovernedMemoryDocument {
  const base = defineMemoryDocument({
    id: input.id,
    collectionId: input.collectionId,
    sourcePlugin: input.sourcePlugin,
    sourceObjectId: input.sourceObjectId,
    sourceKind: input.sourceKind,
    title: input.title,
    body: input.body,
    tenantId: input.tenantId,
    classification: input.classification,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    tags: input.tags
  });

  return Object.freeze({
    ...base,
    reviewState: input.reviewState,
    promotionState: input.promotionState,
    trustScore: Math.max(0, Math.min(100, Math.round(input.trustScore))),
    freshnessWindowHours: Math.max(1, input.freshnessWindowHours),
    freshnessStatus: input.freshnessStatus,
    lastReviewedAt: input.lastReviewedAt,
    promotedAt: input.promotedAt,
    expiresAt: input.expiresAt,
    provenanceUri: input.provenanceUri,
    bindingPluginId: input.bindingPluginId,
    bindingObjectId: input.bindingObjectId,
    reviewNote: input.reviewNote
  });
}

export const memoryCollectionsFixture = Object.freeze<GovernedMemoryCollection[]>([
  defineGovernedMemoryCollection({
    id: "memory-collection:ops",
    label: "Ops Playbooks",
    policyScope: "tenant",
    sourcePlugin: "knowledge-core",
    tenantId: "tenant-platform",
    classification: "internal",
    reviewState: "approved",
    trustScore: 95,
    freshnessWindowHours: 72,
    ownerDepartment: "Operations",
    sourceBindings: [{ pluginId: "knowledge-core", resourceId: "knowledge.articles" }],
    metadata: {
      documentCount: 2
    }
  }),
  defineGovernedMemoryCollection({
    id: "memory-collection:kb",
    label: "Support Knowledge",
    policyScope: "tenant",
    sourcePlugin: "knowledge-core",
    tenantId: "tenant-platform",
    classification: "restricted",
    reviewState: "reviewed",
    trustScore: 89,
    freshnessWindowHours: 48,
    ownerDepartment: "Finance",
    sourceBindings: [{ pluginId: "knowledge-core", resourceId: "knowledge.articles" }],
    metadata: {
      documentCount: 1
    }
  })
]);

export const documentFixtures = Object.freeze<GovernedMemoryDocument[]>([
  defineGovernedMemoryDocument({
    id: "memory-document:ops-handoff",
    collectionId: "memory-collection:ops",
    sourcePlugin: "knowledge-core",
    sourceObjectId: "article:ops-handoff",
    sourceKind: "knowledge-article",
    title: "Shift handoff checklist",
    body: "Confirm open incidents, verify export backlog, and review approvals before ending the shift.",
    tenantId: "tenant-platform",
    classification: "internal",
    createdAt: "2026-04-21T08:00:00.000Z",
    updatedAt: "2026-04-21T08:30:00.000Z",
    tags: ["ops", "handoff"],
    reviewState: "approved",
    promotionState: "promoted",
    trustScore: 96,
    freshnessWindowHours: 72,
    freshnessStatus: "fresh",
    lastReviewedAt: "2026-04-21T08:45:00.000Z",
    promotedAt: "2026-04-21T08:46:00.000Z",
    expiresAt: "2026-04-24T08:45:00.000Z",
    provenanceUri: "knowledge://article/ops-handoff",
    bindingPluginId: "knowledge-core",
    bindingObjectId: "article:ops-handoff",
    reviewNote: "Approved for operator handoffs."
  }),
  defineGovernedMemoryDocument({
    id: "memory-document:finance-escalations",
    collectionId: "memory-collection:kb",
    sourcePlugin: "knowledge-core",
    sourceObjectId: "article:finance-escalations",
    sourceKind: "knowledge-article",
    title: "Finance escalation policy",
    body: "Finance exception approvals require a human checkpoint, an audit reason, and replay-safe prompt metadata.",
    tenantId: "tenant-platform",
    classification: "restricted",
    createdAt: "2026-04-21T11:00:00.000Z",
    updatedAt: "2026-04-21T10:45:00.000Z",
    tags: ["finance", "approvals"],
    reviewState: "approved",
    promotionState: "promoted",
    trustScore: 92,
    freshnessWindowHours: 48,
    freshnessStatus: "fresh",
    lastReviewedAt: "2026-04-21T11:00:00.000Z",
    promotedAt: "2026-04-21T11:10:00.000Z",
    expiresAt: "2026-04-23T11:00:00.000Z",
    provenanceUri: "knowledge://article/finance-escalations",
    bindingPluginId: "knowledge-core",
    bindingObjectId: "article:finance-escalations",
    reviewNote: "Restricted source approved for finance and AI approval workflows."
  }),
  defineGovernedMemoryDocument({
    id: "memory-document:retrieval-debugging",
    collectionId: "memory-collection:ops",
    sourcePlugin: "ai-rag",
    sourceObjectId: "diagnostic:retrieval-debugging",
    sourceKind: "diagnostic-note",
    title: "Retrieval diagnostics",
    body: "Inspect freshness windows, source classifications, and citation minimums when a run produces weak grounding.",
    tenantId: "tenant-platform",
    classification: "internal",
    createdAt: "2026-04-18T07:00:00.000Z",
    updatedAt: "2026-04-18T09:20:00.000Z",
    tags: ["retrieval", "diagnostics"],
    reviewState: "in-review",
    promotionState: "candidate",
    trustScore: 78,
    freshnessWindowHours: 24,
    freshnessStatus: "warning",
    lastReviewedAt: "2026-04-18T09:25:00.000Z",
    promotedAt: null,
    expiresAt: "2026-04-22T06:00:00.000Z",
    provenanceUri: "ai-rag://diagnostic/retrieval-debugging",
    bindingPluginId: "ai-rag",
    bindingObjectId: "diagnostic:retrieval-debugging",
    reviewNote: "Needs promotion after the next retrieval tuning pass."
  })
]);

export const chunkFixtures = Object.freeze(
  documentFixtures.flatMap((document) => chunkMemoryDocument(toMemoryDocument(document), { chunkSize: 18, overlap: 4 }))
);

const aiRagStateFile = "ai-memory-rag.json";

type ReindexRequest = {
  id: string;
  tenantId: string;
  collectionId: string;
  requestedAt: string;
  queuedDocuments: number;
};

type AiRagState = {
  collections: GovernedMemoryCollection[];
  documents: GovernedMemoryDocument[];
  reindexRequests: ReindexRequest[];
  diagnostics: RetrievalDiagnostic[];
  knowledgePipelines: KnowledgePipelineRecord[];
  memoryCandidates: MemoryCandidateRecord[];
};

function seedAiRagState(): AiRagState {
  return normalizeAiRagState({
    collections: [...memoryCollectionsFixture],
    documents: [...documentFixtures],
    reindexRequests: [],
    diagnostics: [],
    knowledgePipelines: [
      defineKnowledgePipeline({
        id: "knowledge-pipeline:ops-handbook",
        tenantId: "tenant-platform",
        label: "Ops Handbook Sync",
        status: "published",
        collectionId: "memory-collection:ops",
        sourceConnectorId: "connector:knowledge-core",
        freshnessSlaHours: 24,
        trustPolicy: "strict",
        lastRunAt: "2026-04-22T08:00:00.000Z",
        nextRunAt: "2026-04-23T08:00:00.000Z",
        lastDiagnosticId: null,
        createdAt: "2026-04-22T07:50:00.000Z",
        updatedAt: "2026-04-22T08:00:00.000Z"
      })
    ],
    memoryCandidates: [
      defineMemoryCandidate({
        id: "memory-candidate:retrieval-debugging",
        tenantId: "tenant-platform",
        documentId: "memory-document:retrieval-debugging",
        targetCollectionId: "memory-collection:ops",
        sourceConnectorId: "connector:knowledge-core",
        reviewState: "pending",
        status: "candidate",
        trustScore: 78,
        freshnessStatus: "warning",
        replayRunId: "run:ops-triage:001",
        diagnosticId: null,
        discoveredAt: "2026-04-22T08:10:00.000Z",
        promotedAt: null,
        updatedAt: "2026-04-22T08:10:00.000Z"
      })
    ]
  });
}

function loadAiRagState(): AiRagState {
  return normalizeAiRagState(loadJsonState(aiRagStateFile, seedAiRagState));
}

function persistAiRagState(updater: (state: AiRagState) => AiRagState): AiRagState {
  return normalizeAiRagState(
    updateJsonState(aiRagStateFile, seedAiRagState, (state) => updater(normalizeAiRagState(state as AiRagState)))
  );
}

export function listMemoryCollections(): GovernedMemoryCollection[] {
  return loadAiRagState().collections.sort((left, right) => left.label.localeCompare(right.label));
}

export function listMemoryDocuments(): GovernedMemoryDocument[] {
  return loadAiRagState().documents.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function listRetrievalDiagnostics(): RetrievalDiagnostic[] {
  return loadAiRagState().diagnostics.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function listKnowledgePipelines(): KnowledgePipelineRecord[] {
  return loadAiRagState().knowledgePipelines.sort((left, right) => left.label.localeCompare(right.label));
}

export function listMemoryCandidates(): MemoryCandidateRecord[] {
  return loadAiRagState().memoryCandidates.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function ingestMemoryDocument(input: IngestMemoryDocumentInput): {
  ok: true;
  chunkCount: number;
  collectionId: string;
  reviewState: DocumentReviewState;
} {
  normalizeActionInput(input);
  const createdAt = new Date().toISOString();
  const document = defineGovernedMemoryDocument({
    id: `memory-document:${input.sourceObjectId}`,
    collectionId: input.collectionId,
    sourcePlugin: input.bindingPluginId ?? "ai-rag",
    sourceObjectId: input.sourceObjectId,
    sourceKind: input.sourceKind,
    title: input.title,
    body: input.body,
    tenantId: input.tenantId,
    classification: input.classification,
    createdAt,
    updatedAt: createdAt,
    tags: input.tags,
    reviewState: "draft",
    promotionState: "candidate",
    trustScore: input.trustScore ?? 70,
    freshnessWindowHours: input.freshnessWindowHours ?? 48,
    freshnessStatus: "warning",
    lastReviewedAt: null,
    promotedAt: null,
    expiresAt: null,
    provenanceUri: input.provenanceUri ?? null,
    bindingPluginId: input.bindingPluginId ?? "ai-rag",
    bindingObjectId: input.sourceObjectId,
    reviewNote: null
  });
  const candidate = defineMemoryCandidate({
    id: `memory-candidate:${input.sourceObjectId}`,
    tenantId: input.tenantId,
    documentId: document.id,
    targetCollectionId: input.collectionId,
    sourceConnectorId: input.bindingPluginId ?? null,
    reviewState: "pending",
    status: "candidate",
    trustScore: document.trustScore,
    freshnessStatus: document.freshnessStatus,
    replayRunId: null,
    diagnosticId: null,
    discoveredAt: createdAt,
    promotedAt: null,
    updatedAt: createdAt
  });

  const chunks = buildRuntimeChunks([document]);

  persistAiRagState((state) => {
    if (!state.collections.some((collection) => collection.id === input.collectionId && collection.tenantId === input.tenantId)) {
      throw new Error(`Unknown memory collection '${input.collectionId}'.`);
    }

    return {
      ...state,
      documents: [document, ...state.documents.filter((entry) => entry.id !== document.id)],
      memoryCandidates: upsertById(state.memoryCandidates, candidate)
    };
  });

  return {
    ok: true,
    chunkCount: chunks.length,
    collectionId: input.collectionId,
    reviewState: document.reviewState
  };
}

export function retrieveTenantKnowledge(input: RetrievalRequestInput): {
  ok: true;
  citationCount: number;
  chunkIds: string[];
  diagnosticId: string;
  degraded: boolean;
  reviewCoverage: number;
} {
  normalizeActionInput(input);
  const state = loadAiRagState();
  const retrieval = retrieveMemory({
    collections: state.collections.map(toMemoryCollection),
    documents: state.documents.map(toMemoryDocument),
    chunks: buildRuntimeChunks(state.documents),
    query: {
      tenantId: input.tenantId,
      text: input.query,
      collectionIds: input.collectionIds,
      topK: input.topK ?? 3,
      policy: defineMemoryPolicy({
        tenantScoped: true,
        requiredCitationCount: 1,
        allowedClassifications: ["internal", "restricted"],
        allowedSourceKinds: ["knowledge-article", "diagnostic-note", "operator-note"]
      }),
      now: "2026-04-22T12:00:00.000Z"
    }
  });

  const diagnostic = buildRetrievalDiagnostic(state.documents, retrieval, input);
  persistAiRagState((current) => ({
    ...current,
    diagnostics: [diagnostic, ...current.diagnostics.filter((entry) => entry.id !== diagnostic.id)].slice(0, 30),
    knowledgePipelines: current.knowledgePipelines.map((pipeline) =>
      !retrieval.plan.collectionIds.includes(pipeline.collectionId)
        ? pipeline
        : defineKnowledgePipeline({
            ...pipeline,
            lastRunAt: diagnostic.createdAt,
            nextRunAt: addHours(diagnostic.createdAt, pipeline.freshnessSlaHours),
            lastDiagnosticId: diagnostic.id,
            updatedAt: diagnostic.createdAt
          })
    )
  }));

  return {
    ok: true,
    citationCount: retrieval.citations.length,
    chunkIds: retrieval.chunks.map((chunk) => chunk.id),
    diagnosticId: diagnostic.id,
    degraded: diagnostic.degraded,
    reviewCoverage: diagnostic.reviewCoverage
  };
}

export function reindexMemoryCollection(input: ReindexMemoryCollectionInput): {
  ok: true;
  queuedDocuments: number;
} {
  normalizeActionInput(input);
  const nextState = persistAiRagState((state) => {
    const collection = state.collections.find((entry) => entry.id === input.collectionId && entry.tenantId === input.tenantId);
    if (!collection) {
      throw new Error(`Unknown memory collection '${input.collectionId}'.`);
    }

    const queuedDocuments = state.documents.filter((document) => document.collectionId === input.collectionId).length;
    return {
      ...state,
      knowledgePipelines: state.knowledgePipelines.map((pipeline) =>
        pipeline.collectionId !== input.collectionId
          ? pipeline
          : defineKnowledgePipeline({
              ...pipeline,
              lastRunAt: new Date().toISOString(),
              nextRunAt: addHours(new Date().toISOString(), pipeline.freshnessSlaHours),
              updatedAt: new Date().toISOString()
            })
      ),
      reindexRequests: [
        {
          id: `reindex:${input.collectionId}:${state.reindexRequests.length + 1}`,
          tenantId: input.tenantId,
          collectionId: input.collectionId,
          requestedAt: new Date().toISOString(),
          queuedDocuments
        },
        ...state.reindexRequests
      ]
    };
  });

  return {
    ok: true,
    queuedDocuments: nextState.documents.filter((document) => document.collectionId === input.collectionId).length
  };
}

export function reviewMemoryDocument(input: ReviewMemoryDocumentInput): {
  ok: true;
  documentId: string;
  reviewState: DocumentReviewState;
  freshnessStatus: MemoryFreshnessStatus;
} {
  normalizeActionInput(input);
  let nextReviewState: DocumentReviewState = "in-review";
  let nextFreshnessStatus: MemoryFreshnessStatus = "warning";
  const now = new Date().toISOString();

  const nextState = persistAiRagState((state) => {
    const document = state.documents.find((entry) => entry.id === input.documentId && entry.tenantId === input.tenantId);
    if (!document) {
      throw new Error(`Unknown memory document '${input.documentId}'.`);
    }

    nextReviewState =
      input.decision === "approved" ? "approved" : input.decision === "needs-refresh" ? "in-review" : "rejected";
    const nextWindow = input.freshnessWindowHours ?? document.freshnessWindowHours;
    const nextExpiresAt =
      input.decision === "approved" ? addHours(now, nextWindow) : input.decision === "needs-refresh" ? document.expiresAt : null;
    nextFreshnessStatus =
      input.decision === "approved" ? "fresh" : input.decision === "needs-refresh" ? "stale" : "stale";

    return {
      ...state,
      documents: state.documents.map((entry) =>
        entry.id !== document.id
          ? entry
          : defineGovernedMemoryDocument({
              ...entry,
              reviewState: nextReviewState,
              trustScore: input.trustScore ?? entry.trustScore,
              freshnessWindowHours: nextWindow,
              freshnessStatus: nextFreshnessStatus,
              lastReviewedAt: now,
              expiresAt: nextExpiresAt,
              reviewNote: input.note ?? `Reviewed by ${input.reviewerId}.`
            })
      ),
      memoryCandidates: state.memoryCandidates.map((candidate) =>
        candidate.documentId !== document.id
          ? candidate
          : defineMemoryCandidate({
              ...candidate,
              reviewState:
                input.decision === "approved" ? "approved" : input.decision === "rejected" ? "rejected" : "pending",
              status: input.decision === "rejected" ? "rejected" : candidate.status,
              trustScore: input.trustScore ?? candidate.trustScore,
              freshnessStatus: nextFreshnessStatus,
              updatedAt: now
            })
      )
    };
  });

  const document = nextState.documents.find((entry) => entry.id === input.documentId)!;
  return {
    ok: true,
    documentId: document.id,
    reviewState: document.reviewState,
    freshnessStatus: document.freshnessStatus
  };
}

export function promoteMemoryDocument(input: PromoteMemoryDocumentInput): {
  ok: true;
  documentId: string;
  collectionId: string;
  promotionState: MemoryPromotionState;
} {
  normalizeActionInput(input);
  const now = new Date().toISOString();
  const nextState = persistAiRagState((state) => {
    const document = state.documents.find((entry) => entry.id === input.documentId && entry.tenantId === input.tenantId);
    if (!document) {
      throw new Error(`Unknown memory document '${input.documentId}'.`);
    }
    if (document.reviewState !== "approved") {
      throw new Error(`Document '${input.documentId}' must be approved before promotion.`);
    }
    const targetCollectionId = input.targetCollectionId ?? document.collectionId;
    if (!state.collections.some((collection) => collection.id === targetCollectionId && collection.tenantId === input.tenantId)) {
      throw new Error(`Unknown target collection '${targetCollectionId}'.`);
    }

    return {
      ...state,
      documents: state.documents.map((entry) =>
        entry.id !== document.id
          ? entry
          : defineGovernedMemoryDocument({
              ...entry,
              collectionId: targetCollectionId,
              promotionState: "promoted",
              promotedAt: now,
              freshnessStatus: resolveFreshnessStatus({
                ...entry,
                updatedAt: now
              })
              })
      ),
      memoryCandidates: state.memoryCandidates.map((candidate) =>
        candidate.documentId !== document.id
          ? candidate
          : defineMemoryCandidate({
              ...candidate,
              targetCollectionId,
              reviewState: "approved",
              status: "promoted",
              trustScore: document.trustScore,
              freshnessStatus: resolveFreshnessStatus({
                ...document,
                updatedAt: now
              }),
              promotedAt: now,
              updatedAt: now
            })
      )
    };
  });

  const document = nextState.documents.find((entry) => entry.id === input.documentId)!;
  return {
    ok: true,
    documentId: document.id,
    collectionId: document.collectionId,
    promotionState: document.promotionState
  };
}

export function upsertKnowledgePipeline(input: UpsertKnowledgePipelineInput) {
  normalizeActionInput(input);
  const now = new Date().toISOString();
  const nextState = persistAiRagState((state) => {
    if (!state.collections.some((collection) => collection.id === input.collectionId && collection.tenantId === input.tenantId)) {
      throw new Error(`Unknown memory collection '${input.collectionId}'.`);
    }

    return {
      ...state,
      knowledgePipelines: upsertById(
        state.knowledgePipelines,
        defineKnowledgePipeline({
          id: input.pipelineId,
          tenantId: input.tenantId,
          label: input.label,
          status: input.status,
          collectionId: input.collectionId,
          sourceConnectorId: input.sourceConnectorId,
          freshnessSlaHours: input.freshnessSlaHours,
          trustPolicy: input.trustPolicy,
          lastRunAt: state.knowledgePipelines.find((entry) => entry.id === input.pipelineId)?.lastRunAt ?? null,
          nextRunAt: state.knowledgePipelines.find((entry) => entry.id === input.pipelineId)?.nextRunAt ?? null,
          lastDiagnosticId: state.knowledgePipelines.find((entry) => entry.id === input.pipelineId)?.lastDiagnosticId ?? null,
          createdAt: state.knowledgePipelines.find((entry) => entry.id === input.pipelineId)?.createdAt ?? now,
          updatedAt: now
        })
      )
    };
  });

  const pipeline = nextState.knowledgePipelines.find((entry) => entry.id === input.pipelineId)!;
  return {
    ok: true as const,
    pipelineId: pipeline.id,
    status: pipeline.status
  };
}

export function promoteMemoryCandidate(input: PromoteMemoryCandidateInput) {
  normalizeActionInput(input);
  const now = new Date().toISOString();
  let promotedDocumentId = "";
  const nextState = persistAiRagState((state) => {
    const candidate = state.memoryCandidates.find((entry) => entry.id === input.candidateId && entry.tenantId === input.tenantId);
    if (!candidate) {
      throw new Error(`Unknown memory candidate '${input.candidateId}'.`);
    }
    if (candidate.reviewState === "rejected" || candidate.status === "rejected") {
      throw new Error(`Memory candidate '${input.candidateId}' is rejected.`);
    }
    const document = state.documents.find((entry) => entry.id === candidate.documentId && entry.tenantId === input.tenantId);
    if (!document) {
      throw new Error(`Unknown memory document '${candidate.documentId}'.`);
    }
    if (document.reviewState !== "approved") {
      throw new Error(`Document '${document.id}' must be approved before candidate promotion.`);
    }

    const targetCollectionId = input.targetCollectionId ?? candidate.targetCollectionId ?? document.collectionId;
    if (!state.collections.some((collection) => collection.id === targetCollectionId && collection.tenantId === input.tenantId)) {
      throw new Error(`Unknown target collection '${targetCollectionId}'.`);
    }
    promotedDocumentId = document.id;

    return {
      ...state,
      documents: state.documents.map((entry) =>
        entry.id !== document.id
          ? entry
          : defineGovernedMemoryDocument({
              ...entry,
              collectionId: targetCollectionId,
              promotionState: "promoted",
              promotedAt: now,
              freshnessStatus: resolveFreshnessStatus({
                ...entry,
                updatedAt: now
              })
            })
      ),
      memoryCandidates: state.memoryCandidates.map((entry) =>
        entry.id !== candidate.id
          ? entry
          : defineMemoryCandidate({
              ...entry,
              targetCollectionId,
              reviewState: "approved",
              status: "promoted",
              freshnessStatus: document.freshnessStatus,
              promotedAt: now,
              updatedAt: now
            })
      )
    };
  });

  const candidate = nextState.memoryCandidates.find((entry) => entry.id === input.candidateId)!;
  return {
    ok: true as const,
    candidateId: candidate.id,
    documentId: promotedDocumentId,
    status: candidate.status
  };
}

export const retrievalFixture = Object.freeze(
  retrieveMemory({
    collections: memoryCollectionsFixture.map(toMemoryCollection),
    documents: documentFixtures.map(toMemoryDocument),
    chunks: [...chunkFixtures],
    query: {
      tenantId: "tenant-platform",
      text: "finance approval replay metadata",
      collectionIds: ["memory-collection:kb", "memory-collection:ops"],
      topK: 3,
      policy: defineMemoryPolicy({
        tenantScoped: true,
        requiredCitationCount: 1,
        allowedClassifications: ["internal", "restricted"],
        allowedSourceKinds: ["knowledge-article", "diagnostic-note"]
      }),
      now: "2026-04-22T12:00:00.000Z"
    }
  })
);

function buildRuntimeChunks(documents: GovernedMemoryDocument[]) {
  return documents.flatMap((document) => chunkMemoryDocument(toMemoryDocument(document), { chunkSize: 18, overlap: 4 }));
}

function buildRetrievalDiagnostic(
  documents: GovernedMemoryDocument[],
  retrieval: typeof retrievalFixture,
  input: RetrievalRequestInput
): RetrievalDiagnostic {
  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const freshnessCounts = retrieval.citations.reduce(
    (accumulator, citation) => {
      const document = documentsById.get(citation.documentId);
      if (!document) {
        return accumulator;
      }
      if (document.freshnessStatus === "stale") {
        accumulator.stale += 1;
      } else {
        accumulator.fresh += 1;
      }
      return accumulator;
    },
    { fresh: 0, stale: 0 }
  );
  const approvedCount = retrieval.citations.filter((citation) => documentsById.get(citation.documentId)?.reviewState === "approved").length;
  const reviewCoverage =
    retrieval.citations.length === 0 ? 0 : Math.round((approvedCount / retrieval.citations.length) * 100);
  const weakestCitation = [...retrieval.citations].sort((left, right) => left.confidence - right.confidence)[0] ?? null;

  return Object.freeze({
    id: `retrieval-diagnostic:${Date.now()}:${retrieval.citations.length}`,
    tenantId: input.tenantId,
    runId: input.runId ?? null,
    workflowInstanceId: input.workflowInstanceId ?? null,
    query: input.query,
    collectionIds: [...retrieval.plan.collectionIds],
    chunkIds: retrieval.chunks.map((chunk) => chunk.id),
    citationCount: retrieval.citations.length,
    freshCitationCount: freshnessCounts.fresh,
    staleCitationCount: freshnessCounts.stale,
    reviewCoverage,
    degraded: retrieval.citations.length === 0 || freshnessCounts.stale > 0 || reviewCoverage < 100,
    weakestSourceId: weakestCitation?.sourceObjectId ?? null,
    createdAt: new Date().toISOString()
  });
}

function normalizeAiRagState(state: AiRagState): AiRagState {
  const documents = (state.documents ?? []).map((document) =>
    defineGovernedMemoryDocument({
      ...document,
      freshnessStatus: resolveFreshnessStatus(document)
    })
  );
  const documentCountByCollection = new Map<string, number>();
  const trustTotalsByCollection = new Map<string, { total: number; count: number; approved: number }>();

  for (const document of documents) {
    documentCountByCollection.set(document.collectionId, (documentCountByCollection.get(document.collectionId) ?? 0) + 1);
    const trust = trustTotalsByCollection.get(document.collectionId) ?? { total: 0, count: 0, approved: 0 };
    trust.total += document.trustScore;
    trust.count += 1;
    trust.approved += document.reviewState === "approved" ? 1 : 0;
    trustTotalsByCollection.set(document.collectionId, trust);
  }

  return {
    collections: (state.collections ?? []).map((collection) => {
      const trust = trustTotalsByCollection.get(collection.id);
      const documentCount = documentCountByCollection.get(collection.id) ?? 0;
      const approvedCount = trust?.approved ?? 0;
      const reviewState: CollectionReviewState =
        documentCount === 0 ? "seeded" : approvedCount === documentCount ? "approved" : approvedCount > 0 ? "reviewed" : "seeded";

      return defineGovernedMemoryCollection({
        ...collection,
        reviewState,
        trustScore: trust && trust.count > 0 ? Math.round(trust.total / trust.count) : collection.trustScore,
        sourceBindings: dedupeSourceBindings(collection.sourceBindings, documents.filter((document) => document.collectionId === collection.id)),
        metadata: {
          ...(collection.metadata ?? {}),
          documentCount
        }
      });
    }),
    documents,
    reindexRequests: [...(state.reindexRequests ?? [])],
    diagnostics: [...(state.diagnostics ?? [])],
    knowledgePipelines: (state.knowledgePipelines ?? []).map(defineKnowledgePipeline),
    memoryCandidates: (state.memoryCandidates ?? []).map((candidate) => {
      const document = documents.find((entry) => entry.id === candidate.documentId);
      return defineMemoryCandidate({
        ...candidate,
        targetCollectionId: candidate.targetCollectionId || document?.collectionId || candidate.targetCollectionId,
        trustScore: document?.trustScore ?? candidate.trustScore,
        freshnessStatus: document?.freshnessStatus ?? candidate.freshnessStatus
      });
    })
  };
}

function defineKnowledgePipeline(input: KnowledgePipelineRecord): KnowledgePipelineRecord {
  return Object.freeze({
    ...input,
    freshnessSlaHours: Math.max(1, input.freshnessSlaHours)
  });
}

function defineMemoryCandidate(input: MemoryCandidateRecord): MemoryCandidateRecord {
  return Object.freeze({
    ...input,
    trustScore: Math.max(0, Math.min(100, Math.round(input.trustScore)))
  });
}

function dedupeSourceBindings(
  bindings: GovernedMemoryCollection["sourceBindings"],
  documents: GovernedMemoryDocument[]
): GovernedMemoryCollection["sourceBindings"] {
  const seen = new Set<string>();
  const merged = [
    ...bindings,
    ...documents.map((document) => ({
      pluginId: document.bindingPluginId,
      resourceId: document.bindingObjectId
    }))
  ];

  return merged.filter((binding) => {
    const key = `${binding.pluginId}:${binding.resourceId}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function toMemoryCollection(collection: GovernedMemoryCollection): MemoryCollection {
  return defineMemoryCollection({
    id: collection.id,
    label: collection.label,
    policyScope: collection.policyScope,
    sourcePlugin: collection.sourcePlugin,
    tenantId: collection.tenantId,
    classification: collection.classification,
    metadata: collection.metadata
  });
}

function toMemoryDocument(document: GovernedMemoryDocument): MemoryDocument {
  return defineMemoryDocument({
    id: document.id,
    collectionId: document.collectionId,
    sourcePlugin: document.sourcePlugin,
    sourceObjectId: document.sourceObjectId,
    sourceKind: document.sourceKind,
    title: document.title,
    body: document.body,
    tenantId: document.tenantId,
    classification: document.classification,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    tags: document.tags
  });
}

function resolveFreshnessStatus(
  document: Pick<GovernedMemoryDocument, "updatedAt" | "expiresAt" | "freshnessWindowHours"> & {
    reviewState?: DocumentReviewState | undefined;
    lastReviewedAt?: string | null | undefined;
  }
): MemoryFreshnessStatus {
  const now = new Date("2026-04-22T12:00:00.000Z").getTime();
  if (document.reviewState === "rejected") {
    return "stale";
  }
  if (document.reviewState === "in-review" && document.lastReviewedAt) {
    return "stale";
  }
  if (document.expiresAt && new Date(document.expiresAt).getTime() <= now) {
    return "stale";
  }

  const ageHours = Math.max(0, (now - new Date(document.updatedAt).getTime()) / (1000 * 60 * 60));
  if (ageHours >= document.freshnessWindowHours) {
    return "stale";
  }
  if (ageHours >= document.freshnessWindowHours * 0.75) {
    return "warning";
  }
  return "fresh";
}

function addHours(timestamp: string, hours: number): string {
  return new Date(new Date(timestamp).getTime() + hours * 60 * 60 * 1000).toISOString();
}

function upsertById<T extends { id: string }>(items: T[], nextItem: T): T[] {
  return [nextItem, ...items.filter((entry) => entry.id !== nextItem.id)];
}
