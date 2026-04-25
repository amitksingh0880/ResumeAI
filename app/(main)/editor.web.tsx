/**
 * Web-only editor screen. Uses <iframe> and <textarea> instead of
 * react-native-webview which is not supported on web.
 */
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Text,
  View,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { 
  LucideSparkles,
  LucideChevronLeft,
  LucideEye,
  LucidePalette,
  LucidePlus,
  LucideSave,
  LucideDownload,
  LucideLink,
  LucideZap, 
  LucideCode, 
  LucideLayers, 
  LucideMessageSquare, 
  LucideChevronUp, 
  LucideChevronDown
} from "lucide-react-native";
import {
  getActiveDocumentId,
  getDocumentById,
  updateDocumentSource,
  getApiKey,
  getSettings,
  type ResumeDocument,
  type AppSettings
} from "@/services/storageService";
import { parseResumeDSL } from "@/services/dslParser";
import { renderTemplate } from "@/services/templateRenderer";
import { fixAllLinks, neuralChat } from "@/services/aiService";
import { exportToPDF } from "@/services/exportService";
import { 
  extractLinkableItems, 
  upsertLink, 
  removeLink, 
  upsertQRCode,
  moveSection,
  type LinkableItem 
} from "@/services/linkService";
import { Theme, type AppTheme } from "@/constants/Theme";

function SourcePanel({ source, onSourceChange, theme }: { source: string; onSourceChange: (s: string) => void; theme: AppTheme }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <textarea
        value={source}
        onChange={(e) => onSourceChange(e.target.value)}
        placeholder="// Start writing your resume in DSL format..."
        spellCheck={false}
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          padding: "16px",
          backgroundColor: "transparent",
          color: theme.textPrimary,
          border: "none",
          outline: "none",
          resize: "none",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: (settings?.editorFontSize ?? 13) + "px",
          lineHeight: "1.6",
        }}
      />
    </View>
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
  project: { color: "#9A8174", icon: "📁" },
  skill: { color: "#34C759", icon: "⚡" },
  company: { color: "#9A8174", icon: "🏢" },
  certification: { color: "#9A8174", icon: "📜" },
  education: { color: "#9A8174", icon: "🎓" },
  contact: { color: "#9A8174", icon: "📧" },
  other: { color: "#888", icon: "🔗" },
};

// ─── Link Manager Panel ───────────────────────────────────────────────────────

