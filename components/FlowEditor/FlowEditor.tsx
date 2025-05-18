"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, { 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  MiniMap, 
  Controls,
  Background,
  useReactFlow,
  ConnectionLineType,
  Node,
  Edge,
  XYPosition,
  Connection,
  NodeChange,
  EdgeChange,
  Viewport
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@/styles/FlowEditor.scss';
import CustomNode from './CustomNode';
import CustomControls from './CustomControls';
import CustomEdge from './CustomEdge';
import { initialNodes, initialEdges } from '@/lib/flowData';
import useHistory from '@/hooks/useHistory';
import useBoundedNodes from '@/hooks/useBoundedNodes';

// Define node and edge types
const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

interface FlowEditorProps {
  title?: string;
}

const FlowEditor: React.FC<FlowEditorProps> = ({ title = 'Flow Editor' }) => {
  // Main react-flow hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { getViewport, setViewport, project, fitView } = useReactFlow();
  
  // References
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // State management
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [isArranging, setIsArranging] = useState(false);
  
  // Custom hooks
  const { addToHistory, undo, redo, canUndo, canRedo } = useHistory(nodes, edges, setNodes, setEdges);
  const { boundedNodesHandler } = useBoundedNodes();
  
  // Handle connection between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      // Only allow connections from source to target handles
      if (connection.sourceHandle && connection.targetHandle) {
        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);
        
        if (sourceNode && targetNode) {
          const newEdge = {
            ...connection,
            type: 'custom',
            animated: true,
            style: { stroke: 'var(--color-edge)' },
            data: { label: 'connected' }
          };
          
          setEdges((eds) => {
            const newEdges = addEdge(newEdge, eds);
            addToHistory(nodes, newEdges);
            return newEdges;
          });
        }
      }
    },
    [nodes, setEdges, addToHistory]
  );

  // Add edge removal listener
  useEffect(() => {
    const handleEdgeRemove = (event: CustomEvent) => {
      const edgeId = event.detail.id;
      setEdges((eds) => {
        const newEdges = eds.filter(e => e.id !== edgeId);
        addToHistory(nodes, newEdges);
        return newEdges;
      });
    };

    document.addEventListener('edgeRemove', handleEdgeRemove as EventListener);
    return () => {
      document.removeEventListener('edgeRemove', handleEdgeRemove as EventListener);
    };
  }, [nodes, setEdges, addToHistory]);
  
  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);
  
  // Handle node hover
  const onNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node) => {
    setHoveredNode(node);
  }, []);
  
  const onNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);
  
  // Track changes to add to history
  const onNodesChangeWithHistory = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      
      // If it's a position change and it's done, save to history
      const positionChange = changes.find(change => change.type === 'position' && change.dragging === false);
      if (positionChange) {
        addToHistory(nodes, edges);
      }
    },
    [nodes, edges, onNodesChange, addToHistory]
  );
  
  const onEdgesChangeWithHistory = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      
      // Only add to history if edges are removed
      const removeChange = changes.find(change => change.type === 'remove');
      if (removeChange) {
        addToHistory(nodes, edges);
      }
    },
    [nodes, edges, onEdgesChange, addToHistory]
  );
  
  // Auto arrange function
  const autoArrangeNodes = useCallback(() => {
    setIsArranging(true);
    
    // Create a map to track node levels
    const nodeLevels = new Map<string, number>();
    const nodeMap = new Map<string, Node>();
    
    // Map nodes by id for quick access
    nodes.forEach(node => {
      nodeMap.set(node.id, node);
      nodeLevels.set(node.id, 0); // Initialize all nodes at level 0
    });
    
    // Identify source nodes (nodes with no incoming edges)
    const sourceNodeIds = new Set(nodes.map(node => node.id));
    edges.forEach(edge => {
      if (sourceNodeIds.has(edge.target)) {
        sourceNodeIds.delete(edge.target);
      }
    });
    
    // Assign levels to nodes (distance from source nodes)
    const assignLevels = (nodeId: string, level: number) => {
      const currentLevel = nodeLevels.get(nodeId) || 0;
      if (level > currentLevel) {
        nodeLevels.set(nodeId, level);
      }
      
      // Find all outgoing edges from this node
      edges
        .filter(edge => edge.source === nodeId)
        .forEach(edge => {
          assignLevels(edge.target, level + 1);
        });
    };
    
    // Start assigning levels from source nodes
    sourceNodeIds.forEach(nodeId => {
      assignLevels(nodeId, 0);
    });
    
    // Group nodes by level
    const nodesByLevel: Record<number, Node[]> = {};
    nodeLevels.forEach((level, nodeId) => {
      if (!nodesByLevel[level]) {
        nodesByLevel[level] = [];
      }
      const node = nodeMap.get(nodeId);
      if (node) {
        nodesByLevel[level].push(node);
      }
    });
    
    // Calculate the new positions
    const VERTICAL_SPACING = 150; // Space between levels
    const HORIZONTAL_SPACING = 250; // Space between nodes in the same level
    
    const newNodes = [...nodes];
    const levels = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);
    
    levels.forEach(level => {
      const nodesInLevel = nodesByLevel[level];
      const levelWidth = nodesInLevel.length * HORIZONTAL_SPACING;
      
      nodesInLevel.forEach((node, index) => {
        const nodeIndex = newNodes.findIndex(n => n.id === node.id);
        if (nodeIndex !== -1) {
          const xPos = (index * HORIZONTAL_SPACING) - (levelWidth / 2) + (HORIZONTAL_SPACING / 2);
          const yPos = level * VERTICAL_SPACING;
          
          newNodes[nodeIndex] = {
            ...newNodes[nodeIndex],
            position: { x: xPos, y: yPos }
          };
        }
      });
    });
    
    setNodes(newNodes);
    
    // Fit view after auto-arranging
    setTimeout(() => {
      fitView({ padding: 0.2 });
      setIsArranging(false);
      addToHistory(newNodes, edges);
    }, 500);
  }, [nodes, edges, setNodes, fitView, addToHistory]);
  
  // Delete selected elements
  const deleteSelected = useCallback(() => {
    setNodes(nodes.filter(node => !node.selected));
    setEdges(edges.filter(edge => !edge.selected));
    
    addToHistory(
      nodes.filter(node => !node.selected),
      edges.filter(edge => !edge.selected)
    );
  }, [nodes, edges, setNodes, setEdges, addToHistory]);
  
  // Add a new node
  const addNode = useCallback(() => {
    const id = `node-${nodes.length + 1}`;
    const newNode = {
      id,
      type: 'custom',
      position: {
        x: Math.random() * 300,
        y: Math.random() * 300
      },
      data: {
        label: `Node ${nodes.length + 1}`,
        content: 'New node content',
        type: 'default'
      }
    };
    
    const newNodes = nodes.concat(newNode);
    setNodes(newNodes);
    addToHistory(newNodes, edges);
  }, [nodes, edges, setNodes, addToHistory]);
  
  // Handle pane ready event
  const onPaneReady = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);
  
  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        redo();
      }
      
      // Delete: Delete or Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement === document.body) {
          e.preventDefault();
          deleteSelected();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, deleteSelected]);
  
  // Apply bounded nodes after any node change
  useEffect(() => {
    boundedNodesHandler(nodes, setNodes);
  }, [nodes, boundedNodesHandler, setNodes]);
  
  return (
    <div className="flow-editor-container">
      <div className="flow-editor-header">
        <h1>{title}</h1>
        <button onClick={addNode}>Add Node</button>
      </div>
      
      <div className="flow-editor-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeWithHistory}
          onEdgesChange={onEdgesChangeWithHistory}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onPaneReady={onPaneReady}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultEdgeOptions={{
            type: 'custom',
            animated: false
          }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={2}
          snapToGrid
          snapGrid={[15, 15]}
        >
          <CustomControls
            onUndo={undo}
            onRedo={redo}
            onAutoArrange={autoArrangeNodes}
            onDeleteSelected={deleteSelected}
            canUndo={canUndo}
            canRedo={canRedo}
          />
          <Background color="#aaa" gap={16} />
          <MiniMap 
            nodeStrokeWidth={3}
            nodeColor={(node) => {
              if (node.selected) return 'var(--color-primary)';
              return 'var(--color-node-border)';
            }}
            maskColor="rgba(240, 240, 240, 0.5)"
          />
          <Controls showInteractive={false} />
        </ReactFlow>
        
        {isArranging && (
          <div className="auto-arrange-overlay">
            <div className="indicator">
              <span>Arranging nodes...</span>
            </div>
          </div>
        )}
        
        <div className="status-bar">
          <div className="status-item">
            <span>Nodes: {nodes.length}</span>
          </div>
          <div className="status-item">
            <span>Connections: {edges.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowEditor;