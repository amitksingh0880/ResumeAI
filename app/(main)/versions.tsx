import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View, Modal } from "react-native";
import {
  getActiveDocumentId,
  getDocumentById,
  updateDocumentSource,
  type ResumeDocument,
  type ResumeVersion,
  getSettings,
} from "@/services/storageService";
import { computeDiff, type DiffLine } from "@/services/aiService";
import { 
  LucideHistory, 
  LucideRotateCcw, 
  LucideChevronLeft, 
  LucideCheckCircle2, 
  LucideEye,
  LucideX,
  LucideClock
} from "lucide-react-native";
import { Theme, type AppTheme } from "@/constants/Theme";
import { useFocusEffect } from "expo-router";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function VersionsScreen() {
  const [doc, setDoc] = useState<ResumeDocument | null>(null);
  const [theme, setTheme] = useState<AppTheme>(Theme.dark);
  const [diffModal, setDiffModal] = useState<{ visible: boolean; diff: DiffLine[]; label: string }>({
    visible: false,
    diff: [],
    label: ""
  });

  useFocusEffect(
    useCallback(() => {
      loadDoc();
      getSettings().then(s => setTheme(Theme[s.appearance]));
    }, [])
  );

  async function loadDoc() {
    const id = await getActiveDocumentId();
    if (id) {
      const d = await getDocumentById(id);
      setDoc(d);
    }
  }

  function handleViewDiff(version: ResumeVersion) {
    if (!doc) return;
    const diff = computeDiff(version.source, doc.currentSource);
    setDiffModal({
      visible: true,
      diff,
      label: version.label
    });
  }

  async function handleRestore(version: ResumeVersion) {
    if (!doc) return;
    await updateDocumentSource(doc.id, version.source, `Restored to ${version.label}`);
    router.back();
  }

  const versions = [...(doc?.versions ?? [])].reverse();

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
          <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>STUDIO TIMELINE</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: theme.textPrimary, letterSpacing: -0.5 }}>Version History</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <LucideClock color={theme.textMuted} size={16} />
          <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "900", letterSpacing: 1 }}>SNAPSHOT HISTORY</Text>
        </View>

        {versions.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center", gap: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}>
              <LucideHistory color={theme.textMuted} size={32} />
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: "center" }}>No previous snapshots found for this repository.</Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {versions.map((v, i) => (
              <View key={v.timestamp + i} style={{ backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.textPrimary, fontSize: 15, fontWeight: "800", marginBottom: 2 }}>{v.label}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "600" }}>{timeAgo(v.timestamp).toUpperCase()}</Text>
                  </View>
                  <View style={{ backgroundColor: theme.surface, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: theme.border }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 9, fontWeight: "900" }}>VER {versions.length - i}.0</Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => handleViewDiff(v)}
                    style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: theme.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: theme.border }}
                  >
                    <LucideEye color={theme.accent} size={14} />
                    <Text style={{ color: theme.textPrimary, fontSize: 11, fontWeight: "800" }}>VIEW DIFF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRestore(v)}
                    style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: theme.accentMuted, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: theme.accent + "33" }}
                  >
                    <LucideRotateCcw color={theme.accent} size={14} />
                    <Text style={{ color: theme.accent, fontSize: 11, fontWeight: "800" }}>RESTORE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Diff Modal */}
      <Modal visible={diffModal.visible} transparent animationType="slide" onRequestClose={() => setDiffModal({ ...diffModal, visible: false })}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" }}>
          <View style={{ height: "80%", backgroundColor: theme.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <View>
                <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>CHANGE ANALYTICS</Text>
                <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: "800" }}>{diffModal.label}</Text>
              </View>
              <TouchableOpacity onPress={() => setDiffModal({ ...diffModal, visible: false })} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, alignItems: "center", justifyContent: "center" }}>
                <LucideX color={theme.textPrimary} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {diffModal.diff.map((line, i) => (
                <View key={i} style={{ 
                  flexDirection: "row", paddingVertical: 4, paddingHorizontal: 8,
                  backgroundColor: line.type === "added" ? theme.success + "15" : line.type === "removed" ? theme.danger + "15" : "transparent",
                  borderLeftWidth: 3, borderLeftColor: line.type === "added" ? theme.success : line.type === "removed" ? theme.danger : "transparent",
                  marginBottom: 1
                }}>
                  <Text style={{ color: line.type === "added" ? theme.success : line.type === "removed" ? theme.danger : theme.textMuted, width: 20, fontSize: 11, fontWeight: "900" }}>
                    {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                  </Text>
                  <Text style={{ color: line.type === "added" ? theme.success : line.type === "removed" ? theme.danger : theme.textSecondary, fontSize: 11, fontFamily: "monospace", flex: 1 }}>
                    {line.content}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
