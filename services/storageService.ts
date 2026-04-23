import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ResumeVersion {
  id: string;
  timestamp: number;
  label: string;
  source: string; // DSL source
  templateId: string;
  customCSS?: string;
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
  customCSS?: string;
}

const KEYS = {
  DOCUMENTS: "resume:documents",
  ACTIVE_ID: "resume:activeId",
  API_KEY: "resume:apiKey",
  ONBOARDING_DONE: "resume:onboardingDone",
  IMPORT_DRAFT: "resume:importDraft",
  IMPORT_DRAFT_CSS: "resume:importDraftCSS",
  IMPORT_DRAFT_FILENAME: "resume:importDraftFilename",
};

// ─── Documents ─────────────────────────────────────────────────────────────

export async function getAllDocuments(): Promise<ResumeDocument[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DOCUMENTS);
    if (!raw) return [];
    const docs: ResumeDocument[] = JSON.parse(raw);
    return docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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


export async function getDocumentById(id: string): Promise<ResumeDocument | null> {
  const docs = await getAllDocuments();
  return docs.find((d) => d.id === id) ?? null;
}

export async function createDocument(
  title: string,
  source: string,
  templateId: string,
  customCSS?: string
): Promise<ResumeDocument> {
  const doc: ResumeDocument = {
    id: Date.now().toString(),
    title,
    currentSource: source,
    templateId,
    customCSS,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    versions: [
      {
        id: "v1",
        timestamp: Date.now(),
        label: "Initial version",
        source,
        templateId,
        customCSS,
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

export async function deleteDocument(id: string): Promise<void> {
  const docs = await getAllDocuments();
  const filtered = docs.filter(d => d.id !== id);
  await AsyncStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(filtered));
  
  const activeId = await getActiveDocumentId();
  if (activeId === id) {
    await AsyncStorage.removeItem(KEYS.ACTIVE_ID);
  }
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

// ─── Import Draft ──────────────────────────────────────────────────────────

export async function saveImportDraft(source: string, css?: string, filename?: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.IMPORT_DRAFT, source);
  if (css) await AsyncStorage.setItem(KEYS.IMPORT_DRAFT_CSS, css);
  if (filename) await AsyncStorage.setItem(KEYS.IMPORT_DRAFT_FILENAME, filename);
}

export async function getImportDraft(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.IMPORT_DRAFT);
}

export async function getImportDraftCSS(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.IMPORT_DRAFT_CSS);
}

export async function getImportDraftFilename(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.IMPORT_DRAFT_FILENAME);
}
