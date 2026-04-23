import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { TEMPLATES } from "@/services/templateRenderer";
import {
  createDocument,
  setActiveDocumentId,
  setOnboardingDone,
} from "@/services/storageService";

export default function TemplatePickerScreen() {
  const { source } = useLocalSearchParams<{ source: string }>();
  const [selected, setSelected] = useState("jakes-cv");

  async function handleCreate() {
    const doc = await createDocument("My Resume", source || "", selected);
    await setActiveDocumentId(doc.id);
    await setOnboardingDone();
    router.replace("/(main)/editor");
  }

  const STYLE_COLORS: Record<string, string> = {
    Classic: "#8B949E", Modern: "#00ADB5", Sidebar: "#4A90D9", "Two-Column": "#A371F7",
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D1117" }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: "#58A6FF", fontSize: 14 }}>← Back</Text>
        </Pressable>

        <Text style={{ fontSize: 26, fontWeight: "800", color: "#E6EDF3", marginBottom: 6 }}>
          Choose a template
        </Text>
        <Text style={{ fontSize: 14, color: "#8B949E", marginBottom: 28 }}>
          You can switch anytime — your source code stays the same
        </Text>

        <View style={{ gap: 14 }}>
          {TEMPLATES.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setSelected(t.id)}
              style={{
                backgroundColor: selected === t.id ? "#1F3A5F" : "#161B22",
                borderRadius: 14, borderWidth: 1.5,
                borderColor: selected === t.id ? "#58A6FF" : "#30363D",
                padding: 16, flexDirection: "row", alignItems: "center", gap: 14,
              }}
            >
              {/* Color swatch */}
              <View style={{ width: 44, height: 56, borderRadius: 8, backgroundColor: t.accentColor, opacity: 0.85, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 20 }}>📄</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#E6EDF3" }}>{t.name}</Text>
                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: "#1C2128" }}>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: STYLE_COLORS[t.style] ?? "#8B949E" }}>{t.style}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: "#8B949E", lineHeight: 18 }}>{t.description}</Text>
              </View>

              {selected === t.id && (
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#58A6FF", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ color: "#0D1117", fontSize: 12, fontWeight: "800" }}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleCreate}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#79B8FF" : "#58A6FF",
            borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 32,
          })}
        >
          <Text style={{ color: "#0D1117", fontWeight: "800", fontSize: 16 }}>
            Create Resume →
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
