import type { CapabilityHandler } from "../types.js";

export interface PdfOpenParams {
  url: string;
  title?: string;
  top?: number;
}

/**
 * The native PDF op. cobdhostkit does NOT bundle a PDF plugin — the common one
 * (`@nadlowebagentur/capacitor-pdf-viewer`) ships a stale npm peer range that
 * conflicts with Capacitor 8 — so the shell injects this, e.g.:
 *
 *   import { CapacitorPdfViewer } from "@nadlowebagentur/capacitor-pdf-viewer";
 *   createPdfCapability({ backend: { open: (p) => CapacitorPdfViewer.open(p) } })
 */
export interface PdfBackend {
  open(params: PdfOpenParams): Promise<void>;
}

export interface PdfOptions {
  backend: PdfBackend;
}

/**
 * `pdf` capability — `COBDCoreKit.pdf.open(file)` opens a native PDF viewer.
 * The `file` (a URL or path) maps to the backend's `url`.
 */
export function createPdfCapability(opts: PdfOptions): CapabilityHandler {
  const backend = opts?.backend;
  if (!backend) {
    throw new Error("createPdfCapability requires a backend (the shell supplies the PDF plugin)");
  }
  return async (method, options) => {
    if (method !== "open") throw new Error(`pdf: unknown method "${method}"`);
    const o = (options ?? {}) as { file?: unknown; url?: unknown; title?: unknown; top?: unknown };
    const url = String(o.file ?? o.url ?? "");
    if (!url) throw new Error("pdf.open: file required");
    await backend.open({
      url,
      title: typeof o.title === "string" ? o.title : undefined,
      top: typeof o.top === "number" ? o.top : undefined,
    });
  };
}
