"use client";

import React, { memo, useState, useRef, useEffect, CSSProperties } from 'react';
import { NodeProps, Handle, Position, useReactFlow } from 'reactflow';
import { Plus } from 'lucide-react';
import '@/styles/CustomNode.scss';

interface CustomNodeData {
  label: string;
  content: string;
  type?: 'input' | 'output' | 'default';
  connections?: number;
}

interface TooltipProps {
  text: string;
  style?: CSSProperties;
  visible: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ text, style, visible }) => {
  return (
    <div 
      className={`tooltip ${visible ? 'visible' : ''}`} 
      style={style}
    >
      {text}
    </div>
  );
};

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ 
  id, 
  data, 
  isConnectable,
  selected,
  xPos,
  yPos
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  const { getEdges, addNodes, addEdges, getNode } = useReactFlow();

  const edgeCount = getEdges().filter(
    edge => edge.source === id || edge.target === id
  ).length;

  const handleAddNode = (position: 'right' | 'bottom') => {
    const currentNode = getNode(id);
    if (!currentNode) return;

    const newNodeId = `node-${Date.now()}`;
    const offset = position === 'right' ? { x: 250, y: 0 } : { x: 0, y: 150 };
    
    const newNode = {
      id: newNodeId,
      type: 'custom',
      position: {
        x: currentNode.position.x + offset.x,
        y: currentNode.position.y + offset.y
      },
      data: {
        label: `Node ${newNodeId.split('-')[1]}`,
        content: 'Connected node',
        type: 'default'
      }
    };

    const newEdge = {
      id: `edge-${id}-${newNodeId}`,
      source: id,
      target: newNodeId,
      type: 'custom',
      animated: true,
      data: { label: 'connected' }
    };

    addNodes(newNode);
    addEdges(newEdge);
  };

  return (
    <div 
      className={`custom-node ${selected ? 'selected' : ''} ${edgeCount > 0 ? 'connected' : ''}`}
      ref={nodeRef}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="handle input-handle"
        isConnectable={isConnectable}
      />
      
      <Handle
        type="target"
        position={Position.Top}
        className="handle input-handle"
        isConnectable={isConnectable}
      />

      <div className="node-header">
        <h3 className="node-title">{data.label}</h3>
        <span className="node-id">{id.split('-')[1]}</span>
      </div>
      
      <div className="node-content">
        <p>{data.content}</p>
      </div>
      
      <div className="node-footer">
        <div className="node-type">
          <span className={`type-icon ${data.type || 'default'}`} />
          <span>{data.type || 'default'}</span>
        </div>
        
        {edgeCount > 0 && (
          <div className="node-connections">
            <span>{edgeCount} connection{edgeCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="handle output-handle"
        isConnectable={isConnectable}
      >
        <div 
          className="handle-button"
          onClick={() => handleAddNode('right')}
        >
          <Plus size={12} />
        </div>
      </Handle>

      <Handle
        type="source"
        position={Position.Bottom}
        className="handle output-handle"
        isConnectable={isConnectable}
      >
        <div 
          className="handle-button"
          onClick={() => handleAddNode('bottom')}
        >
          <Plus size={12} />
        </div>
      </Handle>
      
      {edgeCount > 0 && (
        <div className="node-badge">{edgeCount}</div>
      )}
      
      <Tooltip 
        text="Click to add connected node" 
        style={{ left: tooltipPosition.x, top: tooltipPosition.y }} 
        visible={showTooltip} 
      />
    </div>
  );
};

export default memo(CustomNode);