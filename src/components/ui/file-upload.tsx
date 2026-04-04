import * as React from "react";
import { UploadCloud, File, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  /** Called when files are selected */
  onFilesChange?: (files: File[]) => void;
  /** Accepted file types (MIME types, e.g. "image/*,.pdf") */
  accept?: string;
  /** Whether multiple files can be selected */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  /** Whether the upload is disabled */
  disabled?: boolean;
  /** Whether the upload has an error */
  error?: string;
  /** Hint text */
  hint?: string;
  /** Additional class names */
  className?: string;
  /** ID for the component */
  id?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function FileUpload({
  onFilesChange,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  disabled = false,
  error,
  hint,
  className,
  id,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const [internalError, setInternalError] = React.useState<string | null>(null);

  function validateAndAdd(newFiles: FileList | File[]): File[] {
    const fileArray = Array.from(newFiles);
    const errors: string[] = [];

    if (maxFiles && files.length + fileArray.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed.`);
    }

    const validFiles = fileArray.filter((file) => {
      if (maxSize && file.size > maxSize) {
        errors.push(`"${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}.`);
        return false;
      }
      return true;
    });

    if (errors.length > 0) {
      setInternalError(errors.join(" "));
    } else {
      setInternalError(null);
    }

    return multiple ? [...files, ...validFiles] : validFiles.slice(0, 1);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const updatedFiles = validateAndAdd(e.target.files);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    const updatedFiles = validateAndAdd(e.dataTransfer.files);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleRemove(index: number) {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
    setInternalError(null);
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors",
          dragOver
            ? "border-brand-primary bg-brand-primary/5"
            : error || internalError
              ? "border-brand-error bg-brand-error/5"
              : "border-border bg-card hover:border-border-light hover:bg-card-hover",
          disabled && "cursor-not-allowed opacity-50",
        )}
        aria-label="File upload area"
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleFileChange}
          className="hidden"
          tabIndex={-1}
        />
        <UploadCloud
          className={cn(
            "mb-2 h-8 w-8",
            dragOver ? "text-brand-primary" : "text-text-tertiary",
          )}
        />
        <p className="text-sm text-text-primary">
          <span className="font-medium text-brand-primary">Click to upload</span> or drag
          and drop
        </p>
        {(hint || maxSize) && (
          <p className="mt-1 text-xs text-text-tertiary">
            {hint || (maxSize ? `Max file size: ${formatFileSize(maxSize)}` : "")}
          </p>
        )}
      </div>

      {/* Error messages */}
      {(error || internalError) && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-brand-error">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error || internalError}</span>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-md bg-card px-3 py-2"
            >
              <File className="h-4 w-4 shrink-0 text-text-tertiary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-text-primary">{file.name}</p>
                <p className="text-xs text-text-tertiary">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                className="rounded-sm p-1 text-text-tertiary hover:bg-card-hover hover:text-text-primary"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
FileUpload.displayName = "FileUpload";

export { FileUpload };
