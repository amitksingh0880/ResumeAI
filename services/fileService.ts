/**
 * fileService.ts
 * Cross-platform file picking and text extraction.
 * On web: uses the browser File API (no dependency on expo-file-system).
 * On native: uses expo-document-picker + expo-file-system.
 */

import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";

export interface PickedFile {
  name: string;
  text: string;
  mimeType: string;
}

/**
 * Opens a file picker dialog and returns the text content of the picked file.
 * Supports: .txt, .md, .tex, .pdf* (best-effort), .doc*, .rtf
 * (*PDF text extraction on web is best-effort via raw text parsing)
 */
export async function pickAndReadFile(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      "text/plain",
      "text/markdown",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/x-tex",
    ],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const { uri, name, mimeType } = asset;

  let text = "";

  if (Platform.OS === "web") {
    // On web, uri is a data: or blob: URL — fetch it as text
    try {
      const response = await fetch(uri);
      const rawText = await response.text();

      // For PDFs: strip binary junk, extract readable text
      if (mimeType === "application/pdf" || name.endsWith(".pdf")) {
        text = extractReadableTextFromPDF(rawText);
      } else {
        text = rawText;
      }
    } catch {
      throw new Error("Could not read file. Try copying and pasting the text instead.");
    }
  } else {
    // Native: use expo-file-system
    try {
      const { readAsStringAsync } = await import("expo-file-system");
      text = await readAsStringAsync(uri, { encoding: "utf8" });
    } catch {
      throw new Error("Could not read file on this device.");
    }
  }

  if (!text || text.trim().length < 30) {
    throw new Error(
      "Could not extract readable text from this file.\n\nFor PDFs, please copy and paste your resume text instead."
    );
  }

  return { name: name ?? "resume", text: text.trim(), mimeType: mimeType ?? "text/plain" };
}

/**
 * Best-effort PDF text extraction: find runs of printable ASCII
 * between PDF binary noise. Works for text-based PDFs.
 */
function extractReadableTextFromPDF(raw: string): string {
  // Extract text between BT (Begin Text) and ET (End Text) markers
  const btEtMatches = raw.match(/BT[\s\S]*?ET/g) ?? [];
  const tjMatches: string[] = [];

  for (const block of btEtMatches) {
    // Match Tj and TJ operators (show text)
    const matches = block.match(/\(([^)]+)\)\s*Tj/g) ?? [];
    for (const m of matches) {
      const inner = m.match(/\(([^)]+)\)/);
      if (inner?.[1]) tjMatches.push(inner[1]);
    }
  }

  if (tjMatches.length > 20) {
    return tjMatches.join(" ").replace(/\\n/g, "\n").replace(/\\r/g, "").trim();
  }

  // Fallback: extract any printable string sequences ≥ 4 chars
  const printable = raw.match(/[ -~]{4,}/g) ?? [];
  const filtered = printable
    .filter((s) => {
      // Keep strings that look like words (have letters)
      return /[a-zA-Z]{3,}/.test(s) && !s.startsWith("%PDF") && !s.includes("endobj");
    })
    .join(" ");

  return filtered.substring(0, 8000); // cap at 8K chars
}
