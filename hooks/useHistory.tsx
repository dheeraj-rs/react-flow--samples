"use client";

import { useState, useCallback, useRef } from 'react';
import { Node, Edge } from 'reactflow';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

const useHistory = (
  initialNodes: Node[],
  initialEdges: Edge[],
  setNodes: (nodes: Node[]) => void,
  setEdges: (edges: Edge[]) => void
) => {
  // History stacks
  const undoStack = useRef<HistoryState[]>([]);
  const redoStack = useRef<HistoryState[]>([]);
  
  // Status flags
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  
  // Store initial state
  useState(() => {
    undoStack.current.push({ nodes: initialNodes, edges: initialEdges });
    setCanUndo(false);
    setCanRedo(false);
  });
  
  // Add state to history
  const addToHistory = useCallback((nodes: Node[], edges: Edge[]) => {
    // Prevent duplicate states (only record if something changed)
    const currentState = undoStack.current[undoStack.current.length - 1];
    if (currentState) {
      const nodesEqual = JSON.stringify(currentState.nodes) === JSON.stringify(nodes);
      const edgesEqual = JSON.stringify(currentState.edges) === JSON.stringify(edges);
      
      if (nodesEqual && edgesEqual) {
        return;
      }
    }
    
    // Clone nodes and edges to avoid reference issues
    const clonedNodes = JSON.parse(JSON.stringify(nodes));
    const clonedEdges = JSON.parse(JSON.stringify(edges));
    
    // Add to undo stack and clear redo stack
    undoStack.current.push({ nodes: clonedNodes, edges: clonedEdges });
    redoStack.current = [];
    
    // Limit history size to prevent memory issues
    if (undoStack.current.length > 50) {
      undoStack.current.shift();
    }
    
    setCanUndo(undoStack.current.length > 1);
    setCanRedo(false);
  }, []);
  
  // Undo the last action
  const undo = useCallback(() => {
    if (undoStack.current.length > 1) {
      // Move current state to redo stack
      const current = undoStack.current.pop();
      if (current) {
        redoStack.current.push(current);
      }
      
      // Get the previous state
      const previous = undoStack.current[undoStack.current.length - 1];
      
      // Update flow state
      setNodes(previous.nodes);
      setEdges(previous.edges);
      
      // Update status flags
      setCanUndo(undoStack.current.length > 1);
      setCanRedo(true);
    }
  }, [setNodes, setEdges]);
  
  // Redo the last undone action
  const redo = useCallback(() => {
    if (redoStack.current.length > 0) {
      // Get and remove the last state from redo stack
      const next = redoStack.current.pop();
      
      if (next) {
        // Add to undo stack
        undoStack.current.push(next);
        
        // Update flow state
        setNodes(next.nodes);
        setEdges(next.edges);
        
        // Update status flags
        setCanUndo(true);
        setCanRedo(redoStack.current.length > 0);
      }
    }
  }, [setNodes, setEdges]);
  
  return {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo
  };
};

export default useHistory;