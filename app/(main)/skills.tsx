import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View, TouchableOpacity } from "react-native";
import { getActiveDocumentId, getDocumentById } from "@/services/storageService";
import { parseResumeDSL, ResumeSkillGroup } from "@/services/dslParser";
import { LucideChevronLeft, LucideLayoutGrid, LucidePlus, LucideZap } from "lucide-react-native";

interface SkillCategory {
  name: string;
  skills: string[];
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Languages: "#00F0FF", Frameworks: "#8B5CF6", Backend: "#34C759", Frontend: "#FF9500",
  DevOps: "#FFD60A", Tools: "#007AFF", Mobile: "#FF2D55", Database: "#32D74B",
  Cloud: "#64D2FF", Design: "#AF52DE", AI: "#BF5AF2", Security: "#FF453A",
  Other: "#8E8E93",
};

function categorizeSkill(category: string): string {
  const key = Object.keys(CATEGORY_COLORS).find(
    (k) => category.toLowerCase().includes(k.toLowerCase())
  );
  return CATEGORY_COLORS[key ?? "Other"] ?? "#8E8E93";
}

export default function SkillsScreen() {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [totalSkills, setTotalSkills] = useState(0);

  useEffect(() => {
    (async () => {
      const id = await getActiveDocumentId();
      const doc = id ? await getDocumentById(id) : null;
      if (!doc) return;

      const ast = parseResumeDSL(doc.currentSource);
      const catMap: Record<string, string[]> = {};

      for (const section of ast.sections) {
        for (const item of section.items) {
          if (item.type === "skillgroup") {
            const sg = item as ResumeSkillGroup;
            if (!catMap[sg.category]) catMap[sg.category] = [];
            catMap[sg.category].push(...sg.items);
          }
        }
      }

      const cats = Object.entries(catMap).map(([name, skills]) => ({
        name, skills: [...new Set(skills)], color: categorizeSkill(name),
      }));
      setCategories(cats);
      setTotalSkills(cats.reduce((s, c) => s + c.skills.length, 0));
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: "#1F1F1F" }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 16 }}>
          <LucideChevronLeft color="#00F0FF" size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>TECH STACK</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }}>Skill Matrix</Text>
        </View>
        <View style={{ backgroundColor: "#1A1A1A", borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#2A2A2A" }}>
          <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900" }}>{totalSkills} NODES</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {categories.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <LucideLayoutGrid color="#1F1F1F" size={64} style={{ marginBottom: 20 }} />
            <Text style={{ color: "#444", textAlign: "center", fontSize: 12, fontWeight: "800", letterSpacing: 1 }}>
              NO NEURAL DATA DETECTED.{"\n"}INITIALIZE SKILL GROUPS IN SOURCE.
            </Text>
          </View>
        )}
        
        <View style={{ gap: 20 }}>
          {categories.map((cat) => (
            <View key={cat.name} style={{ backgroundColor: "#121212", borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", padding: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat.color }} />
                  <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 }}>{cat.name.toUpperCase()}</Text>
                </View>
                <Text style={{ color: "#444", fontSize: 10, fontWeight: "800" }}>{cat.skills.length} UNITS</Text>
              </View>
              
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {cat.skills.map((skill) => (
                  <View key={skill} style={{
                    backgroundColor: "#1A1A1A", 
                    borderRadius: 4,
                    borderWidth: 1, 
                    borderColor: "#2A2A2A",
                    paddingHorizontal: 10, 
                    paddingVertical: 6,
                  }}>
                    <Text style={{ color: "#8E8E93", fontSize: 11, fontWeight: "700" }}>{skill.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(modals)/add-skill")}
          activeOpacity={0.7}
          style={{ 
            marginTop: 32, borderRadius: 8, borderWidth: 1, borderColor: "#1F1F1F", 
            borderStyle: "dashed", padding: 20, alignItems: "center", flexDirection: "row", 
            justifyContent: "center", gap: 10, backgroundColor: "#0D0D0D"
          }}
        >
          <LucidePlus color="#00F0FF" size={18} />
          <Text style={{ color: "#00F0FF", fontSize: 13, fontWeight: "800", letterSpacing: 1 }}>INJECT NEW SKILL</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Magic FAB */}
      <TouchableOpacity
        onPress={() => router.push("/(modals)/add-skill")}
        activeOpacity={0.8}
        style={{
          position: "absolute", bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: "#8B5CF6", alignItems: "center", justifyContent: "center",
          elevation: 10
        }}
      >
        <LucideZap color="#FFFFFF" size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
