import { getSettings } from "./storageService";

// Centralized REST API call to Groq (OpenAI compatible)
async function callAI(passedApiKey: string, prompt: string, retries = 2) {
  const url = process.env.EXPO_PUBLIC_GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
  const model = process.env.EXPO_PUBLIC_GROQ_MODEL_NAME || "llama-3.1-8b-instant";
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || passedApiKey;
  const settings = await getSettings();
  const temperature = settings.aiCreativity === "high" ? 0.7 : 0.1;

  if (!apiKey) {
    throw new Error("No Groq API Key found. Please add it to your .env or Settings.");
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`AI: Calling Groq (Attempt ${attempt + 1}/${retries + 1})...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          temperature: temperature,
          max_tokens: 2000 // Reduced from 4000 to save on TPM limits
        })
      });

      if (response.status === 429) {
        if (attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 2000;
          console.warn(`AI: Rate limited (429). Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error("Rate limit exceeded. Please try again in a few seconds.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      if (attempt === retries) throw error;
      console.warn(`AI: Attempt ${attempt + 1} failed: ${error.message}. Retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

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

// --- Skill Insertion ---------------------------------------------------------

export async function insertSkillIntoResume(
  apiKey: string,
  currentSource: string,
  skill: string,
  userRole: string,
  description?: string,
  link?: string
): Promise<SkillInsertionResult> {
  const prompt = `You are a professional resume writer and LaTeX expert.
TASK: Insert the following NEW SKILL into the resume DSL source provided below.

NEW SKILL TO ADD: "${skill}"
${description ? `ADDITIONAL CONTEXT/DETAILS: "${description}"` : ""}
${link ? `ASSOCIATED URL/LINK: "${link}"` : ""}
USER'S CURRENT ROLE: ${userRole || "Software Engineer"}

INSTRUCTIONS:
1. Identify the best location (existing \\skillgroup, new \\skillgroup, or as a \\bullet in experience).
2. Do NOT duplicate existing skills.
3. Maintain the custom DSL syntax (\\name, \\role, \\job, \\bullet, \\skillgroup, etc.).
4. USE THE \\link{url}{label} COMMAND for any URLs provided. For example: \\link{${link || "url"}}{Source Code}.
5. Return the COMPLETE modified source.

CURRENT RESUME SOURCE:
\`\`\`
${currentSource}
\`\`\`

RESPONSE FORMAT (STRICT):
You must respond using this exact structure:

[EXPLANATION]
Brief summary of what was added and why.
[/EXPLANATION]

[PLACEMENT]
Specific location of the insertion.
[/PLACEMENT]

[SOURCE]
The complete modified DSL source code.
[/SOURCE]`;

  try {
    const text = await callAI(apiKey, prompt);
    
    // Parse tag-based response - making closing tags optional and preventing bleeding into next tags
    const sourceMatch = text.match(/\[SOURCE\]([\s\S]*?)(?:\[\/SOURCE\]|$)/i);
    const explanationMatch = text.match(/\[EXPLANATION\]([\s\S]*?)(?:\[\/EXPLANATION\]|(?=\[PLACEMENT\])|(?=\[SOURCE\])|$)/i);
    const placementMatch = text.match(/\[PLACEMENT\]([\s\S]*?)(?:\[\/PLACEMENT\]|(?=\[SOURCE\])|$)/i);

    if (!sourceMatch || !sourceMatch[1].trim()) {
      console.error("AI Response missing [SOURCE] content. Raw response:", text);
      throw new Error("AI failed to return the modified source code in [SOURCE] tags.");
    }

    const updatedSource = sourceMatch[1].trim()
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/\n?```$/, "")
      .replace(/^"""\n?/, "")
      .replace(/\n?"""$/, "")
      .trim();
    
    const explanation = explanationMatch ? explanationMatch[1].trim() : "Skill added.";
    const placement = placementMatch ? placementMatch[1].trim() : "Unknown";

    // Compute diff
    const diff = computeDiff(currentSource, updatedSource);

    return {
      updatedSource,
      diff,
      explanation,
      confidence: 0.95,
      placement,
    };
  } catch (error: any) {
    console.error("AI Skill Insertion Error:", error);
    throw error;
  }
}

// --- Job Match Scorer --------------------------------------------------------

export async function scoreJobMatch(
  apiKey: string,
  resumeSource: string,
  jobDescription: string
): Promise<JobMatchResult> {
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

  try {
    const text = await callAI(apiKey, prompt);
    const jsonStr = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("AI Job Match Error:", error);
    throw error;
  }
}

// --- Bullet Strengthener -----------------------------------------------------

export async function strengthenBullets(
  apiKey: string,
  resumeSource: string
): Promise<AIBulletSuggestion[]> {
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

  try {
    const text = await callAI(apiKey, prompt);
    const jsonStr = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("AI Bullet Strengthener Error:", error);
    throw error;
  }
}

export async function convertTextToDSL(
  apiKey: string,
  plainText: string
): Promise<string> {
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

  try {
    console.log("AI: Attempting conversion via Groq REST API");
    const text = await callAI(apiKey, prompt);
    // Clean up markdown blocks
    const cleaned = text
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
    return cleaned;
  } catch (error: any) {
    console.error("AI Conversion Error:", error);
    throw error;
  }
}

// --- Diff Engine (Myers Algorithm) ------------------------------------------

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

// --- Magic Rewrite ----------------------------------------------------------

export async function magicRewrite(
  apiKey: string,
  bulletText: string,
  userRole: string
): Promise<{ improved: string; explanation: string }> {
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

  try {
    const text = await callAI(apiKey, prompt);
    const jsonStr = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("AI Magic Rewrite Error:", error);
    throw error;
  }
}

// --- Career Roadmap ---------------------------------------------------------

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
  const slicedSkills = currentSkills.slice(0, 15);
  const prompt = `You are a career strategist. Based on these skills and role, generate a 3-step growth roadmap.

  Current Role: ${currentRole}
  Current Skills: ${slicedSkills.join(", ")}

  RESPOND WITH VALID JSON ONLY:
  {
    "steps": [
      { "role": "Next Role Name", "skillsNeeded": ["Skill 1", "Skill 2"], "description": "Short strategy" }
    ],
    "summary": "Overall growth outlook"
  }`;

  try {
    const text = await callAI(apiKey, prompt);
    const jsonStr = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("AI Roadmap Error:", error);
    throw error;
  }
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

/**
 * Converts raw text to DSL and also attempts to extract a matching CSS style.
 */
export async function convertResumeWithStyle(apiKey: string, rawText: string): Promise<{ dsl: string, css: string }> {
  const prompt = `
    You are an expert resume architect. I will give you a raw text resume.
    
    CRITICAL RULES:
    1. DO NOT USE PLACEHOLDERS. Do not use names like "John Doe" or "Jane Smith" unless they are explicitly in the text.
    2. USE ONLY PROVIDED CONTENT. If the "RESUME TEXT" below is empty, unreadable, or just binary garbage, respond ONLY with the word "ERROR: UNREADABLE_CONTENT".
    3. Be faithful to the original data. Preserve every project, skill, and date found.
    
    TASK:
    1. Convert the content into our Resume DSL format (the LaTeX-like structure with \\name, \\role, \\contact, \\summary, and \\section).
    2. Analyze the likely layout of the original resume from the text (e.g. is it centered? two-column? minimalist?).
    3. Generate a CSS block that would make an HTML version of this DSL look like the original.
       Use these classes in your CSS: .header, .section-title, .job-header, .job-title, .job-company, .job-date, .skill-row, .skill-cat.

    RESPONSE FORMAT:
    [DSL]
    (DSL content here)
    [/DSL]
    [CSS]
    (CSS content here)
    [/CSS]

    RESUME TEXT:
    ${rawText}
  `;

  try {
    const text = await callAI(apiKey, prompt);
    const dslMatch = text.match(/\[DSL\]([\s\S]*?)\[\/DSL\]/i);
    const cssMatch = text.match(/\[CSS\]([\s\S]*?)\[\/CSS\]/i);

    const dsl = dslMatch ? dslMatch[1].trim() : text;
    const css = cssMatch ? cssMatch[1].trim() : "";

    return { 
      dsl: dsl.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim(), 
      css: css.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim()
    };
  } catch (error: any) {
    console.error("AI Stylized Conversion Error:", error);
    throw error;
  }
}
export async function fixAllLinks(
  apiKey: string,
  source: string
): Promise<string> {
  const prompt = `You are a professional resume editor. 
  TASK: Scan the provided Resume DSL and convert all PLAIN TEXT URLs or "Link" labels into the structured \\link{url}{label} command.
  
  EXAMPLES:
  - "github.com/user" -> "\\link{https://github.com/user}{GitHub}"
  - "Project Link: http://demo.com" -> "Project: \\link{http://demo.com}{Live Demo}"
  - "Check out my code at bit.ly/123" -> "Code: \\link{https://bit.ly/123}{Source}"
  
  INSTRUCTIONS:
  1. Identify URLs for GitHub, LinkedIn, Personal Websites, and Projects.
  2. Use \\link{url}{Label} where Label is descriptive (GitHub, Demo, Website, etc.).
  3. Return the COMPLETE modified DSL source.
  4. Ensure all URLs start with http:// or https://.
  
  RESUME SOURCE:
  \`\`\`
  ${source}
  \`\`\`
  
  RETURN ONLY THE MODIFIED [SOURCE] TAGGED CONTENT.
  [SOURCE]
  ...
  `;

  try {
    const res = await callAI(apiKey, prompt);
    const match = res.match(/\[SOURCE\]\s*([\s\S]*?)(?:\[\/SOURCE\]|$)/i);
    return match ? match[1].trim() : source;
  } catch (error) {
    console.error("Fix All Links Error:", error);
    return source;
  }
}

// ─── Cover Letter Generator ────────────────────────────────────────────────

export interface CoverLetterResult {
  coverLetter: string;
  tone: string;
  wordCount: number;
}

export async function generateCoverLetter(
  apiKey: string,
  resumeSource: string,
  jobDescription: string,
  companyName: string,
  tone: "professional" | "enthusiastic" | "concise" = "professional"
): Promise<CoverLetterResult> {
  const toneGuide = {
    professional: "Formal, polished, and confident. Use measured language.",
    enthusiastic: "Energetic and passionate. Show genuine excitement for the role.",
    concise: "Brief and direct. Maximum 200 words. No fluff.",
  };

  const prompt = `You are an expert career coach and cover letter writer.

TASK: Generate a tailored cover letter using the candidate's resume and the target job description.

TONE: ${toneGuide[tone]}

COMPANY: ${companyName || "the company"}

RESUME:
\`\`\`
${resumeSource}
\`\`\`

JOB DESCRIPTION:
\`\`\`
${jobDescription}
\`\`\`

INSTRUCTIONS:
1. Extract the candidate's name, role, and key achievements from the resume.
2. Identify the most relevant skills and experiences that match the job description.
3. Write a compelling cover letter with:
   - A strong opening hook (NOT "I am writing to apply...")
   - 2-3 body paragraphs mapping achievements to job requirements
   - A confident closing with a call to action
4. Use specific metrics and achievements from the resume.
5. Keep it under 350 words unless tone is "concise".

Return the cover letter inside [LETTER] tags:
[LETTER]
...
[/LETTER]`;

  const res = await callAI(apiKey, prompt);
  const match = res.match(/\[LETTER\]\s*([\s\S]*?)(?:\[\/LETTER\]|$)/i);
  const letter = match ? match[1].trim() : res.trim();
  const wordCount = letter.split(/\s+/).length;

  return {
    coverLetter: letter,
    tone,
    wordCount,
  };
}

// ─── Grammar & Power Verb Checker ──────────────────────────────────────────

export interface GrammarResult {
  improvedSource: string;
  changes: { original: string; improved: string; reason: string }[];
  score: number; // 0-100 writing quality score
}

export async function checkGrammarAndTone(
  apiKey: string,
  source: string
): Promise<GrammarResult> {
  const prompt = `You are an expert resume writing coach specializing in ATS optimization and power verbs.

TASK: Analyze the resume below and improve weak bullet points.

RULES:
1. Replace weak verbs (did, made, helped, worked on, responsible for, assisted) with power verbs (orchestrated, spearheaded, architected, engineered, optimized, championed).
2. Add quantifiable metrics where possible (e.g., "by 40%", "serving 10K+ users").
3. Keep the LaTeX DSL commands intact (\\bullet{}, \\job{}, etc.).
4. Do NOT change names, dates, company names, or factual information.
5. Only improve bullet text inside \\bullet{} or \\item{} commands.

RESUME:
\`\`\`
${source}
\`\`\`

Return a JSON object inside [RESULT] tags:
[RESULT]
{
  "improvedSource": "...full modified DSL...",
  "changes": [
    {"original": "Worked on backend APIs", "improved": "Engineered scalable backend APIs", "reason": "Replaced weak verb 'worked on'"}
  ],
  "score": 85
}
[/RESULT]`;

  try {
    const res = await callAI(apiKey, prompt);
    const match = res.match(/\[RESULT\]\s*([\s\S]*?)(?:\[\/RESULT\]|$)/i);
    if (match) {
      // Clean potential issues with backslashes in JSON
      const cleaned = match[1].trim().replace(/\\\\/g, "\\\\");
      try {
        return JSON.parse(cleaned);
      } catch {
        // If JSON parse fails, return source unchanged
        return { improvedSource: source, changes: [], score: 70 };
      }
    }
    return { improvedSource: source, changes: [], score: 70 };
  } catch (error) {
    console.error("Grammar Check Error:", error);
    return { improvedSource: source, changes: [], score: 0 };
  }
}

// ─── Neural Chat Copilot ───────────────────────────────────────────────────

export async function neuralChat(
  apiKey: string,
  currentSource: string,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<{ updatedSource: string; assistantMessage: string }> {
  const prompt = `You are "Neural Copilot", a professional resume architect.
  
  CONTEXT:
  The user is editing their resume in a custom DSL format.
  
  CURRENT RESUME SOURCE:
  \`\`\`
  ${currentSource}
  \`\`\`
  
  USER COMMAND: "${userMessage}"
  
  INSTRUCTIONS:
  1. Analyze the user's request. They might want to add a project, change a role, translate text, or fix something.
  2. If the request requires changing the resume, provide the COMPLETE updated DSL source.
  3. If the request is just a question, answer it professionally.
  4. Always maintain the DSL syntax (\\name, \\role, \\job, \\bullet, \\skillgroup, etc.).
  5. Respond using this exact structure:
  
  [MESSAGE]
  (Your professional response to the user here)
  [/MESSAGE]
  
  [SOURCE]
  (The complete updated DSL source code here. If no changes were needed, return the original source.)
  [/SOURCE]`;

  try {
    const text = await callAI(apiKey, prompt);
    const messageMatch = text.match(/\[MESSAGE\]([\s\S]*?)\[\/MESSAGE\]/i);
    const sourceMatch = text.match(/\[SOURCE\]([\s\S]*?)\[\/SOURCE\]/i);

    const assistantMessage = messageMatch ? messageMatch[1].trim() : "I've updated your resume based on your request.";
    let updatedSource = sourceMatch ? sourceMatch[1].trim() : currentSource;

    // Cleanup source markdown
    updatedSource = updatedSource
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    return {
      updatedSource: updatedSource || currentSource,
      assistantMessage
    };
  } catch (error: any) {
    console.error("Neural Chat Error:", error);
    throw error;
  }
}
