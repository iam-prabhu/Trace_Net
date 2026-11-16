import { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Focus,
  RotateCcw,
  Palette,
  Download,
  Share2,
} from 'lucide-react';
import { useGraphStore } from '../../store/graph.store';

interface GraphToolbarProps {
  onExportPNG?: () => void;
  onExportSVG?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export function GraphToolbar({
  onExportPNG,
  onExportSVG,
  onToggleFullscreen,
  isFullscreen = false,
}: GraphToolbarProps) {
  const {
    cyInstance,
    layoutName,
    setLayoutName,
    colorByCommunity,
    setColorByCommunity,
    clearHighlights,
    clearSelection,
  } = useGraphStore();

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleZoomIn = () => {
    if (!cyInstance) return;
    cyInstance.zoom({
      level: cyInstance.zoom() * 1.25,
      renderedPosition: { x: cyInstance.width() / 2, y: cyInstance.height() / 2 },
    });
  };

  const handleZoomOut = () => {
    if (!cyInstance) return;
    cyInstance.zoom({
      level: cyInstance.zoom() * 0.8,
      renderedPosition: { x: cyInstance.width() / 2, y: cyInstance.height() / 2 },
    });
  };

  const handleFit = () => {
    if (!cyInstance) return;
    cyInstance.fit(undefined, 40);
  };

  const handleCenter = () => {
    if (!cyInstance) return;
    cyInstance.center();
  };

  const handleLayoutChange = (newLayout: 'cose' | 'concentric' | 'circle' | 'breadthfirst' | 'cola') => {
    setLayoutName(newLayout);
    if (!cyInstance) return;
    try {
      cyInstance.layout({ name: newLayout, animate: true, animationDuration: 600 } as any).run();
    } catch {
      cyInstance.layout({ name: 'cose', animate: true }).run();
    }
  };

  const handleReset = () => {
    clearHighlights();
    clearSelection();
    handleFit();
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl text-slate-200">
      {/* Layout selector */}
      <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/80 rounded-lg border border-slate-700/50">
        <span className="text-xs font-semibold text-slate-400">Layout:</span>
        <select
          value={layoutName}
          onChange={(e) => handleLayoutChange(e.target.value as any)}
          className="bg-transparent text-xs font-medium text-slate-200 outline-none cursor-pointer"
        >
          <option value="cose" className="bg-slate-900 text-slate-200">Force Directed (CoSE)</option>
          <option value="concentric" className="bg-slate-900 text-slate-200">Concentric Circles</option>
          <option value="circle" className="bg-slate-900 text-slate-200">Circular Ring</option>
          <option value="breadthfirst" className="bg-slate-900 text-slate-200">Breadth-First Hierarchy</option>
          <option value="cola" className="bg-slate-900 text-slate-200">Cola Physics</option>
        </select>
      </div>

      <div className="h-5 w-px bg-slate-700/60 mx-0.5" />

      {/* Zoom controls */}
      <button
        onClick={handleZoomIn}
        title="Zoom In"
        className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <button
        onClick={handleZoomOut}
        title="Zoom Out"
        className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        onClick={handleFit}
        title="Fit Graph to Viewport"
        className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white"
      >
        <Focus className="w-4 h-4" />
      </button>

      <button
        onClick={handleCenter}
        title="Center Graph"
        className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      <div className="h-5 w-px bg-slate-700/60 mx-0.5" />

      {/* Community Color toggle */}
      <button
        onClick={() => setColorByCommunity(!colorByCommunity)}
        title={colorByCommunity ? "Color by Status" : "Color by Louvain Community"}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium transition ${
          colorByCommunity
            ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
            : 'hover:bg-slate-800 text-slate-300 hover:text-white'
        }`}
      >
        <Palette className="w-3.5 h-3.5" />
        <span>{colorByCommunity ? 'Communities' : 'Status'}</span>
      </button>

      {/* Reset highlights */}
      <button
        onClick={handleReset}
        title="Clear Highlights & Filter"
        className="px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
      >
        Reset
      </button>

      <div className="h-5 w-px bg-slate-700/60 mx-0.5" />

      {/* Export dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-1 p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white"
          title="Export Graph Image"
        >
          <Download className="w-4 h-4" />
        </button>

        {showExportMenu && (
          <div className="absolute left-0 mt-2 w-36 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-20">
            <button
              onClick={() => {
                setShowExportMenu(false);
                onExportPNG?.();
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-400" /> Export PNG
            </button>
            <button
              onClick={() => {
                setShowExportMenu(false);
                onExportSVG?.();
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" /> Export SVG
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen toggle */}
      {onToggleFullscreen && (
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-300 hover:text-white"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
