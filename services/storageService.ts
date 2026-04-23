import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ResumeVersion {
  id: string;
  timestamp: number;
  label: string;
  source: string; // DSL source
  templateId: string;
}

export interface ResumeDocument {
  id: string;
  title: string;
  currentSource: string;
  templateId: string;
  createdAt: number;
  updatedAt: number;
  versions: ResumeVersion[];
  apiKey?: string;
}

const KEYS = {
  DOCUMENTS: "resume:documents",
  ACTIVE_ID: "resume:activeId",
  API_KEY: "resume:apiKey",
  ONBOARDING_DONE: "resume:onboardingDone",
};

// ─── Documents ─────────────────────────────────────────────────────────────

export async function getAllDocuments(): Promise<ResumeDocument[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DOCUMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveDocument(doc: ResumeDocument): Promise<void> {
  const docs = await getAllDocuments();
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) docs[idx] = doc;
  else docs.push(doc);
  await AsyncStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(docs));
}

export async function deleteDocument(id: string): Promise<void> {
  const docs = await getAllDocuments();
  await AsyncStorage.setItem(
    KEYS.DOCUMENTS,
    JSON.stringify(docs.filter((d) => d.id !== id))
  );
}

export async function getDocumentById(id: string): Promise<ResumeDocument | null> {
  const docs = await getAllDocuments();
  return docs.find((d) => d.id === id) ?? null;
}

export async function createDocument(
  title: string,
  source: string,
  templateId: string
): Promise<ResumeDocument> {
  const doc: ResumeDocument = {
    id: Date.now().toString(),
    title,
    currentSource: source,
    templateId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [
      {
        id: "v1",
        timestamp: Date.now(),
        label: "Initial version",
        source,
        templateId,
      },
    ],
  };
  await saveDocument(doc);
  return doc;
}

// ─── Source Updates & Versioning ───────────────────────────────────────────

export async function updateDocumentSource(
  id: string,
  newSource: string,
  versionLabel: string
): Promise<ResumeDocument | null> {
  const doc = await getDocumentById(id);
  if (!doc) return null;

  const version: ResumeVersion = {
    id: `v${doc.versions.length + 1}`,
    timestamp: Date.now(),
    label: versionLabel,
    source: newSource,
    templateId: doc.templateId,
  };

  doc.currentSource = newSource;
  doc.updatedAt = Date.now();
  // Keep last 20 versions
  doc.versions = [...doc.versions.slice(-19), version];

  await saveDocument(doc);
  return doc;
}

// ─── Active Document ────────────────────────────────────────────────────────

export async function getActiveDocumentId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.ACTIVE_ID);
}

export async function setActiveDocumentId(id: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.ACTIVE_ID, id);
}

// ─── API Key ────────────────────────────────────────────────────────────────

export async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.API_KEY);
}

export async function saveApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.API_KEY, key);
}

// ─── Onboarding ─────────────────────────────────────────────────────────────

export async function isOnboardingDone(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return val === "true";
}

export async function setOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, "true");
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
