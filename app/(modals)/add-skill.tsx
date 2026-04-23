import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
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
import { LucideZap, LucideCheckCircle2, LucideX } from "lucide-react-native";

const QUICK_SKILLS = [
  "Docker", "Kubernetes", "TypeScript", "React Native", "GraphQL",
  "AWS", "PostgreSQL", "Redis", "Python", "Go", "Rust", "MongoDB",
  "Tailwind CSS", "Next.js", "CI/CD", "Machine Learning", "Terraform",
  "Figma", "Swift", "Kotlin",
];

export default function AddSkillModal() {
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [skill, setSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "result">("input");
  const [result, setResult] = useState<{
    updatedSource: string;
    explanation: string;
    placement: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const id = await getActiveDocumentId();
      if (id) setDoc(await getDocumentById(id));
    })();
  }, []);

  async function handleInsert() {
    if (!skill.trim() || !doc) return;

    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert(
        "API Key Required",
        "Add your Groq API key in Settings to use AI skill insertion.",
        [
          { text: "Go to Settings", onPress: () => { router.dismiss(); router.push("/(main)/settings"); } },
          { text: "Cancel" },
        ]
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: "#1F1F1F" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>
            {step === "input" ? "SKILL INJECTION" : "AI REVIEW"}
          </Text>
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "800", marginTop: 2 }}>
            {step === "input" ? "Add a Skill" : "Preview Changes"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.dismiss()} activeOpacity={0.7} style={{ padding: 4 }}>
          <LucideX color="#8E8E93" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">

        {step === "input" && (
          <>
            {/* Skill Input */}
            <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 8 }}>SKILL NAME</Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
              <TextInput
                value={skill}
                onChangeText={setSkill}
                placeholder="e.g. Kubernetes, Figma, GraphQL..."
                placeholderTextColor="#333"
                style={{
                  flex: 1, backgroundColor: "#121212", borderRadius: 4,
                  borderWidth: 1, borderColor: skill ? "#00F0FF" : "#1F1F1F",
                  padding: 14, color: "#FFFFFF", fontSize: 14,
                }}
                returnKeyType="done"
                onSubmitEditing={handleInsert}
                autoFocus
              />
              <TouchableOpacity
                onPress={handleInsert}
                disabled={loading || !skill.trim()}
                activeOpacity={0.8}
                style={{
                  backgroundColor: skill.trim() ? "#8B5CF6" : "#1A1A1A",
                  borderRadius: 4, paddingHorizontal: 16,
                  alignItems: "center", justifyContent: "center",
                  opacity: !skill.trim() ? 0.5 : 1,
                }}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" size="small" />
                  : <LucideZap color="#FFFFFF" size={20} />
                }
              </TouchableOpacity>
            </View>

            {/* Quick Add */}
            <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 }}>QUICK ADD</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
              {QUICK_SKILLS.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSkill(s)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: skill === s ? "rgba(139,92,246,0.15)" : "#121212",
                    borderWidth: 1, borderColor: skill === s ? "#8B5CF6" : "#1F1F1F",
                    borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8,
                  }}
                >
                  <Text style={{ color: skill === s ? "#8B5CF6" : "#8E8E93", fontSize: 12, fontWeight: "600" }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* How it works */}
            <View style={{ backgroundColor: "#0D0D0D", borderRadius: 8, borderWidth: 1, borderColor: "#1A1A1A", padding: 16 }}>
              <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 8 }}>HOW IT WORKS</Text>
              <Text style={{ color: "#444", fontSize: 12, lineHeight: 18 }}>
                AI reads your entire resume, finds the best place to add the skill (existing skillgroup, new category, or as a bullet), then shows you a preview before applying any changes.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleInsert}
              disabled={loading || !skill.trim()}
              activeOpacity={0.8}
              style={{
                backgroundColor: skill.trim() ? "#8B5CF6" : "#1A1A1A",
                borderRadius: 4, paddingVertical: 16, alignItems: "center",
                marginTop: 24, opacity: !skill.trim() ? 0.5 : 1,
              }}
            >
              {loading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 13, letterSpacing: 2 }}>
                    ✦ INSERT WITH AI
                  </Text>
              }
            </TouchableOpacity>
          </>
        )}

        {step === "result" && result && (
          <>
            {/* AI Result Card */}
            <View style={{ backgroundColor: "rgba(52,199,89,0.08)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(52,199,89,0.25)", padding: 20, marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <LucideCheckCircle2 color="#34C759" size={20} />
                <Text style={{ color: "#34C759", fontSize: 11, fontWeight: "900", letterSpacing: 1, marginLeft: 8 }}>
                  AI INSERTION READY
                </Text>
              </View>
              <Text style={{ color: "#8E8E93", fontSize: 12, marginBottom: 8 }}>
                <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Placed: </Text>
                {result.placement}
              </Text>
              <Text style={{ color: "#8E8E93", fontSize: 12 }}>
                <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Why: </Text>
                {result.explanation}
              </Text>
            </View>

            {/* Skill Badge */}
            <View style={{ backgroundColor: "rgba(139,92,246,0.1)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(139,92,246,0.3)", padding: 16, marginBottom: 24, alignItems: "center" }}>
              <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "800", letterSpacing: 1, marginBottom: 4 }}>SKILL TO INSERT</Text>
              <Text style={{ color: "#8B5CF6", fontSize: 22, fontWeight: "900" }}>{skill.toUpperCase()}</Text>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setStep("input")}
                activeOpacity={0.7}
                style={{ flex: 1, backgroundColor: "#121212", borderRadius: 4, borderWidth: 1, borderColor: "#1F1F1F", paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ color: "#8E8E93", fontWeight: "700", fontSize: 13 }}>← REDO</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAccept}
                activeOpacity={0.8}
                style={{ flex: 2, backgroundColor: "#34C759", borderRadius: 4, paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ color: "#000000", fontWeight: "900", fontSize: 13, letterSpacing: 1 }}>✓ APPLY TO RESUME</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
