'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isIOS } from './is-ios';

type Options = {
  /** Fired continuously while recording with the final-plus-interim text so far. */
  onTranscript?: (text: string) => void;
  /** Fired once when recording ends, with the committed final text. */
  onStop?: (finalText: string) => void;
  lang?: string;
};

export type SpeechToText = {
  supported: boolean;
  recording: boolean;
  /** A short, user-facing reason for the last failure, or null. Clears on the next start. */
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
};

// Map raw Web Speech error codes to a short, user-facing reason. The mic chip
// shows this so a silent failure explains itself.
function micErrorMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'voice input is blocked. allow microphone access in your browser settings.';
    case 'audio-capture':
      return 'no microphone was found.';
    case 'network':
      return 'voice input needs an internet connection.';
    case 'no-speech':
      return "didn't catch anything. give it another go.";
    default:
      return `voice input error: ${code}`;
  }
}

/**
 * Web Speech API wrapper for Android Chrome and desktop. Feature-detected:
 * `supported` stays false on browsers without the API (Firefox) and on iOS,
 * where every browser is WebKit and the API is a stub that reports as available,
 * starts the mic, but never returns results. iOS users dictate with the
 * keyboard's own mic key instead (the components show a hint), so this hook
 * deliberately reports `supported: false` there.
 *
 * Runs in single-utterance mode (continuous = false) and auto-restarts while the
 * user is still recording, which gives reliable capture on Android and desktop.
 * Callbacks are read through refs so updating them never tears down the session.
 */
export function useSpeechToText(options: Options = {}): SpeechToText {
  const { onTranscript, onStop, lang = 'en-US' } = options;
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef('');
  // The user's intent to keep capturing. Stays true across the auto-restarts
  // that span each utterance; cleared only by stop() or a fatal error.
  const wantRef = useRef(false);
  const fatalRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const onStopRef = useRef(onStop);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onStopRef.current = onStop;
  }, [onTranscript, onStop]);

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    // iOS exposes webkitSpeechRecognition but never fires results (WebKit stub),
    // so treat it as unsupported and let the keyboard dictation mic handle iOS.
    if (!Ctor || isIOS()) return;
    setSupported(true);

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      setError(null); // a result means it is working; clear any stale notice
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalRef.current = `${finalRef.current} ${text}`.trim();
        } else {
          interim += text;
        }
      }
      const live = `${finalRef.current} ${interim}`.trim();
      onTranscriptRef.current?.(live);
    };

    recognition.onerror = (event) => {
      setError(micErrorMessage(event.error));
      // Permission / hardware failures are fatal: stop and do not restart.
      // Transient ones (no-speech, aborted, network) just let onend restart us.
      if (
        event.error === 'not-allowed' ||
        event.error === 'service-not-allowed' ||
        event.error === 'audio-capture'
      ) {
        fatalRef.current = true;
        wantRef.current = false;
      }
    };

    // onend fires after every utterance (continuous = false) and on stop. Keep
    // listening by restarting unless the user stopped or something fatal hit.
    recognition.onend = () => {
      if (wantRef.current && !fatalRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // fall through to finish if the engine refuses to restart
        }
      }
      setRecording(false);
      wantRef.current = false;
      const finalText = finalRef.current.trim();
      const fatal = fatalRef.current;
      finalRef.current = '';
      fatalRef.current = false;
      if (!fatal && finalText) onStopRef.current?.(finalText);
    };

    recognitionRef.current = recognition;
    return () => {
      wantRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        // abort throws if not started; nothing to clean up.
      }
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition || wantRef.current) return;
    setError(null);
    finalRef.current = '';
    fatalRef.current = false;
    wantRef.current = true;
    try {
      recognition.start();
    } catch {
      // start() throws if a prior session is still tearing down; the pending
      // onend restarts it. Either way we are recording from here.
    }
    setRecording(true);
  }, []);

  const stop = useCallback(() => {
    wantRef.current = false; // prevents the onend auto-restart
    const recognition = recognitionRef.current;
    if (!recognition) {
      setRecording(false);
      return;
    }
    try {
      recognition.stop();
    } catch {
      // stop() throws if not running; clear local state so the UI recovers.
      setRecording(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (wantRef.current) stop();
    else start();
  }, [start, stop]);

  return { supported, recording, error, start, stop, toggle };
}
