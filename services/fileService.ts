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
        
        // If standard extraction failed, try OCR fallback
        if (!text && Platform.OS === "web") {
          text = await performWebOCR(uri);
        }
      } else {
        text = rawText;
      }
    } catch (e: any) {
      throw new Error(e.message || "Could not read file. Try copying and pasting the text instead.");
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
      const hasLetters = /[a-zA-Z]{3,}/.test(s);
      const isPdfStructure = /obj|stream|endstream|Filter|FlateDecode|Length|Type|Page|Catalog|Pages|Resources/.test(s);
      const isPdfHeader = s.startsWith("%PDF");
      
      return hasLetters && !isPdfStructure && !isPdfHeader;
    })
    .join(" ");

  // Final check for PDF source code markers in the concatenated string
  const isPdfBinary = 
    filtered.includes("%%EOF") || 
    filtered.includes("/MediaBox") || 
    filtered.includes("startxref") ||
    filtered.includes("/Type") || 
    filtered.includes("/Filter") ||
    filtered.includes("/Contents");

  if (isPdfBinary || filtered.length < 50) {
    return ""; // Return empty to signal failure to pickAndReadFile
  }

  return filtered.substring(0, 8000); // cap at 8K chars
}

/**
 * Web-only OCR fallback using Tesseract.js.
 * Requires: npm install tesseract.js
 */
async function performWebOCR(rawOrUri: string): Promise<string> {
  try {
    console.log("PDF extraction failed. Attempting OCR fallback via Tesseract...");
    
    // We use a dynamic import to keep the initial bundle light
    // and prevent crashes on native if the package isn't installed.
    const Tesseract = (await import('tesseract.js')).default;
    
    // Note: On web, the URI passed from expo-document-picker 
    // is a valid blob/data URL that Tesseract can read directly.
    const result = await Tesseract.recognize(rawOrUri, 'eng', {
      logger: m => console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`),
    });

    console.log("OCR successful!");
    return result.data.text;
  } catch (error) {
    console.error("OCR Fallback Error:", error);
    // If OCR fails, return empty so the main logic shows the "Paste Text" alert.
    return "";
  }
}
