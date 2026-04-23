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
import { LucideHistory, LucideRotateCcw, LucideChevronLeft, LucideCheckCircle2 } from "lucide-react-native";

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

  useEffect(() => {
    (async () => {
      const id = await getActiveDocumentId();
      if (id) setDoc(await getDocumentById(id));
    })();
  }, []);

  async function handleRestore(version: ResumeVersion) {
    if (!doc) return;
    await updateDocumentSource(doc.id, version.source, `Restored to ${version.label}`);
    router.back();
  }

  const versions = [...(doc?.versions ?? [])].reverse();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: "#1F1F1F" }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginRight: 16 }}>
          <LucideChevronLeft color="#00F0FF" size={24} />
        </TouchableOpacity>
        <View>
          <Text style={{ color: "#00F0FF", fontSize: 10, fontWeight: "900", letterSpacing: 2 }}>TIMELINE</Text>
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF" }}>Version History</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text style={{ color: "#8E8E93", fontSize: 13, marginBottom: 8, lineHeight: 20 }}>
          View and restore previous iterations of your resume. Each major edit or AI generation creates a recovery point.
        </Text>

        {versions.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <LucideHistory color="#1F1F1F" size={48} />
            <Text style={{ color: "#444", textAlign: "center", marginTop: 16, fontWeight: "800" }}>NO SNAPSHOTS DETECTED</Text>
          </View>
        )}

        {versions.map((v, i) => (
          <View key={v.id} style={{
            backgroundColor: "#121212", borderRadius: 8, borderWidth: 1,
            borderColor: i === 0 ? "#00F0FF" : "#1F1F1F", padding: 16,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{
                  backgroundColor: i === 0 ? "rgba(0, 240, 255, 0.1)" : "#1A1A1A",
                  borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
                  borderWidth: 1, borderColor: i === 0 ? "#00F0FF" : "#2A2A2A"
                }}>
                  <Text style={{ color: i === 0 ? "#00F0FF" : "#8E8E93", fontSize: 9, fontWeight: "900", letterSpacing: 1 }}>
                    {i === 0 ? "CURRENT" : v.id.toUpperCase()}
                  </Text>
                </View>
                {i === 0 && <LucideCheckCircle2 color="#00F0FF" size={14} />}
              </View>
              <Text style={{ color: "#444", fontSize: 11, fontWeight: "700" }}>{timeAgo(v.timestamp).toUpperCase()}</Text>
            </View>

            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700", marginBottom: 14 }}>{v.label}</Text>
            
            {i !== 0 && (
              <TouchableOpacity
                onPress={() => handleRestore(v)}
                activeOpacity={0.7}
                style={{ 
                  backgroundColor: "#1A1A1A", borderRadius: 4, paddingVertical: 10, 
                  alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8,
                  borderWidth: 1, borderColor: "#2A2A2A"
                }}
              >
                <LucideRotateCcw color="#8E8E93" size={14} />
                <Text style={{ color: "#8E8E93", fontSize: 12, fontWeight: "800", letterSpacing: 0.5 }}>RESTORE THIS VERSION</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
