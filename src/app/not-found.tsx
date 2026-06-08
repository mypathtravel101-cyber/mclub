'use client';

import { useEffect } from 'react';

export default function NotFound() {
  useEffect(() => {
    // Redirect to the main page if we hit a 404
    // This prevents the default Next.js 404 page from showing
    // when the gateway corrupts the RSC stream
    window.location.replace('/');
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f1923 0%, #1a2330 50%, #0f1923 100%)',
      color: '#8899aa',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#d4af37', fontSize: '24px', marginBottom: '8px' }}>MCLUB</h2>
        <p style={{ fontSize: '14px' }}>正在載入...</p>
      </div>
    </div>
  );
}
