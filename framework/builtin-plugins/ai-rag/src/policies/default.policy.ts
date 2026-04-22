import { definePolicy } from "@platform/permissions";

export const aiPolicy = definePolicy({
  id: "ai-rag.default",
  rules: [
    {
      permission: "ai.memory.read",
      allowIf: ["role:admin", "role:operator", "role:support"]
    },
    {
      permission: "ai.memory.ingest",
      allowIf: ["role:admin"],
      requireReason: true,
      audit: true
    },
    {
      permission: "ai.memory.reindex",
      allowIf: ["role:admin"],
      requireReason: true,
      audit: true
    },
    {
      permission: "ai.memory.review",
      allowIf: ["role:admin", "role:operator"],
      requireReason: true,
      audit: true
    },
    {
      permission: "ai.memory.promote",
      allowIf: ["role:admin", "role:operator"],
      requireReason: true,
      audit: true
    },
    {
      permission: "ai.knowledge-pipelines.read",
      allowIf: ["role:admin", "role:operator", "role:support"]
    },
    {
      permission: "ai.knowledge-pipelines.write",
      allowIf: ["role:admin", "role:operator"],
      requireReason: true,
      audit: true
    },
    {
      permission: "ai.memory-candidates.read",
      allowIf: ["role:admin", "role:operator", "role:support"]
    },
    {
      permission: "ai.memory-candidates.promote",
      allowIf: ["role:admin", "role:operator"],
      requireReason: true,
      audit: true
    },
    {
      permission: "ai.reports.read",
      allowIf: ["role:admin", "role:operator", "role:support"]
    }
  ]
});
