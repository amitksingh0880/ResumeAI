import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { getActiveDocumentId, getDocumentById } from "@/services/storageService";
import { parseResumeDSL, ResumeSkillGroup } from "@/services/dslParser";
import { LucideChevronLeft, LucideLayoutGrid, LucidePlus } from "lucide-react-native";
import { Card, Badge, Button } from "@/components/ui";

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
          if (item.type === "skill") {
            if (!catMap["Other"]) catMap["Other"] = [];
            catMap["Other"].push(item.name);
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
        <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
          <LucideChevronLeft color="#00F0FF" size={24} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>TECH STACK</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }}>Skill Matrix</Text>
        </View>
        <Badge label={`${totalSkills} UNITS`} variant="primary" />
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
            <Card key={cat.name} variant="glass" padding={16}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat.color }} />
                  <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 }}>{cat.name.toUpperCase()}</Text>
                </View>
                <Text style={{ color: "#444", fontSize: 10, fontWeight: "800" }}>{cat.skills.length} NODES</Text>
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
                    <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600" }}>{skill.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </View>

        <Button 
          title="ADD NEW CATEGORY" 
          variant="outline" 
          size="md" 
          icon={<LucidePlus color="#FFFFFF" size={18} />}
          style={{ marginTop: 40, borderStyle: "dashed" }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
