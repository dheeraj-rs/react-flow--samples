"use client";

import React, { memo } from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
  MarkerType
} from 'reactflow';
import { X } from 'lucide-react';
import '@/styles/CustomEdge.scss';

interface CustomEdgeData {
  label?: string;
}

const CustomEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
  selected,
  animated,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const edgeStyles = {
    ...style,
    stroke: selected ? 'var(--color-primary)' : 'var(--color-edge)',
    strokeWidth: selected ? 3 : 2,
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd || {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: selected ? 'var(--color-primary)' : 'var(--color-edge)',
        }}
        style={edgeStyles}
        className={`custom-edge ${animated ? 'animated' : ''} ${selected ? 'highlighted' : ''}`}
      />

      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="edge-label-container"
          >
            <span className="edge-label">{data.label}</span>
            <button 
              className="edge-delete-button"
              onClick={(event) => {
                event.stopPropagation();
                const edges = document.querySelectorAll('.react-flow__edge');
                edges.forEach(edge => {
                  if (edge.getAttribute('data-testid') === `rf__edge-${id}`) {
                    const removeEvent = new CustomEvent('edgeRemove', { detail: { id } });
                    document.dispatchEvent(removeEvent);
                  }
                });
              }}
            >
              <X size={12} />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(CustomEdge);