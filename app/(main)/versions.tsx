import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import {
  getActiveDocumentId,
  getDocumentById,
  updateDocumentSource,
  type ResumeDocument,
  type ResumeVersion,
} from "@/services/storageService";

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
  const [previewVersion, setPreviewVersion] = useState<ResumeVersion | null>(null);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D1117" }}>
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#30363D" }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ color: "#58A6FF", fontSize: 14 }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#E6EDF3" }}>Version History</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        {versions.length === 0 && (
          <Text style={{ color: "#8B949E", textAlign: "center", marginTop: 40 }}>No versions yet.</Text>
        )}
        {versions.map((v, i) => (
          <View key={v.id} style={{
            backgroundColor: "#161B22", borderRadius: 12, borderWidth: 1,
            borderColor: i === 0 ? "#58A6FF" : "#30363D", padding: 14,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{
                  backgroundColor: i === 0 ? "#1F3A5F" : "#1C2128",
                  borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
                }}>
                  <Text style={{ color: i === 0 ? "#58A6FF" : "#8B949E", fontSize: 11, fontWeight: "700" }}>
                    {i === 0 ? "● CURRENT" : v.id.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={{ color: "#6E7681", fontSize: 11 }}>{timeAgo(v.timestamp)}</Text>
            </View>
            <Text style={{ color: "#C9D1D9", fontSize: 13, fontWeight: "600", marginBottom: 10 }}>{v.label}</Text>
            {i !== 0 && (
              <Pressable
                onPress={() => handleRestore(v)}
                style={{ backgroundColor: "#1C2128", borderRadius: 8, paddingVertical: 8, alignItems: "center", borderWidth: 1, borderColor: "#30363D" }}
              >
                <Text style={{ color: "#8B949E", fontSize: 12, fontWeight: "600" }}>↩ Restore this version</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
