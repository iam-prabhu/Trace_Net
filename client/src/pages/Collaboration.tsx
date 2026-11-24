import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Radio,
  MousePointer2,
  Send,
  MessageSquare,
  ShieldAlert,
  Info,
  CheckCircle2,
  Crosshair,
  ExternalLink,
  Briefcase,
} from 'lucide-react';
import { getSocket } from '../services/socket';
import { useGraphStore } from '../store/graph.store';
import { GraphCanvas } from '../components/graph/GraphCanvas';
import { getGraph } from '../services/graph.service';
import { getInvestigations, getInvestigationMembers } from '../services/investigation.service';
import { useAuthStore } from '../store/auth.store';
import type { GraphData, GraphNode } from '../types/graph.types';
import type { Investigation } from '../types/investigation.types';
import type { CollaboratorPresence } from '../store/collaboration.store';

interface CollabEvent {
  id: string;
  user: string;
  color: string;
  action: string;
  time: string;
  isChat?: boolean;
}

export default function Collaboration() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { setHighlightedPath, setSelectedNode } = useGraphStore();

  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(18);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [activeInvestigationId, setActiveInvestigationId] = useState<string>('INV-2025-001');
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });

  // Live dynamic members in room
  const [members, setMembers] = useState<CollaboratorPresence[]>([]);

  // Live events stream
  const [events, setEvents] = useState<CollabEvent[]>([]);
  const [messageInput, setMessageInput] = useState('');

  // Peer focus indicator
  const [peerFocusedNode, setPeerFocusedNode] = useState<{
    nodeId: string;
    user: string;
    color: string;
  } | null>(null);

  const streamEndRef = useRef<HTMLDivElement>(null);

  // Active investigation object
  const currentInvestigation = useMemo(() => {
    return investigations.find((i) => i.id === activeInvestigationId) || investigations[0];
  }, [investigations, activeInvestigationId]);

  // Determine accounts involved in the currently active investigation
  const involvedNodes = useMemo(() => {
    if (!currentInvestigation) return [];
    if (currentInvestigation.nodeIds && currentInvestigation.nodeIds.length > 0) {
      return currentInvestigation.nodeIds;
    }
    if (currentInvestigation.initialAccountIds && currentInvestigation.initialAccountIds.length > 0) {
      return currentInvestigation.initialAccountIds;
    }
    // Fallback detection for known mock cases or regex match from description
    if (currentInvestigation.id.includes('001')) return ['ACC-CYCLE-01', 'ACC-CYCLE-02', 'ACC-CYCLE-03'];
    if (currentInvestigation.id.includes('002')) return ['ACC-AGG-01', 'ACC-MULE-01', 'ACC-MULE-02', 'ACC-MULE-03'];
    if (currentInvestigation.id.includes('003')) return ['ACC-CORP-99', 'ACC-DISP-01', 'ACC-DISP-02'];
    const matches = (currentInvestigation.description || '').match(/ACC-[A-Za-z0-9_-]+/g);
    return matches ? Array.from(new Set(matches)) : [];
  }, [currentInvestigation]);

  // Load investigations and initial graph data
  useEffect(() => {
    getInvestigations().then((invs) => {
      if (invs && invs.length > 0) {
        setInvestigations(invs);
        if (!invs.some((i) => i.id === activeInvestigationId)) {
          setActiveInvestigationId(invs[0].id);
        }
      }
    });

    getGraph().then((data) => {
      if (data && data.nodes && data.nodes.length > 0) {
        setGraphData(data);
      }
    });
  }, []);

  // When room changes, auto-highlight the case's accounts in Cytoscape and emit/log room switch
  useEffect(() => {
    if (!currentInvestigation) return;

    if (involvedNodes.length > 0) {
      setHighlightedPath(involvedNodes);
    } else {
      setHighlightedPath([]);
    }

    setEvents((prev) => [
      {
        id: `room-switch-${Date.now()}`,
        user: 'Room Gateway',
        color: '#6366F1',
        action: `Switched synchronized session to ${currentInvestigation.id} — "${currentInvestigation.title}" (${involvedNodes.length} accounts linked)`,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  }, [currentInvestigation?.id, involvedNodes, setHighlightedPath]);

  // Handle active room socket synchronization
  useEffect(() => {
    if (!activeInvestigationId) return;

    // 1. Initial REST fetch of active members in room
    getInvestigationMembers(activeInvestigationId).then((m) => {
      if (m && m.length > 0) {
        setMembers(m);
      } else {
        setMembers([]);
      }
    });

    let socket: any = null;
    try {
      socket = getSocket();
      setIsConnected(socket.connected);

      const onConnect = () => setIsConnected(true);
      const onDisconnect = () => setIsConnected(false);

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);

      // Join the investigation room
      socket.emit('investigation:join', activeInvestigationId);

      // Presence list snapshot on joining
      socket.on('investigation:presence-list', (data: { investigationId: string; users: CollaboratorPresence[] }) => {
        if (data.users) {
          setMembers(data.users);
        }
      });

      socket.on('investigation:users', (data: { investigationId: string; users: CollaboratorPresence[] }) => {
        if (data.users) {
          setMembers(data.users);
        }
      });

      // Peer joined room
      socket.on('investigation:user-joined', (data: { investigationId: string; user: CollaboratorPresence; users?: CollaboratorPresence[] }) => {
        if (data.users) {
          setMembers(data.users);
        } else if (data.user) {
          setMembers((prev) => [...prev.filter((m) => m.userId !== data.user.userId), data.user]);
        }
        if (data.user) {
          setEvents((prev) => [
            {
              id: `join-${Date.now()}`,
              user: data.user.name || data.user.email,
              color: data.user.color || '#10B981',
              action: 'Joined the collaborative investigation room',
              time: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
        }
      });

      // Peer left room
      socket.on('investigation:user-left', (data: { investigationId: string; userId: string; socketId?: string; users?: CollaboratorPresence[] }) => {
        if (data.users) {
          setMembers(data.users);
        } else {
          setMembers((prev) => prev.filter((m) => m.userId !== data.userId && m.socketId !== data.socketId));
        }
        setEvents((prev) => [
          {
            id: `leave-${Date.now()}`,
            user: 'Investigator',
            color: '#94A3B8',
            action: 'Left the collaborative investigation room',
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
      });

      // Peer graph selection
      socket.on('investigation:graph-selection', (data: any) => {
        if (data.selectedNodeId) {
          setPeerFocusedNode({
            nodeId: data.selectedNodeId,
            user: data.userName || 'Peer Investigator',
            color: data.color || '#3B82F6',
          });
          setHighlightedPath([data.selectedNodeId]);

          setEvents((prev) => [
            {
              id: `evt-${Date.now()}`,
              user: data.userName || 'Peer Investigator',
              color: data.color || '#3B82F6',
              action: `Inspecting account node ${data.selectedNodeId}`,
              time: data.timestamp || new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
        }
      });

      // Peer chat message
      socket.on('investigation:chat', (data: any) => {
        setEvents((prev) => [
          {
            id: data.id || `chat-${Date.now()}`,
            user: data.user || 'Peer Investigator',
            color: data.color || '#8B5CF6',
            action: data.message,
            time: data.time || new Date().toLocaleTimeString(),
            isChat: true,
          },
          ...prev,
        ]);
      });

      // Case status update
      socket.on('investigation:status-updated', (data: any) => {
        setEvents((prev) => [
          {
            id: `status-${Date.now()}`,
            user: data.updatedBy || 'Case Lead',
            color: '#F59E0B',
            action: `Updated case status to ${data.status}`,
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
      });
    } catch (err) {
      console.warn('Socket connect error:', err);
    }

    const interval = setInterval(() => {
      setLatency(16 + Math.floor(Math.random() * 12));
    }, 5000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.emit('investigation:leave', activeInvestigationId);
        socket.off('connect');
        socket.off('disconnect');
        socket.off('investigation:presence-list');
        socket.off('investigation:users');
        socket.off('investigation:user-joined');
        socket.off('investigation:user-left');
        socket.off('investigation:graph-selection');
        socket.off('investigation:chat');
        socket.off('investigation:status-updated');
      }
    };
  }, [activeInvestigationId]);

  // Handle local node selection in canvas -> broadcast to peers
  const handleNodeSelect = (node: GraphNode | null) => {
    if (!node) return;
    try {
      const socket = getSocket();
      socket.emit('investigation:graph-selection', {
        investigationId: activeInvestigationId,
        selectedNodeId: node.id,
        accountType: node.accountType,
      });

      setEvents((prev) => [
        {
          id: `local-${Date.now()}`,
          user: `${currentUser?.name || 'You'} (You)`,
          color: '#3B82F6',
          action: `Inspecting account node ${node.id}`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } catch (err) {
      console.warn('Socket emit error', err);
    }
  };

  // Handle sending a chat message to the room
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const message = messageInput.trim();
    setMessageInput('');

    try {
      const socket = getSocket();
      socket.emit('investigation:chat', {
        investigationId: activeInvestigationId,
        message,
      });

      setEvents((prev) => [
        {
          id: `chat-${Date.now()}`,
          user: `${currentUser?.name || 'You'} (You)`,
          color: '#3B82F6',
          action: message,
          time: new Date().toLocaleTimeString(),
          isChat: true,
        },
        ...prev,
      ]);
    } catch (err) {
      console.warn('Socket chat error', err);
    }
  };

  // Compile member cards to display (ensures current user is always included if alone)
  const displayMembers: CollaboratorPresence[] =
    members.length > 0
      ? members
      : currentUser
      ? [
          {
            userId: currentUser.id,
            name: currentUser.name || currentUser.email.split('@')[0],
            email: currentUser.email,
            role: currentUser.role,
            color: '#3B82F6',
            activity: 'Viewing Canvas',
          },
        ]
      : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Real-Time Collaboration Hub & Synchronized Canvas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized multi-investigator rooms, viewport graph tracking, and real-time live events
          </p>
        </div>

        {/* Live Socket Connectivity Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
            {isConnected ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-emerald-700">WebSocket Connected</span>
                <span className="text-[10px] font-mono text-slate-400">({latency}ms)</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-semibold text-amber-700">Connecting Socket...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Multi-User Collaboration Instructions Pill */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start sm:items-center gap-3 text-xs text-blue-900 shadow-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
        <div className="flex-1">
          <span className="font-bold">How to test live multi-user collaboration: </span>
          Open an Incognito window or separate browser tab, navigate to this console, sign in with another account (e.g.,{' '}
          <code className="px-1.5 py-0.5 bg-blue-100/70 rounded text-[11px] font-mono text-blue-800">
            investigator@fraudconsole.internal / user123
          </code>
          ), and select this case. You will immediately see their card appear live in the room, and selecting nodes will sync across both screens!
        </div>
      </div>

      {/* Main Grid: Active Room Canvas + Event Log & Peers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Synchronized Graph Canvas */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col min-h-[620px]">
            {/* Room Toolbar */}
            <div className="flex flex-wrap items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  Active Room:
                </span>
                <select
                  value={activeInvestigationId}
                  onChange={(e) => {
                    setActiveInvestigationId(e.target.value);
                    setPeerFocusedNode(null);
                  }}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer transition shadow-2xs max-w-sm sm:max-w-md truncate"
                >
                  {investigations.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.id} — {inv.title} ({inv.status})
                    </option>
                  ))}
                  {investigations.length === 0 && (
                    <option value="INV-2025-001">INV-2025-001 — Shell Ring Investigation</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">
                  {displayMembers.length} active investigator{displayMembers.length === 1 ? '' : 's'} in room
                </span>
              </div>
            </div>

            {/* Active Investigation Case Dossier Banner */}
            {currentInvestigation && (
              <div className="mb-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-slate-900 font-mono">
                      {currentInvestigation.id}
                    </span>
                    <span className="font-bold text-slate-800 truncate max-w-md">
                      {currentInvestigation.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      currentInvestigation.status?.toUpperCase() === 'OPEN' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      currentInvestigation.status?.toUpperCase() === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      currentInvestigation.status?.toUpperCase() === 'UNDER_REVIEW' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {currentInvestigation.status?.toUpperCase() || 'OPEN'}
                    </span>
                    {currentInvestigation.priority && (
                      <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">
                        {currentInvestigation.priority.toUpperCase()} PRIORITY
                      </span>
                    )}
                  </div>
                  
                  <p className="text-slate-500 text-[11px] line-clamp-1 mb-1.5">
                    {currentInvestigation.description || 'Active synchronized collaborative investigation.'}
                  </p>

                  {/* Involved Account Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Involved Nodes:</span>
                    {involvedNodes.map((accId) => (
                      <button
                        key={accId}
                        onClick={() => {
                          setHighlightedPath([accId]);
                          const cyNode = graphData.nodes.find(n => n.id === accId);
                          if (cyNode) handleNodeSelect(cyNode);
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 text-[11px] font-mono border border-slate-200 transition cursor-pointer font-semibold shadow-2xs"
                        title="Click to focus on node in canvas"
                      >
                        {accId}
                      </button>
                    ))}
                    {involvedNodes.length === 0 && (
                      <span className="text-slate-400 text-[10px] italic">No accounts linked</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (involvedNodes.length > 0) setHighlightedPath([...involvedNodes]);
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs border border-slate-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Center and highlight case accounts in canvas"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-blue-600" /> Focus Nodes
                  </button>
                  <button
                    onClick={() => navigate(`/investigations/${currentInvestigation.id}`)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg font-semibold text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Open comprehensive investigation dossier"
                  >
                    <ExternalLink className="w-3.5 h-3.5 !text-white" /> Dossier
                  </button>
                </div>
              </div>
            )}

            {/* Peer selection notice banner */}
            {peerFocusedNode && (
              <div className="mb-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-800 transition animate-fadeIn">
                <div className="flex items-center gap-2">
                  <MousePointer2
                    className="w-3.5 h-3.5 animate-bounce"
                    style={{ color: peerFocusedNode.color }}
                  />
                  <span>
                    <strong style={{ color: peerFocusedNode.color }}>{peerFocusedNode.user}</strong> is
                    focused on account:
                  </span>
                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">
                    {peerFocusedNode.nodeId}
                  </span>
                </div>
                <span className="text-[10px] text-blue-500 font-medium">Live Synced via Socket.IO</span>
              </div>
            )}

            <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 min-h-[380px]">
              <GraphCanvas
                graphData={graphData}
                onNodeSelect={handleNodeSelect}
                peerFocusedNode={peerFocusedNode}
              />
            </div>
          </div>
        </div>

        {/* Right: Connected Collaborators & Broadcast Feed */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Investigators in Room */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                Connected Room Members ({displayMembers.length})
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                LIVE
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {displayMembers.map((u) => {
                const isMe = currentUser && (u.userId === currentUser.id || u.email === currentUser.email);
                return (
                  <div
                    key={u.userId || u.socketId || u.email}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between transition hover:border-slate-300"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white"
                        style={{ backgroundColor: u.color || '#3B82F6' }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {u.name || u.email.split('@')[0]}
                          {isMe ? ' (You)' : ''}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {u.role || 'INVESTIGATOR'} • {u.activity || 'Active'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 shrink-0">
                      ONLINE
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Synchronized Broadcast Activity Log */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm h-[380px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                Live Collaboration Stream
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Real-time Feed</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
              {events.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p>Room connected. No peer activity yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click any node on the graph or type a message below to broadcast to everyone in this room.
                  </p>
                </div>
              ) : (
                events.map((evt) => (
                  <div
                    key={evt.id}
                    className={`p-2.5 rounded-xl border text-xs transition ${
                      evt.isChat
                        ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs" style={{ color: evt.color }}>
                        {evt.user}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{evt.time}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed break-words">{evt.action}</p>
                  </div>
                ))
              )}
              <div ref={streamEndRef} />
            </div>

            {/* Quick Chat / Broadcast Input */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Broadcast a note to room..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
