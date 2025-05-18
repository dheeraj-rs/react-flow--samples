"use client";

import { useCallback, useState, useEffect } from 'react';
import { Node, useReactFlow, Viewport } from 'reactflow';

const useBoundedNodes = (padding: number = 20) => {
  const { getViewport } = useReactFlow();
  const [viewportDimensions, setViewportDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const updateViewportDimensions = () => {
      const reactFlowContainer = document.querySelector('.react-flow');
      if (reactFlowContainer) {
        const { width, height } = reactFlowContainer.getBoundingClientRect();
        setViewportDimensions({ width, height });
      }
    };

    updateViewportDimensions();
    window.addEventListener('resize', updateViewportDimensions);

    return () => {
      window.removeEventListener('resize', updateViewportDimensions);
    };
  }, []);

  const boundedNodesHandler = useCallback(
    (nodes: Node[], setNodes: (nodes: Node[]) => void) => {
      const { width, height } = viewportDimensions;
      if (width === 0 || height === 0) return;

      const { zoom, x, y } = getViewport();
      const nodeWidth = 180;
      const nodeHeight = 100;

      const visibleAreaLeft = -x / zoom;
      const visibleAreaTop = -y / zoom;
      const visibleAreaRight = (width / zoom) - x / zoom - nodeWidth;
      const visibleAreaBottom = (height / zoom) - y / zoom - nodeHeight;

      const boundaryLeft = visibleAreaLeft + padding;
      const boundaryTop = visibleAreaTop + padding;
      const boundaryRight = visibleAreaRight - padding;
      const boundaryBottom = visibleAreaBottom - padding;

      let needsUpdate = false;
      const updatedNodes = nodes.map(node => {
        let { x: nodeX, y: nodeY } = node.position;
        let isOutOfBounds = false;

        if (nodeX < boundaryLeft) {
          nodeX = boundaryLeft;
          isOutOfBounds = true;
        } else if (nodeX > boundaryRight) {
          nodeX = boundaryRight;
          isOutOfBounds = true;
        }

        if (nodeY < boundaryTop) {
          nodeY = boundaryTop;
          isOutOfBounds = true;
        } else if (nodeY > boundaryBottom) {
          nodeY = boundaryBottom;
          isOutOfBounds = true;
        }

        if (isOutOfBounds) {
          needsUpdate = true;
          return {
            ...node,
            position: { x: nodeX, y: nodeY },
          };
        }

        return node;
      });

      if (needsUpdate) {
        setNodes(updatedNodes);
      }
    },
    [getViewport, viewportDimensions, padding]
  );

  return {
    boundedNodesHandler,
    viewportDimensions,
  };
};

export default useBoundedNodes;