# AI RAG TODO

**Maturity Tier:** `Hardened`

## Shipped Now

- Exports 5 governed actions: `ai.memory.ingest`, `ai.memory.retrieve`, `ai.memory.reindex`, `ai.memory.review`, `ai.memory.promote`.
- Owns 3 resource contracts: `ai.memory-collections`, `ai.memory-documents`, `ai.retrieval-diagnostics`.
- Adds richer admin workspace contributions on top of the base UI surface with trust, freshness, and review visibility.
- Defines a durable data schema contract even though no explicit SQL helper module is exported.
- Exports dedicated integration and migration verification lanes for governed retrieval, promotion flow, and schema coverage.

## Current Gaps

- Cross-repo workspace bootstrap is still required before the package can run end-to-end verification lanes in isolation.
- The repo validates schema shape and governed retrieval behavior, but it still does not emit first-party SQL migration files from this package.
- Connector breadth remains intentionally narrow while freshness and provenance contracts stabilize.

## Recommended Next

- Add emitted SQL migration assets and rollback helpers alongside the current schema-verification lane.
- Broaden the integration matrix beyond the current governed retrieval and replay-linked diagnostic path.
- Add more ingestion and connector breadth only after the current retrieval contracts remain stable under production load.
- Deepen operator visibility into collection freshness, ingestion failures, and retrieval quality.
- Promote important downstream reactions into explicit commands, jobs, or workflow steps instead of relying on implicit coupling.

## Later / Optional

- Hybrid search, reranking, and external-connector packs once the hardened retrieval pipeline stabilizes.
- More connector breadth, richer evaluation libraries, and domain-specific copilots after the governed contracts settle.
