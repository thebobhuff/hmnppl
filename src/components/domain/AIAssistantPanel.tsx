/**
 * AI Assistant Panel - Right sliding panel with chat interface.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Loader2,
  Minimize2,
  Plus,
  Paperclip,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type ChatMode = "assist" | "policy_creation";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
}

interface StoredConversation {
  conversationId: string;
  messages: Array<Omit<Message, "timestamp"> & { timestamp: string }>;
  files: UploadedFile[];
}

interface PanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "hr-assistant-conversation";
const POLICY_DRAFT_KEY = "hr-assistant-policy-draft";

const POLICY_CONTEXT = [
  {
    id: "1",
    title: "Attendance & Punctuality Policy",
    category: "attendance",
    status: "active",
  },
  { id: "2", title: "Code of Conduct", category: "conduct", status: "active" },
  {
    id: "3",
    title: "Performance Management Policy",
    category: "performance",
    status: "active",
  },
  { id: "4", title: "Anti-Harassment Policy", category: "conduct", status: "active" },
  { id: "5", title: "Remote Work Policy", category: "attendance", status: "active" },
];

const SCREEN_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/policies": "Policies",
  "/policies/new": "Create Policy",
  "/conduct-interview": "Conduct Interview",
  "/incident-queue": "Incident Queue",
  "/meetings": "Meetings",
  "/documents": "Documents",
  "/team": "Team",
  "/employees": "Employees",
  "/report-issue": "Report Issue",
};

function createWelcomeMessage(): Message {
  return {
    id: "1",
    role: "assistant",
    content:
      "Hi! I'm your HR Policy Assistant. I can help you understand company policies, create a new policy, or work from uploaded files. What would you like help with?",
    timestamp: new Date(),
  };
}

function safeUUID(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now());
}

function MarkdownLikeText({ children }: { children: string }) {
  return <div className="whitespace-pre-wrap break-words">{children}</div>;
}

export function AIAssistantPanel({ isOpen, onClose }: PanelProps) {
  const pathname = usePathname();
  const [conversationId, setConversationId] = useState(() => safeUUID());
  const [messages, setMessages] = useState<Message[]>([createWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [chatMode, setChatMode] = useState<ChatMode>("assist");
  const [draftPolicy, setDraftPolicy] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const screenContext = useMemo(() => {
    const label =
      SCREEN_LABELS[pathname] ?? pathname.replace(/^\//, "").replace(/-/g, " ");
    return {
      pathname,
      label: label || "Dashboard",
      policyCount: POLICY_CONTEXT.length,
    };
  }, [pathname]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed: StoredConversation = JSON.parse(raw);
      setConversationId(parsed.conversationId || safeUUID());
      setFiles(parsed.files || []);
      setMessages(
        parsed.messages?.length
          ? parsed.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
          : [createWelcomeMessage()],
      );
    } catch {
      setMessages([createWelcomeMessage()]);
    }
  }, []);

  useEffect(() => {
    const payload: StoredConversation = {
      conversationId,
      files,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
      })),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [conversationId, files, messages]);

  useEffect(() => {
    if (draftPolicy) {
      localStorage.setItem(POLICY_DRAFT_KEY, draftPolicy);
    }
  }, [draftPolicy]);

  const newChat = () => {
    const nextConversationId = safeUUID();
    const welcome = createWelcomeMessage();
    setConversationId(nextConversationId);
    setMessages([welcome]);
    setFiles([]);
    setInput("");
    setChatMode("assist");
    setDraftPolicy("");
  };

  const readFile = async (file: File): Promise<UploadedFile> => {
    const isTextLike =
      /^(text\/|application\/(json|xml|csv))/.test(file.type) ||
      /\.(txt|md|markdown|json|csv|log|xml|html?|pdf)$/i.test(file.name);

    const content = isTextLike
      ? await file.text()
      : "[Binary file uploaded. Text extraction unavailable in browser.]";

    return {
      id: safeUUID(),
      name: file.name,
      type: file.type || "unknown",
      size: file.size,
      content,
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;

    const formData = new FormData();
    selected.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/v1/assistant/files", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const uploaded: UploadedFile[] = (data.files || []).map(
        (item: { name: string; type: string; size: number; text: string }) => ({
          id: safeUUID(),
          name: item.name,
          type: item.type || "unknown",
          size: item.size,
          content: item.text || "",
        }),
      );
      const fallback = await Promise.all(
        selected
          .filter((file) => !uploaded.find((u) => u.name === file.name))
          .map(readFile),
      );
      setFiles((prev) => [...prev, ...uploaded, ...fallback].slice(-5));
    } catch {
      const uploaded = await Promise.all(selected.map(readFile));
      setFiles((prev) => [...prev, ...uploaded].slice(-5));
    }
    event.target.value = "";
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    const userMessage: Message = {
      id: safeUUID(),
      role: "user",
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const endpoint =
        chatMode === "policy_creation"
          ? "/api/v1/agents/policy-creation"
          : "/api/v1/agents/policy-chat";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: userText,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          context: {
            screen: screenContext,
            policies: POLICY_CONTEXT,
            files: files.map((f) => ({
              id: f.id,
              name: f.name,
              type: f.type,
              size: f.size,
              content: f.content.slice(0, 20000),
            })),
          },
        }),
      });

      const data = await response.json();
      if (data.policy_draft) {
        setDraftPolicy(data.policy_draft);
      }

      if (data.ready_for_draft) {
        setChatMode("assist");
      }

      const assistantMessage: Message = {
        id: safeUUID(),
        role: "assistant",
        content:
          data.response ||
          data.message ||
          (data.policy_draft
            ? "I drafted the policy below."
            : "I've processed your request."),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: safeUUID(),
          role: "assistant",
          content: "I'm having trouble connecting to the AI service. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
              <Bot className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">HR Assistant</h3>
              <p className="text-xs text-text-tertiary">Policy Expert</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={newChat} title="New chat">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-b border-border px-4 py-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-brand-slate-light px-2 py-1 text-text-secondary">
              Screen: {screenContext.label}
            </span>
            <span className="rounded-full bg-brand-slate-light px-2 py-1 text-text-secondary">
              Policies: {POLICY_CONTEXT.length}
            </span>
            <span className="rounded-full bg-brand-slate-light px-2 py-1 text-text-secondary">
              Files: {files.length}
            </span>
          </div>
        </div>

        <div className="border-b border-border p-3">
          <p className="mb-2 text-xs text-text-tertiary">Quick Actions</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setChatMode("policy_creation");
                setInput("Help me create a new policy");
              }}
              className="text-xs"
            >
              Create Policy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput("What are the attendance policies?")}
              className="text-xs"
            >
              View Policies
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInput("How do I handle a policy violation?")}
              className="text-xs"
            >
              Handle Violation
            </Button>
          </div>
        </div>

        {draftPolicy && (
          <div className="border-b border-border p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-text-tertiary">Draft Policy</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/policies/new">Open Builder</Link>
              </Button>
            </div>
            <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-brand-slate-light p-3 text-xs">
              <MarkdownLikeText>{draftPolicy}</MarkdownLikeText>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-3",
                    message.role === "user"
                      ? "bg-brand-primary text-white"
                      : "bg-brand-slate-light text-text-primary",
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <MarkdownLikeText>{message.content}</MarkdownLikeText>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  )}
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      message.role === "user" ? "text-white/70" : "text-text-tertiary",
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg bg-brand-slate-light px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
                    <span className="text-sm text-text-tertiary">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-border px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-text-tertiary">Attachments</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            accept=".txt,.md,.markdown,.json,.csv,.log,.xml,.html,.htm,.pdf"
          />

          {files.length > 0 && (
            <div className="mb-3 space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="rounded-md border border-border px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-text-tertiary" />
                    <span className="font-medium text-text-primary">{file.name}</span>
                  </div>
                  <p className="mt-1 text-text-tertiary">
                    {file.type || "unknown"} • {Math.round(file.size / 1024)} KB
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about policies..."
              className="max-h-[120px] min-h-[60px] resize-none"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="self-end"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function AIAssistantFAB({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 h-14 w-14 rounded-full shadow-lg shadow-black/20 transition-all hover:scale-105 hover:shadow-xl"
      size="icon"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
}
