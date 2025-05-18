"use client";

import React from 'react';
import { 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  X, 
  LayoutGrid, 
  Save 
} from 'lucide-react';
import { useReactFlow } from 'reactflow';
import '@/styles/FlowEditor.scss';

interface CustomControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  onAutoArrange: () => void;
  onDeleteSelected: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const CustomControls: React.FC<CustomControlsProps> = ({ 
  onUndo, 
  onRedo, 
  onAutoArrange, 
  onDeleteSelected,
  canUndo,
  canRedo
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  
  return (
    <div className="controls-custom">
      <button 
        className="control-button" 
        onClick={() => zoomIn()}
        title="Zoom In"
      >
        <ZoomIn size={18} />
      </button>
      
      <button 
        className="control-button" 
        onClick={() => zoomOut()}
        title="Zoom Out"
      >
        <ZoomOut size={18} />
      </button>
      
      <button 
        className="control-button" 
        onClick={() => fitView({ padding: 0.2 })}
        title="Fit View"
      >
        <Maximize size={18} />
      </button>
      
      <button 
        className="control-button" 
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
        style={{ opacity: canUndo ? 1 : 0.5 }}
      >
        <Undo2 size={18} />
      </button>
      
      <button 
        className="control-button" 
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo"
        style={{ opacity: canRedo ? 1 : 0.5 }}
      >
        <Redo2 size={18} />
      </button>
      
      <button 
        className="control-button" 
        onClick={onAutoArrange}
        title="Auto Arrange"
      >
        <LayoutGrid size={18} />
      </button>
      
      <button 
        className="control-button" 
        onClick={() => {
          const result = window.confirm("Save this flow diagram?");
          if (result) {
            // In a real application, implement save functionality
            alert("Flow saved successfully!");
          }
        }}
        title="Save Flow"
      >
        <Save size={18} />
      </button>
      
      <button 
        className="control-button delete" 
        onClick={onDeleteSelected}
        title="Delete Selected"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default CustomControls;