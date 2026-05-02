"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Shield,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface AudioRecorderPanelProps {
  meetingId: string;
}

type RecordingState = "idle" | "consent" | "recording" | "processing" | "done" | "error";

const TRANSCRIPTION_STEPS = [
  { label: "Consent", icon: Shield },
  { label: "Recording", icon: Mic },
  { label: "Transcribing", icon: Loader2 },
  { label: "AI Summary", icon: BrainIcon },
];

export function AudioRecorderPanel({ meetingId }: AudioRecorderPanelProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const currentStepIndex = (() => {
    switch (state) {
      case "idle": case "consent": return 0;
      case "recording": return 1;
      case "processing": return 2;
      case "done": return 3;
      case "error": return 2;
      default: return 0;
    }
  })();

  const startConsent = () => setState("consent");

  const handleConsentConfirm = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioBlob(e.data);
        }
      };

      recorder.start(1000);
      setState("recording");

      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      setError("Microphone access denied. Please allow microphone access to record.");
      setState("error");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    if (audioBlob) {
      processRecording();
    }
  };

  const processRecording = async () => {
    setState("processing");
    try {
      const formData = new FormData();
      formData.append("meeting_id", meetingId);
      if (audioBlob) formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch("/api/v1/meetings/audio-summary", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to process recording");
      }

      const data = await res.json();
      setSummary(data.summary || "Summary not available");
      setState("done");
      toast({ title: "Summary generated", description: "AI summary is ready.", variant: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process audio");
      setState("error");
    }
  };

  const reset = () => {
    setState("idle");
    setRecordingSeconds(0);
    setAudioBlob(null);
    setSummary(null);
    setError(null);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className={`h-4 w-4 ${state === "recording" ? "text-brand-error" : "text-text-tertiary"}`} />
            <span className="text-sm font-medium text-text-primary">Audio Summary</span>
          </div>
          {state !== "idle" && <Badge variant="outline">{state}</Badge>}
        </div>

        {/* Step Indicator */}
        <div className="mt-3 flex items-center gap-1">
          {TRANSCRIPTION_STEPS.map((step, i) => {
            const Icon = step.icon;
            const done = i < currentStepIndex;
            const active = i === currentStepIndex;
            return (
              <div key={step.label} className="flex items-center">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    done
                      ? "bg-brand-success text-white"
                      : active
                        ? "bg-brand-primary text-white"
                        : "bg-brand-slate-light text-text-tertiary"
                  }`}
                >
                  {state === "processing" && i === 2 ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                </div>
                <span className={`ml-1.5 text-xs ${active ? "text-text-primary font-medium" : "text-text-tertiary"}`}>
                  {step.label}
                </span>
                {i < TRANSCRIPTION_STEPS.length - 1 && (
                  <div className={`mx-1 h-px w-4 ${i < currentStepIndex ? "bg-brand-success" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Content based on state */}
        <div className="mt-4">
          {state === "idle" && (
            <div className="space-y-3">
              <p className="text-xs text-text-tertiary">
                Record the disciplinary meeting and generate an AI summary with action items.
              </p>
              <Button onClick={startConsent} size="sm" className="w-full">
                <Mic className="mr-2 h-4 w-4" />
                Start Recording
              </Button>
            </div>
          )}

          {state === "consent" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-brand-warning/30 bg-brand-warning/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-warning" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Recording Consent Required</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      This meeting involves sensitive disciplinary matters. By proceeding, you confirm:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-text-tertiary">
                      <li className="flex items-start gap-1.5">
                        <CheckCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-brand-success" />
                        All participants have given informed consent to be recorded
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-brand-success" />
                        Recording is permitted under your company policy
                      </li>
                      <li className="flex items-start gap-1.5">
                        <CheckCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-brand-success" />
                        Audio will be transcribed and summarized by AI
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConsentConfirm} size="sm" className="flex-1">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  I Confirm
                </Button>
                <Button variant="outline" onClick={reset} size="sm">Cancel</Button>
              </div>
            </div>
          )}

          {state === "recording" && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 rounded-lg border border-brand-error/30 bg-red-50/30 py-4">
                <div className="flex h-3 w-3 items-center justify-center">
                  <span className="absolute h-3 w-3 animate-ping rounded-full bg-brand-error opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-brand-error" />
                </div>
                <span className="text-lg font-mono font-bold text-brand-error">
                  {formatTime(recordingSeconds)}
                </span>
                <span className="text-sm text-text-tertiary">Recording...</span>
              </div>
              <Button onClick={handleStopRecording} variant="outline" size="sm" className="w-full">
                <MicOff className="mr-2 h-4 w-4" />
                Stop Recording
              </Button>
            </div>
          )}

          {state === "processing" && (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
                <span className="text-sm text-text-secondary">
                  {audioBlob ? "Transcribing and generating summary..." : "Processing audio..."}
                </span>
              </div>
              <p className="text-center text-xs text-text-tertiary">
                This may take up to 30 seconds depending on recording length.
              </p>
            </div>
          )}

          {state === "done" && summary && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-brand-success/30 bg-brand-success/10 p-2">
                <CheckCircle className="h-4 w-4 text-brand-success" />
                <span className="text-xs font-medium text-brand-success">Summary generated</span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded border border-border bg-brand-slate-light/30 p-3">
                <p className="text-xs text-text-secondary whitespace-pre-wrap">{summary}</p>
              </div>
              <Button variant="outline" size="sm" onClick={reset} className="w-full">
                Record Another
              </Button>
            </div>
          )}

          {state === "error" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-brand-error/30 bg-red-50/30 p-3">
                <AlertTriangle className="h-4 w-4 text-brand-error" />
                <span className="text-xs text-text-secondary">{error || "An error occurred"}</span>
              </div>
              <Button variant="outline" size="sm" onClick={reset} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

function BrainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.54"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.54"/>
    </svg>
  );
}