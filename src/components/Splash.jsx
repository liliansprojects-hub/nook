import React from 'react';

// The nook logo on the logo's own cream: shown while the app and the account load.
export default function Splash() {
  return (
    <div className="fixed inset-0 grid place-items-center" style={{ background: '#f4ebe2' }}>
      <img src="/splash-logo.png" alt="nook" width={168} height={168} style={{ width: 168, height: 168 }} />
    </div>
  );
}
