import React from 'react';

function App() {
  console.log("App component is rendering!"); // Add a log
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightgreen' }}>
      <h1>It Works!</h1>
      <p>If you see this, the basic React setup is okay.</p>
    </div>
  );
}

export default App;