import React, { useState, useEffect, useCallback } from 'react';

// Simple HTML tag stripper for cleaner speech output
const stripHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

function AudioGuidance({ step }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(null); // Store selected voice URI

  // Check for API support and get voices on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      setSpeechSynthesis(synth);

      const loadVoices = () => {
         const voiceList = synth.getVoices();
         setVoices(voiceList);
         // Optionally auto-select a default voice (e.g., the first English voice)
         const defaultVoice = voiceList.find(v => v.lang.startsWith('en'));
         if (defaultVoice && !selectedVoiceURI) {
             setSelectedVoiceURI(defaultVoice.voiceURI);
         }
      }

      // Voices may load asynchronously
      loadVoices();
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }
    } else {
      console.warn("Web Speech API (Synthesis) not supported by this browser.");
    }
  }, [selectedVoiceURI]); // Re-run if selectedVoiceURI changes? Maybe not needed.


  const speakInstruction = useCallback(() => {
    if (!speechSynthesis || !step || isSpeaking) return;

    // Cancel any previous speech
    speechSynthesis.cancel();

    const instructionText = stripHtml(step.html_instructions);
    const utterance = new SpeechSynthesisUtterance(instructionText);

    // Set voice if selected and found
     if (selectedVoiceURI) {
        const voice = voices.find(v => v.voiceURI === selectedVoiceURI);
        if (voice) utterance.voice = voice;
     }

    // Optional: Configure pitch, rate, volume
    // utterance.pitch = 1;
    // utterance.rate = 1;
    // utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  }, [speechSynthesis, step, isSpeaking, selectedVoiceURI, voices]);

  const stopSpeaking = useCallback(() => {
    if (speechSynthesis && isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [speechSynthesis, isSpeaking]);

  // Automatically speak when the step changes? Optional, could be annoying.
  // useEffect(() => {
  //   if (step && speechSynthesis) {
  //     // Maybe add a small delay?
  //     // speakInstruction();
  //   }
  //   // Cleanup function to stop speaking if component unmounts or step changes mid-speech
  //   return () => stopSpeaking();
  // }, [step, speechSynthesis, speakInstruction, stopSpeaking]);


  if (!('speechSynthesis' in window)) {
     return <p className="text-sm text-orange-600 mt-2">Audio guidance not supported by your browser.</p>;
  }

  if (!step) return null; // Don't render if no step selected

  return (
    <div className="mt-4 p-3 bg-gray-100 rounded-md shadow-inner space-y-3">
       <p className="text-sm font-medium text-gray-700">Audio Guidance:</p>
       <div className="text-sm italic text-gray-600 mb-2">
           "{stripHtml(step.html_instructions)}"
       </div>

       {/* Voice Selection Dropdown */}
       {voices.length > 0 && (
         <div>
           <label htmlFor="voiceSelect" className="text-xs text-gray-500 mr-2">Voice:</label>
           <select
             id="voiceSelect"
             value={selectedVoiceURI || ''}
             onChange={(e) => setSelectedVoiceURI(e.target.value)}
             className="text-xs p-1 border border-gray-300 rounded"
           >
              <option value="">Browser Default</option>
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
           </select>
         </div>
       )}

       <div className="flex gap-2">
          <button
            onClick={speakInstruction}
            disabled={isSpeaking || !step}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-1 px-3 rounded transition duration-150 disabled:opacity-50"
          >
            {isSpeaking ? 'Speaking...' : 'Play Step'}
          </button>
          <button
            onClick={stopSpeaking}
            disabled={!isSpeaking}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-1 px-3 rounded transition duration-150 disabled:opacity-50"
          >
            Stop
          </button>
       </div>
    </div>
  );
}

export default AudioGuidance;