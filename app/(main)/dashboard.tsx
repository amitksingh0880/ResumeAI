import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  getActiveDocumentId,
  getDocumentById,
  type ResumeDocument,
} from "@/services/storageService";
import { parseResumeDSL } from "@/services/dslParser";
import { 
  LucideZap, 
  LucideFileText, 
  LucideActivity, 
  LucidePlus, 
  LucideChevronRight, 
  LucideSearch,
  LucideBell,
  LucideUser,
  LucideTarget
} from "lucide-react-native";
import { Button, Card, Badge, Input } from "@/components/ui";

export default function DashboardScreen() {
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [skillCount, setSkillCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const id = await getActiveDocumentId();
    if (!id) return;
    const d = await getDocumentById(id);
    if (d) {
      setDoc(d);
      try {
        const ast = parseResumeDSL(d.currentSource);
        const skills = ast.sections.reduce((acc, s) => acc + s.items.filter(i => i.type === 'skillgroup').reduce((a, sg: any) => a + sg.items.length, 0), 0);
        setSkillCount(skills);
      } catch {}
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* Top Command Bar */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <View>
            <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>COMMAND CENTER</Text>
            <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "800", marginTop: 4 }}>Welcome back, Alex</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2A2A2A" }}>
              <LucideBell color="#FFFFFF" size={20} />
            </Pressable>
            <Pressable style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2A2A2A" }}>
              <LucideUser color="#FFFFFF" size={20} />
            </Pressable>
          </View>
        </View>

        {/* Global Search */}
        <Input 
          placeholder="SEARCH RESUMES OR JOBS..." 
          icon={<LucideSearch color="#444444" size={18} />}
          containerStyle={{ marginBottom: 32 }}
          inputStyle={{ fontSize: 12, letterSpacing: 1 }}
        />

        {/* Bento Grid: AI Health & Active Resumes */}
        <View style={{ gap: 20, marginBottom: 32 }}>
          
          {/* AI Health Matrix */}
          <Card variant="glass" padding={20}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 24 }}>
              <View>
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800" }}>Neural Matrix</Text>
                <Text style={{ color: "#8E8E93", fontSize: 11, fontWeight: "500", marginTop: 2 }}>Optimization Score</Text>
              </View>
              <Badge label="OPTIMIZED" variant="primary" />
            </View>
            
            <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
              <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 8, borderColor: "#1A1A1A", borderTopColor: "#00F0FF", borderRightColor: "#00F0FF", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "900" }}>85</Text>
                <Text style={{ color: "#00F0FF", fontSize: 8, fontWeight: "800" }}>SCORE</Text>
              </View>
              <View style={{ flex: 1, gap: 12 }}>
                <View>
                  <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "700" }}>KEYWORD DENSITY</Text>
                  <View style={{ height: 4, backgroundColor: "#1A1A1A", borderRadius: 2, marginTop: 4 }}>
                    <View style={{ height: 4, backgroundColor: "#00F0FF", borderRadius: 2, width: "92%" }} />
                  </View>
                </View>
                <View>
                  <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "700" }}>READABILITY</Text>
                  <View style={{ height: 4, backgroundColor: "#1A1A1A", borderRadius: 2, marginTop: 4 }}>
                    <View style={{ height: 4, backgroundColor: "#8B5CF6", borderRadius: 2, width: "78%" }} />
                  </View>
                </View>
              </View>
            </View>
          </Card>

          {/* Active Resumes */}
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>ACTIVE REPOSITORY</Text>
              <Pressable><Text style={{ color: "#00F0FF", fontSize: 11, fontWeight: "700" }}>VIEW ALL</Text></Pressable>
            </View>
            
            {doc && (
              <Card variant="glass" padding={12} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 44, height: 56, borderRadius: 4, backgroundColor: "#1A1A1A", borderStyle: "dashed", borderWidth: 1, borderColor: "#333", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                    <LucideFileText color="#444444" size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>{doc.title.toUpperCase()}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#34C759" }} />
                      <Text style={{ color: "#8E8E93", fontSize: 11 }}>UPDATED 2H AGO</Text>
                    </View>
                  </View>
                  <Button 
                    variant="ghost" 
                    title="" 
                    icon={<LucideChevronRight color="#00F0FF" size={20} />} 
                    onPress={() => router.push("/(main)/editor")}
                  />
                </View>
              </Card>
            )}

            <Button 
              title="INITIALIZE NEW PROJECT" 
              variant="outline"
              size="md"
              icon={<LucidePlus color="#FFFFFF" size={18} />}
              style={{ borderStyle: "dashed" }}
            />
          </View>

        </View>

        {/* Neural Activity Timeline */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800", marginBottom: 16 }}>NEURAL ACTIVITY</Text>
          <Card variant="outline" padding={20}>
            <View style={{ gap: 20 }}>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0, 240, 255, 0.1)", alignItems: "center", justifyContent: "center" }}>
                  <LucideTarget color="#00F0FF" size={12} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>RESUME VIEWED</Text>
                  <Text style={{ color: "#8E8E93", fontSize: 11, marginTop: 2 }}>Recruiter from Stripe accessed your Product Designer profile.</Text>
                  <Text style={{ color: "#444", fontSize: 9, fontWeight: "800", marginTop: 4 }}>24 MIN AGO</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(139, 92, 246, 0.1)", alignItems: "center", justifyContent: "center" }}>
                  <LucideZap color="#8B5CF6" size={12} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>AI REWRITE COMPLETE</Text>
                  <Text style={{ color: "#8E8E93", fontSize: 11, marginTop: 2 }}>Experience section optimized for Google Senior Role requirements.</Text>
                  <Text style={{ color: "#444", fontSize: 9, fontWeight: "800", marginTop: 4 }}>2 HOURS AGO</Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* Smart Job Match Footer */}
        <View style={{ marginBottom: 40 }}>
           <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "800" }}>MATCH RECOMMENDATIONS</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              <Card variant="glass" padding={16} style={{ width: 260 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <View style={{ width: 40, height: 40, backgroundColor: "#1A1A1A", borderRadius: 8, alignItems: "center", justifyContent: "center" }}>
                    <LucideZap color="#00F0FF" size={20} />
                  </View>
                  <View>
                    <Text style={{ color: "#8E8E93", fontSize: 10, fontWeight: "800" }}>FIGMA</Text>
                    <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>Sr. UX Designer</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                   <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                     <LucideTarget color="#00F0FF" size={12} />
                     <Text style={{ color: "#00F0FF", fontSize: 11, fontWeight: "900" }}>98% MATCH</Text>
                   </View>
                   <Text style={{ color: "#8E8E93", fontSize: 11 }}>$180k+</Text>
                </View>
                <Button title="MATCH & APPLY" variant="primary" size="sm" style={{ marginTop: 16 }} />
              </Card>
            </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
