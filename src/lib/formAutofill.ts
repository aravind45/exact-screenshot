import { api } from "@/lib/api";

interface AutofillDownloadOptions {
  formType: string;
  filename?: string;
  payload?: Record<string, unknown>;
}

interface AutofillFallbackOptions extends AutofillDownloadOptions {
  blankPdfUrl?: string;
}

interface AutofillResult {
  mode: "autofill" | "blank";
}

function normalizeBase64(value: string): string {
  const trimmed = String(value || "").trim();
  const marker = "base64,";
  const markerIndex = trimmed.indexOf(marker);
  return markerIndex >= 0 ? trimmed.slice(markerIndex + marker.length) : trimmed;
}

function assertPdfBase64(pdfBase64: string, formType: string): string {
  const normalized = normalizeBase64(pdfBase64);
  if (!normalized) {
    throw new Error(`No PDF bytes returned for ${formType}`);
  }

  let probe = "";
  try {
    const sample = normalized.slice(0, 256);
    probe = atob(sample).toLowerCase();
  } catch {
    throw new Error(`Invalid PDF payload returned for ${formType}`);
  }

  if (probe.includes("<!doctype") || probe.includes("<html")) {
    throw new Error(`Server returned HTML instead of a PDF for ${formType}`);
  }

  if (!probe.startsWith("%pdf")) {
    throw new Error(`Generated document for ${formType} is not a valid PDF`);
  }

  return normalized;
}

function b64toBlob(b64Data: string, contentType = "", sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i += 1) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: contentType || "application/pdf" });
}

function triggerPdfDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function downloadAutofillPdf(options: AutofillDownloadOptions): Promise<void> {
  const { formType, filename, payload } = options;
  const data = await api.previewPetition({ formType, ...(payload || {}) });

  if (!data?.pdfBase64 || typeof data.pdfBase64 !== "string") {
    throw new Error(`PDF preview did not return document data for ${formType}`);
  }

  const normalizedPdfBase64 = assertPdfBase64(data.pdfBase64, formType);
  const blob = b64toBlob(normalizedPdfBase64, "application/pdf");

  if (!blob.size) {
    throw new Error(`Generated PDF for ${formType} was empty`);
  }

  triggerPdfDownload(blob, filename || `${formType}_PreFilled.pdf`);
}

export async function downloadAutofillWithFallback(
  options: AutofillFallbackOptions
): Promise<AutofillResult> {
  try {
    await downloadAutofillPdf(options);
    return { mode: "autofill" };
  } catch (error) {
    if (options.blankPdfUrl && options.blankPdfUrl !== "#") {
      window.open(options.blankPdfUrl, "_blank", "noopener,noreferrer");
      return { mode: "blank" };
    }
    throw error;
  }
}
