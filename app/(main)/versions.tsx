import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  getActiveDocumentId,
  getDocumentById,
  updateDocumentSource,
  type ResumeDocument,
  type ResumeVersion,
} from "@/services/storageService";
import { computeDiff, type DiffLine } from "@/services/aiService";
import { 
  LucideHistory, 
  LucideRotateCcw, 
  LucideChevronLeft, 
  LucideCheckCircle2, 
  LucideEye,
  LucideX
} from "lucide-react-native";
import { Modal } from "react-native";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

import { Theme, type AppTheme } from "@/constants/Theme";
import { getSettings } from "@/services/storageService";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

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
    if (id) setDoc(await getDocumentById(id));
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
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: theme.border }}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(main)/dashboard");
            }
          }} 
          activeOpacity={0.7} 
          style={{ marginRight: 16 }}
        >
          <LucideChevronLeft color={theme.accent} size={24} />
        </TouchableOpacity>
        <View>
          <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>TIMELINE</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: theme.textPrimary }}>Version History</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 8, lineHeight: 20 }}>
          View and restore previous iterations of your resume. Each major edit or AI generation creates a recovery point.
        </Text>

        {versions.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <LucideHistory color={theme.border} size={48} />
            <Text style={{ color: theme.textMuted, textAlign: "center", marginTop: 16, fontWeight: "800" }}>NO SNAPSHOTS DETECTED</Text>
          </View>
        )}

        {versions.map((v, i) => (
          <View key={v.id} style={{
            backgroundColor: theme.card, borderRadius: 8, borderWidth: 1,
            borderColor: i === 0 ? theme.accent : theme.border, padding: 16,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{
                  backgroundColor: i === 0 ? theme.accent + "15" : theme.surface,
                  borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
                  borderWidth: 1, borderColor: i === 0 ? theme.accent : theme.border
                }}>
                  <Text style={{ color: i === 0 ? theme.accent : theme.textSecondary, fontSize: 9, fontWeight: "900", letterSpacing: 1 }}>
                    {i === 0 ? "CURRENT" : v.id.toUpperCase()}
                  </Text>
                </View>
                {i === 0 && <LucideCheckCircle2 color={theme.accent} size={14} />}
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "700" }}>{timeAgo(v.timestamp).toUpperCase()}</Text>
            </View>

            <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "700", marginBottom: 14 }}>{v.label}</Text>
            
            <View style={{ flexDirection: "row", gap: 10 }}>
              {i !== 0 && (
                <TouchableOpacity
                  onPress={() => handleRestore(v)}
                  activeOpacity={0.7}
                  style={{ 
                    flex: 1,
                    backgroundColor: theme.surface, borderRadius: 4, paddingVertical: 10, 
                    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
                    borderWidth: 1, borderColor: theme.border
                  }}
                >
                  <LucideRotateCcw color={theme.textSecondary} size={14} />
                  <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 }}>RESTORE</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={() => handleViewDiff(v)}
                activeOpacity={0.7}
                style={{ 
                   flex: 1,
                   backgroundColor: theme.accent + "05", borderRadius: 4, paddingVertical: 10, 
                   alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
                   borderWidth: 1, borderColor: theme.accent + "33"
                }}
              >
                <LucideEye color={theme.accent} size={14} />
                <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 }}>VIEW DIFF</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Diff Modal */}
      <Modal
        visible={diffModal.visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDiffModal({ ...diffModal, visible: false })}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", paddingTop: 50 }}>
          <View style={{ 
            flex: 1, backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
            borderWidth: 1, borderColor: theme.border
          }}>
            <View style={{ 
              flexDirection: "row", justifyContent: "space-between", alignItems: "center", 
              padding: 20, borderBottomWidth: 1, borderColor: theme.border 
            }}>
              <View>
                <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>CHANGES SINCE</Text>
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: "800" }}>{diffModal.label}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setDiffModal({ ...diffModal, visible: false })}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}
              >
                <LucideX color={theme.textPrimary} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {diffModal.diff.map((line, idx) => (
                <View key={idx} style={{ 
                  flexDirection: "row", 
                  backgroundColor: line.type === "added" ? theme.success + "15" : 
                                   line.type === "removed" ? theme.danger + "15" : "transparent",
                  paddingVertical: 2,
                  paddingHorizontal: 4,
                  borderRadius: 2,
                  marginBottom: 1
                }}>
                  <Text style={{ 
                    color: theme.textMuted, fontSize: 10, width: 30, textAlign: "right", marginRight: 10,
                    fontFamily: "monospace"
                  }}>
                    {line.lineNumber}
                  </Text>
                  <Text style={{ 
                    color: line.type === "added" ? theme.success : 
                           line.type === "removed" ? theme.danger : theme.textMuted,
                    fontSize: 10,
                    width: 15,
                    fontFamily: "monospace"
                  }}>
                    {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                  </Text>
                  <Text style={{ 
                    color: line.type === "added" ? theme.success : 
                           line.type === "removed" ? theme.danger : theme.textPrimary,
                    fontSize: 11,
                    flex: 1,
                    fontFamily: "monospace"
                  }}>
                    {line.content || " "}
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
