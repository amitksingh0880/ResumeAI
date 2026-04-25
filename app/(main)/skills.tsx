import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View, TouchableOpacity } from "react-native";
import { getActiveDocumentId, getDocumentById } from "@/services/storageService";
import { parseResumeDSL, ResumeSkillGroup } from "@/services/dslParser";
import { LucideChevronLeft, LucideLayoutGrid, LucidePlus, LucideZap } from "lucide-react-native";

import { Theme, type AppTheme } from "@/constants/Theme";
import { getSettings } from "@/services/storageService";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

interface SkillCategory {
  name: string;
  skills: string[];
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Languages: "#9A8174", Frameworks: "#8B5CF6", Backend: "#34C759", Frontend: "#FF9500",
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
  const [theme, setTheme] = useState<AppTheme>(Theme.dark);

  useFocusEffect(
    useCallback(() => {
      loadSkills();
      getSettings().then(s => setTheme(Theme[s.appearance]));
    }, [])
  );

  async function loadSkills() {
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
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={{ 
        flexDirection: "row", alignItems: "center", padding: 16, height: 64,
        borderBottomWidth: 1, borderColor: theme.border, backgroundColor: theme.background 
      }}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(main)/dashboard");
            }
          }} 
          activeOpacity={0.7} 
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border, marginRight: 16 }}
        >
          <LucideChevronLeft color={theme.accent} size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>STUDIO ASSETS</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: theme.textPrimary, letterSpacing: -0.5 }}>Skill Matrix</Text>
        </View>
        <View style={{ 
          backgroundColor: theme.accentMuted, borderRadius: 8, paddingHorizontal: 12, height: 28, 
          justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: theme.accent + "33" 
        }}>
          <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900" }}>{totalSkills} NODES</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {categories.length === 0 && (
          <View style={{ alignItems: "center", paddingTop: 100 }}>
            <View style={{ 
              width: 80, height: 80, borderRadius: 40, backgroundColor: theme.card, 
              alignItems: "center", justifyContent: "center", marginBottom: 24,
              borderWidth: 1, borderColor: theme.border
            }}>
              <LucideLayoutGrid color={theme.textMuted} size={32} />
            </View>
            <Text style={{ color: theme.textMuted, textAlign: "center", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, lineHeight: 18 }}>
              NEURAL ENGINE OFFLINE.{"\n"}INITIALIZE SKILL GROUPS IN SOURCE.
            </Text>
          </View>
        )}
        
        <View style={{ gap: 24 }}>
          {categories.map((cat) => (
            <View key={cat.name}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingHorizontal: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat.color, shadowColor: cat.color, shadowRadius: 4, shadowOpacity: 0.6 }} />
                  <Text style={{ color: theme.textPrimary, fontWeight: "800", fontSize: 12, letterSpacing: 1 }}>{cat.name.toUpperCase()}</Text>
                </View>
                <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: "800" }}>{cat.skills.length} UNITS</Text>
              </View>
              
              <View style={{ 
                flexDirection: "row", flexWrap: "wrap", gap: 10,
                backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 16
              }}>
                {cat.skills.map((skill) => (
                  <View key={skill} style={{
                    backgroundColor: theme.surface, 
                    borderRadius: 8,
                    borderWidth: 1, 
                    borderColor: theme.border,
                    paddingHorizontal: 12, 
                    paddingVertical: 8,
                  }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.2 }}>{skill.toUpperCase()}</Text>
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
            marginTop: 40, borderRadius: 16, borderWidth: 1, borderColor: theme.border, 
            borderStyle: "dashed", padding: 24, alignItems: "center", flexDirection: "row", 
            justifyContent: "center", gap: 12, backgroundColor: theme.card
          }}
        >
          <LucidePlus color={theme.accent} size={20} />
          <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "800", letterSpacing: 1 }}>INJECT NEW TECHNOLOGY</Text>
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
          backgroundColor: theme.accent, alignItems: "center", justifyContent: "center",
          elevation: 10
        }}
      >
        <LucideZap color="#000" size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
