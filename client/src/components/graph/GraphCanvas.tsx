import { useRef, useEffect, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
// @ts-expect-error cytoscape-cola has no bundled typings
import cola from 'cytoscape-cola';
import type { GraphData, GraphNode, GraphEdge } from '../../types/graph.types';
import { toCytoscapeElements } from '../../utils/graph-utils';
import { useGraphStore } from '../../store/graph.store';
import { GraphToolbar } from './GraphToolbar';
import { GraphLegend } from './GraphLegend';

try {
  cytoscape.use(cola);
} catch {
  // cola might already be registered
}

interface GraphCanvasProps {
  graphData: GraphData;
  onNodeSelect?: (node: GraphNode | null) => void;
  onEdgeSelect?: (edge: GraphEdge | null) => void;
  height?: string;
  className?: string;
  hideToolbar?: boolean;
  hideLegend?: boolean;
}

export function GraphCanvas({
  graphData,
  onNodeSelect,
  onEdgeSelect,
  height = '100%',
  className = '',
  hideToolbar = false,
  hideLegend = false,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    layoutName,
    colorByCommunity,
    highlightedPath,
    highlightedCycle,
    setCyInstance,
    setSelectedNode,
    setSelectedEdge,
  } = useGraphStore();

  // Initialize Cytoscape Instance once
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: toCytoscapeElements(graphData, colorByCommunity),
      boxSelectionEnabled: true,
      autounselectify: false,
      style: ([
        // Base Node Style
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'width': 'data(size)',
            'height': 'data(size)',
            'background-color': 'data(bgColor)',
            'color': '#f8fafc',
            'font-size': 11,
            'font-family': 'monospace',
            'font-weight': 'bold',
            'text-valign': 'center',
            'text-halign': 'center',
            'border-width': 2,
            'border-color': '#1e293b',
            'border-opacity': 0.8,
            'text-outline-color': '#0f172a',
            'text-outline-width': 2,
            'transition-property': 'background-color, border-color, border-width, width, height',
            'transition-duration': 300,
          },
        },
        // Base Edge Style
        {
          selector: 'edge',
          style: {
            'width': 'data(width)',
            'line-color': '#64748b',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.1,
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': 9,
            'font-family': 'monospace',
            'color': '#94a3b8',
            'text-background-opacity': 0.8,
            'text-background-color': '#0f172a',
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle',
            'opacity': 0.75,
            'transition-property': 'line-color, target-arrow-color, width, opacity',
            'transition-duration': 300,
          },
        },
        // Selected Node
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#38bdf8',
            'shadow-blur': 15,
            'shadow-color': '#38bdf8',
            'shadow-opacity': 0.9,
          },
        },
        // Selected Edge
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#38bdf8',
            'target-arrow-color': '#38bdf8',
            'width': 4,
            'opacity': 1,
            'color': '#38bdf8',
          },
        },
        // High Risk / Flagged Nodes
        {
          selector: 'node[status = "flagged"], node[status = "suspicious"]',
          style: {
            'border-color': '#ef4444',
            'border-width': 3,
          },
        },
        // High Risk Edges
        {
          selector: 'edge[status = "FLAGGED"]',
          style: {
            'line-color': '#ef4444',
            'target-arrow-color': '#ef4444',
            'color': '#fca5a5',
          },
        },
        // Path Highlighting Classes
        {
          selector: '.highlighted-path-node',
          style: {
            'border-color': '#f59e0b',
            'border-width': 4,
            'background-color': '#d97706',
            'shadow-blur': 20,
            'shadow-color': '#f59e0b',
            'shadow-opacity': 0.8,
          },
        },
        {
          selector: '.highlighted-path-edge',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'width': 5,
            'opacity': 1,
            'color': '#f59e0b',
            'z-index': 99,
          },
        },
        // Cycle Highlighting Classes (Red Animated Pulse)
        {
          selector: '.highlighted-cycle-node',
          style: {
            'border-color': '#f43f5e',
            'border-width': 5,
            'background-color': '#e11d48',
            'shadow-blur': 25,
            'shadow-color': '#f43f5e',
            'shadow-opacity': 1,
          },
        },
        {
          selector: '.highlighted-cycle-edge',
          style: {
            'line-color': '#f43f5e',
            'target-arrow-color': '#f43f5e',
            'width': 5,
            'opacity': 1,
            'color': '#f43f5e',
            'line-style': 'solid',
            'z-index': 100,
          },
        },
        // Dimmed Elements when something is highlighted
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.15,
            'text-opacity': 0,
          },
        },
      ] as any),
      layout: {
        name: layoutName,
        animate: true,
        animationDuration: 700,
        fit: true,
        padding: 40,
      } as any,
    });

    cyRef.current = cy;
    setCyInstance(cy);

    // Click events
    cy.on('tap', 'node', (e) => {
      const nodeData = e.target.data();
      const matchedNode = graphData.nodes.find(n => n.id === nodeData.id) || {
        id: nodeData.id,
        balance: nodeData.balance,
        riskScore: nodeData.riskScore,
        accountType: nodeData.accountType,
        status: nodeData.status,
        communityId: nodeData.communityId,
      };
      setSelectedNode(matchedNode);
      onNodeSelect?.(matchedNode);
    });

    cy.on('tap', 'edge', (e) => {
      const edgeData = e.target.data();
      const matchedEdge = graphData.edges.find(ed => ed.id === edgeData.id) || {
        id: edgeData.id,
        source: edgeData.source,
        target: edgeData.target,
        amount: edgeData.amount,
        status: edgeData.status,
        type: edgeData.type,
      };
      setSelectedEdge(matchedEdge);
      onEdgeSelect?.(matchedEdge);
    });

    cy.on('tap', (e) => {
      if (e.target === cy) {
        setSelectedNode(null);
        setSelectedEdge(null);
        onNodeSelect?.(null);
        onEdgeSelect?.(null);
      }
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
      setCyInstance(null);
    };
  }, []);

  // Incremental merge when graphData updates without resetting existing node positions!
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      const existingNodes = new Set(cy.nodes().map(n => n.id()));
      const existingEdges = new Set(cy.edges().map(e => e.id()));

      const newElements = toCytoscapeElements(graphData, colorByCommunity);
      const elementsToAdd = newElements.filter(el => {
        if (el.group === 'nodes') return !existingNodes.has(el.data.id!);
        if (el.group === 'edges') return !existingEdges.has(el.data.id!);
        return false;
      });

      if (elementsToAdd.length > 0) {
        cy.add(elementsToAdd);
        // Gently arrange only new elements without moving settled nodes
        cy.layout({
          name: 'cose',
          animate: true,
          animationDuration: 500,
          fit: false,
          randomize: false,
        } as any).run();
      }
    });
  }, [graphData, colorByCommunity]);

  // Handle path / cycle highlights
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.elements().removeClass('highlighted-path-node highlighted-path-edge highlighted-cycle-node highlighted-cycle-edge dimmed');

      const hasPath = highlightedPath.length > 0;
      const hasCycle = highlightedCycle.length > 0;

      if (!hasPath && !hasCycle) return;

      // Dim everything first
      cy.elements().addClass('dimmed');

      if (hasPath) {
        for (let i = 0; i < highlightedPath.length; i++) {
          const nodeId = highlightedPath[i];
          const node = cy.getElementById(nodeId);
          node.removeClass('dimmed').addClass('highlighted-path-node');

          if (i < highlightedPath.length - 1) {
            const nextNodeId = highlightedPath[i + 1];
            const edge = cy.edges(`[source = "${nodeId}"][target = "${nextNodeId}"], [source = "${nextNodeId}"][target = "${nodeId}"]`);
            edge.removeClass('dimmed').addClass('highlighted-path-edge');
          }
        }
      }

      if (hasCycle) {
        for (let i = 0; i < highlightedCycle.length; i++) {
          const nodeId = highlightedCycle[i];
          const node = cy.getElementById(nodeId);
          node.removeClass('dimmed').addClass('highlighted-cycle-node');

          const nextNodeId = highlightedCycle[(i + 1) % highlightedCycle.length];
          const edge = cy.edges(`[source = "${nodeId}"][target = "${nextNodeId}"], [source = "${nextNodeId}"][target = "${nodeId}"]`);
          edge.removeClass('dimmed').addClass('highlighted-cycle-edge');
        }
      }
    });
  }, [highlightedPath, highlightedCycle]);

  // Export handlers
  const handleExportPNG = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const png64 = cy.png({ full: true, bg: '#0b132b', scale: 2 });
    const a = document.createElement('a');
    a.href = png64;
    a.download = `fraud-graph-${Date.now()}.png`;
    a.click();
  }, []);

  const handleExportSVG = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    // Export high-res PNG fallback if svg plugin isn't active
    const png64 = cy.png({ full: true, bg: '#0b132b', scale: 3 });
    const a = document.createElement('a');
    a.href = png64;
    a.download = `fraud-graph-vector-${Date.now()}.png`;
    a.click();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{ height }}
      className={`relative w-full overflow-hidden bg-[#070b14] select-none ${className}`}
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Cytoscape Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Overlay Toolbar */}
      {!hideToolbar && (
        <GraphToolbar
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
      )}

      {/* Overlay Legend */}
      {!hideLegend && <GraphLegend />}
    </div>
  );
}
