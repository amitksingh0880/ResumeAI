import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  getActiveDocumentId,
  getApiKey,
  getDocumentById,
  updateDocumentSource,
  type ResumeDocument,
} from "@/services/storageService";
import { insertSkillIntoResume } from "@/services/aiService";
import { parseResumeDSL } from "@/services/dslParser";

const QUICK_SKILLS = [
  "Docker", "Kubernetes", "TypeScript", "React Native", "GraphQL",
  "AWS", "PostgreSQL", "Redis", "Python", "Go", "Rust", "MongoDB",
  "Tailwind CSS", "Next.js", "CI/CD", "Machine Learning",
];

export default function AddSkillModal() {
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [skill, setSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "result">("input");
  const [result, setResult] = useState<{ updatedSource: string; explanation: string; placement: string } | null>(null);

  useEffect(() => {
    (async () => {
      const id = await getActiveDocumentId();
      if (id) setDoc(await getDocumentById(id));
    })();
  }, []);

  async function handleInsert() {
    if (!skill.trim()) return;
    if (!doc) return;

    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert(
        "API Key Required",
        "Please add your Gemini API key in Settings to use AI features.",
        [{ text: "Go to Settings", onPress: () => { router.dismiss(); router.push("/(main)/settings"); } }, { text: "Cancel" }]
      );
      return;
    }

    setLoading(true);
    try {
      const ast = parseResumeDSL(doc.currentSource);
      const res = await insertSkillIntoResume(apiKey, doc.currentSource, skill.trim(), ast.role);
      setResult(res);
      setStep("result");
    } catch (e: any) {
      Alert.alert("AI Error", e?.message ?? "Something went wrong. Check your API key.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!result || !doc) return;
    await updateDocumentSource(doc.id, result.updatedSource, `Added skill: ${skill}`);
    router.dismiss();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D1117" }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#30363D" }}>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "700", color: "#E6EDF3" }}>
          {step === "input" ? "Add a Skill" : "AI Review"}
        </Text>
        <Pressable onPress={() => router.dismiss()}>
          <Text style={{ color: "#8B949E", fontSize: 22 }}>×</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {step === "input" && (
          <>
            <View style={{ gap: 8 }}>
              <Text style={{ color: "#8B949E", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
                Skill Name
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  value={skill}
                  onChangeText={setSkill}
                  placeholder="e.g. Kubernetes, Rust, Figma…"
                  placeholderTextColor="#6E7681"
                  style={{
                    flex: 1, backgroundColor: "#161B22", borderRadius: 10,
                    borderWidth: 1, borderColor: "#30363D", padding: 12,
                    color: "#E6EDF3", fontSize: 14,
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleInsert}
                />
                <Pressable
                  onPress={handleInsert}
                  disabled={loading || !skill.trim()}
                  style={{
                    backgroundColor: "#58A6FF", borderRadius: 10, paddingHorizontal: 16,
                    alignItems: "center", justifyContent: "center",
                    opacity: loading || !skill.trim() ? 0.5 : 1,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#0D1117" size="small" />
                  ) : (
                    <Text style={{ color: "#0D1117", fontWeight: "800", fontSize: 14 }}>AI ✦</Text>
                  )}
                </Pressable>
              </View>
            </View>

            <View>
              <Text style={{ color: "#8B949E", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                Quick Add
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {QUICK_SKILLS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setSkill(s)}
                    style={{
                      backgroundColor: skill === s ? "#1F3A5F" : "#161B22",
                      borderWidth: 1, borderColor: skill === s ? "#58A6FF" : "#30363D",
                      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
                    }}
                  >
                    <Text style={{ color: skill === s ? "#58A6FF" : "#8B949E", fontSize: 12 }}>{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ backgroundColor: "#161B22", borderRadius: 10, borderWidth: 1, borderColor: "#30363D", padding: 14 }}>
              <Text style={{ color: "#8B949E", fontSize: 12, lineHeight: 18 }}>
                💡 The AI will read your entire resume, find the best place to add the skill, and show you a diff before applying any changes.
              </Text>
            </View>
          </>
        )}

        {step === "result" && result && (
          <>
            <View style={{ backgroundColor: "#1A3A1F", borderRadius: 10, borderWidth: 1, borderColor: "#3FB950", padding: 14 }}>
              <Text style={{ color: "#3FB950", fontSize: 13, fontWeight: "700", marginBottom: 6 }}>
                ✓ AI Insertion Ready
              </Text>
              <Text style={{ color: "#8B949E", fontSize: 12, marginBottom: 6 }}>
                <Text style={{ color: "#C9D1D9", fontWeight: "600" }}>Placed: </Text>{result.placement}
              </Text>
              <Text style={{ color: "#8B949E", fontSize: 12 }}>
                <Text style={{ color: "#C9D1D9", fontWeight: "600" }}>Why: </Text>{result.explanation}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setStep("input")}
                style={{ flex: 1, backgroundColor: "#161B22", borderRadius: 10, borderWidth: 1, borderColor: "#30363D", paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ color: "#8B949E", fontWeight: "600" }}>← Redo</Text>
              </Pressable>
              <Pressable
                onPress={handleAccept}
                style={{ flex: 2, backgroundColor: "#3FB950", borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ color: "#0D1117", fontWeight: "800", fontSize: 15 }}>✓ Apply to Resume</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
