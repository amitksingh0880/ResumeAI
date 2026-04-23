import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  getActiveDocumentId,
  getDocumentById,
  getApiKey,
} from "@/services/storageService";
import { parseResumeDSL } from "@/services/dslParser";
import { generateCareerRoadmap, type CareerStep } from "@/services/aiService";
import { LucideChevronLeft, LucideTarget, LucideArrowUpRight, LucideCheckCircle2, LucideZap } from "lucide-react-native";
import { Card, Badge, Button } from "@/components/ui";

export default function RoadmapScreen() {
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<{ steps: CareerStep[]; summary: string } | null>(null);

  useEffect(() => {
    handleGenerate();
  }, []);

  async function handleGenerate() {
    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert("API Key Required", "Please add your Gemini API key in Settings.");
      router.back();
      return;
    }

    const id = await getActiveDocumentId();
    const doc = id ? await getDocumentById(id) : null;
    if (!doc) return;

    setLoading(true);
    try {
      const ast = parseResumeDSL(doc.currentSource);
      const skills = ast.sections.flatMap(s => s.items.filter(i => i.type === 'skillgroup').flatMap((sg: any) => sg.items));
      
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
        <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
          <LucideChevronLeft color="#00F0FF" size={24} />
        </Pressable>
        <View>
          <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>NEURAL PATH</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }}>Career Roadmap</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 }}>
            <ActivityIndicator size="large" color="#00F0FF" />
            <Text style={{ color: "#444", marginTop: 16, fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>CALCULATING TRAJECTORY...</Text>
          </View>
        ) : roadmap ? (
          <>
            <Card variant="glass" padding={20} style={{ marginBottom: 32 }}>
              <LucideTarget color="#8B5CF6" size={32} style={{ marginBottom: 12 }} />
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", marginBottom: 8 }}>Strategic Market Outlook</Text>
              <Text style={{ color: "#8E8E93", fontSize: 13, lineHeight: 20 }}>{roadmap.summary}</Text>
            </Card>

            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 2, marginBottom: 20 }}>EVOLUTIONARY PHASES</Text>

            <View style={{ gap: 20 }}>
              {roadmap.steps.map((step, i) => (
                <Card key={i} variant={i === 0 ? "glass" : "outline"} padding={20} style={i === 0 ? { borderColor: "#00F0FF" } : {}}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <Badge label={`PHASE 0${i + 1}`} variant={i === 0 ? "primary" : "outline"} />
                    <LucideArrowUpRight color={i === 0 ? "#00F0FF" : "#1F1F1F"} size={20} />
                  </View>

                  <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginBottom: 6 }}>{step.role.toUpperCase()}</Text>
                  <Text style={{ color: "#8E8E93", fontSize: 13, marginBottom: 16, lineHeight: 18 }}>{step.description}</Text>
                  
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {step.skillsNeeded.map((skill, si) => (
                      <View key={si} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#2A2A2A" }}>
                        <LucideCheckCircle2 color="#34C759" size={12} style={{ marginRight: 6 }} />
                        <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600" }}>{skill.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              ))}
            </View>
            
            <Button 
              title="RE-CALCULATE PATH" 
              variant="outline" 
              icon={<LucideZap color="#00F0FF" size={16} />}
              onPress={handleGenerate}
              style={{ marginTop: 40, marginBottom: 40 }}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
