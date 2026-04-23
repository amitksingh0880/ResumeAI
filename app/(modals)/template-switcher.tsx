import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  getActiveDocumentId,
  getDocumentById,
  type ResumeDocument,
} from "@/services/storageService";
import { TEMPLATES } from "@/services/templateRenderer";
import { saveDocument } from "@/services/storageService";
import { LucideX, LucideLayout, LucideCheckCircle2 } from "lucide-react-native";

export default function TemplateSwitcherModal() {
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [selected, setSelected] = useState("jakes-cv");

  useEffect(() => {
    (async () => {
      const id = await getActiveDocumentId();
      if (id) {
        const d = await getDocumentById(id);
        if (d) { setDoc(d); setSelected(d.templateId); }
      }
    })();
  }, []);

  async function handleApply(templateId: string) {
    if (!doc) return;
    const id = await getActiveDocumentId();
    const updatedDoc = { ...doc, templateId, updatedAt: Date.now() };
    await saveDocument(updatedDoc);
    setDoc(updatedDoc);
    setSelected(templateId);
    
    // Briefly show selection before closing
    setTimeout(() => {
      router.back();
    }, 300);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: "#1F1F1F" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>VISUAL ENGINE</Text>
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginTop: 2 }}>Switch Template</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ padding: 4 }}>
          <LucideX color="#8E8E93" size={22} />
        </TouchableOpacity>
      </View>

      <Text style={{ color: "#8E8E93", fontSize: 12, paddingHorizontal: 20, paddingTop: 16, lineHeight: 18 }}>
        Select a visual style. Your resume source content remains unchanged while the presentation layer adapts.
      </Text>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        {TEMPLATES.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => handleApply(t.id)}
            activeOpacity={0.7}
            style={{
              backgroundColor: selected === t.id ? "rgba(0, 240, 255, 0.05)" : "#121212",
              borderRadius: 8, borderWidth: 1.5,
              borderColor: selected === t.id ? "#00F0FF" : "#1F1F1F",
              padding: 16, flexDirection: "row", alignItems: "center", gap: 14,
            }}
          >
            <View style={{ width: 44, height: 56, borderRadius: 4, backgroundColor: t.accentColor, opacity: 0.85, alignItems: "center", justifyContent: "center" }}>
              <LucideLayout color="#FFFFFF" size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#FFFFFF" }}>{t.name}</Text>
                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#2A2A2A" }}>
                  <Text style={{ fontSize: 9, fontWeight: "800", color: "#8E8E93", letterSpacing: 1 }}>{t.style.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: "#8E8E93", lineHeight: 17 }}>{t.description}</Text>
            </View>
            {selected === t.id && (
              <LucideCheckCircle2 color="#00F0FF" size={20} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
