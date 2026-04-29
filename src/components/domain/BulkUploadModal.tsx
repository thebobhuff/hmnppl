/**
 * BulkUploadModal — CSV upload for bulk employee import.
 *
 * PRD Epic 3: Data Dump Uploads
 */
"use client";

import { useCallback, useRef, useState } from "react";
import { Modal, ModalContent } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Upload, FileText, CheckCircle2, XCircle, Download, Loader2 } from "lucide-react";
import { hrAPI, type BulkUploadResponse } from "@/lib/api/client";

interface BulkUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkUploadModal({ open, onClose, onSuccess }: BulkUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const uploadResult = await hrAPI.uploadDataFile(selectedFile);
      setResult(uploadResult);
      if (uploadResult.processed > 0) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [selectedFile, onSuccess]);

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    onClose();
  }, [onClose]);

  const downloadTemplate = useCallback(() => {
    const csv = [
      [
        "email",
        "first_name",
        "last_name",
        "role",
        "job_title",
        "department_id",
        "manager_email",
      ].join(","),
      [
        "jane.doe@company.com",
        "Jane",
        "Doe",
        "employee",
        "Software Engineer",
        "",
        "john.smith@company.com",
      ].join(","),
      [
        "john.smith@company.com",
        "John",
        "Smith",
        "manager",
        "Engineering Manager",
        "",
        "",
      ].join(","),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <Modal open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <ModalContent className="max-w-lg">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Bulk Upload Employees
            </h2>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <XCircle className="h-5 w-5" />
            </Button>
          </div>

          <p className="mb-4 text-sm text-text-secondary">
            Upload a CSV file to bulk-import employees. The file should include email, name,
            role, and optionally manager assignments.
          </p>

          <Button variant="outline" size="sm" onClick={downloadTemplate} className="mb-4">
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>

          {!result ? (
            <>
              <div
                className="mb-4 cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-brand-primary hover:bg-card-hover"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto mb-2 h-8 w-8 text-text-tertiary" />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-brand-primary" />
                    <span className="text-sm font-medium text-text-primary">{selectedFile.name}</span>
                    <span className="text-xs text-text-tertiary">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-text-secondary">
                      Drop a CSV file here or click to browse
                    </p>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Required columns: email, first_name, last_name, role
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-brand-error/30 bg-brand-error/5 p-3">
                  <p className="text-sm text-brand-error">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    "Import"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-text-primary">{result.total}</p>
                  <p className="text-xs text-text-tertiary">Total Rows</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-brand-success">{result.processed}</p>
                  <p className="text-xs text-text-tertiary">Imported</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-2xl font-bold text-brand-error">{result.failed}</p>
                  <p className="text-xs text-text-tertiary">Failed</p>
                </Card>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-brand-error/30 bg-brand-error/5 p-3">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-brand-error">
                      {err}
                    </p>
                  ))}
                  {result.errors.length > 5 && (
                    <p className="text-xs text-text-tertiary">
                      ...and {result.errors.length - 5} more errors
                    </p>
                  )}
                </div>
              )}

              <div className="max-h-48 overflow-y-auto space-y-1">
                {result.results.slice(0, 20).map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded border border-border p-2"
                  >
                    {r.success ? (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-brand-success" />
                    ) : (
                      <XCircle className="h-4 w-4 flex-shrink-0 text-brand-error" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-text-primary">{r.email}</p>
                      <p className="truncate text-xs text-text-tertiary">{r.message}</p>
                    </div>
                    <Badge variant={r.success ? "success" : "error"} className="text-[10px]">
                      {r.success ? "OK" : "Fail"}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setSelectedFile(null);
                  }}
                >
                  Upload Another
                </Button>
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
