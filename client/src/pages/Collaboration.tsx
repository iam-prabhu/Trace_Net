import { useState, useEffect } from 'react';
import {
  Users,
  Radio,
  Share2,
  MousePointer2,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { getSocket } from '../services/socket';
import { useGraphStore } from '../store/graph.store';
import { GraphCanvas } from '../components/graph/GraphCanvas';
import { MOCK_GRAPH } from '../services/mock-data';

interface CollabEvent {
  id: string;
  user: string;
  color: string;
  action: string;
  time: string;
}

export default function Collaboration() {
  const { setHighlightedPath, setSelectedNode } = useGraphStore();

  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(24);
  const [activeRoom, setActiveRoom] = useState('investigation:INV-2025-001');
  const [events, setEvents] = useState<CollabEvent[]>([
    {
      id: 'e-1',
      user: 'Marcus Vance',
      color: '#3B82F6',
      action: 'Selected shell account ACC-101 in canvas',
      time: '14:20:05',
    },
    {
      id: 'e-2',
      user: 'Sarah Lin',
      color: '#10B981',
      action: 'Highlighted 4-node cycle [ACC-101 -> ACC-104]',
      time: '14:21:12',
    },
  ]);

  const [simulatedPeerSelection, setSimulatedPeerSelection] = useState<string | null>('ACC-103');

  useEffect(() => {
    let socket: any = null;
    try {
      socket = getSocket();
      setIsConnected(socket.connected);

      socket.on('connect', () => {
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('investigation:graph-selection', (data: any) => {
        setEvents((prev) => [
          {
            id: `evt-${Date.now()}`,
            user: data.userName || 'Peer Investigator',
            color: data.color || '#3B82F6',
            action: `Selected ${data.selectedNodeId || 'node/edge'} in graph`,
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
        if (data.selectedNodeId) {
          setSimulatedPeerSelection(data.selectedNodeId);
        }
      });
    } catch (err) {
      console.warn('Socket connect error:', err);
    }

    // Ping interval to simulate realistic network heartbeat
    const interval = setInterval(() => {
      setLatency(20 + Math.floor(Math.random() * 15));
    }, 4000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('investigation:graph-selection');
      }
    };
  }, []);

  const triggerPeerSimulation = (nodeId: string, peerName: string, color: string) => {
    setSimulatedPeerSelection(nodeId);
    setHighlightedPath([nodeId, 'ACC-102']);
    setSelectedNode({ id: nodeId, status: 'flagged' } as any);

    setEvents((prev) => [
      {
        id: `sim-${Date.now()}`,
        user: peerName,
        color,
        action: `Selected and inspected ${nodeId} via WebSocket broadcast`,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);

    // Send via socket if connected
    try {
      const socket = getSocket();
      socket.emit('investigation:graph-selection', {
        investigationId: 'INV-2025-001',
        selectedNodeId: nodeId,
        highlightedPath: [nodeId, 'ACC-102'],
      });
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Real-Time Collaboration Hub & Synchronized Canvas
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized multi-investigator rooms, viewport cursor tracking, and collaborative graph state
          </p>
        </div>

        {/* Live Socket Connectivity Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            {isConnected ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-400">WebSocket Connected</span>
                <span className="text-[10px] font-mono text-slate-500">({latency}ms)</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="font-semibold text-amber-400">Connecting Socket...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Active Room Canvas + Event Log & Peers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Synchronized Graph Canvas */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col h-[520px]">
            {/* Room Toolbar */}
            <div className="flex flex-wrap items-center justify-between pb-3 mb-2 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  Active Room:
                </span>
                <select
                  value={activeRoom}
                  onChange={(e) => setActiveRoom(e.target.value)}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-blue-300"
                >
                  <option value="investigation:INV-2025-001">investigation:INV-2025-001 (Shell Ring)</option>
                  <option value="investigation:INV-2025-002">investigation:INV-2025-002 (P2P Triangle)</option>
                </select>
              </div>

              {/* Simulated Peer Action Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 hidden sm:inline">Simulate Peer:</span>
                <button
                  onClick={() => triggerPeerSimulation('ACC-103', 'Marcus Vance', '#3B82F6')}
                  className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium transition"
                >
                  Marcus selects ACC-103
                </button>
                <button
                  onClick={() => triggerPeerSimulation('ACC-401', 'Sarah Lin', '#10B981')}
                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition"
                >
                  Sarah selects ACC-401
                </button>
              </div>
            </div>

            {/* Peer selection notice banner */}
            {simulatedPeerSelection && (
              <div className="mb-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs text-blue-300">
                <div className="flex items-center gap-2">
                  <MousePointer2 className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
                  <span>Peer investigator is currently focused on node:</span>
                  <span className="font-mono font-bold text-white">{simulatedPeerSelection}</span>
                </div>
                <span className="text-[10px] text-slate-400">Synced via Socket.io</span>
              </div>
            )}

            <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-800">
              <GraphCanvas graphData={MOCK_GRAPH} />
            </div>
          </div>
        </div>

        {/* Right: Connected Collaborators & Broadcast Feed */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Investigators in Room */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              Connected Room Members (3)
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <div>
                    <div className="font-bold text-white">Sarah Lin (You)</div>
                    <div className="text-[10px] text-slate-400">Lead Investigator • Active</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">ONLINE</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <div>
                    <div className="font-bold text-white">Marcus Vance</div>
                    <div className="text-[10px] text-slate-400">Inspecting Subgraph • Focused</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">ONLINE</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div>
                    <div className="font-bold text-white">Dave Miller</div>
                    <div className="text-[10px] text-slate-400">Reviewing Cycle Finding • Idle</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">IDLE</span>
              </div>
            </div>
          </div>

          {/* Synchronized Broadcast Activity Log */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl h-[340px] flex flex-col">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              Live Collaboration Stream
            </h4>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white" style={{ color: evt.color }}>
                      {evt.user}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{evt.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{evt.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
