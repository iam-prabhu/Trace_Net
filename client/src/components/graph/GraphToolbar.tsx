import { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Focus,
  RotateCcw,
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
    <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg text-slate-700">
      {/* Layout selector */}
      <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
        <span className="text-xs font-semibold text-slate-500">Layout:</span>
        <select
          value={layoutName}
          onChange={(e) => handleLayoutChange(e.target.value as any)}
          className="bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer"
        >
          <option value="cose" className="bg-white text-slate-800">Force Directed (CoSE)</option>
          <option value="concentric" className="bg-white text-slate-800">Concentric Circles</option>
          <option value="circle" className="bg-white text-slate-800">Circular Ring</option>
          <option value="breadthfirst" className="bg-white text-slate-800">Breadth-First Hierarchy</option>
          <option value="cola" className="bg-white text-slate-800">Cola Physics</option>
        </select>
      </div>

      <div className="h-5 w-px bg-slate-200 mx-0.5" />

      {/* Zoom controls */}
      <button
        onClick={handleZoomIn}
        title="Zoom In"
        className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <button
        onClick={handleZoomOut}
        title="Zoom Out"
        className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        onClick={handleFit}
        title="Fit Graph to Viewport"
        className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <Focus className="w-4 h-4" />
      </button>

      <button
        onClick={handleCenter}
        title="Center Graph"
        className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Reset highlights */}
      <button
        onClick={handleReset}
        title="Clear Highlights & Filter"
        className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
      >
        Reset
      </button>

      <div className="h-5 w-px bg-slate-200 mx-0.5" />

      {/* Export dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center gap-1 p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900 cursor-pointer"
          title="Export Graph Image"
        >
          <Download className="w-4 h-4" />
        </button>

        {showExportMenu && (
          <div className="absolute left-0 mt-2 w-36 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-20">
            <button
              onClick={() => {
                setShowExportMenu(false);
                onExportPNG?.();
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" /> Export PNG
            </button>
            <button
              onClick={() => {
                setShowExportMenu(false);
                onExportSVG?.();
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" /> Export SVG
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen toggle */}
      {onToggleFullscreen && (
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
