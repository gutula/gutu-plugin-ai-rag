import {
  BuilderCanvas,
  BuilderHost,
  BuilderInspector,
  BuilderPalette,
  createBuilderPanelLayout
} from "@platform/admin-builders";

import { listKnowledgePipelines, listMemoryCandidates } from "../../services/main.service";

export function KnowledgePipelineBuilderPage() {
  const pipelines = listKnowledgePipelines();
  const candidates = listMemoryCandidates().slice(0, 6);

  return (
    <BuilderHost
      layout={createBuilderPanelLayout({
        left: "palette",
        center: "canvas",
        right: "inspector"
      })}
      palette={<BuilderPalette items={pipelines.map((pipeline) => ({ id: pipeline.id, label: pipeline.label }))} />}
      canvas={
        <BuilderCanvas title="Knowledge pipeline topology">
          <div className="awb-form-card">
            <h3 className="awb-panel-title">Governed retrieval path</h3>
            <ul className="awb-check-list">
              <li>Pipelines tie connectors to collections with explicit freshness SLAs and trust policy.</li>
              <li>Promotion candidates stay reviewable before they affect grounded runs.</li>
              <li>Retrieval diagnostics feed directly back into pipeline health and replay evidence.</li>
            </ul>
          </div>
        </BuilderCanvas>
      }
      inspector={
        <BuilderInspector title="Recent candidates">
          <div className="awb-form-card">
            <div className="awb-table">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="awb-table-row">
                  <strong>{candidate.documentId}</strong>
                  <span>{candidate.status}</span>
                </div>
              ))}
            </div>
          </div>
        </BuilderInspector>
      }
    />
  );
}
