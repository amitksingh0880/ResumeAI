import { router, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import {
  getAllDocuments,
  getActiveDocumentId,
  getDocumentById,
  setActiveDocumentId,
  deleteDocument,
  deleteMultipleDocuments,
  type ResumeDocument,
} from "@/services/storageService";
import { parseResumeDSL } from "@/services/dslParser";
import { Theme, type AppTheme } from "@/constants/Theme";
import { getSettings } from "@/services/storageService";
import {
  LucideZap,
  LucideFileText,
  LucidePlus,
  LucideChevronRight,
  LucideTarget,
  LucideSettings,
  LucideTrash2,
  LucideSquare,
  LucideCheckSquare,
  LucideFileSignature,
  LucideSpellCheck,
} from "lucide-react-native";

export default function DashboardScreen() {
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [allDocs, setAllDocs] = useState<ResumeDocument[]>([]);
  const [skillCount, setSkillCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [theme, setTheme] = useState<AppTheme>(Theme.dark);
  const [isEditMode, setIsEditMode] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
      getSettings().then(s => setTheme(Theme[s.appearance]));
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
    if (isEditMode) {
      toggleSelection(id);
      return;
    }
    await setActiveDocumentId(id);
    loadData();
  }

  function toggleSelection(id: string) {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  function handleSelectAll() {
    if (selectedIds.length === allDocs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allDocs.map(d => d.id));
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;

    const performDelete = async () => {
      await deleteMultipleDocuments(selectedIds);
      setSelectedIds([]);
      setIsEditMode(false);
      loadData();
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Are you sure you want to delete ${selectedIds.length} repositories?`)) {
        performDelete();
      }
      return;
    }

    Alert.alert(
      "Bulk Delete",
      `Are you sure you want to delete ${selectedIds.length} repositories?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete }
      ]
    );
  }

  async function handleDelete(id: string) {
    const performDelete = async () => {
      await deleteDocument(id);
      loadData();
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to permanently delete this repository?")) {
        performDelete();
      }
      return;
    }

    Alert.alert(
      "Delete Resume",
      "Are you sure you want to permanently delete this repository?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: performDelete }
      ]
    );
  }

  const score = skillCount > 0 ? Math.min(60 + skillCount * 2, 99) : 85;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Header ── */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32, marginTop: 10 }}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 12, height: 2, backgroundColor: theme.accent, borderRadius: 1 }} />
              <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" }}>Studio Intelligence</Text>
            </View>
            <Text style={{ color: theme.textPrimary, fontSize: 28, fontWeight: "800", marginTop: 4, letterSpacing: -0.5 }}>Command Center</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(main)/settings")}
            activeOpacity={0.7}
            style={{ 
              width: 48, height: 48, borderRadius: 14, 
              backgroundColor: theme.card, alignItems: "center", justifyContent: "center", 
              borderWidth: 1, borderColor: theme.border,
              shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8
            }}
          >
            <LucideSettings color={theme.textPrimary} size={22} />
          </TouchableOpacity>
        </View>

        {/* ── AI Health Matrix ── */}
        <View style={{ 
          backgroundColor: theme.card, borderRadius: 20, borderWidth: 1, borderColor: theme.border, 
          padding: 24, marginBottom: 28,
          shadowColor: theme.glow, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 24 }}>
            <View>
              <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "800" }}>Portfolio Matrix</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Real-time Optimization Score</Text>
            </View>
            <View style={{ 
              backgroundColor: theme.accentMuted, borderRadius: 6, paddingHorizontal: 12, height: 26, 
              justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: theme.accent + "33" 
            }}>
              <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 1 }}>SYSTEM ACTIVE</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 32 }}>
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <View style={{ 
                width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: theme.border,
                alignItems: "center", justifyContent: "center",
                shadowColor: theme.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15
              }}>
                <View style={{ 
                  position: "absolute", width: 100, height: 100, borderRadius: 50, 
                  borderWidth: 4, borderColor: theme.accent, borderTopColor: "transparent", borderLeftColor: "transparent",
                  transform: [{ rotate: "45deg" }]
                }} />
                <Text style={{ color: theme.textPrimary, fontSize: 32, fontWeight: "900" }}>{score}</Text>
                <Text style={{ color: theme.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1 }}>INDEX</Text>
              </View>
            </View>

            <View style={{ flex: 1, gap: 16 }}>
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>KEYWORD DENSITY</Text>
                  <Text style={{ color: theme.textPrimary, fontSize: 10, fontWeight: "900" }}>92%</Text>
                </View>
                <View style={{ height: 6, backgroundColor: theme.surface, borderRadius: 3, overflow: "hidden" }}>
                  <View style={{ height: "100%", backgroundColor: theme.accent, width: "92%" }} />
                </View>
              </View>

              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>SYSTEM READABILITY</Text>
                  <Text style={{ color: theme.textPrimary, fontSize: 10, fontWeight: "900" }}>78%</Text>
                </View>
                <View style={{ height: 6, backgroundColor: theme.surface, borderRadius: 3, overflow: "hidden" }}>
                  <View style={{ height: "100%", backgroundColor: theme.accent, width: "78%" }} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Quick Actions Grid ── */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 16, paddingLeft: 4 }}>OPERATIONAL TASKS</Text>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <ActionCard 
                icon={<LucideFileText color={theme.accent} size={24} />} 
                label="EDITOR" 
                sub="Source View"
                onPress={() => router.push("/(main)/editor")}
                theme={theme}
              />
              <ActionCard 
                icon={<LucideTarget color={theme.accent} size={24} />} 
                label="JOB MATCH" 
                sub="ATS Scan"
                onPress={() => router.push("/(main)/match")}
                theme={theme}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <ActionCard 
                icon={<LucideFileSignature color={theme.accent} size={24} />} 
                label="COVER LETTER" 
                sub="AI Content"
                onPress={() => router.push("/(main)/cover-letter")}
                theme={theme}
              />
              <ActionCard 
                icon={<LucideZap color={theme.accent} size={24} />} 
                label="ROADMAP" 
                sub="Career Path"
                onPress={() => router.push("/(main)/roadmap")}
                theme={theme}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <ActionCard 
                icon={<LucideSpellCheck color={theme.accent} size={24} />} 
                label="GRAMMAR" 
                sub="AI Audit"
                onPress={() => router.push("/(main)/grammar")}
                theme={theme}
              />
              <ActionCard 
                icon={<LucideFileText color={theme.accent} size={24} />} 
                label="VERSIONS" 
                sub="Snapshots"
                onPress={() => router.push("/(main)/versions")}
                theme={theme}
              />
            </View>
          </View>
        </View>

        {/* ── Active Repository ── */}
        <View style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingHorizontal: 4 }}>
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "900", letterSpacing: 2 }}>ACTIVE REPOSITORY</Text>
            <TouchableOpacity onPress={() => router.push("/(main)/editor")} activeOpacity={0.7}>
              <Text style={{ color: theme.accent, fontSize: 11, fontWeight: "800" }}>VIEW ALL →</Text>
            </TouchableOpacity>
          </View>

          {doc ? (
            <TouchableOpacity
              onPress={() => router.push("/(main)/editor")}
              activeOpacity={0.9}
              style={{ 
                backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, 
                padding: 20, flexDirection: "row", alignItems: "center",
                shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12
              }}
            >
              <View style={{ 
                width: 50, height: 64, borderRadius: 8, backgroundColor: theme.surface, 
                borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center", marginRight: 16 
              }}>
                <LucideFileText color={theme.accent} size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: "800", letterSpacing: -0.2 }} numberOfLines={1}>{doc.title.toUpperCase()}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.success, marginRight: 8, shadowColor: theme.success, shadowRadius: 4, shadowOpacity: 0.5 }} />
                  <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600" }}>
                    {skillCount} Tech Nodes · v{doc.versions?.length ?? 1}
                  </Text>
                </View>
              </View>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
                <LucideChevronRight color={theme.accent} size={18} />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/(onboarding)/import")}
              activeOpacity={0.7}
              style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 32, alignItems: "center", borderStyle: "dashed" }}
            >
              <LucidePlus color={theme.textMuted} size={32} />
              <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "800", textAlign: "center", marginTop: 12 }}>INITIALIZE FIRST REPOSITORY</Text>
            </TouchableOpacity>
          )}

          {!doc && (
            <TouchableOpacity
              onPress={() => router.push("/(onboarding)/import")}
              activeOpacity={0.7}
              style={{ 
                marginTop: 12, borderRadius: 12, backgroundColor: theme.accent, 
                padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10,
                shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8
              }}
            >
              <LucidePlus color="#000" size={20} />
              <Text style={{ color: "#000", fontSize: 13, fontWeight: "900", letterSpacing: 1 }}>CREATE NEW RESUME</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── All Resumes ── */}
        {allDocs.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 12, fontWeight: "900", letterSpacing: 1.5 }}>
                {isEditMode ? `SELECTED (${selectedIds.length})` : "ALL REPOSITORIES"}
              </Text>
              
              <View style={{ flexDirection: "row", gap: 12 }}>
                {isEditMode && (
                  <TouchableOpacity onPress={handleSelectAll}>
                    <Text style={{ color: theme.accent, fontSize: 11, fontWeight: "700" }}>
                      {selectedIds.length === allDocs.length ? "DESELECT ALL" : "SELECT ALL"}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => {
                  setIsEditMode(!isEditMode);
                  setSelectedIds([]);
                }}>
                  <Text style={{ color: isEditMode ? theme.danger : theme.accent, fontSize: 11, fontWeight: "700" }}>
                    {isEditMode ? "CANCEL" : "SELECT"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {allDocs.map((d) => (
              <View
                key={d.id}
                style={{
                  backgroundColor: selectedIds.includes(d.id) ? theme.accent + "10" : theme.card,
                  borderRadius: 8, borderWidth: 1,
                  borderColor: selectedIds.includes(d.id) ? theme.accent : theme.border,
                  marginBottom: 8, flexDirection: "row", alignItems: "center"
                }}
              >
                <TouchableOpacity 
                  onPress={() => handleSwitch(d.id)}
                  style={{ flex: 1, padding: 12, flexDirection: "row", alignItems: "center" }}
                  activeOpacity={0.7}
                >
                  {isEditMode ? (
                    <View style={{ marginRight: 12 }}>
                      {selectedIds.includes(d.id) ? (
                        <LucideCheckSquare color={theme.accent} size={18} />
                      ) : (
                        <LucideSquare color={theme.textMuted} size={18} />
                      )}
                    </View>
                  ) : (
                    <LucideFileText color={doc?.id === d.id ? theme.accent : theme.textMuted} size={16} />
                  )}
                  
                  <View style={{ marginLeft: isEditMode ? 0 : 12, flex: 1 }}>
                    <Text style={{ color: doc?.id === d.id || selectedIds.includes(d.id) ? theme.textPrimary : theme.textSecondary, fontSize: 13, fontWeight: "700" }}>{d.title}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                      <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }}>{d.templateId.toUpperCase()}</Text>
                      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.border, marginHorizontal: 6 }} />
                      <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: "900" }}>
                        {new Date(d.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                
                {!isEditMode && (
                  <TouchableOpacity 
                    onPress={() => handleDelete(d.id)}
                    style={{ padding: 12, marginRight: 4 }}
                    activeOpacity={0.7}
                  >
                    <LucideTrash2 color={theme.danger} size={16} />
                  </TouchableOpacity>
                )}

                {doc?.id === d.id && !isEditMode && <View style={{ width: 4, height: 24, backgroundColor: theme.accent, borderTopLeftRadius: 2, borderBottomLeftRadius: 2 }} />}
              </View>
            ))}

            {isEditMode && selectedIds.length > 0 && (
              <TouchableOpacity
                onPress={handleBulkDelete}
                activeOpacity={0.8}
                style={{
                  backgroundColor: theme.danger,
                  borderRadius: 4, paddingVertical: 14,
                  alignItems: "center", marginTop: 8
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 11, letterSpacing: 1.5 }}>
                  DELETE {selectedIds.length} SELECTED
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Neural Activity ── */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: theme.textPrimary, fontSize: 12, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 }}>NEURAL ACTIVITY</Text>
          <View style={{ backgroundColor: "transparent", borderRadius: 8, borderWidth: 1, borderColor: theme.border, padding: 20 }}>
            <View style={{ flexDirection: "row", marginBottom: 20 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.accent + "15", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                <LucideTarget color={theme.accent} size={12} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "700" }}>RESUME VIEWED</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>Recruiter from Stripe viewed your Product Designer profile.</Text>
                <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: "800", marginTop: 4 }}>24 MIN AGO</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: theme.accent + "15", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                <LucideZap color={theme.accent} size={12} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "700" }}>AI REWRITE COMPLETE</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>Experience section optimized for Google Senior Role.</Text>
                <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: "800", marginTop: 4 }}>2 HOURS AGO</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Skills shortcut ── */}
        {skillCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/(main)/skills")}
            activeOpacity={0.8}
            style={{ marginBottom: 40, backgroundColor: theme.card, borderRadius: 8, borderWidth: 1, borderColor: theme.border, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <View>
              <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>YOUR TECH STACK</Text>
              <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: "900", marginTop: 4 }}>
                {skillCount} <Text style={{ color: theme.accent }}>Skills</Text>
              </Text>
            </View>
            <LucideChevronRight color={theme.accent} size={24} />
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function ActionCard({ icon, label, sub, onPress, theme }: { icon: any, label: string, sub: string, onPress: () => void, theme: AppTheme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ 
        flex: 1, backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, 
        padding: 18, alignItems: "flex-start",
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6
      }}
    >
      <View style={{ 
        width: 44, height: 44, borderRadius: 10, backgroundColor: theme.surface, 
        alignItems: "center", justifyContent: "center", marginBottom: 12,
        borderWidth: 1, borderColor: theme.border
      }}>
        {icon}
      </View>
      <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: "800", letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: "600", marginTop: 2 }}>{sub}</Text>
    </TouchableOpacity>
  );
}
