# AI RAG TODO

**Maturity Tier:** `Hardened`

## Shipped Now

- Exports 7 governed actions: `ai.memory.ingest`, `ai.memory.retrieve`, `ai.memory.reindex`, `ai.memory.review`, `ai.memory.promote`, `ai.knowledge-pipelines.upsert`, `ai.memory-candidates.promote`.
- Owns 5 resource contracts: `ai.memory-collections`, `ai.memory-documents`, `ai.retrieval-diagnostics`, `ai.knowledge-pipelines`, `ai.memory-candidates`.
- Adds richer admin workspace contributions on top of the base UI surface.
- Defines a durable data schema contract even though no explicit SQL helper module is exported.

## Current Gaps

- No standalone plugin-owned event, job, or workflow catalog is exported yet; compose it through actions, resources, and the surrounding Gutu runtime.
- The repo does not yet export a domain parity catalog with owned entities, reports, settings surfaces, and exception queues.

## Recommended Next

- Add more ingestion and connector breadth only after the current retrieval contracts remain stable under production load.
- Deepen operator visibility into collection freshness, ingestion failures, and retrieval quality.
- Add deeper provider, persistence, or evaluation integrations only where the shipped control-plane contracts already prove stable.
- Expand operator diagnostics and release gating where the current lifecycle already exposes strong evidence paths.
- Promote important downstream reactions into explicit commands, jobs, or workflow steps instead of relying on implicit coupling.

## Later / Optional

- Hybrid search, reranking, and external-connector packs once the baseline retrieval pipeline stabilizes.
- More connector breadth, richer evaluation libraries, and domain-specific copilots after the baseline contracts settle.
