import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Network } from 'lucide-react';
import { GraphCanvas } from '../graph/GraphCanvas';
import { MOCK_GRAPH } from '../../services/mock-data';

export function MiniGraphView() {
  const navigate = useNavigate();

  // Highlight only the core high-risk ring in mini preview
  const previewGraph = {
    nodes: MOCK_GRAPH.nodes.slice(0, 7),
    edges: MOCK_GRAPH.edges.slice(0, 7),
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center justify-between mb-3 z-10">
        <div>
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-400" />
            Live Cluster Topology Preview
          </h3>
          <p className="text-xs text-slate-400">Ring 1: Shell Entity Circular Routing</p>
        </div>

        <button
          onClick={() => navigate('/explorer')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold transition"
        >
          <span>Open Full Canvas</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 w-full min-h-[220px] rounded-xl overflow-hidden border border-slate-800 relative">
        <GraphCanvas
          graphData={previewGraph}
          hideToolbar
          hideLegend
          height="100%"
        />
      </div>
    </div>
  );
}
