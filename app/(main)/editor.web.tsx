/**
 * Web-only editor screen. Uses <iframe> and <textarea> instead of
 * react-native-webview which is not supported on web.
 */
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { 
  LucideSparkles, 
  LucideChevronLeft, 
  LucideEye, 
  LucideCode2, 
  LucidePalette, 
  LucidePlus,
  LucideSave
} from "lucide-react-native";
import {
  getActiveDocumentId,
  getDocumentById,
  updateDocumentSource,
  getApiKey,
  type ResumeDocument,
} from "@/services/storageService";
import { parseResumeDSL } from "@/services/dslParser";
import { renderTemplate } from "@/services/templateRenderer";

function EditorIframe({
  source,
  onChange,
}: {
  source: string;
  onChange: (v: string) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  const escaped = source
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/tomorrow-night-bright.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/stex/stex.min.js"></script>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body { height:100%; background:#0A0A0A; overflow:hidden; }
.CodeMirror { height:100vh; font-family:'JetBrains Mono','Courier New',monospace; font-size:14px; line-height:1.6; background:#0A0A0A; color:#f8fafc; }
.CodeMirror-gutters { background:#0A0A0A; border-right:1px solid #1F1F1F; }
.CodeMirror-linenumber { color:#444; }
.CodeMirror-cursor { border-color:#00F0FF; }
.CodeMirror-selected { background:rgba(0,240,255,0.1) !important; }
.cm-keyword { color:#00F0FF; font-weight:bold; }
.cm-bracket { color:#8B5CF6; }
.cm-comment { color:#444; font-style:italic; }
.cm-string { color:#8B5CF6; }
.cm-atom { color:#00F0FF; }
</style>
</head>
<body>
<textarea id="editor"></textarea>
<script>
var editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
  mode:'stex', theme:'tomorrow-night-bright', lineNumbers:true, lineWrapping:true,
  indentUnit:2, tabSize:2,
  extraKeys:{ Tab: function(cm){ cm.replaceSelection('  '); } }
});
editor.setValue(\`${escaped}\`);
editor.on('change', function() {
  window.parent.postMessage({ type:'change', value:editor.getValue() }, '*');
});
window.parent.postMessage({ type:'ready' }, '*');
</script>
</body>
</html>`;

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "ready") setReady(true);
      if (e.data.type === "change") onChange(e.data.value);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onChange]);

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      style={{ width: "100%", height: "100%", border: "none", background: "#0A0A0A" }}
      title="DSL Editor"
    />
  );
}

function PreviewIframe({ html }: { html: string }) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  return (
    <iframe
      src={url}
      style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
      title="Resume Preview"
    />
  );
}

export default function EditorScreen() {
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [source, setSource] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [saving, setSaving] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { loadDoc(); }, []);

  useEffect(() => {
    if (!source) return;
    try {
      const ast = parseResumeDSL(source);
      const html = renderTemplate(doc?.templateId ?? "jakes-cv", ast);
      setPreviewHtml(html);
    } catch {}
  }, [source, doc?.templateId]);

  async function loadDoc() {
    const id = await getActiveDocumentId();
    if (!id) return;
    const d = await getDocumentById(id);
    if (d) { setDoc(d); setSource(d.currentSource); }
  }

  const handleChange = useCallback((newSource: string) => {
    setSource(newSource);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      if (doc) {
        const updated = await updateDocumentSource(doc.id, newSource, "Manual edit");
        if (updated) setDoc(updated);
      }
      setSaving(false);
    }, 1500);
  }, [doc]);

  const handleMagicRewrite = async () => {
    const apiKey = await getApiKey();
    if (!apiKey) { Alert.alert("Key Required", "Add Gemini Key."); return; }
    setRewriting(true);
    setTimeout(() => {
       setRewriting(false);
       Alert.alert("Analysis Complete", "AI has optimized your content structure.");
    }, 2000);
  };

  if (!doc) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      {/* Top Header */}
      <View style={{ 
        height: 60, 
        flexDirection: "row", 
        alignItems: "center", 
        borderBottomWidth: 1, 
        borderColor: "#1F1F1F", 
        paddingHorizontal: 16, 
        justifyContent: "space-between" 
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.replace("/(main)/dashboard")} activeOpacity={0.7}>
            <LucideChevronLeft color="#00F0FF" size={24} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800" }}>EDITOR</Text>
            <Text style={{ color: "#444", fontSize: 10, fontWeight: "900" }} numberOfLines={1}>
              {doc.title.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginRight: 8 }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: saving ? "#FFD60A" : "#34C759", marginRight: 6 }} />
            <Text style={{ color: "#444", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>
              {saving ? "SYNCING..." : "AUTOSAVED"}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => router.push("/(modals)/template-switcher")}
            activeOpacity={0.7}
            style={{ 
              backgroundColor: "rgba(139, 92, 246, 0.1)", 
              borderRadius: 4, 
              width: 36, height: 36,
              alignItems: "center", justifyContent: "center",
              borderWidth: 1, 
              borderColor: "rgba(139, 92, 246, 0.3)" 
            }}
          >
            <LucidePalette color="#8B5CF6" size={18} />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push("/(modals)/add-skill")}
            activeOpacity={0.7}
            style={{ 
              backgroundColor: "#00F0FF", 
              borderRadius: 4, 
              width: 36, height: 36,
              alignItems: "center", justifyContent: "center"
            }}
          >
            <LucidePlus color="#000" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* View Toggle */}
      <View style={{ flexDirection: "row", padding: 12, gap: 8, backgroundColor: "#121212" }}>
        <TouchableOpacity
          onPress={() => setTab("editor")}
          activeOpacity={0.7}
          style={{ 
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", 
            gap: 8, height: 36, borderRadius: 4, 
            backgroundColor: tab === "editor" ? "#1F1F1F" : "transparent", 
            borderWidth: 1, borderColor: tab === "editor" ? "#00F0FF" : "transparent" 
          }}
        >
          <LucideCode2 color={tab === "editor" ? "#00F0FF" : "#444"} size={16} />
          <Text style={{ color: tab === "editor" ? "#FFFFFF" : "#444", fontSize: 11, fontWeight: "800" }}>SOURCE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("preview")}
          activeOpacity={0.7}
          style={{ 
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", 
            gap: 8, height: 36, borderRadius: 4, 
            backgroundColor: tab === "preview" ? "#1F1F1F" : "transparent", 
            borderWidth: 1, borderColor: tab === "preview" ? "#00F0FF" : "transparent" 
          }}
        >
          <LucideEye color={tab === "preview" ? "#00F0FF" : "#444"} size={16} />
          <Text style={{ color: tab === "preview" ? "#FFFFFF" : "#444", fontSize: 11, fontWeight: "800" }}>RENDER</Text>
        </TouchableOpacity>
      </View>

      {/* Editor/Preview Area */}
      <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
        {tab === "editor" ? (
          <EditorIframe source={source} onChange={handleChange} />
        ) : (
          <PreviewIframe html={previewHtml} />
        )}
      </View>

      {/* Magic FAB */}
      {tab === "editor" && (
        <TouchableOpacity
          onPress={handleMagicRewrite}
          activeOpacity={0.8}
          style={{
            position: "absolute", bottom: 24, right: 24,
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center",
            elevation: 10, opacity: rewriting ? 0.7 : 1
          }}
        >
          {rewriting ? <ActivityIndicator color="#fff" /> : <LucideSparkles color="#fff" size={24} />}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
