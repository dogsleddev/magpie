'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
  start: () => void;
  stop: () => void;
  toggle: () => void;
};

/**
 * Web Speech API wrapper. Feature-detected: `supported` stays false on browsers
 * without the API (Firefox). The recognition instance is created once; callbacks
 * are read through refs so updating them never tears down the session.
 */
export function useSpeechToText(options: Options = {}): SpeechToText {
  const { onTranscript, onStop, lang = 'en-US' } = options;
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef('');
  const erroredRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const onStopRef = useRef(onStop);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onStopRef.current = onStop;
  }, [onTranscript, onStop]);

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
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

    recognition.onerror = () => {
      erroredRef.current = true;
    };

    // onend is the single exit point: it fires for an explicit stop and for an
    // automatic end (silence). Commit the captured text unless an error tripped.
    recognition.onend = () => {
      setRecording(false);
      const finalText = finalRef.current.trim();
      const errored = erroredRef.current;
      finalRef.current = '';
      erroredRef.current = false;
      if (!errored && finalText) onStopRef.current?.(finalText);
    };

    recognitionRef.current = recognition;
    return () => {
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
    if (!recognition || recording) return;
    finalRef.current = '';
    erroredRef.current = false;
    try {
      recognition.start();
      setRecording(true);
    } catch {
      // start() throws if already running; ignore.
    }
  }, [recording]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      // stop() throws if not running; the onend handler may not fire, so fall
      // back to clearing local state.
      setRecording(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (recording) stop();
    else start();
  }, [recording, start, stop]);

  return { supported, recording, start, stop, toggle };
}
