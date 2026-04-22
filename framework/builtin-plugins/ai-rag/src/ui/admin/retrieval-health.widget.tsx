import React from "react";

import { listRetrievalDiagnostics, retrievalFixture } from "../../services/main.service";

export function RetrievalHealthWidget() {
  const latestDiagnostic = listRetrievalDiagnostics()[0];

  return (
    <section data-plugin-widget="ai-retrieval-health" className="awb-form-card">
      <div className="awb-inline-banner">
        <strong>{latestDiagnostic?.degraded ? "Retrieval attention needed" : `${retrievalFixture.citations.length} citations returned`}</strong>
        <span>
          {latestDiagnostic
            ? `${latestDiagnostic.reviewCoverage}% review coverage with ${latestDiagnostic.staleCitationCount} stale citations in the latest persisted diagnostic.`
            : `${retrievalFixture.plan.collectionIds.length} approved collections participated in the latest diagnostic query.`}
        </span>
      </div>
    </section>
  );
}
