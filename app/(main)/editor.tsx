import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import {
  LucideChevronLeft,
  LucidePlay,
  LucideSave,
  LucideZap,
  LucideMaximize,
  LucideCode,
  LucideEye,
  LucideDownload
} from "lucide-react-native";
import { Button, Card, Badge } from "@/components/ui";
import { 
  getActiveDocumentId, 
  getDocumentById, 
  updateDocumentSource 
} from "@/services/storageService";

export default function EditorScreen() {
  const [source, setSource] = useState("");
  const [docId, setDocId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    loadDoc();
  }, []);

  async function loadDoc() {
    const id = await getActiveDocumentId();
    if (id) {
      setDocId(id);
      const d = await getDocumentById(id);
      if (d) setSource(d.currentSource);
    }
  }

  async function handleSave() {
    if (docId) {
      await updateDocumentSource(docId, source);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      {/* Top Header */}
      <View style={{ height: 60, flexDirection: "row", alignItems: "center", px: 16, borderBottomWidth: 1, borderColor: "#1F1F1F", paddingHorizontal: 16, justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable onPress={() => router.back()}>
            <LucideChevronLeft color="#00F0FF" size={24} />
          </Pressable>
          <View>
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>EDITOR</Text>
            <Text style={{ color: "#444", fontSize: 10, fontWeight: "800" }}>SENIOR_ENG_2024.YAML</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button variant="ghost" title="" icon={<LucideSave color="#FFFFFF" size={20} />} onPress={handleSave} />
          <Button variant="primary" title="EXPORT" size="sm" icon={<LucideDownload color="#000" size={16} />} />
        </View>
      </View>

      {/* View Toggle */}
      <View style={{ flexDirection: "row", padding: 12, gap: 8, backgroundColor: "#121212" }}>
        <Pressable 
          onPress={() => setViewMode("edit")}
          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 36, borderRadius: 4, backgroundColor: viewMode === "edit" ? "#1F1F1F" : "transparent", borderWidth: 1, borderColor: viewMode === "edit" ? "#00F0FF" : "transparent" }}
        >
          <LucideCode color={viewMode === "edit" ? "#00F0FF" : "#444"} size={16} />
          <Text style={{ color: viewMode === "edit" ? "#FFFFFF" : "#444", fontSize: 11, fontWeight: "800" }}>SOURCE</Text>
        </Pressable>
        <Pressable 
          onPress={() => setViewMode("preview")}
          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 36, borderRadius: 4, backgroundColor: viewMode === "preview" ? "#1F1F1F" : "transparent", borderWidth: 1, borderColor: viewMode === "preview" ? "#00F0FF" : "transparent" }}
        >
          <LucideEye color={viewMode === "preview" ? "#00F0FF" : "#444"} size={16} />
          <Text style={{ color: viewMode === "preview" ? "#FFFFFF" : "#444", fontSize: 11, fontWeight: "800" }}>RENDER</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        {viewMode === "edit" ? (
          <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <TextInput
                multiline
                value={source}
                onChangeText={setSource}
                style={{ 
                  color: "#FFFFFF", 
                  fontFamily: "JetBrains Mono", 
                  fontSize: 13, 
                  lineHeight: 20 
                }}
                placeholderTextColor="#333"
                spellCheck={false}
                autoCapitalize="none"
              />
            </ScrollView>
          </View>
        ) : (
          <View style={{ flex: 1, backgroundColor: "#1A1A1A", padding: 20 }}>
             <ScrollView>
               <Card variant="solid" padding={32} style={{ backgroundColor: "#FFFFFF", borderRadius: 0, minHeight: 600 }}>
                  <View style={{ borderLeftWidth: 4, borderColor: "#00F0FF", paddingLeft: 20, marginBottom: 32 }}>
                    <Text style={{ fontSize: 32, fontWeight: "900", color: "#000000" }}>ALEX RIVERA</Text>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#00F0FF", marginTop: 4 }}>Senior Software Engineer</Text>
                  </View>
                  
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 10, fontWeight: "900", color: "#AAA", borderBottomWidth: 1, borderColor: "#EEE", paddingBottom: 4, marginBottom: 12 }}>PROFESSIONAL SUMMARY</Text>
                    <Text style={{ fontSize: 13, color: "#333", lineHeight: 20 }}>
                      Highly motivated engineer with 8+ years experience in building scalable distributed systems and professional modern UIs.
                    </Text>
                  </View>

                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 10, fontWeight: "900", color: "#AAA", borderBottomWidth: 1, borderColor: "#EEE", paddingBottom: 4, marginBottom: 12 }}>EXPERIENCE</Text>
                    <View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ fontWeight: "700", color: "#000" }}>Principal Developer</Text>
                        <Text style={{ fontSize: 11, color: "#AAA" }}>Jan 2021 — Present</Text>
                      </View>
                      <Text style={{ fontSize: 13, color: "#00F0FF", fontWeight: "600", marginBottom: 8 }}>TechFlow Solutions</Text>
                      <View style={{ gap: 4 }}>
                         <Text style={{ fontSize: 12, color: "#444" }}>• Architected real-time data sync engine reducing latency by 45%.</Text>
                         <Text style={{ fontSize: 12, color: "#444" }}>• Led team of 12 through complete stack modernization.</Text>
                      </View>
                    </View>
                  </View>
               </Card>
             </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Magic Rewrite FAB */}
      <Pressable 
        style={{ 
          position: "absolute", 
          bottom: 24, 
          right: 24, 
          width: 56, 
          height: 56, 
          borderRadius: 28, 
          backgroundColor: "#8B5CF6", 
          alignItems: "center", 
          justifyContent: "center",
          shadowColor: "#8B5CF6",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 10
        }}
      >
        <LucideZap color="#FFFFFF" size={28} />
      </Pressable>

    </SafeAreaView>
  );
}
