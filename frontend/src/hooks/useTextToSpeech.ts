/**
 * Custom hook for Text-to-Speech using Web Speech API
 *
 * Note: Web Speech API is supported in most modern browsers.
 * For production, consider using a paid service for more natural voices.
 */
import { useState, useCallback, useEffect, useRef } from "react";

interface UseTextToSpeechOptions {
  lang?: string;
  rate?: number; // Speech rate: 0.1 to 10, default 1
  pitch?: number; // Pitch: 0 to 2, default 1
  volume?: number; // Volume: 0 to 1, default 1
  voiceName?: string; // Specific voice name
}

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  currentRate: number;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  setVoice: (voiceName: string) => void;
  setRate: (rate: number) => void;
}

export function useTextToSpeech(
  options: UseTextToSpeechOptions = {},
): UseTextToSpeechReturn {
  const {
    lang = "en-US",
    rate = 1,
    pitch = 1,
    volume = 1,
    voiceName,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [currentRate, setCurrentRate] = useState(rate);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check support and load voices
  useEffect(() => {
    const synth = window.speechSynthesis;
    setIsSupported(!!synth);

    if (!synth) return;

    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);

      // Try to find a matching voice
      if (voiceName) {
        const voice = availableVoices.find((v) => v.name === voiceName);
        if (voice) {
          setSelectedVoice(voice);
          return;
        }
      }

      // For Vietnamese, prioritize high-quality voices
      if (lang.startsWith("vi")) {
        // Priority order for Vietnamese voices
        const vietnameseVoicePriority = [
          "Google Tiếng Việt",
          "Microsoft An Online",
          "Microsoft HoaiMy Online",
          "Linh",
          "vi-VN",
        ];

        // Find voices matching Vietnamese
        const viVoices = availableVoices.filter(
          (v) => v.lang.startsWith("vi") || v.lang === "vi-VN",
        );

        // Try to find the best voice by priority
        for (const preferred of vietnameseVoicePriority) {
          const voice = viVoices.find(
            (v) => v.name.includes(preferred) || v.lang.includes(preferred),
          );
          if (voice) {
            setSelectedVoice(voice);
            console.log("Selected Vietnamese voice:", voice.name);
            return;
          }
        }

        // Fallback to any Vietnamese voice
        if (viVoices.length > 0) {
          setSelectedVoice(viVoices[0]);
          console.log("Fallback Vietnamese voice:", viVoices[0].name);
          return;
        }
      }

      // Default behavior for other languages
      const voice = availableVoices.find((v) =>
        v.lang.startsWith(lang.split("-")[0]),
      );
      if (voice) setSelectedVoice(voice);
    };

    // Voices might not be immediately available
    loadVoices();
    synth.onvoiceschanged = loadVoices;

    return () => {
      synth.onvoiceschanged = null;
    };
  }, [lang, voiceName]);

  const speak = useCallback(
    (text: string) => {
      if (!window.speechSynthesis || !text.trim()) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = currentRate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [lang, currentRate, pitch, volume, selectedVoice],
  );

  const pause = useCallback(() => {
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.pause();
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
    }
  }, [isPaused]);

  const cancel = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const setVoice = useCallback(
    (name: string) => {
      const voice = voices.find((v) => v.name === name);
      if (voice) {
        setSelectedVoice(voice);
      }
    },
    [voices],
  );

  const setRate = useCallback((newRate: number) => {
    setCurrentRate(Math.max(0.1, Math.min(10, newRate)));
  }, []);

  return {
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    selectedVoice,
    currentRate,
    speak,
    pause,
    resume,
    cancel,
    setVoice,
    setRate,
  };
}
