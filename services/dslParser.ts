/**
 * Resume DSL Parser
 * Parses a LaTeX-inspired markup language into a structured AST
 *
 * Supported commands:
 *   \name{} \role{} \contact{}
 *   \section{title}
 *   \job{title}{company}{date}
 *   \bullet{text}
 *   \skillgroup{category}{items}
 *   \skill{name}
 *   \degree{name}{school}{year}
 *   \cert{name}{issuer}{year}
 *   \link{url}{label}
 *   \summary{text}
 *   \resumestart / \resumeend
 */

export interface ResumeContact {
  email?: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  location?: string;
  raw: string[];
}

export interface ResumeBullet {
  type: "bullet";
  text: string;
}

export interface ResumeJob {
  type: "job";
  title: string;
  company: string;
  date: string;
  bullets: string[];
}

export interface ResumeSkillGroup {
  type: "skillgroup";
  category: string;
  items: string[];
}

export interface ResumeSkill {
  type: "skill";
  name: string;
}

export interface ResumeDegree {
  type: "degree";
  name: string;
  school: string;
  year: string;
}

export interface ResumeCert {
  type: "cert";
  name: string;
  issuer: string;
  year: string;
}

export interface ResumeSection {
  title: string;
  items: (ResumeJob | ResumeSkillGroup | ResumeSkill | ResumeDegree | ResumeCert | ResumeBullet)[];
}

export interface ResumeAST {
  name: string;
  role: string;
  contact: ResumeContact;
  summary: string;
  sections: ResumeSection[];
  raw: string; // original source
}

function extractArg(text: string, start: number): { value: string; end: number } {
  let depth = 0;
  let result = "";
  let i = start;
  while (i < text.length) {
    if (text[i] === "{") {
      if (depth === 0) { depth++; i++; continue; }
      depth++;
    }
    if (text[i] === "}") {
      depth--;
      if (depth === 0) return { value: result.trim(), end: i + 1 };
    }
    if (depth > 0) result += text[i];
    i++;
  }
  return { value: result.trim(), end: i };
}

function extractArgs(text: string, start: number, count: number): { args: string[]; end: number } {
  const args: string[] = [];
  let pos = start;
  for (let i = 0; i < count; i++) {
    // skip whitespace between args
    while (pos < text.length && /\s/.test(text[pos]) && text[pos] !== "{") pos++;
    if (text[pos] !== "{") break;
    const { value, end } = extractArg(text, pos);
    args.push(value);
    pos = end;
  }
  return { args, end: pos };
}

export function parseResumeDSL(source: string): ResumeAST {
  const ast: ResumeAST = {
    name: "",
    role: "",
    contact: { raw: [] },
    summary: "",
    sections: [],
    raw: source,
  };

  const lines = source.split("\n");
  let currentSection: ResumeSection | null = null;
  let currentJob: ResumeJob | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("%")) continue; // skip comments

    // --- Top-level commands ---
    if (line.startsWith("\\name{")) {
      const { args } = extractArgs(line, 5, 1);
      ast.name = args[0] || "";
      continue;
    }
    if (line.startsWith("\\role{")) {
      const { args } = extractArgs(line, 5, 1);
      ast.role = args[0] || "";
      continue;
    }
    if (line.startsWith("\\contact{")) {
      const { args } = extractArgs(line, 8, 1);
      const raw = args[0] || "";
      ast.contact.raw.push(raw);
      // parse common patterns
      if (raw.includes("@")) ast.contact.email = raw;
      else if (raw.match(/^\+?[\d\s\-().]+$/)) ast.contact.phone = raw;
      else if (raw.includes("github.com")) ast.contact.github = raw;
      else if (raw.includes("linkedin.com")) ast.contact.linkedin = raw;
      else if (raw.startsWith("http")) ast.contact.website = raw;
      else ast.contact.location = raw;
      continue;
    }
    if (line.startsWith("\\summary{")) {
      const { args } = extractArgs(line, 8, 1);
      ast.summary = args[0] || "";
      continue;
    }
    if (line.startsWith("\\resumestart") || line.startsWith("\\resumeend")) continue;

    // --- Section ---
    if (line.startsWith("\\section{")) {
      if (currentJob && currentSection) {
        currentSection.items.push(currentJob);
        currentJob = null;
      }
      const { args } = extractArgs(line, 8, 1);
      currentSection = { title: args[0] || "", items: [] };
      ast.sections.push(currentSection);
      continue;
    }

    // --- Section items ---
    if (!currentSection) continue;

    if (line.startsWith("\\job{")) {
      if (currentJob) currentSection.items.push(currentJob);
      const { args } = extractArgs(line, 4, 3);
      currentJob = {
        type: "job",
        title: args[0] || "",
        company: args[1] || "",
        date: args[2] || "",
        bullets: [],
      };
      continue;
    }

    if (line.startsWith("\\bullet{")) {
      const { args } = extractArgs(line, 7, 1);
      if (currentJob) {
        currentJob.bullets.push(args[0] || "");
      } else {
        currentSection.items.push({ type: "bullet", text: args[0] || "" });
      }
      continue;
    }

    if (line.startsWith("\\skillgroup{")) {
      if (currentJob) { currentSection.items.push(currentJob); currentJob = null; }
      const { args } = extractArgs(line, 11, 2);
      currentSection.items.push({
        type: "skillgroup",
        category: args[0] || "",
        items: (args[1] || "").split(",").map((s) => s.trim()).filter(Boolean),
      });
      continue;
    }

    if (line.startsWith("\\skill{")) {
      if (currentJob) { currentSection.items.push(currentJob); currentJob = null; }
      const { args } = extractArgs(line, 6, 1);
      currentSection.items.push({ type: "skill", name: args[0] || "" });
      continue;
    }

    if (line.startsWith("\\degree{")) {
      if (currentJob) { currentSection.items.push(currentJob); currentJob = null; }
      const { args } = extractArgs(line, 7, 3);
      currentSection.items.push({
        type: "degree",
        name: args[0] || "",
        school: args[1] || "",
        year: args[2] || "",
      });
      continue;
    }

    if (line.startsWith("\\cert{")) {
      if (currentJob) { currentSection.items.push(currentJob); currentJob = null; }
      const { args } = extractArgs(line, 5, 3);
      currentSection.items.push({
        type: "cert",
        name: args[0] || "",
        issuer: args[1] || "",
        year: args[2] || "",
      });
      continue;
    }
  }

  // flush last job
  if (currentJob && currentSection) {
    currentSection.items.push(currentJob);
  }

  return ast;
}

