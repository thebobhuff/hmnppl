/**
 * TrackChangesEditor.tsx — Tiptap editor spike with custom track-changes.
 *
 * STRATEGY:
 * Since Tiptap's official Tracked Changes extension is a **paid add-on**
 * (requires Tiptap Cloud subscription), this spike implements track-changes
 * using three approaches:
 *
 * 1. **Custom Suggesting Mode** — A custom ProseMirror plugin that wraps
 *    edits in marked nodes (green insertions, red strikethrough deletions).
 * 2. **Diff View Mode** — Shows a before/after diff using the AuditCapture utility.
 * 3. **Read-only Mode** — Employee view with no editing.
 *
 * This lets us evaluate whether OSS Tiptap + custom extensions is viable
 * vs. paying for Tiptap Cloud's Tracked Changes.
 */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Mark, mergeAttributes } from "@tiptap/core";
import type { ChangeRecord } from "./AuditCapture";
import { captureDiff, changesToAuditJson } from "./AuditCapture";

// ---------------------------------------------------------------------------
// Custom Tiptap Marks for tracked changes
// ---------------------------------------------------------------------------

/** Green-highlighted insertion mark */
const TrackedInsertion = Mark.create({
  name: "trackedInsertion",

  parseHTML() {
    return [{ tag: "ins[data-tracked]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "ins",
      mergeAttributes(HTMLAttributes, {
        "data-tracked": "insertion",
        style:
          "background-color: rgba(34, 197, 94, 0.2); " +
          "text-decoration: underline; " +
          "text-decoration-color: #22c55e; " +
          "border-bottom: 2px solid #22c55e;",
      }),
    ];
  },

  addAttributes() {
    return {
      author: { default: "HR Agent" },
      timestamp: { default: "" },
    };
  },
});

/** Red strikethrough deletion mark */
const TrackedDeletion = Mark.create({
  name: "trackedDeletion",

  parseHTML() {
    return [{ tag: "del[data-tracked]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "del",
      mergeAttributes(HTMLAttributes, {
        "data-tracked": "deletion",
        style:
          "background-color: rgba(201, 54, 56, 0.2); " +
          "text-decoration: line-through; " +
          "text-decoration-color: #c93638; " +
          "color: #c93638; " +
          "opacity: 0.8;",
      }),
    ];
  },

  addAttributes() {
    return {
      author: { default: "HR Agent" },
      timestamp: { default: "" },
    };
  },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EditorMode = "edit" | "suggest" | "readonly";

export interface TrackedChange {
  id: string;
  type: "insert" | "delete";
  text: string;
  author: string;
  timestamp: string;
  accepted?: boolean;
  rejected?: boolean;
}

interface TrackChangesEditorProps {
  /** Initial document content (plain text) */
  initialContent: string;
  /** Editor mode */
  mode: EditorMode;
  /** Callback when mode changes */
  onModeChange?: (mode: EditorMode) => void;
  /** Callback when changes are captured */
  onChangesCaptured?: (changes: ChangeRecord[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrackChangesEditor({
  initialContent,
  mode,
  onModeChange,
  onChangesCaptured,
}: TrackChangesEditorProps) {
  const [originalContent, setOriginalContent] = useState(initialContent);
  const [trackedChanges, setTrackedChanges] = useState<TrackedChange[]>([]);
  const [changeCounter, setChangeCounter] = useState(0);
  const [showAuditJson, setShowAuditJson] = useState(false);
  const [auditJson, setAuditJson] = useState("");

  // Convert plain text to HTML paragraphs for Tiptap
  const textToHtml = useCallback((text: string) => {
    return text
      .split("\n")
      .map((line) => `<p>${line || "<br>"}</p>`)
      .join("");
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Document content will appear here...",
      }),
      TrackedInsertion,
      TrackedDeletion,
    ],
    content: textToHtml(initialContent),
    editable: mode !== "readonly",
    editorProps: {
      attributes: {
        class: "tiptap-editor-content",
      },
    },
    onUpdate: ({ editor: ed }) => {
      // In suggest mode, we track the current state
      if (mode === "suggest") {
        // The diff is computed on-demand via the capture button
      }
    },
  });

  // Update editable state when mode changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(mode !== "readonly");
    }
  }, [editor, mode]);

  // Handle toggling suggest mode — pre-populate with demo tracked changes
  const handleToggleSuggest = useCallback(() => {
    const newMode: EditorMode = mode === "suggest" ? "edit" : "suggest";
    onModeChange?.(newMode);
  }, [mode, onModeChange]);

  // Apply a demo tracked change (insertion)
  const handleDemoInsertion = useCallback(() => {
    if (!editor) return;
    const timestamp = new Date().toISOString();

    // Insert text with tracked insertion mark
    editor
      .chain()
      .focus()
      .insertContentAt(editor.state.selection.from, [
        {
          type: "text",
          text: " [AI-suggested clause: This warning may be escalated if no improvement is observed.] ",
          marks: [
            {
              type: "trackedInsertion",
              attrs: { author: "AI Agent", timestamp },
            },
          ],
        },
      ])
      .run();

    const change: TrackedChange = {
      id: `change-${changeCounter}`,
      type: "insert",
      text: "[AI-suggested clause: This warning may be escalated if no improvement is observed.]",
      author: "AI Agent",
      timestamp,
    };

    setTrackedChanges((prev) => [...prev, change]);
    setChangeCounter((c) => c + 1);
  }, [editor, changeCounter]);

  // Apply a demo tracked change (deletion)
  const handleDemoDeletion = useCallback(() => {
    if (!editor) return;
    const timestamp = new Date().toISOString();

    // Delete selected text and wrap it in a deletion mark
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(
      Math.max(from, 1),
      Math.max(to, from + 1)
    );

    if (selectedText && from !== to) {
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContentAt(from, [
          {
            type: "text",
            text: selectedText,
            marks: [
              {
                type: "trackedDeletion",
                attrs: { author: "HR Agent", timestamp },
              },
            ],
          },
        ])
        .run();

      const change: TrackedChange = {
        id: `change-${changeCounter}`,
        type: "delete",
        text: selectedText,
        author: "HR Agent",
        timestamp,
      };

      setTrackedChanges((prev) => [...prev, change]);
      setChangeCounter((c) => c + 1);
    }
  }, [editor, changeCounter]);

  // Accept a tracked change
  const handleAcceptChange = useCallback(
    (changeId: string) => {
      setTrackedChanges((prev) =>
        prev.map((c) =>
          c.id === changeId ? { ...c, accepted: true } : c
        )
      );
    },
    []
  );

  // Reject a tracked change
  const handleRejectChange = useCallback(
    (changeId: string) => {
      setTrackedChanges((prev) =>
        prev.map((c) =>
          c.id === changeId ? { ...c, rejected: true } : c
        )
      );
    },
    []
  );

  // Capture diff as audit JSON
  const handleCaptureDiff = useCallback(() => {
    if (!editor) return;

    const currentText = editor.state.doc.textContent;
    const changes = captureDiff(originalContent, currentText, "HR Agent");
    const json = changesToAuditJson(changes);

    setAuditJson(json);
    setShowAuditJson(true);
    onChangesCaptured?.(changes);
  }, [editor, originalContent, onChangesCaptured]);

  // Reset to original
  const handleReset = useCallback(() => {
    if (!editor) return;
    editor.commands.setContent(textToHtml(originalContent));
    setTrackedChanges([]);
    setChangeCounter(0);
  }, [editor, originalContent, textToHtml]);

  if (!editor) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-text-secondary">Loading editor...</div>
      </div>
    );
  }

  const activeChanges = trackedChanges.filter(
    (c) => !c.accepted && !c.rejected
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-brand-slate p-3">
        {/* Mode buttons */}
        <div className="flex items-center gap-1 rounded-md bg-brand-dark-slate p-1">
          {(["edit", "suggest", "readonly"] as EditorMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onModeChange?.(m)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-brand-vanilla text-text-inverse"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {m === "edit"
                ? "Edit"
                : m === "suggest"
                  ? "Suggest"
                  : "Read Only"}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Demo actions */}
        {mode === "suggest" && (
          <>
            <button
              onClick={handleDemoInsertion}
              className="rounded bg-brand-success/20 px-3 py-1.5 text-sm text-brand-success transition-colors hover:bg-brand-success/30"
              title="Insert AI-suggested clause at cursor"
            >
              + Demo Insertion
            </button>
            <button
              onClick={handleDemoDeletion}
              className="rounded bg-brand-brown-red/20 px-3 py-1.5 text-sm text-brand-brown-red transition-colors hover:bg-brand-brown-red/30"
              title="Mark selected text as deletion"
            >
              − Demo Deletion
            </button>
            <div className="h-6 w-px bg-border" />
          </>
        )}

        {/* Editor actions */}
        <button
          onClick={handleCaptureDiff}
          className="rounded bg-brand-honey/20 px-3 py-1.5 text-sm text-brand-honey transition-colors hover:bg-brand-honey/30"
          title="Capture current diff as audit JSON"
        >
          Capture Diff
        </button>

        <button
          onClick={handleReset}
          className="rounded bg-brand-slate-lighter/20 px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          title="Reset to original document"
        >
          Reset
        </button>

        {/* Change counter */}
        {activeChanges.length > 0 && (
          <span className="ml-auto rounded-full bg-brand-vanilla px-2 py-0.5 text-xs font-medium text-text-inverse">
            {activeChanges.length} pending change
            {activeChanges.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Editor area */}
      <div
        className={`overflow-hidden rounded-lg border border-border bg-brand-dark-slate ${
          mode === "readonly" ? "opacity-80" : ""
        }`}
      >
        {/* Inline formatting toolbar for edit mode */}
        {mode === "edit" && (
          <div className="flex gap-1 border-b border-border bg-brand-slate p-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`rounded px-2.5 py-1 text-sm font-bold transition-colors ${
                editor.isActive("bold")
                  ? "bg-brand-vanilla text-text-inverse"
                  : "text-text-primary hover:bg-brand-slate-light"
              }`}
              title="Bold (Ctrl+B)"
            >
              B
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`rounded px-2.5 py-1 text-sm italic transition-colors ${
                editor.isActive("italic")
                  ? "bg-brand-vanilla text-text-inverse"
                  : "text-text-primary hover:bg-brand-slate-light"
              }`}
              title="Italic (Ctrl+I)"
            >
              I
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`rounded px-2.5 py-1 text-sm transition-colors ${
                editor.isActive("heading", { level: 2 })
                  ? "bg-brand-vanilla text-text-inverse"
                  : "text-text-primary hover:bg-brand-slate-light"
              }`}
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`rounded px-2.5 py-1 text-sm transition-colors ${
                editor.isActive("heading", { level: 3 })
                  ? "bg-brand-vanilla text-text-inverse"
                  : "text-text-primary hover:bg-brand-slate-light"
              }`}
              title="Heading 3"
            >
              H3
            </button>
            <div className="mx-1 h-6 w-px bg-border" />
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`rounded px-2.5 py-1 text-sm transition-colors ${
                editor.isActive("bulletList")
                  ? "bg-brand-vanilla text-text-inverse"
                  : "text-text-primary hover:bg-brand-slate-light"
              }`}
              title="Bullet List"
            >
              UL
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`rounded px-2.5 py-1 text-sm transition-colors ${
                editor.isActive("orderedList")
                  ? "bg-brand-vanilla text-text-inverse"
                  : "text-text-primary hover:bg-brand-slate-light"
              }`}
              title="Ordered List"
            >
              OL
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`rounded px-2.5 py-1 text-sm transition-colors ${
                editor.isActive("blockquote")
                  ? "bg-brand-vanilla text-text-inverse"
                  : "text-text-primary hover:bg-brand-slate-light"
              }`}
              title="Block Quote"
            >
              &ldquo;
            </button>
          </div>
        )}

        <div className="tiptap-editor-wrapper max-h-[600px] overflow-y-auto p-6">
          <EditorContent editor={editor} />
        </div>

        {mode === "readonly" && (
          <div className="border-t border-border bg-brand-slate/50 px-6 py-3 text-center text-sm text-text-tertiary">
            🔒 Read-only mode — Employee view. No edits permitted.
          </div>
        )}
      </div>

      {/* Tracked Changes Panel */}
      {trackedChanges.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-lg font-semibold text-text-primary">
            Tracked Changes ({trackedChanges.length})
          </h3>
          <div className="space-y-2">
            {trackedChanges.map((change) => (
              <div
                key={change.id}
                className={`flex items-start gap-3 rounded-md border p-3 ${
                  change.accepted
                    ? "border-brand-success/30 bg-brand-success/10 opacity-60"
                    : change.rejected
                      ? "border-brand-brown-red/30 bg-brand-brown-red/10 opacity-60"
                      : "border-border bg-brand-dark-slate"
                }`}
              >
                {/* Change type indicator */}
                <span
                  className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-xs font-bold ${
                    change.type === "insert"
                      ? "bg-brand-success/20 text-brand-success"
                      : "bg-brand-brown-red/20 text-brand-brown-red"
                  }`}
                >
                  {change.type === "insert" ? "+" : "−"}
                </span>

                {/* Change details */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      change.type === "insert"
                        ? "text-brand-success"
                        : "text-brand-brown-red line-through"
                    }`}
                    title={change.text}
                  >
                    {change.text.length > 80
                      ? change.text.slice(0, 80) + "..."
                      : change.text}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    by {change.author} ·{" "}
                    {new Date(change.timestamp).toLocaleTimeString()}
                    {change.accepted && " · ✅ Accepted"}
                    {change.rejected && " · ❌ Rejected"}
                  </p>
                </div>

                {/* Accept/Reject buttons */}
                {!change.accepted && !change.rejected && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleAcceptChange(change.id)}
                      className="rounded bg-brand-success/20 px-2 py-1 text-xs text-brand-success hover:bg-brand-success/30"
                      aria-label={`Accept change: ${change.text.slice(0, 30)}`}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectChange(change.id)}
                      className="rounded bg-brand-brown-red/20 px-2 py-1 text-xs text-brand-brown-red hover:bg-brand-brown-red/30"
                      aria-label={`Reject change: ${change.text.slice(0, 30)}`}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bulk actions */}
          {activeChanges.length > 1 && (
            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              <button
                onClick={() =>
                  trackedChanges.forEach((c) => {
                    if (!c.accepted && !c.rejected) handleAcceptChange(c.id);
                  })
                }
                className="rounded bg-brand-success/20 px-3 py-1.5 text-sm text-brand-success hover:bg-brand-success/30"
              >
                Accept All
              </button>
              <button
                onClick={() =>
                  trackedChanges.forEach((c) => {
                    if (!c.accepted && !c.rejected) handleRejectChange(c.id);
                  })
                }
                className="rounded bg-brand-brown-red/20 px-3 py-1.5 text-sm text-brand-brown-red hover:bg-brand-brown-red/30"
              >
                Reject All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Audit JSON Panel */}
      {showAuditJson && (
        <div className="rounded-lg border border-brand-honey/30 bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-text-primary">
              Audit Trail — Structured Diff
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(auditJson);
                }}
                className="rounded bg-brand-slate px-3 py-1 text-sm text-text-secondary hover:text-text-primary"
              >
                Copy JSON
              </button>
              <button
                onClick={() => setShowAuditJson(false)}
                className="rounded bg-brand-slate px-3 py-1 text-sm text-text-secondary hover:text-text-primary"
              >
                Close
              </button>
            </div>
          </div>
          <pre className="max-h-80 overflow-auto rounded-md bg-brand-dark-slate p-4 text-xs leading-relaxed text-text-secondary">
            {auditJson}
          </pre>
        </div>
      )}
    </div>
  );
}
