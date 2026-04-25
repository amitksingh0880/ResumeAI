import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import {
  LucideChevronLeft,
  LucideSave,
  LucideZap,
  LucideCode,
  LucideEye,
  LucideDownload,
  LucideLink,
  LucideLayers,
  LucideSparkles,
  LucideMessageSquare,
  LucideChevronUp,
  LucideChevronDown
} from "lucide-react-native";

import { Theme, type AppTheme } from "@/constants/Theme";
import {
  getActiveDocumentId,
  getDocumentById,
  updateDocumentSource,
  getApiKey,
  type ResumeDocument,
  getSettings,
  type AppSettings,
} from "@/services/storageService";
import { parseResumeDSL } from "@/services/dslParser";
import { renderTemplate } from "@/services/templateRenderer";
import { exportToPDF } from "@/services/exportService";
import { 
  extractLinkableItems, 
  upsertLink, 
  removeLink, 
  upsertQRCode,
  moveSection,
  type LinkableItem 
} from "@/services/linkService";
import { neuralChat } from "@/services/aiService";

export default function EditorScreen() {
  const [source, setSource] = useState("");
  const [docId, setDocId] = useState<string | null>(null);
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "links" | "structure" | "chat">("edit");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const [theme, setTheme] = useState<AppTheme>(Theme.dark);

  useEffect(() => {
    loadDoc();
    getSettings().then(s => setTheme(Theme[s.appearance]));
  }, []);

  async function loadDoc() {
    const id = await getActiveDocumentId();
    if (id) {
      setDocId(id);
      const d = await getDocumentById(id);
      if (d) {
        setDoc(d);
        setSource(d.currentSource);
      }
    }
  }

  async function handleSave() {
    if (!docId || !source.trim()) return;
    setSaving(true);
    try {
      await updateDocumentSource(docId, source, "Manual save");
      Alert.alert("Saved", "Your resume has been saved.");
    } catch (e: any) {
      Alert.alert("Error", "Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    if (!source.trim()) return;
    setExporting(true);
    try {
      const ast = parseResumeDSL(source);
      const html = renderTemplate(doc?.templateId || "elite-latex", ast);
      await exportToPDF(html, doc?.title || "Resume");
    } catch (e: any) {
      Alert.alert("Export Failed", e.message);
    } finally {
      setExporting(false);
    }
  }

  // Parse actual document for preview
  let parsedName = "YOUR NAME";
  let parsedRole = "Professional Title";
  let parsedSummary = "";
  let parsedExperience: { title: string; company: string; date: string; bullets: string[] }[] = [];
  let parsedSkills: string[] = [];

  try {
    if (source.trim()) {
      const ast = parseResumeDSL(source);
      parsedName = ast.name || "YOUR NAME";
      parsedRole = ast.role || "Professional Title";
      parsedSummary = ast.summary || "";
      for (const section of ast.sections) {
        for (const item of section.items) {
          if (item.type === "job") {
            const job = item as any;
            parsedExperience.push({
              title: job.title || "",
              company: job.company || "",
              date: job.date || "",
              bullets: (job.bullets || []).map((b: any) => b.text || ""),
            });
          }
          if (item.type === "skillgroup") {
            parsedSkills.push(...((item as any).items || []));
          }
        }
      }
    }
  } catch {}

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
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(main)/dashboard");
              }
            }} 
            activeOpacity={0.7}
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}
          >
            <LucideChevronLeft color={theme.accent} size={20} />
          </TouchableOpacity>
          <View>
            <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "900", letterSpacing: -0.2 }}>STUDIO CORE</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.accent }} />
              <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: "700" }} numberOfLines={1}>
                {doc?.title?.toUpperCase() ?? "DRAFT REPOSITORY"}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity 
            onPress={handleSave} 
            activeOpacity={0.7} 
            style={{ 
              width: 40, height: 40, borderRadius: 10, 
              backgroundColor: theme.card, alignItems: "center", justifyContent: "center",
              borderWidth: 1, borderColor: theme.border
            }}
          >
            {saving ? <ActivityIndicator color={theme.accent} size="small" /> : <LucideSave color={theme.textPrimary} size={18} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExport}
            activeOpacity={0.8}
            style={{ 
              backgroundColor: theme.accent, borderRadius: 10, paddingHorizontal: 16, height: 40,
              flexDirection: "row", alignItems: "center", gap: 8,
              shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
            }}
          >
            {exporting ? <ActivityIndicator color="#000" size="small" /> : <LucideDownload color="#000" size={16} />}
            <Text style={{ color: "#000", fontWeight: "900", fontSize: 11, letterSpacing: 0.5 }}>{exporting ? "PROCESSING" : "EXPORT"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View Toggle - Modern Segmented Control */}
      <View style={{ backgroundColor: theme.background, paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: theme.border }}>
        <View style={{ 
          flexDirection: "row", padding: 4, backgroundColor: theme.card, 
          borderRadius: 12, borderWidth: 1, borderColor: theme.border, gap: 2 
        }}>
          {[
            { id: "edit", label: "SOURCE", icon: <LucideCode size={13} /> },
            { id: "preview", label: "RENDER", icon: <LucideEye size={13} /> },
            { id: "links", label: "LINKS", icon: <LucideLink size={13} /> },
            { id: "structure", label: "STRUCT", icon: <LucideLayers size={13} /> },
            { id: "chat", label: "CHAT", icon: <LucideMessageSquare size={13} /> },
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setViewMode(t.id as any)}
              activeOpacity={0.7}
              style={{ 
                flex: 1, height: 32, borderRadius: 8,
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
                backgroundColor: viewMode === t.id ? theme.surface : "transparent",
              }}
            >
              {React.cloneElement(t.icon as any, { color: viewMode === t.id ? theme.accent : theme.textMuted })}
              <Text style={{ 
                color: viewMode === t.id ? theme.textPrimary : theme.textMuted, 
                fontSize: 8, fontWeight: "900", letterSpacing: 0.5 
              }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {viewMode === "edit" ? (
          <SourcePanel source={source} onSourceChange={setSource} theme={theme} />
        ) : viewMode === "preview" ? (
          <ScrollView style={{ flex: 1, backgroundColor: theme.surface }} contentContainerStyle={{ padding: 20 }}>
            {/* Live Resume Preview */}
            <View style={{ backgroundColor: "#FFFFFF", padding: 32, minHeight: 600 }}>
              {/* Header with accent bar */}
              <View style={{ borderLeftWidth: 4, borderColor: theme.accent, paddingLeft: 20, marginBottom: 28 }}>
                <Text style={{ fontSize: 28, fontWeight: "900", color: "#000000" }}>{parsedName.toUpperCase()}</Text>
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.accent, marginTop: 4 }}>{parsedRole}</Text>
              </View>

              {parsedSummary ? (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 9, fontWeight: "900", color: "#AAA", letterSpacing: 2, borderBottomWidth: 1, borderColor: "#EEE", paddingBottom: 4, marginBottom: 10 }}>PROFESSIONAL SUMMARY</Text>
                  <Text style={{ fontSize: 13, color: "#333", lineHeight: 20 }}>{parsedSummary}</Text>
                </View>
              ) : null}

              {parsedExperience.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 9, fontWeight: "900", color: "#AAA", letterSpacing: 2, borderBottomWidth: 1, borderColor: "#EEE", paddingBottom: 4, marginBottom: 10 }}>EXPERIENCE</Text>
                  {parsedExperience.map((job, i) => (
                    <View key={i} style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontWeight: "700", color: "#000", fontSize: 13 }}>{job.title}</Text>
                        <Text style={{ fontSize: 11, color: "#AAA" }}>{job.date}</Text>
                      </View>
                      <Text style={{ fontSize: 12, color: theme.accent, fontWeight: "600", marginBottom: 6 }}>{job.company}</Text>
                      {job.bullets.map((b, bi) => (
                        <Text key={bi} style={{ fontSize: 11, color: "#444", marginBottom: 3 }}>• {b}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {parsedSkills.length > 0 && (
                <View>
                  <Text style={{ fontSize: 9, fontWeight: "900", color: "#AAA", letterSpacing: 2, borderBottomWidth: 1, borderColor: "#EEE", paddingBottom: 4, marginBottom: 10 }}>SKILLS</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {parsedSkills.map((s, i) => (
                      <View key={i} style={{ backgroundColor: "#F5F5F5", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 11, color: "#333" }}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {!parsedSummary && parsedExperience.length === 0 && (
                <Text style={{ color: "#AAA", textAlign: "center", marginTop: 40, fontSize: 13 }}>
                  Start writing in the SOURCE view to see your resume rendered here.
                </Text>
              )}
            </View>
          </ScrollView>
        ) : viewMode === "links" ? (
          <LinkManagerPanel source={source} onSourceChange={setSource} theme={theme} />
        ) : viewMode === "structure" ? (
          <StructurePanel source={source} onSourceChange={setSource} theme={theme} />
        ) : (
          <NeuralChatPanel source={source} onSourceChange={setSource} theme={theme} />
        )}
      </KeyboardAvoidingView>

      <TouchableOpacity
        onPress={() => router.push("/(modals)/add-skill")}
        activeOpacity={0.8}
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.accent,
          alignItems: "center",
          justifyContent: "center",
          elevation: 10,
        }}
      >
        <LucideZap color="#FFFFFF" size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function SourcePanel({ source, onSourceChange, theme }: { source: string; onSourceChange: (s: string) => void; theme: AppTheme }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <TextInput
        multiline
        value={source}
        onChangeText={onSourceChange}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        placeholder="// Start writing your resume in DSL format..."
        placeholderTextColor={theme.textMuted}
        style={{
          flex: 1,
          padding: 16,
          color: theme.textPrimary,
          fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
          fontSize: settings?.editorFontSize ?? 13,
          lineHeight: (settings?.editorFontSize ?? 13) * 1.5,
          textAlignVertical: "top",
        }}
      />
    </View>
  );
}

function LinkManagerPanel({ source, onSourceChange, theme }: { source: string; onSourceChange: (s: string) => void; theme: AppTheme }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const items = extractLinkableItems(source);

  const handleSave = (item: any) => {
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
      <View style={{ marginBottom: 20, padding: 16, borderRadius: 8, backgroundColor: theme.accent + "15", borderWidth: 1, borderColor: theme.border }}>
        <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: "800" }}>🔗 LINKS & QR</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4 }}>Manage portfolio links and QR codes.</Text>
      </View>

      {!items.some(i => i.label === "Portfolio / Website QR") && (
        <TouchableOpacity 
          onPress={() => { setEditingId("new-qr"); setEditUrl(""); }}
          style={{ marginBottom: 20, padding: 12, borderRadius: 6, borderWidth: 1, borderStyle: "dashed", borderColor: theme.accent, alignItems: "center" }}
        >
          <Text style={{ color: theme.accent, fontSize: 11, fontWeight: "900" }}>✨ ADD PORTFOLIO QR CODE</Text>
        </TouchableOpacity>
      )}

      {editingId === "new-qr" && (
        <View style={{ marginBottom: 20, flexDirection: "row", gap: 8 }}>
          <TextInput 
            value={editUrl} 
            onChangeText={setEditUrl} 
            placeholder="https://portfolio.com" 
            placeholderTextColor={theme.textMuted}
            style={{ flex: 1, backgroundColor: theme.surface, borderRadius: 4, padding: 10, color: theme.textPrimary }} 
          />
          <TouchableOpacity onPress={() => handleSave({ label: "Portfolio / Website QR" })} style={{ backgroundColor: theme.accent, borderRadius: 4, paddingHorizontal: 16, justifyContent: "center" }}>
            <Text style={{ color: "#000", fontWeight: "800" }}>ADD</Text>
          </TouchableOpacity>
        </View>
      )}

      {items.map((item, idx) => (
        <View key={idx} style={{ marginBottom: 10, padding: 12, backgroundColor: theme.card, borderRadius: 6, borderWidth: 1, borderColor: theme.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "700" }}>{item.label}</Text>
            {item.currentUrl && <Text style={{ color: theme.accent, fontSize: 10, marginTop: 2 }}>{item.currentUrl}</Text>}
          </View>
          <TouchableOpacity 
            onPress={() => { setEditingId(item.id); setEditUrl(item.currentUrl || "https://"); }}
            style={{ backgroundColor: theme.accent + "15", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6 }}
          >
            <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900" }}>{item.currentUrl ? "EDIT" : "+ LINK"}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

function StructurePanel({ source, onSourceChange, theme }: { source: string; onSourceChange: (s: string) => void; theme: AppTheme }) {
  const lines = source.split("\n");
  const sections = lines.filter(l => l.startsWith("\\section{")).map(l => l.match(/\\section{([^}]+)}/)?.[1] || "");

  const handleMove = (title: string, direction: "up" | "down") => {
    onSourceChange(moveSection(source, title, direction));
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "800" }}>Resume Structure</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>Drag sections or use arrows to reorder.</Text>
      </View>

      {sections.map((sec, idx) => (
        <View key={idx} style={{ marginBottom: 10, padding: 16, backgroundColor: theme.card, borderRadius: 8, borderWidth: 1, borderColor: theme.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "700" }}>{sec}</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={() => handleMove(sec, "up")} disabled={idx === 0} style={{ opacity: idx === 0 ? 0.3 : 1 }}>
              <LucideChevronUp color={theme.accent} size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMove(sec, "down")} disabled={idx === sections.length - 1} style={{ opacity: idx === sections.length - 1 ? 0.3 : 1 }}>
              <LucideChevronDown color={theme.accent} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function NeuralChatPanel({ source, onSourceChange, theme }: { source: string; onSourceChange: (s: string) => void; theme: AppTheme }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
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
      if (updatedSource !== source) onSourceChange(updatedSource);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        {messages.length === 0 && (
          <View style={{ padding: 20, backgroundColor: theme.card, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.accent, fontWeight: "900", fontSize: 10, letterSpacing: 1 }}>STUDIO COPILOT</Text>
            <Text style={{ color: theme.textPrimary, fontSize: 13, marginTop: 4 }}>Command me to modify your resume (e.g. "Add a project", "Translate", "Fix tone").</Text>
          </View>
        )}
        {messages.map((m, i) => (
          <View key={i} style={{ 
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            backgroundColor: m.role === "user" ? theme.surface : theme.card,
            padding: 12, borderRadius: 12, maxWidth: "85%", borderWidth: 1, borderColor: theme.border
          }}>
            <Text style={{ color: theme.textPrimary, fontSize: 13 }}>{m.content}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator color={theme.accent} style={{ alignSelf: "flex-start", margin: 10 }} />}
      </ScrollView>
      <View style={{ padding: 16, borderTopWidth: 1, borderColor: theme.border, flexDirection: "row", gap: 10 }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Message copilot..."
          placeholderTextColor={theme.textMuted}
          style={{ flex: 1, backgroundColor: theme.surface, color: theme.textPrimary, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}
        />
        <TouchableOpacity onPress={handleSend} style={{ backgroundColor: theme.accent, padding: 10, borderRadius: 6, justifyContent: "center" }}>
          <LucideSparkles color="#000" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

