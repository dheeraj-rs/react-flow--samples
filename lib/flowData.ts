import { Node, Edge } from 'reactflow';

export const initialNodes: Node[] = [
  {
    id: 'node-1',
    type: 'custom',
    position: { x: 50, y: 50 },
    data: {
      label: 'Start Node',
      content: 'Click the handles to add connected nodes',
      type: 'input'
    }
  }
];

export const initialEdges: Edge[] = [];