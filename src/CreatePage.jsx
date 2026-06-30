import React, { useState } from 'react';

export default function CreatePage({ onCreate }) {
  const [prompt, setPrompt] = useState('');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d0d',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Igboukwu Labs</h1>
      <p style={{ color: '#aaa', marginBottom: '24px' }}>Describe what you want to build</p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. A landing page for my music studio..."
        rows={4}
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #333',
          background: '#1a1a1a',
          color: '#fff',
          marginBottom: '16px'
        }}
      />
      <button
        onClick={() => onCreate && onCreate(prompt)}
        style={{
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          background: '#ff6a00',
          color: '#fff',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Generate
      </button>
    </div>
  );
}
