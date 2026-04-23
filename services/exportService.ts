import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export async function exportToPDF(html: string, fileName: string = "Resume") {
  try {
    if (Platform.OS === "web") {
      // WEB: Use a hidden iframe trick for clean printing
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();

        // Wait for styles and fonts to load
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          // Clean up after a delay
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 500);
      }
    } else {
      // MOBILE: Use expo-print and expo-sharing
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Optional: Rename file if possible (expo-print doesn't support naming easily on all platforms)
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
        dialogTitle: `Export ${fileName}`,
      });
    }
    return true;
  } catch (error) {
    console.error("Export PDF Error:", error);
    throw error;
  }
}
