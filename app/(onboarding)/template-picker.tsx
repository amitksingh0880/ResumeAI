import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TEMPLATES } from "@/services/templateRenderer";
import {
  createDocument,
  setActiveDocumentId,
  setOnboardingDone,
} from "@/services/storageService";
import { LucideChevronLeft, LucideLayout, LucideCheckCircle2 } from "lucide-react-native";

export default function TemplatePickerScreen() {
  const { source } = useLocalSearchParams<{ source: string }>();
  const [selected, setSelected] = useState("jakes-cv");

  async function handleCreate() {
    const doc = await createDocument("My Resume", source || "", selected);
    await setActiveDocumentId(doc.id);
    await setOnboardingDone();
    router.replace("/(main)/dashboard");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24, flexDirection: "row", alignItems: "center" }} activeOpacity={0.7}>
          <LucideChevronLeft color="#00F0FF" size={20} />
          <Text style={{ color: "#00F0FF", fontSize: 14, fontWeight: "700", marginLeft: 4 }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2, marginBottom: 4 }}>SELECT ARCHITECTURE</Text>
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
                backgroundColor: selected === t.id ? "rgba(0, 240, 255, 0.05)" : "#121212",
                borderRadius: 8, borderWidth: 1.5,
                borderColor: selected === t.id ? "#00F0FF" : "#1F1F1F",
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
                <LucideCheckCircle2 color="#00F0FF" size={20} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          activeOpacity={0.8}
          style={{ backgroundColor: "#00F0FF", borderRadius: 4, paddingVertical: 18, alignItems: "center" }}
        >
          <Text style={{ color: "#000000", fontWeight: "900", fontSize: 13, letterSpacing: 2 }}>
            INITIALIZE SYSTEM →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
