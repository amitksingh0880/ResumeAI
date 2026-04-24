/**
 * Web-only editor screen. Uses <iframe> and <textarea> instead of
 * react-native-webview which is not supported on web.
 */
import { router, useFocusEffect } from "expo-router";
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
  LucideSave,
  LucideDownload,
  LucideLink
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
import { fixAllLinks } from "@/services/aiService";
import { exportToPDF } from "@/services/exportService";
import { extractLinkableItems, upsertLink, removeLink, type LinkableItem } from "@/services/linkService";

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

  // If source changes externally (like from AI Add Skill), we must update the editor!
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Small hack: send a message into the iframe to update the value
      // We don't have a listener inside the iframe for this, so we could just reload the iframe URL
      // by setting a key on the iframe or let React remount it.
    }
  }, [source]);

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  // We add 'key={source.length}' to force a remount of the iframe when external source changes substantially
  return (
    <iframe
      key={source.length}
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

// ─── Category styling helpers ─────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { color: string; icon: string }> = {
  project: { color: "#00F0FF", icon: "📁" },
  skill: { color: "#34C759", icon: "⚡" },
  company: { color: "#FFD60A", icon: "🏢" },
  certification: { color: "#FF6B6B", icon: "📜" },
  education: { color: "#8B5CF6", icon: "🎓" },
  contact: { color: "#007AFF", icon: "📧" },
  other: { color: "#888", icon: "🔗" },
};

// ─── Link Manager Panel ───────────────────────────────────────────────────────

