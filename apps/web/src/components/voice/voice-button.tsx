'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

type VoiceAction = {
  type: 'achat' | 'frais' | 'evenement' | 'chantier' | 'question';
  data: Record<string, unknown>;
  confirmation: string;
};

export default function VoiceButton() {
  const router = useRouter();
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [action, setAction] = useState<VoiceAction | null>(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    setError('');
    setTranscript('');
    setAction(null);
    setAnswer('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('La reconnaissance vocale n\'est pas supportée par votre navigateur.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);

      if (event.results[0].isFinal) {
        setListening(false);
        processVoice(text);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setListening(false);
      if (event.error === 'no-speech') {
        setError('Aucune voix détectée. Réessayez.');
      } else {
        setError(`Erreur: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  async function processVoice(text: string) {
    setProcessing(true);
    try {
      const res = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const result = await res.json();

      if (result.type === 'question') {
        setAnswer(result.answer || result.confirmation);
      } else if (result.type) {
        setAction(result);
      } else {
        setError(result.error || 'Commande non reconnue.');
      }
    } catch {
      setError('Erreur de traitement.');
    } finally {
      setProcessing(false);
    }
  }

  async function confirmAction() {
    if (!action) return;
    setProcessing(true);

    try {
      let url = '';
      let redirectUrl = '';

      switch (action.type) {
        case 'achat':
          url = '/api/achats';
          redirectUrl = '/achats';
          break;
        case 'frais':
          url = '/api/frais';
          redirectUrl = '/frais';
          break;
        case 'evenement':
          url = '/api/evenements';
          redirectUrl = '/calendrier';
          break;
        case 'chantier':
          url = '/api/chantiers';
          redirectUrl = '/chantiers';
          break;
      }

      if (url) {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data),
        });

        if (res.ok) {
          setAction(null);
          setTranscript('');
          router.push(redirectUrl);
        } else {
          const err = await res.json();
          setError(err.error || 'Erreur lors de la création.');
        }
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setProcessing(false);
    }
  }

  function dismiss() {
    setAction(null);
    setTranscript('');
    setAnswer('');
    setError('');
  }

  const showPanel = listening || processing || transcript || action || answer || error;

  return (
    <>
      {/* Voice panel overlay */}
      {showPanel && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            {/* Close */}
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">
                {listening ? 'Écoute en cours...' : processing ? 'Traitement...' : action ? 'Confirmer' : answer ? 'Réponse' : 'Assistant vocal'}
              </h2>
              <button onClick={dismiss} className="p-2 rounded-xl hover:bg-gray-100">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Listening indicator */}
            {listening && (
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
                  <Mic size={32} className="text-red-500" />
                </div>
                {transcript && (
                  <p className="mt-4 text-sm text-gray-600 text-center italic">&quot;{transcript}&quot;</p>
                )}
                <button onClick={stopListening}
                  className="mt-4 px-4 py-2 rounded-xl bg-gray-100 text-sm font-medium text-gray-600">
                  Arrêter
                </button>
              </div>
            )}

            {/* Processing */}
            {processing && (
              <div className="flex flex-col items-center py-4">
                <Loader2 size={32} className="text-blue-500 animate-spin" />
                <p className="mt-4 text-sm text-gray-500">Analyse de votre demande...</p>
              </div>
            )}

            {/* Transcript display */}
            {!listening && !processing && transcript && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Vous avez dit :</p>
                <p className="text-sm text-gray-700">&quot;{transcript}&quot;</p>
              </div>
            )}

            {/* Answer (for questions) */}
            {answer && (
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-800">{answer}</p>
              </div>
            )}

            {/* Action confirmation */}
            {action && !processing && (
              <div className="space-y-3">
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-green-800">{action.confirmation}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={confirmAction}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white
                               rounded-xl font-medium active:scale-95 transition-transform">
                    <Check size={18} /> Confirmer
                  </button>
                  <button onClick={dismiss}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700
                               rounded-xl font-medium active:scale-95 transition-transform">
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB Voice button — mobile only */}
      <button
        onClick={listening ? stopListening : startListening}
        className={`lg:hidden fixed bottom-20 left-4 z-50 w-14 h-14 rounded-full shadow-lg
                   flex items-center justify-center transition-all duration-200 active:scale-90
                   mb-[env(safe-area-inset-bottom)]
                   ${listening ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}
      >
        {listening ? (
          <MicOff size={24} className="text-white" />
        ) : (
          <Mic size={24} className="text-white" />
        )}
      </button>
    </>
  );
}

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
