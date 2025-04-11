import React, { useState, useEffect, useCallback } from 'react';

// Safe HTML tag stripper for cleaner speech output
const stripHtml = (html) => {
  if (typeof DOMParser === 'undefined') return html;
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  } catch (error) {
    console.error('Error stripping HTML:', error);
    return html;
  }
}

function AudioGuidance({ step }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(null);

  // Check for API support and get voices on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn("Web Speech API (Synthesis) not supported by this browser.");
      return;
    }

    const synth = window.speechSynthesis;
    setSpeechSynthesis(synth);

    const loadVoices = () => {
      const voiceList = synth.getVoices();
      setVoices(voiceList);
    }

    // Voices may load asynchronously
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }

    // Cleanup function
    return () => {
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = null;
      }
    };
  }, []); // No dependencies - run only on mount

  // Set default voice once voices are loaded (separate effect)
  useEffect(() => {
    if (voices.length > 0 && !selectedVoiceURI) {
      // Auto-select a default voice (e.g., the first English voice)
      const defaultVoice = voices.find(v => v.lang.startsWith('en'));
      if (defaultVoice) {
        setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    }
  }, [voices, selectedVoiceURI]);

  const speakInstruction = useCallback(() => {
    if (!speechSynthesis || !step || isSpeaking) return;

    // Cancel any previous speech
    speechSynthesis.cancel();

    const instructionText = stripHtml(step.html_instructions);
    if (!instructionText) return;

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

  // Cleanup on unmount or when step changes
  useEffect(() => {
    return () => {
      if (speechSynthesis) {
        speechSynthesis.cancel();
      }
    };
  }, [speechSynthesis, step]);

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
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