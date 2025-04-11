// App.jsx
import React from 'react';
import AudioGuidance from './AudioGuidance';

function App() {
  const sampleStep = {
    html_instructions: '<p>This is a test instruction.</p>',
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My App</h1>
      <AudioGuidance step={sampleStep} />
    </div>
  );
}

export default App;