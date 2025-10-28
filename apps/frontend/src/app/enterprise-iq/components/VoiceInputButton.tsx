"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  onSubmit?: () => void; // New: callback to submit the query
  disabled?: boolean;
}

export function VoiceInputButton({ onTranscript, onSubmit, disabled = false }: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after each speech segment - gives user full control
    recognition.interimResults = true; // Show interim results while speaking
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      // Accumulate all results (both interim and final)
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }

      console.log('Voice transcript:', fullTranscript, 'results:', event.results.length);

      // Update accumulated transcript
      setAccumulatedTranscript(prev => {
        // If this is a new recording session, replace; otherwise append
        const newTranscript = fullTranscript;
        return newTranscript;
      });

      // Update the input field in real-time
      onTranscript(fullTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);

      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (event.error === 'no-speech') {
        console.log('No speech detected, keeping recording active');
        // Don't stop recording on no-speech, let user control
      }
    };

    recognition.onend = () => {
      console.log('Recognition ended');
      // Don't automatically restart - user has full control
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const toggleRecording = () => {
    if (!isSupported || disabled) return;

    if (isRecording) {
      // Stop recording and submit immediately
      console.log('Stopping recording and submitting transcript');
      recognitionRef.current?.stop();
      setIsRecording(false);

      // Submit the accumulated transcript
      if (accumulatedTranscript.trim() && onSubmit) {
        // Small delay to ensure transcript is updated
        setTimeout(() => {
          onSubmit();
          setAccumulatedTranscript(''); // Clear for next recording
        }, 100);
      }
    } else {
      // Start recording
      try {
        setAccumulatedTranscript(''); // Clear previous transcript
        recognitionRef.current?.start();
        setIsRecording(true);
        console.log('Started recording');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsRecording(false);
      }
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className="p-2 rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
        title="Voice input not supported in this browser"
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleRecording}
      disabled={disabled}
      className={`
        p-2 rounded-lg transition-all relative
        ${isRecording
          ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
          : disabled
          ? 'bg-muted text-muted-foreground cursor-not-allowed'
          : 'bg-accent text-white hover:bg-accent/90'
        }
      `}
      title={isRecording ? 'Click to stop and submit' : 'Start voice input'}
      aria-label={isRecording ? 'Stop recording and submit' : 'Start voice input'}
    >
      {isRecording ? (
        <>
          <Mic className="w-5 h-5" />
          {/* Recording indicator */}
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping"></span>
        </>
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
}
