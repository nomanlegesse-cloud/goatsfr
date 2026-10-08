import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  Square,
  Upload,
  Loader2,
  Check,
  Send,
  Volume2,
  RotateCcw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { isContentRestricted, formatModerationWarning } from './moderation';

interface TranscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText: (text: string) => void;
  onSendTranscriptNow: (text: string) => void;
  onRestrictedContent: (warning: string) => void;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read audio blob'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read audio blob'));
    reader.readAsDataURL(blob);
  });
}

export default function TranscribeModal({
  isOpen,
  onClose,
  onInsertText,
  onSendTranscriptNow,
  onRestrictedContent,
}: TranscribeModalProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [livePreviewText, setLivePreviewText] = useState<string>('');
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      stopRecordingCleanup();
    }
    return () => {
      stopRecordingCleanup();
    };
  }, [isOpen]);

  const stopRecordingCleanup = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  if (!isOpen) return null;

  const transcribeAudioBlob = async (blob: Blob, fallbackLiveText: string = '') => {
    setIsTranscribing(true);
    setErrorMsg(null);
    try {
      const base64 = await blobToBase64(blob);
      const mimeType = blob.type || 'audio/webm';
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64, mimeType }),
      });

      const data = (await res.json()) as { transcript?: string; error?: string };

      if (!res.ok) {
        if (fallbackLiveText.trim()) {
          setTranscript((prev) =>
            prev ? `${prev} ${fallbackLiveText.trim()}` : fallbackLiveText.trim()
          );
        } else {
          setErrorMsg(data.error || 'Could not transcribe audio.');
        }
        return;
      }

      const finalText = (data.transcript || fallbackLiveText || '').trim();
      if (!finalText) {
        setErrorMsg('No speech was detected in the recording. Try speaking closer to the microphone.');
        return;
      }

      if (isContentRestricted(finalText)) {
        const w = formatModerationWarning('GOATS', finalText);
        onRestrictedContent(w);
        setErrorMsg(w);
        return;
      }

      setTranscript((prev) => (prev ? `${prev} ${finalText}` : finalText));
    } catch (err) {
      if (fallbackLiveText.trim()) {
        setTranscript((prev) =>
          prev ? `${prev} ${fallbackLiveText.trim()}` : fallbackLiveText.trim()
        );
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to transcribe audio.');
      }
    } finally {
      setIsTranscribing(false);
      setLivePreviewText('');
    }
  };

  const handleStartRecording = async () => {
    setErrorMsg(null);
    setLivePreviewText('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      // Optional browser Web Speech API live preview alongside Gemini 3.5 Transcribe
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      let capturedLive = '';
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rec.onresult = (event: any) => {
            let combined = '';
            for (let i = 0; i < event.results.length; i++) {
              combined += event.results[i][0].transcript + ' ';
            }
            capturedLive = combined.trim();
            setLivePreviewText(capturedLive);
          };
          rec.start();
          recognitionRef.current = rec;
        } catch {
          // ignore if browser speech recognition is unavailable
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        if (audioPreviewUrl) {
          URL.revokeObjectURL(audioPreviewUrl);
        }
        const previewUrl = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(previewUrl);

        if (audioBlob.size > 0) {
          await transcribeAudioBlob(audioBlob, capturedLive);
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setErrorMsg(
        'Microphone access was denied or unavailable. Please allow microphone permissions or upload an audio file below.'
      );
    }
  };

  const handleStopRecording = () => {
    stopRecordingCleanup();
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setAudioPreviewUrl(URL.createObjectURL(file));
    await transcribeAudioBlob(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUseInComposer = () => {
    const clean = transcript.trim();
    if (!clean) return;
    if (isContentRestricted(clean)) {
      const w = formatModerationWarning('GOATS', clean);
      onRestrictedContent(w);
      setErrorMsg(w);
      return;
    }
    onInsertText(clean);
    onClose();
  };

  const handleSendImmediately = () => {
    const clean = transcript.trim();
    if (!clean) return;
    if (isContentRestricted(clean)) {
      const w = formatModerationWarning('GOATS', clean);
      onRestrictedContent(w);
      setErrorMsg(w);
      return;
    }
    onSendTranscriptNow(clean);
    setTranscript('');
    onClose();
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transcribe-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-[#2C2520]/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E5DEC9] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-[#2C2520]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#F3EFE6] border border-[#DFD7C8] flex items-center justify-center text-[#8C6D46] shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="transcribe-modal-title"
                className="font-display text-lg font-bold text-[#2C2520] flex items-center gap-2"
              >
                <span>Voice & Audio Transcriber</span>
                <span className="px-2 py-0.5 rounded-md bg-[#F3EFE6] border border-[#DFD7C8] text-[11px] font-semibold text-[#8C6D46]">
                  Live Speech-to-Text
                </span>
              </h2>
              <p className="text-xs text-[#6E645B] mt-0.5">
                Record your voice or upload an audio clip to transcribe it into chat text
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close transcriber"
            className="p-1.5 rounded-lg text-[#786E65] hover:text-[#2C2520] hover:bg-[#F3EFE6]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recording & Upload Controls */}
        <div className="p-4 rounded-2xl bg-[#F7F4EF] border border-[#E5DEC9] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={isTranscribing}
                className="flex-1 py-3 px-4 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4 text-[#D99B66]" />
                <span>Start Voice Recording</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopRecording}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 animate-pulse"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop & Transcribe ({formatTimer(recordingSeconds)})</span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isRecording || isTranscribing}
              className="py-3 px-4 rounded-xl bg-white hover:bg-[#EFECE6] disabled:opacity-50 border border-[#DFD7C8] text-[#2C2520] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload className="w-4 h-4 text-[#8C6D46]" />
              <span>Upload Audio File</span>
            </button>
          </div>

          {/* Live Status / Progress */}
          {isRecording && (
            <div className="p-3 rounded-xl bg-white border border-[#DFD7C8] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  Listening to microphone...
                </span>
                <span className="font-mono-tabular font-bold text-[#2C2520]">
                  {formatTimer(recordingSeconds)}
                </span>
              </div>
              {livePreviewText && (
                <p className="text-xs text-[#6E645B] italic">
                  “{livePreviewText}”
                </p>
              )}
            </div>
          )}

          {isTranscribing && (
            <div className="p-3 rounded-xl bg-white border border-[#DFD7C8] flex items-center gap-2.5 text-xs text-[#2C2520] font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-[#8C6D46] shrink-0" />
              <span>Transcribing your audio into text...</span>
            </div>
          )}

          {audioPreviewUrl && !isRecording && (
            <div className="flex items-center gap-2.5 pt-1">
              <Volume2 className="w-4 h-4 text-[#8C6D46] shrink-0" />
              <audio
                controls
                src={audioPreviewUrl}
                className="h-8 w-full"
              />
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Editable Transcript Box */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="transcribed-text-area"
              className="text-xs font-bold text-[#2C2520] flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8C6D46]" />
              <span>Transcribed Text (Editable)</span>
            </label>
            {transcript && (
              <button
                type="button"
                onClick={() => setTranscript('')}
                className="text-[11px] font-semibold text-[#786E65] hover:text-[#2C2520] flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
          <textarea
            id="transcribed-text-area"
            rows={4}
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              setErrorMsg(null);
            }}
            placeholder="Your transcribed speech will appear here automatically..."
            className="w-full p-3.5 rounded-xl bg-[#F7F4EF] border border-[#DFD7C8] focus:border-[#8C6D46] text-sm text-[#2C2520] placeholder-[#9E9388] focus:outline-none leading-relaxed resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#EFECE6] hover:bg-[#E5DFD3] text-xs font-semibold text-[#5C5349]"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUseInComposer}
              disabled={!transcript.trim() || isTranscribing}
              className="px-4 py-2.5 rounded-xl bg-[#F7F4EF] hover:bg-[#EFECE6] disabled:opacity-40 border border-[#DFD7C8] text-[#2C2520] text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-[#8C6D46]" />
              <span>Insert into Message Bar</span>
            </button>

            <button
              type="button"
              onClick={handleSendImmediately}
              disabled={!transcript.trim() || isTranscribing}
              className="px-4 py-2.5 rounded-xl bg-[#2C2520] hover:bg-[#3F362F] disabled:opacity-40 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
