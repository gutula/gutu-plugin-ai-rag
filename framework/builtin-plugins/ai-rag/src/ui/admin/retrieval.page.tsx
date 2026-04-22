import React from "react";

import { ChartSurface, createBarChartOption } from "@platform/chart";
import { formatPlatformDateTime } from "@platform/ui";

import { listRetrievalDiagnostics, retrievalFixture } from "../../services/main.service";

export function RetrievalDiagnosticsPage() {
  const diagnostics = listRetrievalDiagnostics();
  const latestDiagnostic = diagnostics[0];

  return (
    <section data-plugin-page="ai-rag-retrieval" className="awb-surface-stack">
      <div className="awb-inline-banner">
        <strong>Retrieval diagnostics</strong>
        <span>Citations, freshness windows, and approved source kinds remain visible for every grounded response.</span>
      </div>
      {latestDiagnostic ? (
        <div className="awb-inline-grid awb-inline-grid-4">
          <div className="awb-mini-stat">
            <span className="awb-mini-stat-label">Latest citations</span>
            <strong className="awb-mini-stat-value">{latestDiagnostic.citationCount}</strong>
          </div>
          <div className="awb-mini-stat">
            <span className="awb-mini-stat-label">Stale citations</span>
            <strong className="awb-mini-stat-value">{latestDiagnostic.staleCitationCount}</strong>
          </div>
          <div className="awb-mini-stat">
            <span className="awb-mini-stat-label">Review coverage</span>
            <strong className="awb-mini-stat-value">{latestDiagnostic.reviewCoverage}%</strong>
          </div>
          <div className="awb-mini-stat">
            <span className="awb-mini-stat-label">Status</span>
            <strong className="awb-mini-stat-value">{latestDiagnostic.degraded ? "Degraded" : "Healthy"}</strong>
          </div>
        </div>
      ) : null}
      <ChartSurface
        title="Citation confidence"
        option={createBarChartOption({
          title: "Citation confidence",
          labels: retrievalFixture.citations.map((citation) => citation.sourceObjectId),
          series: [
            {
              name: "Confidence",
              data: retrievalFixture.citations.map((citation) => Number((citation.confidence * 100).toFixed(2)))
            }
          ]
        })}
      />
      <div className="awb-inline-grid awb-inline-grid-2">
        {retrievalFixture.citations.map((citation) => (
          <div key={citation.chunkId} className="awb-form-card">
            <h3 className="awb-panel-title">{citation.sourceObjectId}</h3>
            <p className="awb-muted-copy">{citation.excerpt}</p>
            <dl className="awb-detail-grid">
              <div>
                <dt>Score</dt>
                <dd>{citation.score}</dd>
              </div>
              <div>
                <dt>Confidence</dt>
                <dd>{citation.confidence}</dd>
              </div>
              <div>
                <dt>Freshness cutoff</dt>
                <dd>{formatPlatformDateTime(retrievalFixture.plan.freshnessCutoff ?? "2026-04-18T12:00:00.000Z")}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
      {latestDiagnostic ? (
        <div className="awb-form-card">
          <h3 className="awb-panel-title">Latest persisted diagnostic</h3>
          <dl className="awb-detail-grid">
            <div>
              <dt>Query</dt>
              <dd>{latestDiagnostic.query}</dd>
            </div>
            <div>
              <dt>Weakest source</dt>
              <dd>{latestDiagnostic.weakestSourceId ?? "n/a"}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatPlatformDateTime(latestDiagnostic.createdAt)}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </section>
  );
}
