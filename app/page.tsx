"use client";

import dynamic from 'next/dynamic';
import { ReactFlowProvider } from 'reactflow';

// Import FlowEditor dynamically to ensure it only runs on client
const FlowEditor = dynamic(
  () => import('@/components/FlowEditor/FlowEditor'),
  { 
    ssr: false, 
    loading: () => (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        width: '100%',
        backgroundColor: '#f8f8f8'
      }}>
        <p>Loading Flow Editor...</p>
      </div>
    )
  }
);

export default function Home() {
  return (
    <main>
      <ReactFlowProvider>
        <FlowEditor title="React Flow Editor" />
      </ReactFlowProvider>
    </main>
  );
}