import { GoogleGenerativeAI } from "@google/generative-ai";

export interface SkillInsertionResult {
  updatedSource: string;
  diff: DiffLine[];
  explanation: string;
  confidence: number; // 0-1
  placement: string; // description of where skill was placed
}

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber: number;
}

export interface JobMatchResult {
  score: number; // 0-100
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  summary: string;
}

export interface AIBulletSuggestion {
  original: string;
  improved: string;
  reason: string;
}

function createClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}

// ─── Skill Insertion ─────────────────────────────────────────────────────────

export async function insertSkillIntoResume(
  apiKey: string,
  currentSource: string,
  skill: string,
  userRole: string
): Promise<SkillInsertionResult> {
  const genAI = createClient(apiKey);
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });

  const prompt = `You are a professional resume writer and LaTeX expert. You are working with a custom resume DSL (domain-specific language) that uses LaTeX-like syntax.

The DSL commands are:
- \\name{}, \\role{}, \\contact{}, \\summary{}
- \\section{title} — starts a new section
- \\job{title}{company}{date} — a job entry
- \\bullet{text} — bullet point under a job or section
- \\skillgroup{category}{item1, item2, item3} — skills grouped by category
- \\skill{name} — standalone skill
- \\degree{name}{school}{year} — education
- \\cert{name}{issuer}{year} — certification

CURRENT RESUME SOURCE:
\`\`\`
${currentSource}
\`\`\`

USER'S CURRENT ROLE: ${userRole || "Software Engineer"}

NEW SKILL TO ADD: "${skill}"

INSTRUCTIONS:
1. Analyze where this skill best fits in the resume
2. If a matching \\skillgroup exists (e.g., skill is "Docker" → find DevOps/Tools group), add it there
3. If no matching group exists, create a new appropriate \\skillgroup or add as \\skill
4. If the skill is best expressed as a bullet point in experience, add a relevant \\bullet
5. Do NOT duplicate existing skills
6. Return the COMPLETE modified DSL source with the skill properly inserted
7. Be natural and professional — don't just blindly append

RESPOND WITH VALID JSON ONLY (no markdown code blocks):
{
  "updatedSource": "the complete modified DSL source",
  "explanation": "brief explanation of what was changed and why",
  "placement": "exact description of where the skill was placed",
  "confidence": 0.95
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Parse JSON response (strip any accidental markdown)
  const jsonStr = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  const parsed = JSON.parse(jsonStr);

  // Compute diff
  const diff = computeDiff(currentSource, parsed.updatedSource);

  return {
    updatedSource: parsed.updatedSource,
    diff,
    explanation: parsed.explanation,
    confidence: parsed.confidence ?? 0.9,
    placement: parsed.placement,
  };
}

// ─── Job Match Scorer ────────────────────────────────────────────────────────

export async function scoreJobMatch(
  apiKey: string,
  resumeSource: string,
  jobDescription: string
): Promise<JobMatchResult> {
  const genAI = createClient(apiKey);
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });

  const prompt = `You are an expert ATS (Applicant Tracking System) and career coach.

RESUME (DSL format):
\`\`\`
${resumeSource}
\`\`\`

JOB DESCRIPTION:
\`\`\`
${jobDescription}
\`\`\`

Analyze how well this resume matches the job description.

RESPOND WITH VALID JSON ONLY:
{
  "score": 75,
  "matchedKeywords": ["React", "Node.js", "MongoDB"],
  "missingKeywords": ["Kubernetes", "GraphQL", "Redis"],
  "suggestions": [
    "Add your Docker experience to the Skills section",
    "Quantify your achievements with metrics in Experience"
  ],
  "summary": "Your resume is a strong match for the backend requirements but lacks cloud-native experience."
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonStr = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(jsonStr);
}

// ─── Bullet Strengthener ─────────────────────────────────────────────────────

export async function strengthenBullets(
  apiKey: string,
  resumeSource: string
): Promise<AIBulletSuggestion[]> {
  const genAI = createClient(apiKey);
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });

  const prompt = `You are a professional resume writer. Review these resume bullet points and suggest stronger, more impactful versions that use action verbs and quantifiable results.

RESUME:
${resumeSource}

Find all \\bullet{} entries and suggest improvements.