function LinkManagerPanel({
  source,
  onSourceChange,
  theme
}: {
  source: string;
  onSourceChange: (newSource: string) => void;
  theme: AppTheme;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const items = extractLinkableItems(source);
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

  function handleSaveLink(item: any) {
    if (!editUrl.trim()) return;
    const url = editUrl.startsWith("http") ? editUrl : `https://${editUrl}`;
    if (item.label === "Portfolio / Website QR") {
      onSourceChange(upsertQRCode(source, url));
    } else {
      onSourceChange(upsertLink(source, item.label, url));
    }
    setEditingId(null);
    setEditUrl("");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 20 }}>
      {/* Header Stats */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, padding: 16, borderRadius: 8,
        backgroundColor: theme.accent + "15", borderWidth: 1, borderColor: theme.border,
      }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: "800", color: theme.textPrimary, letterSpacing: 0.5 }}>🔗 LINK MANAGER</Text>
          <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>Manage interactive links & QR codes</Text>
        </View>
        <View style={{
          backgroundColor: theme.success + "15", borderColor: theme.success + "33",
          borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
        }}>
          <Text style={{ fontSize: 11, fontWeight: "800", color: theme.success }}>{linkedCount} / {totalCount} LINKED</Text>
        </View>
      </View>

      {/* Filter Pills */}
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <TouchableOpacity
          onPress={() => setFilter("all")}
          style={{
            backgroundColor: filter === "all" ? theme.accent + "15" : theme.surface,
            borderColor: filter === "all" ? theme.accent : theme.border,
            borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: "800", color: filter === "all" ? theme.accent : theme.textSecondary }}>ALL</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setFilter(cat)}
            style={{
              backgroundColor: filter === cat ? theme.accent + "15" : theme.surface,
              borderColor: filter === cat ? theme.accent : theme.border,
              borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "800", color: filter === cat ? theme.accent : theme.textSecondary }}>{cat.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Global QR Code Action if missing */}
      {!items.some(i => i.label === "Portfolio / Website QR") && filter === "all" && (
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => { setEditingId("new-qr"); setEditUrl(""); }}
            style={{
              width: "100%", backgroundColor: theme.accent + "05", borderColor: theme.accent + "33",
              borderWidth: 1, borderStyle: "dashed", borderRadius: 6, padding: 12, alignItems: "center",
            }}
          >
            <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900" }}>✨ ADD PORTFOLIO QR CODE</Text>
          </TouchableOpacity>
          {editingId === "new-qr" && (
            <View style={{ marginTop: 12, flexDirection: "row", gap: 8 }}>
              <TextInput
                value={editUrl}
                onChangeText={setEditUrl}
                placeholder="https://your-portfolio.com"
                placeholderTextColor={theme.textMuted}
                autoFocus
                style={{
                  backgroundColor: theme.surface, borderColor: theme.accent, borderWidth: 1,
                  borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8, color: theme.textPrimary, fontSize: 12, flex: 1,
                }}
              />
              <TouchableOpacity
                onPress={() => handleSaveLink({ label: "Portfolio / Website QR" })}
                style={{ backgroundColor: theme.accent, borderRadius: 4, paddingHorizontal: 16, justifyContent: "center" }}
              >
                <Text style={{ color: "#000", fontSize: 10, fontWeight: "800" }}>CREATE</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingId(null)} style={{ backgroundColor: theme.surface, borderRadius: 4, paddingHorizontal: 12, justifyContent: "center" }}>
                <Text style={{ color: theme.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Items by category */}
      {filteredCategories.map(cat => {
        const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other;
        return (
          <View key={cat} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 10, fontWeight: "900", letterSpacing: 1.5, color: theme.textPrimary, marginBottom: 8, borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 6 }}>
              {cat.toUpperCase()}
            </Text>
            <View style={{ gap: 8 }}>
              {grouped[cat].map(item => {
                const hasLink = !!item.currentUrl;
                const isEditing = editingId === item.id;
                return (
                  <View key={item.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.card, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: theme.textPrimary }}>{item.label}</Text>
                      {hasLink && !isEditing && (
                        <Text style={{ fontSize: 10, color: theme.accent, marginTop: 2, flexWrap: "wrap" }}>{item.currentUrl}</Text>
                      )}
                    </View>
                    {isEditing ? (
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <TextInput
                          value={editUrl}
                          onChangeText={setEditUrl}
                          style={{ backgroundColor: theme.surface, borderColor: theme.accent, borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5, color: theme.textPrimary, fontSize: 11, width: 180 }}
                        />
                        <TouchableOpacity onPress={() => handleSaveLink(item)} style={{ backgroundColor: theme.accent, borderRadius: 4, paddingHorizontal: 10, justifyContent: "center" }}>
                          <Text style={{ color: "#000", fontSize: 9, fontWeight: "800" }}>SAVE</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ flexDirection: "row", gap: 4 }}>
                        <TouchableOpacity
                          onPress={() => { setEditingId(item.id); setEditUrl(item.currentUrl || "https://"); }}
                          style={{ backgroundColor: theme.accent + "15", borderColor: theme.border, borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5 }}
                        >
                          <Text style={{ color: theme.accent, fontSize: 9, fontWeight: "900" }}>{hasLink ? "EDIT" : "+ LINK"}</Text>
                        </TouchableOpacity>
                        {hasLink && (
                          <TouchableOpacity
                            onPress={() => onSourceChange(removeLink(source, item.label))}
                            style={{ backgroundColor: theme.danger + "15", borderColor: theme.danger + "33", borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 5 }}
                          >
                            <Text style={{ color: theme.danger, fontSize: 9, fontWeight: "900" }}>✕</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

export default function EditorScreen() {
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [source, setSource] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [tab, setTab] = useState<"editor" | "preview" | "links" | "structure" | "chat">("editor");
  const [saving, setSaving] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [copiedHtml, setCopiedHtml] = useState(false);

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(previewHtml);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch (err) {
      console.error("Failed to copy HTML:", err);
    }
  };

  const [theme, setTheme] = useState<AppTheme>(Theme.dark);

  useFocusEffect(
    useCallback(() => {
      loadDoc();
      getSettings().then(s => setTheme(Theme[s.appearance]));
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

  // ─── Keyboard Shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "s") {
        e.preventDefault();
        if (doc && source.trim()) {
          setSaving(true);
          await updateDocumentSource(doc.id, source, "Keyboard save");
          setSaving(false);
        }
      }
      if (ctrl && e.key === "e") {
        e.preventDefault();
        if (source.trim()) {
          try {
            const ast = parseResumeDSL(source);
            const html = renderTemplate(doc?.templateId ?? "jakes-cv", ast, doc?.customCSS);
            await exportToPDF(html, doc?.title || "Resume");
          } catch {}
        }
      }
      if (ctrl && e.key === "1") { e.preventDefault(); setTab("editor"); }
      if (ctrl && e.key === "2") { e.preventDefault(); setTab("preview"); }
      if (ctrl && e.key === "3") { e.preventDefault(); setTab("links"); }
      if (ctrl && e.key === "4") { e.preventDefault(); setTab("structure"); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [source, doc]);

  // ─── Real-time Stats ─────────────────────────────────────────────────────
  const stats = (() => {
    if (!source) return { words: 0, bullets: 0, sections: 0, pages: 0, chars: 0 };
    const words = source.replace(/\\[a-z]+\s*{/gi, " ").replace(/[{}\\]/g, " ").split(/\s+/).filter(w => w.length > 1).length;
    const bullets = (source.match(/\\(bullet|item)/g) || []).length;
    const sections = (source.match(/\\section/g) || []).length;
    const chars = source.length;
    const pages = Math.max(1, Math.round((words / 500) * 10) / 10);
    return { words, bullets, sections, pages, chars };
  })();

  if (!doc) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Top Header */}
      <View style={{ 
        height: 64, flexDirection: "row", alignItems: "center", 
        borderBottomWidth: 1, borderColor: theme.border, 
        paddingHorizontal: 16, justifyContent: "space-between",
        backgroundColor: theme.background
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <TouchableOpacity 
            onPress={() => router.replace("/(main)/dashboard")} 
            activeOpacity={0.7}
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}
          >
            <LucideChevronLeft color={theme.accent} size={20} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "900", letterSpacing: -0.2 }}>STUDIO EDITOR</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.accent }} />
              <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: "700" }} numberOfLines={1}>
                {doc.title.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Buttons - Modern Segmented Control */}
        <View style={{ 
          flexDirection: "row", padding: 4, backgroundColor: theme.card, 
          borderRadius: 12, borderWidth: 1, borderColor: theme.border, gap: 2,
          minWidth: 400
        }}>
          {[
            { id: "editor", label: "SOURCE", icon: <LucideCode size={13} /> },
            { id: "preview", label: "RENDER", icon: <LucideEye size={13} /> },
            { id: "links", label: "LINKS", icon: <LucideLink size={13} /> },
            { id: "structure", label: "STRUCT", icon: <LucideLayers size={13} /> },
            { id: "chat", label: "CHAT", icon: <LucideMessageSquare size={13} /> },
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id as any)}
              activeOpacity={0.7}
              style={{ 
                flex: 1, height: 32, borderRadius: 8,
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
                backgroundColor: tab === t.id ? theme.surface : "transparent",
              }}
            >
              {React.cloneElement(t.icon as any, { color: tab === t.id ? theme.accent : theme.textMuted })}
              <Text style={{ 
                color: tab === t.id ? theme.textPrimary : theme.textMuted, 
                fontSize: 8, fontWeight: "900", letterSpacing: 0.5 
              }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginRight: 8 }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: saving ? "#FFD60A" : theme.success, marginRight: 6 }} />
            <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>
              {saving ? "SYNCING..." : "AUTOSAVED"}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 20, paddingVertical: 6, backgroundColor: theme.surface,
        borderBottomWidth: 1, borderColor: theme.border,
      }}>
        <Text style={{ color: theme.textSecondary, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}>
          {stats.words} WORDS
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}>
          {stats.bullets} BULLETS
        </Text>
        <Text style={{ color: theme.textSecondary, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}>
          {stats.sections} SECTIONS
        </Text>
        <Text style={{ color: stats.pages > 1.5 ? theme.danger : theme.success, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}>
          ~{stats.pages} PAGE{stats.pages !== 1 ? "S" : ""}
        </Text>
      </View>

      {/* Editor/Preview/Links/Structure Area */}
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        {tab === "editor" ? (
          <SourcePanel source={source} onSourceChange={handleChange} theme={theme} />
        ) : tab === "preview" ? (
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 20, paddingVertical: 8, borderBottomWidth: 1, borderColor: theme.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: theme.textSecondary }}>LIVE RENDER</Text>
              <TouchableOpacity
                onPress={handleCopyHtml}
                style={{
                  backgroundColor: copiedHtml ? theme.success + "15" : theme.surface,
                  borderColor: copiedHtml ? theme.success + "33" : theme.border,
                  borderWidth: 1, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4,
                }}
              >
                <Text style={{ color: copiedHtml ? theme.success : theme.textSecondary, fontSize: 9, fontWeight: "900" }}>
                  {copiedHtml ? "✓ COPIED" : "📋 COPY HTML"}
                </Text>
              </TouchableOpacity>
            </View>
            <PreviewIframe html={previewHtml} />
          </View>
        ) : tab === "links" ? (
          <LinkManagerPanel source={source} onSourceChange={handleChange} theme={theme} />
        ) : tab === "structure" ? (
          <StructurePanel source={source} onSourceChange={handleChange} theme={theme} />
        ) : (
          <NeuralChatPanel source={source} onSourceChange={handleChange} theme={theme} />
        )}
      </View>

      {/* Magic FAB */}
      {tab === "editor" && (
        <TouchableOpacity
          onPress={handleMagicRewrite}
          disabled={rewriting}
          activeOpacity={0.8}
          style={{
            position: "absolute", bottom: 24, right: 24,
            backgroundColor: theme.accent, width: 56, height: 56,
            borderRadius: 28, alignItems: "center", justifyContent: "center",
            shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4, shadowRadius: 8, elevation: 10,
            opacity: rewriting ? 0.7 : 1
          }}
        >
          {rewriting ? <ActivityIndicator color="#000" /> : <LucideSparkles color="#000" size={24} />}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function StructurePanel({ source, onSourceChange, theme }: { source: string, onSourceChange: (s: string) => void, theme: AppTheme }) {
  const lines = source.split("\n");
  const sections = lines.filter(l => l.startsWith("\\section{")).map(l => l.match(/\\section{([^}]+)}/)?.[1] || "");

  const handleMove = (title: string, direction: "up" | "down") => {
    onSourceChange(moveSection(source, title, direction));
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 30 }}>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 10, fontWeight: "900", color: theme.accent, letterSpacing: 1.5 }}>REORDER</Text>
        <Text style={{ fontSize: 20, fontWeight: "800", color: theme.textPrimary, marginTop: 4 }}>Resume Structure</Text>
        <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 6 }}>Use arrows to reorder sections. Changes are synced instantly.</Text>
      </View>

      <View style={{ gap: 10 }}>
        {sections.map((sec, idx) => (
          <View key={idx} style={{ 
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, borderRadius: 8,
            paddingHorizontal: 20, paddingVertical: 16
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: "900" }}>{String(idx + 1).padStart(2, '0')}</Text>
              <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "700" }}>{sec}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity 
                disabled={idx === 0}
                onPress={() => handleMove(sec, "up")}
                style={{ 
                  backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1,
                  borderRadius: 4, width: 32, height: 32, alignItems: "center", justifyContent: "center",
                  opacity: idx === 0 ? 0.3 : 1
                }}
              >
                <LucideChevronUp color={theme.textPrimary} size={16} />
              </TouchableOpacity>
              <TouchableOpacity 
                disabled={idx === sections.length - 1}
                onPress={() => handleMove(sec, "down")}
                style={{ 
                  backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1,
                  borderRadius: 4, width: 32, height: 32, alignItems: "center", justifyContent: "center",
                  opacity: idx === sections.length - 1 ? 0.3 : 1
                }}
              >
                <LucideChevronDown color={theme.textPrimary} size={16} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
function NeuralChatPanel({ source, onSourceChange, theme }: { source: string, onSourceChange: (s: string) => void, theme: AppTheme }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant", content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const apiKey = await getApiKey();
      const { updatedSource, assistantMessage } = await neuralChat(apiKey || "", source, userMsg, messages);
      
      setMessages(prev => [...prev, { role: "assistant", content: assistantMessage }]);
      if (updatedSource !== source) {
        onSourceChange(updatedSource);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ padding: 20, borderBottomWidth: 1, borderColor: theme.border }}>
        <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>NEURAL COPILOT</Text>
        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "800", marginTop: 4 }}>How can I help with your resume?</Text>
      </View>
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
        {messages.length === 0 && (
          <View style={{ backgroundColor: theme.card, padding: 20, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 20 }}>
              Try asking things like:
              {"\n"}• "Add a project about a weather app using React Native"
              {"\n"}• "Make my professional summary more punchy"
              {"\n"}• "Translate the Experience section to German"
              {"\n"}• "Reorder sections to put Education at the top"
            </Text>
          </View>
        )}
        
        {messages.map((m, i) => (
          <View key={i} style={{ 
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
            backgroundColor: m.role === "user" ? theme.surface : theme.card,
            padding: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border
          }}>
            <Text style={{ color: theme.textPrimary, fontSize: 13, lineHeight: 20 }}>{m.content}</Text>
          </View>
        ))}
        {loading && (
          <View style={{ alignSelf: "flex-start", backgroundColor: theme.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
            <ActivityIndicator color={theme.accent} />
          </View>
        )}
      </ScrollView>

      <View style={{ padding: 20, borderTopWidth: 1, borderColor: theme.border, flexDirection: "row", gap: 10 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Command your resume..."
          placeholderTextColor={theme.textMuted}
          style={{ flex: 1, backgroundColor: theme.surface, color: theme.textPrimary, borderRadius: 8, paddingHorizontal: 16, height: 44, borderWidth: 1, borderColor: theme.border }}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity 
          onPress={handleSend}
          style={{ backgroundColor: theme.accent, width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center" }}
        >
          <LucideSparkles color="#000" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
