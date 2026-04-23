import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import {
  getActiveDocumentId,
  getDocumentById,
  setActiveDocumentId,
  type ResumeDocument,
} from "@/services/storageService";
import { TEMPLATES } from "@/services/templateRenderer";
import { saveDocument } from "@/services/storageService";

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
    doc.templateId = templateId;
    doc.updatedAt = Date.now();
    await saveDocument(doc);
    router.dismiss();
  }

  const STYLE_COLORS: Record<string, string> = {
    Classic: "#8B949E", Modern: "#00ADB5", Sidebar: "#4A90D9", "Two-Column": "#A371F7",
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D1117" }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#30363D" }}>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: "#E6EDF3" }}>🎨 Switch Template</Text>
        <Pressable onPress={() => router.dismiss()}>
          <Text style={{ color: "#8B949E", fontSize: 22 }}>×</Text>
        </Pressable>
      </View>
      <Text style={{ color: "#6E7681", fontSize: 12, paddingHorizontal: 16, paddingTop: 10 }}>
        Your source code stays the same — just the visual style changes.
      </Text>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {TEMPLATES.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => handleApply(t.id)}
            style={{
              backgroundColor: selected === t.id ? "#1F3A5F" : "#161B22",
              borderRadius: 14, borderWidth: 1.5,
              borderColor: selected === t.id ? "#58A6FF" : "#30363D",
              padding: 16, flexDirection: "row", alignItems: "center", gap: 14,
            }}
          >
            <View style={{ width: 44, height: 56, borderRadius: 8, backgroundColor: t.accentColor, opacity: 0.9, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 20 }}>📄</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#E6EDF3" }}>{t.name}</Text>
                <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: "#1C2128" }}>
                  <Text style={{ fontSize: 10, fontWeight: "600", color: STYLE_COLORS[t.style] ?? "#8B949E" }}>{t.style}</Text>
                </View>
                {selected === t.id && (
                  <View style={{ backgroundColor: "#1F3A5F", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, color: "#58A6FF", fontWeight: "700" }}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: "#8B949E", lineHeight: 17 }}>{t.description}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