export function serializeAST(ast: ResumeAST): string {
  // Convert AST back to DSL source (used when AI modifies the AST directly)
  let out = "\\resumestart\n";
  out += `\\name{${ast.name}}\n`;
  out += `\\role{${ast.role}}\n`;
  for (const c of ast.contact.raw) out += `\\contact{${c}}\n`;
  if (ast.summary) out += `\\summary{${ast.summary}}\n\n`;

  for (const section of ast.sections) {
    out += `\n\\section{${section.title}}\n`;
    for (const item of section.items) {
      if (item.type === "job") {
        out += `  \\job{${item.title}}{${item.company}}{${item.date}}\n`;
        for (const b of item.bullets) out += `    \\bullet{${b}}\n`;
      } else if (item.type === "skillgroup") {
        out += `  \\skillgroup{${item.category}}{${item.items.join(", ")}}\n`;
      } else if (item.type === "skill") {
        out += `  \\skill{${item.name}}\n`;
      } else if (item.type === "degree") {
        out += `  \\degree{${item.name}}{${item.school}}{${item.year}}\n`;
      } else if (item.type === "cert") {
        out += `  \\cert{${item.name}}{${item.issuer}}{${item.year}}\n`;
      } else if (item.type === "bullet") {
        out += `  \\bullet{${item.text}}\n`;
      }
    }
  }
  out += "\n\\resumeend\n";
  return out;
}

export const DEFAULT_RESUME_DSL = `\\resumestart
\\name{Your Name}
\\role{Software Engineer}
\\contact{your.email@example.com}
\\contact{+1 (555) 000-0000}
\\contact{github.com/yourusername}
\\contact{linkedin.com/in/yourprofile}
\\summary{Passionate engineer with experience building scalable applications. Seeking to leverage expertise in modern web and mobile technologies.}

\\section{Experience}
\\job{Software Engineer}{Company Name}{Jan 2023 – Present}
  \\bullet{Designed and implemented scalable microservices architecture serving 10M+ users}
  \\bullet{Led a team of 5 engineers to deliver key product features on time}

\\section{Skills}
\\skillgroup{Languages}{JavaScript, TypeScript, Python, Go}
\\skillgroup{Frameworks}{React, React Native, Node.js, Express}
\\skillgroup{Tools}{Git, Docker, AWS, PostgreSQL}

\\section{Education}
\\degree{B.Tech Computer Science}{Your University}{2022}

\\section{Certifications}
\\cert{AWS Cloud Practitioner}{Amazon}{2023}
\\resumeend
`;
