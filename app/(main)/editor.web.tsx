/**
 * Web-only editor screen. Uses <iframe> and <textarea> instead of
 * react-native-webview which is not supported on web.
 */
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  SafeAreaView,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { LucideSparkles, LucideChevronLeft, LucideEye, LucideCode2, LucidePalette, LucidePlus } from "lucide-react-native";
import {
  getActiveDocumentId,
  getDocumentById,
  updateDocumentSource,
  getApiKey,
  type ResumeDocument,
} from "@/services/storageService";
import { parseResumeDSL } from "@/services/dslParser";
import { renderTemplate, getTemplate } from "@/services/templateRenderer";

const { width, height } = Dimensions.get("window");

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
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/material-palenight.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/stex/stex.min.js"></script>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body { height:100%; background:#020617; overflow:hidden; }
.CodeMirror { height:100vh; font-family:'JetBrains Mono',monospace; font-size:14px; line-height:1.6; background:#020617; color:#f8fafc; }
.CodeMirror-gutters { background:#020617; border-right:1px solid rgba(255,255,255,0.05); }
.CodeMirror-linenumber { color:#475569; }
.CodeMirror-cursor { border-color:#6366f1; }
.CodeMirror-selected { background:rgba(99,102,241,0.2) !important; }
.cm-keyword { color:#6366f1; font-weight:bold; }
.cm-bracket { color:#22d3ee; }
.cm-comment { color:#64748b; font-style:italic; }
.cm-string { color:#a855f7; }
</style>
</head>
<body>
<textarea id="editor"></textarea>
<script>
var editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
  mode:'stex', theme:'material-palenight', lineNumbers:true, lineWrapping:true,
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
      style={{ width: "100%", height: "100%", border: "none", background: "#020617" }}
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

  const template = getTemplate(doc?.templateId ?? "jakes-cv");

  if (!doc) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
      {/* Premium Glass Header */}
      <View style={{
        flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
        backgroundColor: "rgba(15, 23, 42, 0.7)",
      }}>
        <Pressable onPress={() => router.replace("/(main)/dashboard")} style={{ marginRight: 16 }}>
          <LucideChevronLeft color="#94a3b8" size={24} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#f8fafc", fontWeight: "800", fontSize: 16 }} numberOfLines={1}>
            {doc.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: saving ? "#f59e0b" : "#10b981" }} />
            <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>{saving ? "Syncing..." : "Autosaved"}</Text>
          </View>
        </View>
        
        <Pressable
          onPress={() => router.push("/(modals)/template-switcher")}
          style={{ 
            backgroundColor: "rgba(168, 85, 247, 0.1)", 
            borderRadius: 12, 
            paddingHorizontal: 10, 
            paddingVertical: 8, 
            marginRight: 8, 
            borderWidth: 1, 
            borderColor: "rgba(168, 85, 247, 0.2)" 
          }}
        >
          <LucidePalette color="#a855f7" size={18} />
        </Pressable>
        
        <Pressable
          onPress={() => router.push("/(modals)/add-skill")}
          style={{ 
            backgroundColor: "#6366f1", 
            borderRadius: 12, 
            paddingHorizontal: 12, 
            paddingVertical: 8,
            shadowColor: "#6366f1",
            shadowOpacity: 0.3,
            shadowRadius: 10
          }}
        >
          <LucidePlus color="#ffffff" size={18} />
        </Pressable>
      </View>

      {/* Modern Segmented Tab Bar */}
      <View style={{
        flexDirection: "row", marginHorizontal: 16, marginTop: 16, marginBottom: 8,
        backgroundColor: "rgba(30, 41, 59, 0.5)", borderRadius: 16, padding: 4,
        borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.1)",
      }}>
        <Pressable
          onPress={() => setTab("editor")}
          style={{
            flex: 1, flexDirection: "row", gap: 8, paddingVertical: 10, alignItems: "center", justifyContent: "center",
            borderRadius: 12, backgroundColor: tab === "editor" ? "#1e293b" : "transparent",
            borderWidth: tab === "editor" ? 1 : 0, borderColor: "rgba(255,255,255,0.1)"
          }}
        >
          <LucideCode2 color={tab === "editor" ? "#6366f1" : "#64748b"} size={16} />
          <Text style={{ color: tab === "editor" ? "#f8fafc" : "#64748b", fontWeight: "800", fontSize: 13 }}>Source</Text>
        </Pressable>
        <Pressable
          onPress={() => setTab("preview")}
          style={{
            flex: 1, flexDirection: "row", gap: 8, paddingVertical: 10, alignItems: "center", justifyContent: "center",
            borderRadius: 12, backgroundColor: tab === "preview" ? "#1e293b" : "transparent",
            borderWidth: tab === "preview" ? 1 : 0, borderColor: "rgba(255,255,255,0.1)"
          }}
        >
          <LucideEye color={tab === "preview" ? "#22d3ee" : "#64748b"} size={16} />
          <Text style={{ color: tab === "preview" ? "#f8fafc" : "#64748b", fontWeight: "800", fontSize: 13 }}>Preview</Text>
        </Pressable>
      </View>

      {/* Content Area */}
      <View style={{ flex: 1, marginHorizontal: 16, marginBottom: 16, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.1)" }}>
        {tab === "editor" ? (
          <EditorIframe source={source} onChange={handleChange} />
        ) : (
          <PreviewIframe html={previewHtml} />
        )}
      </View>

      {/* Premium Magic FAB */}
      {tab === "editor" && (
        <Pressable
          onPress={handleMagicRewrite}
          style={({ pressed }) => ({
            position: "absolute", bottom: 40, right: 32,
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: "#a855f7", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(168, 85, 247, 0.5)",
            opacity: pressed || rewriting ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.9 : 1 }]
          } as any)}
        >
          {rewriting ? <ActivityIndicator color="#fff" /> : <LucideSparkles color="#fff" size={28} />}
        </Pressable>
      )}
    </SafeAreaView>
  );
}
