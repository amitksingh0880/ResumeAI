import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getActiveDocumentId,
  getDocumentById,
  getApiKey,
} from "@/services/storageService";
import { parseResumeDSL } from "@/services/dslParser";
import { generateCareerRoadmap, type CareerStep } from "@/services/aiService";
import { LucideCheckCircle2 } from "lucide-react-native";

export default function RoadmapScreen() {
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<{ steps: CareerStep[]; summary: string } | null>(null);

  useEffect(() => {
    handleGenerate();
  }, []);

  async function handleGenerate() {
    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert("API Key Required", "Add your Gemini API key in Settings.");
      router.back();
      return;
    }
    const id = await getActiveDocumentId();
    const doc = id ? await getDocumentById(id) : null;
    if (!doc) {
      Alert.alert("No Resume", "Please create a resume first.");
      return;
    }
    setLoading(true);
    try {
      const ast = parseResumeDSL(doc.currentSource);
      const skills = ast.sections.flatMap(s =>
        s.items.filter(i => i.type === "skillgroup").flatMap((sg: any) => sg.items)
      );
      const res = await generateCareerRoadmap(apiKey, skills, ast.role);
      setRoadmap(res);
    } catch (e: any) {
      Alert.alert("Roadmap Error", e?.message || "Failed to generate roadmap.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: "#1F1F1F" }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 16 }}>
          <Text style={{ color: "#00F0FF", fontSize: 14, fontWeight: "700" }}>← Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>NEURAL PATH</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }}>Career Roadmap</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 100 }}>
            <ActivityIndicator size="large" color="#00F0FF" />
            <Text style={{ color: "#444", marginTop: 16, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
              CALCULATING TRAJECTORY...
            </Text>
          </View>
        ) : roadmap ? (
          <>
            {/* Market Outlook */}
            <View style={{ backgroundColor: "#121212", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 20, marginBottom: 28 }}>
              <Text style={{ color: "#8B5CF6", fontSize: 10, fontWeight: "900", letterSpacing: 2, marginBottom: 8 }}>MARKET OUTLOOK</Text>
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800", marginBottom: 8 }}>Strategic Analysis</Text>
              <Text style={{ color: "#8E8E93", fontSize: 13, lineHeight: 20 }}>{roadmap.summary}</Text>
            </View>

            <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 16 }}>EVOLUTIONARY PHASES</Text>

            {roadmap.steps.map((step, i) => (
              <View key={i} style={{
                backgroundColor: "#121212", borderRadius: 8, padding: 20,
                borderWidth: 1, borderColor: i === 0 ? "#00F0FF" : "#1F1F1F",
                marginBottom: 16,
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <View style={{ backgroundColor: i === 0 ? "rgba(0,240,255,0.1)" : "#1A1A1A", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: i === 0 ? "#00F0FF" : "#2A2A2A" }}>
                    <Text style={{ color: i === 0 ? "#00F0FF" : "#8E8E93", fontSize: 10, fontWeight: "900", letterSpacing: 1 }}>PHASE 0{i + 1}</Text>
                  </View>
                </View>
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", marginBottom: 6 }}>{step.role.toUpperCase()}</Text>
                <Text style={{ color: "#8E8E93", fontSize: 13, marginBottom: 16, lineHeight: 18 }}>{step.description}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {step.skillsNeeded.map((skill, si) => (
                    <View key={si} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#2A2A2A" }}>
                      <LucideCheckCircle2 color="#34C759" size={12} style={{ marginRight: 6 }} />
                      <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600" }}>{skill.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={handleGenerate}
              activeOpacity={0.7}
              style={{ paddingVertical: 16, alignItems: "center", marginTop: 8, marginBottom: 40 }}
            >
              <Text style={{ color: "#00F0FF", fontSize: 13, fontWeight: "800", letterSpacing: 1 }}>✦ RE-CALCULATE PATH</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
