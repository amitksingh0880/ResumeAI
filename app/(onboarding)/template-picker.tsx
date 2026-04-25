import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TEMPLATES } from "@/services/templateRenderer";
import {
  createDocument,
  setActiveDocumentId,
  setOnboardingDone,
  getImportDraft,
  getImportDraftCSS,
  getImportDraftFilename,
} from "@/services/storageService";
import { LucideChevronLeft, LucideLayout, LucideCheckCircle2, LucideArrowRight } from "lucide-react-native";

export default function TemplatePickerScreen() {
  const [source, setSource] = useState("");
  const [customCSS, setCustomCSS] = useState("");
  const [filename, setFilename] = useState("");
  const [selected, setSelected] = useState("jakes-cv");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([getImportDraft(), getImportDraftCSS(), getImportDraftFilename()]).then(([s, css, fname]) => {
      setSource(s || "");
      setCustomCSS(css || "");
      setFilename(fname || "");
      if (css) setSelected("legacy-style");
      setLoading(false);
    });
  }, []);

  async function handleCreate() {
    if (!source) return;
    setCreating(true);
    
    let title = filename ? filename.replace(/\.[^/.]+$/, "") : "My Resume";
    try {
      const { parseResumeDSL } = require("@/services/dslParser");
      const ast = parseResumeDSL(source);
      if (ast.name && ast.name !== "Your Name") {
        title = `${ast.name}'s Resume`;
      }
    } catch (e) {
      console.warn("Failed to parse name for title:", e);
    }

    const doc = await createDocument(title, source, selected, customCSS);
    await setActiveDocumentId(doc.id);
    await setOnboardingDone();
    router.replace("/(main)/dashboard");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#050206" }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24, flexDirection: "row", alignItems: "center" }} activeOpacity={0.7}>
          <LucideChevronLeft color="#9A8174" size={20} />
          <Text style={{ color: "#9A8174", fontSize: 14, fontWeight: "700", marginLeft: 4 }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ color: "#9A8174", fontSize: 10, fontWeight: "900", letterSpacing: 2, marginBottom: 4 }}>STUDIO ARCHITECTURE</Text>
        <Text style={{ fontSize: 26, fontWeight: "900", color: "#FFFFFF", marginBottom: 6 }}>Choose Template</Text>
        <Text style={{ fontSize: 13, color: "#8E8E93", marginBottom: 28, lineHeight: 20 }}>
          Your data is decoupled from the design. Switch layouts instantly without affecting your resume source code.
        </Text>

        <View style={{ marginBottom: 32 }}>
          {TEMPLATES.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setSelected(t.id)}
              activeOpacity={0.7}
              style={{
                backgroundColor: selected === t.id ? "rgba(154, 129, 116, 0.05)" : "#121212",
                borderRadius: 8, borderWidth: 1.5,
                borderColor: selected === t.id ? "#9A8174" : "#1F1F1F",
                padding: 16, flexDirection: "row", alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View style={{
                width: 44, height: 56, borderRadius: 4,
                backgroundColor: t.accentColor, opacity: 0.85,
                alignItems: "center", justifyContent: "center", marginRight: 16,
              }}>
                <LucideLayout color="#FFFFFF" size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF", marginRight: 8 }}>{t.name}</Text>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#2A2A2A" }}>
                    <Text style={{ fontSize: 9, fontWeight: "800", color: "#8E8E93", letterSpacing: 1 }}>{t.style.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: "#8E8E93", lineHeight: 18 }}>{t.description}</Text>
              </View>
              {selected === t.id && (
                <LucideCheckCircle2 color="#9A8174" size={20} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading || creating || !source}
          activeOpacity={0.8}
          style={{ 
            backgroundColor: (loading || !source) ? "#1A1A1A" : "#9A8174", 
            borderRadius: 4, paddingVertical: 18, alignItems: "center", justifyContent: "center",
            opacity: creating ? 0.7 : 1
          }}
        >
          {creating ? (
            <ActivityIndicator color="#000" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ color: (loading || !source) ? "#444" : "#000000", fontWeight: "900", fontSize: 13, letterSpacing: 2 }}>
                INITIALIZE SYSTEM
              </Text>
              <LucideArrowRight color={(loading || !source) ? "#444" : "#000"} size={18} />
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
