import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const memoryCollections = pgTable("ai_memory_collections", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id"),
  label: text("label").notNull(),
  classification: text("classification").notNull(),
  sourcePlugin: text("source_plugin").notNull(),
  reviewState: text("review_state").notNull(),
  trustScore: integer("trust_score").notNull(),
  freshnessWindowHours: integer("freshness_window_hours").notNull(),
  ownerDepartment: text("owner_department"),
  sourceBindingCount: integer("source_binding_count").notNull(),
  documentCount: integer("document_count").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const memoryDocuments = pgTable("ai_memory_documents", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id"),
  collectionId: text("collection_id").notNull(),
  title: text("title").notNull(),
  sourcePlugin: text("source_plugin").notNull(),
  sourceObjectId: text("source_object_id").notNull(),
  sourceKind: text("source_kind").notNull(),
  classification: text("classification").notNull(),
  reviewState: text("review_state").notNull(),
  promotionState: text("promotion_state").notNull(),
  trustScore: integer("trust_score").notNull(),
  freshnessWindowHours: integer("freshness_window_hours").notNull(),
  freshnessStatus: text("freshness_status").notNull(),
  provenanceUri: text("provenance_uri"),
  lastReviewedAt: timestamp("last_reviewed_at"),
  promotedAt: timestamp("promoted_at"),
  expiresAt: timestamp("expires_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const retrievalDiagnostics = pgTable("ai_retrieval_diagnostics", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  runId: text("run_id"),
  workflowInstanceId: text("workflow_instance_id"),
  query: text("query").notNull(),
  citationCount: integer("citation_count").notNull(),
  freshCitationCount: integer("fresh_citation_count").notNull(),
  staleCitationCount: integer("stale_citation_count").notNull(),
  reviewCoverage: integer("review_coverage").notNull(),
  degraded: boolean("degraded").notNull(),
  weakestSourceId: text("weakest_source_id"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const knowledgePipelines = pgTable("ai_knowledge_pipelines", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  label: text("label").notNull(),
  status: text("status").notNull(),
  collectionId: text("collection_id").notNull(),
  sourceConnectorId: text("source_connector_id").notNull(),
  freshnessSlaHours: integer("freshness_sla_hours").notNull(),
  trustPolicy: text("trust_policy").notNull(),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  lastDiagnosticId: text("last_diagnostic_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const memoryCandidates = pgTable("ai_memory_candidates", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  documentId: text("document_id").notNull(),
  targetCollectionId: text("target_collection_id").notNull(),
  sourceConnectorId: text("source_connector_id"),
  reviewState: text("review_state").notNull(),
  status: text("status").notNull(),
  trustScore: integer("trust_score").notNull(),
  freshnessStatus: text("freshness_status").notNull(),
  replayRunId: text("replay_run_id"),
  diagnosticId: text("diagnostic_id"),
  discoveredAt: timestamp("discovered_at").notNull().defaultNow(),
  promotedAt: timestamp("promoted_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
