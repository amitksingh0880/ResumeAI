import { router, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  getAllDocuments,
  getActiveDocumentId,
  getDocumentById,
  setActiveDocumentId,
  deleteDocument,
  type ResumeDocument,
} from "@/services/storageService";
import { parseResumeDSL } from "@/services/dslParser";
import {
  LucideZap,
  LucideFileText,
  LucidePlus,
  LucideChevronRight,
  LucideTarget,
  LucideSettings,
  LucideTrash2,
} from "lucide-react-native";

export default function DashboardScreen() {
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [allDocs, setAllDocs] = useState<ResumeDocument[]>([]);
  const [skillCount, setSkillCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    setLoading(true);
    const docs = await getAllDocuments();
    setAllDocs(docs);

    const id = await getActiveDocumentId();
    if (!id && docs.length > 0) {
      // Auto-activate the first one if none active
      await setActiveDocumentId(docs[0].id);
      setDoc(docs[0]);
    } else if (id) {
      const d = docs.find(doc => doc.id === id) || null;
      setDoc(d);
      if (d) {
        try {
          const ast = parseResumeDSL(d.currentSource);
          const count = ast.sections.reduce(
            (acc, s) =>
              acc +
              s.items
                .filter((i) => i.type === "skillgroup")
                .reduce((a, sg: any) => a + sg.items.length, 0),
            0
          );
          setSkillCount(count);
        } catch {}
      }
    }
    setLoading(false);
  }

  async function handleSwitch(id: string) {
    await setActiveDocumentId(id);
    loadData();
  }

  async function handleDelete(id: string) {
    Alert.alert(
      "Delete Resume",
      "Are you sure you want to permanently delete this repository?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await deleteDocument(id);
            loadData();
          }
        }
      ]
    );
  }

  const score = skillCount > 0 ? Math.min(60 + skillCount * 2, 99) : 85;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* ── Header ── */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <View>
            <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>COMMAND CENTER</Text>
            <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "800", marginTop: 4 }}>Welcome back</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(main)/settings")}
            style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2A2A2A" }}
          >
            <LucideSettings color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>

        {/* ── AI Health Matrix ── */}
        <View style={{ backgroundColor: "rgba(18,18,18,0.9)", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
            <View>
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>Neural Matrix</Text>
              <Text style={{ color: "#8E8E93", fontSize: 11, marginTop: 2 }}>Portfolio Optimization</Text>
            </View>
            <View style={{ backgroundColor: "#00F0FF", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: "#000", fontSize: 10, fontWeight: "900", letterSpacing: 1 }}>ACTIVE</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <View style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 6, borderColor: "#1A1A1A", borderTopColor: "#00F0FF", borderRightColor: "#00F0FF", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "900" }}>{score}</Text>
              <Text style={{ color: "#00F0FF", fontSize: 8, fontWeight: "800" }}>SCORE</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "700", marginBottom: 4 }}>KEYWORD DENSITY</Text>
              <View style={{ height: 4, backgroundColor: "#1A1A1A", borderRadius: 2, marginBottom: 12 }}>
                <View style={{ height: 4, backgroundColor: "#00F0FF", borderRadius: 2, width: "92%" }} />
              </View>
              <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "700", marginBottom: 4 }}>READABILITY</Text>
              <View style={{ height: 4, backgroundColor: "#1A1A1A", borderRadius: 2 }}>
                <View style={{ height: 4, backgroundColor: "#8B5CF6", borderRadius: 2, width: "78%" }} />
              </View>
            </View>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={{ flexDirection: "row", marginBottom: 24, gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push("/(main)/editor")}
            style={{ flex: 1, backgroundColor: "#121212", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 16, alignItems: "center" }}
            activeOpacity={0.7}
          >
            <LucideFileText color="#00F0FF" size={22} />
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800", marginTop: 8, letterSpacing: 1 }}>EDITOR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(main)/match")}
            style={{ flex: 1, backgroundColor: "#121212", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 16, alignItems: "center" }}
            activeOpacity={0.7}
          >
            <LucideTarget color="#8B5CF6" size={22} />
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800", marginTop: 8, letterSpacing: 1 }}>JOB MATCH</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(main)/roadmap")}
            style={{ flex: 1, backgroundColor: "#121212", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 16, alignItems: "center" }}
            activeOpacity={0.7}
          >
            <LucideZap color="#FFD60A" size={22} />
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800", marginTop: 8, letterSpacing: 1 }}>ROADMAP</Text>
          </TouchableOpacity>
        </View>

        {/* ── Active Repository ── */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 1.5 }}>ACTIVE REPOSITORY</Text>
            <TouchableOpacity onPress={() => router.push("/(main)/editor")} activeOpacity={0.7}>
              <Text style={{ color: "#00F0FF", fontSize: 11, fontWeight: "700" }}>OPEN →</Text>
            </TouchableOpacity>
          </View>

          {doc ? (
            <TouchableOpacity
              onPress={() => router.push("/(main)/editor")}
              activeOpacity={0.8}
              style={{ backgroundColor: "rgba(18,18,18,0.9)", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 16 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ width: 44, height: 56, borderRadius: 4, backgroundColor: "#1A1A1A", borderWidth: 1, borderColor: "#333", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                  <LucideFileText color="#00F0FF" size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }} numberOfLines={1}>{doc.title.toUpperCase()}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#34C759", marginRight: 6 }} />
                    <Text style={{ color: "#8E8E93", fontSize: 11 }}>
                      {skillCount} SKILLS · v{doc.versions?.length ?? 1}
                    </Text>
                  </View>
                </View>
                <LucideChevronRight color="#00F0FF" size={20} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={{ backgroundColor: "#121212", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 32, alignItems: "center" }}>
              <LucideFileText color="#333" size={40} />
              <Text style={{ color: "#444", fontSize: 12, fontWeight: "700", textAlign: "center", marginTop: 12 }}>NO RESUME FOUND</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.push("/(onboarding)/import")}
            activeOpacity={0.7}
            style={{ marginTop: 10, borderRadius: 4, borderWidth: 1, borderColor: "#1F1F1F", padding: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
          >
            <LucidePlus color="#FFFFFF" size={18} />
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>NEW RESUME</Text>
          </TouchableOpacity>
        </View>

        {/* ── All Resumes ── */}
        {allDocs.length > 1 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 }}>ALL REPOSITORIES</Text>
            {allDocs.map((d) => (
              <TouchableOpacity
                key={d.id}
                onPress={() => handleSwitch(d.id)}
                style={{
                  backgroundColor: doc?.id === d.id ? "rgba(0,240,255,0.05)" : "#121212",
                  borderRadius: 8, borderWidth: 1,
                  borderColor: doc?.id === d.id ? "#00F0FF" : "#1F1F1F",
                  padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center"
                }}
              >
                <LucideFileText color={doc?.id === d.id ? "#00F0FF" : "#444"} size={16} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: doc?.id === d.id ? "#FFFFFF" : "#8E8E93", fontSize: 13, fontWeight: "700" }}>{d.title}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                    <Text style={{ color: "#444", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>{d.templateId.toUpperCase()}</Text>
                    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#333", marginHorizontal: 6 }} />
                    <Text style={{ color: "#444", fontSize: 9, fontWeight: "900" }}>
                      {new Date(d.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  onPress={() => handleDelete(d.id)}
                  style={{ padding: 8 }}
                >
                  <LucideTrash2 color="#444" size={14} />
                </TouchableOpacity>

                {doc?.id === d.id && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#00F0FF", marginLeft: 8 }} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Neural Activity ── */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 }}>NEURAL ACTIVITY</Text>
          <View style={{ backgroundColor: "transparent", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 20 }}>
            <View style={{ flexDirection: "row", marginBottom: 20 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,240,255,0.1)", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                <LucideTarget color="#00F0FF" size={12} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>RESUME VIEWED</Text>
                <Text style={{ color: "#8E8E93", fontSize: 11, marginTop: 2 }}>Recruiter from Stripe viewed your Product Designer profile.</Text>
                <Text style={{ color: "#444", fontSize: 9, fontWeight: "800", marginTop: 4 }}>24 MIN AGO</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(139,92,246,0.1)", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                <LucideZap color="#8B5CF6" size={12} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>AI REWRITE COMPLETE</Text>
                <Text style={{ color: "#8E8E93", fontSize: 11, marginTop: 2 }}>Experience section optimized for Google Senior Role.</Text>
                <Text style={{ color: "#444", fontSize: 9, fontWeight: "800", marginTop: 4 }}>2 HOURS AGO</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Skills shortcut ── */}
        {skillCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/(main)/skills")}
            activeOpacity={0.8}
            style={{ marginBottom: 40, backgroundColor: "rgba(18,18,18,0.9)", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <View>
              <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>YOUR TECH STACK</Text>
              <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "900", marginTop: 4 }}>
                {skillCount} <Text style={{ color: "#00F0FF" }}>Skills</Text>
              </Text>
            </View>
            <LucideChevronRight color="#00F0FF" size={24} />
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
