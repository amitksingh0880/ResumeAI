import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
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
} from "lucide-react-native";
import { Button, Card } from "@/components/ui";
import {
  getActiveDocumentId,
  getDocumentById,
  updateDocumentSource,
  type ResumeDocument,
} from "@/services/storageService";
import { parseResumeDSL } from "@/services/dslParser";

export default function EditorScreen() {
  const [source, setSource] = useState("");
  const [docId, setDocId] = useState<string | null>(null);
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDoc();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      {/* Top Header */}
      <View style={{ height: 60, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: "#1F1F1F", paddingHorizontal: 16, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable onPress={() => router.back()}>
            <LucideChevronLeft color="#00F0FF" size={24} />
          </Pressable>
          <View>
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>EDITOR</Text>
            <Text style={{ color: "#444", fontSize: 10, fontWeight: "800" }} numberOfLines={1}>
              {doc?.title?.toUpperCase() ?? "UNTITLED"}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            variant="ghost"
            title=""
            icon={saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <LucideSave color="#FFFFFF" size={20} />}
            onPress={handleSave}
          />
          <Button
            variant="primary"
            title="EXPORT"
            size="sm"
            icon={<LucideDownload color="#000" size={16} />}
          />
        </View>
      </View>

      {/* View Toggle */}
      <View style={{ flexDirection: "row", padding: 12, gap: 8, backgroundColor: "#121212" }}>
        <Pressable
          onPress={() => setViewMode("edit")}
          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 36, borderRadius: 4, backgroundColor: viewMode === "edit" ? "#1F1F1F" : "transparent", borderWidth: 1, borderColor: viewMode === "edit" ? "#00F0FF" : "transparent" }}
        >
          <LucideCode color={viewMode === "edit" ? "#00F0FF" : "#444"} size={16} />
          <Text style={{ color: viewMode === "edit" ? "#FFFFFF" : "#444", fontSize: 11, fontWeight: "800" }}>SOURCE</Text>
        </Pressable>
        <Pressable
          onPress={() => setViewMode("preview")}
          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 36, borderRadius: 4, backgroundColor: viewMode === "preview" ? "#1F1F1F" : "transparent", borderWidth: 1, borderColor: viewMode === "preview" ? "#00F0FF" : "transparent" }}
        >
          <LucideEye color={viewMode === "preview" ? "#00F0FF" : "#444"} size={16} />
          <Text style={{ color: viewMode === "preview" ? "#FFFFFF" : "#444", fontSize: 11, fontWeight: "800" }}>RENDER</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {viewMode === "edit" ? (
          <ScrollView style={{ flex: 1, backgroundColor: "#0A0A0A" }} contentContainerStyle={{ padding: 16 }}>
            <TextInput
              multiline
              value={source}
              onChangeText={setSource}
              style={{
                color: "#FFFFFF",
                fontSize: 13,
                lineHeight: 20,
                textAlignVertical: "top",
                minHeight: 400,
              }}
              placeholderTextColor="#333"
              placeholder="// Start writing your resume in DSL format..."
              spellCheck={false}
              autoCapitalize="none"
            />
          </ScrollView>
        ) : (
          <ScrollView style={{ flex: 1, backgroundColor: "#1A1A1A" }} contentContainerStyle={{ padding: 20 }}>
            {/* Live Resume Preview */}
            <View style={{ backgroundColor: "#FFFFFF", padding: 32, minHeight: 600 }}>
              {/* Header with cyan accent bar */}
              <View style={{ borderLeftWidth: 4, borderColor: "#00F0FF", paddingLeft: 20, marginBottom: 28 }}>
                <Text style={{ fontSize: 28, fontWeight: "900", color: "#000000" }}>{parsedName.toUpperCase()}</Text>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#007AFF", marginTop: 4 }}>{parsedRole}</Text>
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
                      <Text style={{ fontSize: 12, color: "#007AFF", fontWeight: "600", marginBottom: 6 }}>{job.company}</Text>
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
        )}
      </KeyboardAvoidingView>

      {/* Magic Rewrite FAB */}
      <Pressable
        onPress={() => router.push("/(main)/roadmap")}
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#8B5CF6",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#8B5CF6",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        <LucideZap color="#FFFFFF" size={28} />
      </Pressable>
    </SafeAreaView>
  );
}
