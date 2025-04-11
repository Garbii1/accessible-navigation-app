import React from 'react';
import AudioGuidance from './AudioGuidance';

function App() {
  const step = {
    html_instructions: '<p>Follow these instructions.</p>',
  };

  return (
    <div>
      <h1>Welcome to My App</h1>
      <AudioGuidance step={step} />
    </div>
  );
}

export default App;