RESPOND WITH VALID JSON ONLY (array):
[
  {
    "original": "Worked on the backend API",
    "improved": "Architected and deployed RESTful APIs handling 50K+ daily requests, reducing latency by 35%",
    "reason": "Added action verb, scale metric, and performance impact"
  }
]`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonStr = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(jsonStr);
}

// ─── Convert Plain Text to DSL ───────────────────────────────────────────────

export async function convertTextToDSL(
  apiKey: string,
  plainText: string
): Promise<string> {
  const genAI = createClient(apiKey);
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });

  const prompt = `You are a resume parser. Convert this plain text resume into our custom DSL format.

DSL COMMANDS:
- \\resumestart and \\resumeend wrap the document
- \\name{Full Name}
- \\role{Job Title}
- \\contact{email} \\contact{phone} \\contact{github url} \\contact{linkedin url}
- \\summary{Summary text}
- \\section{Section Name}
- \\job{Job Title}{Company}{Date Range}
- \\bullet{Bullet point text}
- \\skillgroup{Category}{skill1, skill2, skill3}
- \\degree{Degree Name}{University}{Year}
- \\cert{Certification Name}{Issuer}{Year}

PLAIN TEXT RESUME:
${plainText}

Return ONLY the DSL source code, no explanation.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

// ─── Diff Engine (Myers Algorithm) ──────────────────────────────────────────

export function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const diff: DiffLine[] = [];

  // Simple LCS-based diff
  const lcs = computeLCS(oldLines, newLines);
  let oi = 0, ni = 0, li = 0;
  let lineNum = 1;

  while (oi < oldLines.length || ni < newLines.length) {
    if (
      li < lcs.length &&
      oi < oldLines.length &&
      ni < newLines.length &&
      oldLines[oi] === lcs[li] &&
      newLines[ni] === lcs[li]
    ) {
      diff.push({ type: "unchanged", content: oldLines[oi], lineNumber: lineNum++ });
      oi++; ni++; li++;
    } else if (ni < newLines.length && (li >= lcs.length || newLines[ni] !== lcs[li])) {
      diff.push({ type: "added", content: newLines[ni], lineNumber: lineNum++ });
      ni++;
    } else if (oi < oldLines.length) {
      diff.push({ type: "removed", content: oldLines[oi], lineNumber: lineNum++ });
      oi++;
    }
  }

  return diff;
}

// ─── Magic Rewrite ──────────────────────────────────────────────────────────

export async function magicRewrite(
  apiKey: string,
  bulletText: string,
  userRole: string
): Promise<{ improved: string; explanation: string }> {
  const genAI = createClient(apiKey);
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });

  const prompt = `You are a world-class executive resume writer. 
  
  Original Bullet: "${bulletText}"
  User's Role: ${userRole}

  Rewrite this bullet point to be extremely impactful. 
  1. Use strong action verbs.
  2. Include quantifiable metrics (even if you have to guess realistic ones for the role, but mark them clearly).
  3. Focus on outcomes, not just tasks.
  4. Keep it concise for a professional resume.

  RESPOND WITH VALID JSON ONLY:
  {
    "improved": "The rewritten bullet",
    "explanation": "Why this version is better"
  }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonStr = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(jsonStr);
}

// ─── Career Roadmap ─────────────────────────────────────────────────────────

export interface CareerStep {
  role: string;
  skillsNeeded: string[];
  description: string;
}

export async function generateCareerRoadmap(
  apiKey: string,
  currentSkills: string[],
  currentRole: string
): Promise<{ steps: CareerStep[]; summary: string }> {
  const genAI = createClient(apiKey);
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });

  const prompt = `You are a career strategist. Based on these skills and role, generate a 3-step growth roadmap.

  Current Role: ${currentRole}
  Current Skills: ${currentSkills.join(", ")}

  RESPOND WITH VALID JSON ONLY:
  {
    "steps": [
      { "role": "Next Role Name", "skillsNeeded": ["Skill 1", "Skill 2"], "description": "Short strategy" }
    ],
    "summary": "Overall growth outlook"
  }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonStr = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(jsonStr);
}

function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);

  const lcs: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) { lcs.unshift(a[i - 1]); i--; j--; }
    else if (dp[i - 1][j] > dp[i][j - 1]) i--;
    else j--;
  }
  return lcs;
}
