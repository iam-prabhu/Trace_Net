import React from 'react';
import { Button } from '../common/Button';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

interface GraphControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFit?: () => void;
  onRefresh?: () => void;
}

export function GraphControls({ onZoomIn, onZoomOut, onFit, onRefresh }: GraphControlsProps) {
  return (
    <div className="flex flex-col gap-1 p-2 bg-white rounded shadow border border-gray-200">
      <Button variant="ghost" size="sm" onClick={onZoomIn}><ZoomIn size={16} /></Button>
      <Button variant="ghost" size="sm" onClick={onZoomOut}><ZoomOut size={16} /></Button>
      <Button variant="ghost" size="sm" onClick={onFit}><Maximize2 size={16} /></Button>
      <Button variant="ghost" size="sm" onClick={onRefresh}><RefreshCw size={16} /></Button>
    </div>
  );
}
