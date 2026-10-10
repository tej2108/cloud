// Loads a PDF in the browser with pdf.js and returns its positioned text.
// The file never leaves the device: pdf.js parses it in a Web Worker.

import type { TextItem } from "./report-parse";

export const MAX_PDF_BYTES = 40 * 1024 * 1024;
/** The key ratios sit in the förvaltningsberättelse near the front. */
const MAX_PAGES = 40;

export class ReportError extends Error {
  constructor(
    public code: "not-pdf" | "too-large" | "password" | "unreadable",
    message: string,
  ) {
    super(message);
  }
}

export async function readPdfText(file: File, onPage?: (page: number, total: number) => void): Promise<TextItem[]> {
  if (file.size > MAX_PDF_BYTES) throw new ReportError("too-large", "The file is larger than 40 MB.");
  const data = new Uint8Array(await file.arrayBuffer());
  // Check the magic bytes instead of trusting the file name or MIME type.
  if (String.fromCharCode(...data.slice(0, 5)) !== "%PDF-") throw new ReportError("not-pdf", "That file isn't a PDF.");

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

  const task = pdfjs.getDocument({
    data,
    // Text only: no fonts, no WebAssembly decoders, no XFA forms, no network.
    disableFontFace: true,
    useWasm: false,
    enableXfa: false,
    useWorkerFetch: false,
    disableAutoFetch: true,
    disableStream: true,
  });
  let doc;
  try {
    doc = await task.promise;
  } catch (e) {
    await task.destroy();
    if (e instanceof Error && e.name === "PasswordException") {
      throw new ReportError("password", "The PDF is password-protected.");
    }
    throw new ReportError("unreadable", "The PDF couldn't be opened. It may be damaged.");
  }

  const items: TextItem[] = [];
  const total = Math.min(doc.numPages, MAX_PAGES);
  try {
    for (let p = 1; p <= total; p++) {
      onPage?.(p, total);
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      for (const it of content.items) {
        if (!("str" in it) || !it.str.trim()) continue;
        items.push({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width, h: it.height || Math.abs(it.transform[3]), page: p });
      }
      page.cleanup();
    }
  } finally {
    // Tears down the worker and frees the parsed document.
    await task.destroy();
  }
  return items;
}
