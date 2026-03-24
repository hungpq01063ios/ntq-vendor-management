"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ImportResult } from "@/actions/import.actions";
import type { ActionResult } from "@/types";

interface Props {
  /** Label hiện trên nút Open Dialog */
  label?: string;
  /** URL để download template */
  templateUrl: string;
  /** Tên file khi download (có .xlsx) */
  templateFileName?: string;
  /** Server action để upload file */
  importAction: (formData: FormData) => Promise<ActionResult<ImportResult>>;
  /** Callback sau khi import thành công */
  onSuccess?: () => void;
}

export default function ImportDialog({
  label = "Import Excel",
  templateUrl,
  templateFileName,
  importAction,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(templateUrl);
      if (!res.ok) { toast.error("Download failed"); return; }
      // Extract filename from Content-Disposition header, fallback to prop or default
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const fileName = match?.[1] ?? templateFileName ?? "import-template.xlsx";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  }

  async function handleImport() {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await importAction(fd);

      if (!res.success) {
        toast.error(res.error ?? "Import failed");
        return;
      }

      setResult(res.data);
      if (res.data.imported > 0) {
        toast.success(`Imported ${res.data.imported} records successfully`);
        onSuccess?.();
      } else {
        toast.warning("No records were imported");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-1.5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        {label}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={handleClose} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">{label}</h2>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>

              <div className="p-6 space-y-5">
                {/* Step 1: Download template */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">1</div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 mb-1">Download the template</p>
                    <p className="text-xs text-gray-500 mb-2">The template includes valid lookup values from the system.</p>
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {downloading ? (
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      )}
                      {downloading ? "Downloading..." : "Download Template (.xlsx)"}
                    </button>
                  </div>
                </div>

                {/* Step 2: Fill in data */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">2</div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Fill in your data</p>
                    <p className="text-xs text-gray-500">Follow Instructions sheet. Delete example rows. Keep the header row.</p>
                  </div>
                </div>

                {/* Step 3: Upload */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">3</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-2">Upload the filled file</p>
                    <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <input
                        ref={inputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {file ? (
                        <div className="text-center">
                          <p className="text-sm font-medium text-green-700">✓ {file.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB — Click to change</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm text-gray-500">Click to select .xlsx file</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Result summary */}
                {result && (
                  <div className={`rounded-lg p-4 text-sm ${result.imported > 0 ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}>
                    <div className="flex gap-6 mb-2">
                      <span className="text-gray-600">Total rows: <strong>{result.total}</strong></span>
                      <span className="text-green-700">Imported: <strong>{result.imported}</strong></span>
                      <span className="text-yellow-700">Skipped: <strong>{result.skipped}</strong></span>
                    </div>
                    {result.errors.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                        {result.errors.map((e, i) => (
                          <p key={i} className="text-xs text-red-600">
                            Row {e.row}: {e.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t">
                <Button variant="outline" onClick={handleClose} disabled={loading}>
                  {result ? "Close" : "Cancel"}
                </Button>
                {!result && (
                  <Button onClick={handleImport} disabled={!file || loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Importing...
                      </span>
                    ) : "Start Import"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