function LinkManagerPanel({
  source,
  onSourceChange,
}: {
  source: string;
  onSourceChange: (newSource: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const items = extractLinkableItems(source);

  // Group by category
  const grouped: Record<string, LinkableItem[]> = {};
  for (const item of items) {
    const key = item.category;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  const categories = Object.keys(grouped);
  const filteredCategories = filter === "all" ? categories : categories.filter(c => c === filter);

  const linkedCount = items.filter(i => i.currentUrl).length;
  const totalCount = items.length;

  function handleSaveLink(item: LinkableItem) {
    if (!editUrl.trim()) return;
    const url = editUrl.startsWith("http") ? editUrl : `https://${editUrl}`;
    const newSource = upsertLink(source, item.label, url);
    onSourceChange(newSource);
    setEditingId(null);
    setEditUrl("");
  }

  function handleRemoveLink(item: LinkableItem) {
    const newSource = removeLink(source, item.label);
    onSourceChange(newSource);
  }

  function handleStartEdit(item: LinkableItem) {
    setEditingId(item.id);
    setEditUrl(item.currentUrl || "https://");
  }

  return (
    <div style={{
      height: "100%",
      overflowY: "auto",
      background: "#0A0A0A",
      padding: "20px",
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#fff",
    }}>
      {/* Header Stats */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
        padding: "16px",
        background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(0,240,255,0.08))",
        borderRadius: "8px",
        border: "1px solid rgba(139,92,246,0.2)",
      }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "0.5px" }}>🔗 LINK MANAGER</div>
          <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
            Add links to projects, skills, companies & more
          </div>
        </div>
        <div style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}>
          <div style={{
            background: "rgba(52,199,89,0.15)",
            border: "1px solid rgba(52,199,89,0.3)",
            borderRadius: "20px",
            padding: "6px 14px",
            fontSize: "11px",
            fontWeight: "800",
            color: "#34C759",
          }}>
            {linkedCount} / {totalCount} LINKED
          </div>
        </div>
      </div>

      {/* Filter Pills */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button
          onClick={() => setFilter("all")}
          style={{
            background: filter === "all" ? "rgba(0,240,255,0.2)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${filter === "all" ? "#00F0FF" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "20px",
            padding: "5px 14px",
            fontSize: "10px",
            fontWeight: "800",
            color: filter === "all" ? "#00F0FF" : "#888",
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
        >
          ALL ({totalCount})
        </button>
        {categories.map(cat => {
          const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                background: filter === cat ? `${cfg.color}22` : "rgba(255,255,255,0.05)",
                border: `1px solid ${filter === cat ? cfg.color : "rgba(255,255,255,0.1)"}`,
                borderRadius: "20px",
                padding: "5px 14px",
                fontSize: "10px",
                fontWeight: "800",
                color: filter === cat ? cfg.color : "#888",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              {cfg.icon} {cat.toUpperCase()} ({grouped[cat].length})
            </button>
          );
        })}
      </div>

      {/* Items by category */}
      {filteredCategories.map(cat => {
        const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
        const catItems = grouped[cat];
        return (
          <div key={cat} style={{ marginBottom: "20px" }}>
            <div style={{
              fontSize: "10px",
              fontWeight: "900",
              letterSpacing: "1.5px",
              color: cfg.color,
              marginBottom: "8px",
              paddingBottom: "6px",
              borderBottom: `1px solid ${cfg.color}33`,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <span>{cfg.icon}</span> {cat.toUpperCase()}
            </div>

            {catItems.map(item => {
              const isEditing = editingId === item.id;
              const hasLink = !!item.currentUrl;

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    background: isEditing
                      ? "rgba(139,92,246,0.1)"
                      : hasLink
                      ? "rgba(52,199,89,0.05)"
                      : "rgba(255,255,255,0.02)",
                    borderRadius: "6px",
                    marginBottom: "4px",
                    border: `1px solid ${
                      isEditing ? "rgba(139,92,246,0.3)" : hasLink ? "rgba(52,199,89,0.15)" : "rgba(255,255,255,0.05)"
                    }`,
                    transition: "all 0.15s",
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "3px",
                    background: hasLink ? "#34C759" : "#333",
                    flexShrink: 0,
                  }} />

                  {/* Label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#fff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {item.label}
                    </div>
                    {hasLink && !isEditing && (
                      <div style={{
                        fontSize: "10px",
                        color: "#007AFF",
                        marginTop: "2px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {item.currentUrl}
                      </div>
                    )}
                    <div style={{ fontSize: "9px", color: "#555", marginTop: "1px" }}>
                      {item.section}
                    </div>
                  </div>

                  {/* Edit area */}
                  {isEditing ? (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e: any) => setEditUrl(e.target.value)}
                        onKeyDown={(e: any) => { if (e.key === "Enter") handleSaveLink(item); }}
                        placeholder="https://..."
                        autoFocus
                        style={{
                          background: "#1A1A1A",
                          border: "1px solid rgba(139,92,246,0.4)",
                          borderRadius: "4px",
                          padding: "6px 10px",
                          color: "#fff",
                          fontSize: "11px",
                          width: "220px",
                          outline: "none",
                          fontFamily: "monospace",
                        }}
                      />
                      <button
                        onClick={() => handleSaveLink(item)}
                        style={{
                          background: "#8B5CF6",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "6px 12px",
                          fontSize: "10px",
                          fontWeight: "800",
                          cursor: "pointer",
                          letterSpacing: "0.5px",
                        }}
                      >
                        SAVE
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditUrl(""); }}
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          color: "#888",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "4px",
                          padding: "6px 10px",
                          fontSize: "10px",
                          fontWeight: "800",
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button
                        onClick={() => handleStartEdit(item)}
                        style={{
                          background: hasLink ? "rgba(0,122,255,0.1)" : "rgba(139,92,246,0.15)",
                          color: hasLink ? "#007AFF" : "#8B5CF6",
                          border: `1px solid ${hasLink ? "rgba(0,122,255,0.2)" : "rgba(139,92,246,0.3)"}`,
                          borderRadius: "4px",
                          padding: "5px 10px",
                          fontSize: "9px",
                          fontWeight: "900",
                          cursor: "pointer",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {hasLink ? "EDIT" : "+ LINK"}
                      </button>
                      {hasLink && (
                        <>
                          <button
                            onClick={() => window.open(item.currentUrl, "_blank")}
                            style={{
                              background: "rgba(52,199,89,0.1)",
                              color: "#34C759",
                              border: "1px solid rgba(52,199,89,0.2)",
                              borderRadius: "4px",
                              padding: "5px 8px",
                              fontSize: "9px",
                              fontWeight: "900",
                              cursor: "pointer",
                            }}
                          >
                            ↗
                          </button>
                          <button
                            onClick={() => handleRemoveLink(item)}
                            style={{
                              background: "rgba(255,59,48,0.1)",
                              color: "#FF3B30",
                              border: "1px solid rgba(255,59,48,0.2)",
                              borderRadius: "4px",
                              padding: "5px 8px",
                              fontSize: "9px",
                              fontWeight: "900",
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {totalCount === 0 && (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          color: "#555",
        }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔗</div>
          <div style={{ fontSize: "13px", fontWeight: "700" }}>No linkable items found</div>
          <div style={{ fontSize: "11px", marginTop: "6px" }}>
            Add projects, skills, or experience to your resume to start linking
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorScreen() {
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [source, setSource] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [tab, setTab] = useState<"editor" | "preview" | "links">("editor");
  const [saving, setSaving] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadDoc();
    }, [])
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "MAKE_LINK") {
        const { text, url } = event.data;
        // Check if already linked to avoid double-wrapping
        if (source.includes(`{${text}}`) && source.includes(`\\link`)) {
           // Basic check, could be improved but prevents most double-links
           return;
        }
        const newSource = source.replace(text, `\\link{${url}}{${text}}`);
        setSource(newSource);
        if (doc) {
          updateDocumentSource(doc.id, newSource, `Linked: ${text}`);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [source, doc]);

  useEffect(() => {
    if (!source) return;
    try {
      const ast = parseResumeDSL(source);
      const html = renderTemplate(doc?.templateId ?? "jakes-cv", ast, doc?.customCSS);
      setPreviewHtml(html);
    } catch {}
  }, [source, doc?.templateId, doc?.customCSS]);

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
    if (!apiKey) { Alert.alert("Key Required", "Add Groq Key."); return; }
    setRewriting(true);
    try {
      const fixedSource = await fixAllLinks(apiKey, source);
      setSource(fixedSource);
      if (doc) {
        await updateDocumentSource(doc.id, fixedSource, "AI Link Repair");
      }
      Alert.alert("Links Repaired", "All URLs have been converted to interactive links.");
    } catch (e) {
      Alert.alert("Error", "Failed to repair links.");
    } finally {
      setRewriting(false);
    }
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
              backgroundColor: "rgba(0, 240, 255, 0.1)", 
              borderRadius: 4, 
              width: 36, height: 36,
              alignItems: "center", justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(0, 240, 255, 0.3)",
              marginRight: 4
            }}
          >
            <LucidePlus color="#00F0FF" size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              try {
                await exportToPDF(previewHtml, doc.title);
              } catch (e) {
                Alert.alert("Export Failed", "Could not generate PDF.");
              }
            }}
            activeOpacity={0.7}
            style={{ 
              backgroundColor: "#00F0FF", 
              borderRadius: 4, 
              paddingHorizontal: 10,
              height: 36,
              flexDirection: "row",
              alignItems: "center", justifyContent: "center",
              gap: 6
            }}
          >
            <LucideDownload color="#000" size={16} />
            <Text style={{ color: "#000", fontWeight: "900", fontSize: 10, letterSpacing: 0.5 }}>EXPORT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View Toggle — 3 tabs */}
      <View style={{ flexDirection: "row", padding: 12, gap: 8, backgroundColor: "#121212" }}>
        <TouchableOpacity
          onPress={() => setTab("editor")}
          activeOpacity={0.7}
          style={{ 
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", 
            gap: 6, height: 36, borderRadius: 4, 
            backgroundColor: tab === "editor" ? "#1F1F1F" : "transparent", 
            borderWidth: 1, borderColor: tab === "editor" ? "#00F0FF" : "transparent" 
          }}
        >
          <LucideCode2 color={tab === "editor" ? "#00F0FF" : "#444"} size={14} />
          <Text style={{ color: tab === "editor" ? "#FFFFFF" : "#444", fontSize: 10, fontWeight: "800" }}>SOURCE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("preview")}
          activeOpacity={0.7}
          style={{ 
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", 
            gap: 6, height: 36, borderRadius: 4, 
            backgroundColor: tab === "preview" ? "#1F1F1F" : "transparent", 
            borderWidth: 1, borderColor: tab === "preview" ? "#00F0FF" : "transparent" 
          }}
        >
          <LucideEye color={tab === "preview" ? "#00F0FF" : "#444"} size={14} />
          <Text style={{ color: tab === "preview" ? "#FFFFFF" : "#444", fontSize: 10, fontWeight: "800" }}>RENDER</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("links")}
          activeOpacity={0.7}
          style={{ 
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", 
            gap: 6, height: 36, borderRadius: 4, 
            backgroundColor: tab === "links" ? "#1F1F1F" : "transparent", 
            borderWidth: 1, borderColor: tab === "links" ? "#8B5CF6" : "transparent" 
          }}
        >
          <LucideLink color={tab === "links" ? "#8B5CF6" : "#444"} size={14} />
          <Text style={{ color: tab === "links" ? "#FFFFFF" : "#444", fontSize: 10, fontWeight: "800" }}>LINKS</Text>
        </TouchableOpacity>
      </View>

      {/* Editor/Preview/Links Area */}
      <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
        {tab === "editor" ? (
          <EditorIframe source={source} onChange={handleChange} />
        ) : tab === "preview" ? (
          <PreviewIframe html={previewHtml} />
        ) : (
          <LinkManagerPanel
            source={source}
            onSourceChange={(newSource: string) => {
              setSource(newSource);
              if (doc) {
                updateDocumentSource(doc.id, newSource, "Link update");
              }
            }}
          />
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
