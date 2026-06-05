import type { PdfAPI, Transport } from "./types.js";

/** `COBDCoreKit.pdf` — native PDF viewer via the host. */
export function installPdf(transport: Transport): PdfAPI {
  return {
    async open(file) {
      await transport.call("pdf", "open", { file });
    },
  };
}
