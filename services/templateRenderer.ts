import { ResumeAST, ResumeJob, ResumeSkillGroup, ResumeDegree, ResumeCert } from "./dslParser";

// ─── Shared CSS Utilities ────────────────────────────────────────────────────

const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { -webkit-print-color-adjust: exact; }
  a { text-decoration: none; color: inherit; }
`;

// ─── 1. Jake's CV ────────────────────────────────────────────────────────────

export function renderJakesCV(ast: ResumeAST): string {
  const css = `
    body { font-family: 'Charter', 'Georgia', serif; font-size: 11pt; color: #000; background: #fff; max-width: 750px; margin: 0 auto; padding: 20px 24px; }
    .header { text-align: center; margin-bottom: 10px; }
    .header h1 { font-size: 24pt; font-weight: 700; letter-spacing: 1px; }
    .header .contact { font-size: 9pt; color: #444; margin-top: 4px; }
    .header .contact span { margin: 0 6px; }
    .section-title { font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1pt solid #000; margin: 10px 0 5px; padding-bottom: 2px; }
    .job-header { display: flex; justify-content: space-between; margin-bottom: 2px; }
    .job-title { font-weight: 700; font-size: 10.5pt; }
    .job-company { font-style: italic; font-size: 10pt; }
    .job-date { font-size: 10pt; color: #444; white-space: nowrap; }
    ul { margin-left: 16px; margin-top: 3px; }
    li { font-size: 10pt; margin-bottom: 2px; line-height: 1.4; }
    .skill-row { display: flex; margin-bottom: 3px; font-size: 10pt; }
    .skill-cat { font-weight: 700; min-width: 100px; }
    .summary { font-size: 10pt; color: #333; margin-bottom: 8px; line-height: 1.5; }
    .edu-row { display: flex; justify-content: space-between; font-size: 10pt; }
    .cert-row { display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 2px; }
  `;

  const sections = ast.sections.map((sec) => {
    const items = sec.items.map((item) => {
      if (item.type === "job") {
        const j = item as ResumeJob;
        return `<div class="job-header"><span><span class="job-title">${j.title}</span> — <span class="job-company">${j.company}</span></span><span class="job-date">${j.date}</span></div><ul>${j.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`;
      }
      if (item.type === "skillgroup") {
        const s = item as ResumeSkillGroup;
        return `<div class="skill-row"><span class="skill-cat">${s.category}:</span><span>${s.items.join(", ")}</span></div>`;
      }
      if (item.type === "degree") {
        const d = item as ResumeDegree;
        return `<div class="edu-row"><span><b>${d.name}</b>, ${d.school}</span><span>${d.year}</span></div>`;
      }
      if (item.type === "cert") {
        const c = item as ResumeCert;
        return `<div class="cert-row"><span><b>${c.name}</b> — ${c.issuer}</span><span>${c.year}</span></div>`;
      }
      if (item.type === "bullet") return `<ul><li>${item.text}</li></ul>`;
      return "";
    }).join("");
    return `<div class="section-title">${sec.title}</div>${items}`;
  }).join("<br/>");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_CSS}${css}</style></head><body>
    <div class="header">
      <h1>${ast.name}</h1>
      <div class="contact">${ast.contact.raw.map((c) => `<span>${c}</span>`).join("<span>|</span>")}</div>
    </div>
    ${ast.summary ? `<div class="summary">${ast.summary}</div>` : ""}
    ${sections}
  </body></html>`;
}

// ─── 2. Awesome CV ───────────────────────────────────────────────────────────

export function renderAwesomeCV(ast: ResumeAST, accentColor = "#00ADB5"): string {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&display=swap');
    body { font-family: 'Source Sans 3', 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; color: #333; background: #fff; max-width: 750px; margin: 0 auto; }
    .header { background: ${accentColor}; color: #fff; padding: 28px 32px; }
    .header h1 { font-size: 28pt; font-weight: 700; letter-spacing: 2px; }
    .header .role { font-size: 13pt; font-weight: 300; opacity: 0.9; margin-top: 4px; }
    .header .contact { margin-top: 10px; font-size: 9pt; display: flex; gap: 16px; flex-wrap: wrap; opacity: 0.9; }
    .body { padding: 20px 32px; }
    .section-title { font-size: 13pt; font-weight: 700; color: ${accentColor}; text-transform: uppercase; letter-spacing: 2px; border-bottom: 2px solid ${accentColor}; padding-bottom: 4px; margin: 14px 0 8px; }
    .entry { margin-bottom: 10px; }
    .entry-header { display: flex; justify-content: space-between; }
    .entry-title { font-weight: 700; font-size: 11pt; }
    .entry-sub { color: #666; font-size: 10pt; }
    .entry-date { color: #888; font-size: 9pt; white-space: nowrap; }
    ul { margin-left: 16px; margin-top: 4px; }
    li { margin-bottom: 3px; line-height: 1.5; font-size: 10pt; }
    .skill-row { display: flex; margin-bottom: 5px; align-items: center; }
    .skill-cat { font-weight: 700; min-width: 110px; color: ${accentColor}; font-size: 10pt; }
    .summary { font-size: 10pt; line-height: 1.6; color: #555; margin-bottom: 6px; }
  `;

  const sections = ast.sections.map((sec) => {
    const items = sec.items.map((item) => {
      if (item.type === "job") {
        const j = item as ResumeJob;
        return `<div class="entry"><div class="entry-header"><div><div class="entry-title">${j.title}</div><div class="entry-sub">${j.company}</div></div><div class="entry-date">${j.date}</div></div><ul>${j.bullets.map((b) => `<li>${b}</li>`).join("")}</ul></div>`;
      }
      if (item.type === "skillgroup") {
        const s = item as ResumeSkillGroup;
        return `<div class="skill-row"><span class="skill-cat">${s.category}</span><span>${s.items.join(" · ")}</span></div>`;
      }
      if (item.type === "degree") {
        const d = item as ResumeDegree;
        return `<div class="entry"><div class="entry-header"><div><div class="entry-title">${d.name}</div><div class="entry-sub">${d.school}</div></div><div class="entry-date">${d.year}</div></div></div>`;
      }
      if (item.type === "cert") {
        const c = item as ResumeCert;
        return `<div class="entry"><div class="entry-header"><div class="entry-title">${c.name}</div><div class="entry-date">${c.year}</div></div><div class="entry-sub">${c.issuer}</div></div>`;
      }
      if (item.type === "bullet") return `<ul><li>${item.text}</li></ul>`;
      return "";
    }).join("");
    return `<div class="section-title">${sec.title}</div>${items}`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_CSS}${css}</style></head><body>
    <div class="header">
      <h1>${ast.name}</h1>
      <div class="role">${ast.role}</div>
      <div class="contact">${ast.contact.raw.join("  ·  ")}</div>
    </div>
    <div class="body">
      ${ast.summary ? `<div class="summary">${ast.summary}</div>` : ""}
      ${sections}
    </div>
  </body></html>`;
}

// ─── 3. AltaCV (Sidebar) ─────────────────────────────────────────────────────

export function renderAltaCV(ast: ResumeAST, accentColor = "#4A90D9"): string {
  const css = `
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; color: #222; background: #fff; display: flex; min-height: 100vh; }
    .sidebar { width: 200px; min-width: 200px; background: #f0f4f8; padding: 20px 14px; }
    .main { flex: 1; padding: 20px 20px; }
    .sidebar h1 { font-size: 16pt; font-weight: 800; color: ${accentColor}; line-height: 1.2; }
    .sidebar .role { font-size: 9pt; color: #666; margin-top: 3px; margin-bottom: 12px; }
    .sidebar-section { font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: ${accentColor}; border-top: 1.5px solid ${accentColor}; padding-top: 6px; margin: 10px 0 5px; }
    .contact-item { font-size: 8.5pt; color: #444; margin-bottom: 3px; word-break: break-all; }
    .skill-bar-row { margin-bottom: 5px; }
    .skill-name { font-size: 8.5pt; font-weight: 600; }
    .skill-bar-bg { height: 4px; background: #ddd; border-radius: 2px; margin-top: 2px; }
    .skill-bar-fill { height: 4px; background: ${accentColor}; border-radius: 2px; }
    .section-title { font-size: 12pt; font-weight: 700; color: ${accentColor}; border-bottom: 2px solid ${accentColor}; padding-bottom: 3px; margin: 12px 0 7px; }
    .entry { margin-bottom: 10px; }
    .entry-header { display: flex; justify-content: space-between; }
    .entry-title { font-weight: 700; font-size: 10.5pt; }
    .entry-sub { color: #666; font-size: 9pt; }
    .entry-date { color: ${accentColor}; font-size: 8.5pt; white-space: nowrap; font-weight: 600; }
    ul { margin-left: 14px; margin-top: 4px; }
    li { font-size: 9.5pt; margin-bottom: 3px; line-height: 1.4; }
    .summary { font-size: 9.5pt; color: #555; line-height: 1.5; margin-bottom: 6px; }
  `;

  // Collect all skills for sidebar
  const allSkillGroups = ast.sections.flatMap((s) =>
    s.items.filter((i) => i.type === "skillgroup") as ResumeSkillGroup[]
  );

  const sidebarSkills = allSkillGroups.map((sg) =>
    sg.items.slice(0, 3).map((skill, idx) => `
      <div class="skill-bar-row">
        <div class="skill-name">${skill}</div>
        <div class="skill-bar-bg"><div class="skill-bar-fill" style="width:${80 + idx * 5}%"></div></div>
      </div>`).join("")
  ).join("");

  const mainSections = ast.sections.map((sec) => {
    const items = sec.items.map((item) => {
      if (item.type === "job") {
        const j = item as ResumeJob;
        return `<div class="entry"><div class="entry-header"><div><div class="entry-title">${j.title}</div><div class="entry-sub">${j.company}</div></div><div class="entry-date">${j.date}</div></div><ul>${j.bullets.map((b) => `<li>${b}</li>`).join("")}</ul></div>`;
      }
      if (item.type === "skillgroup") return ""; // shown in sidebar
      if (item.type === "degree") {
        const d = item as ResumeDegree;
        return `<div class="entry"><div class="entry-header"><div><div class="entry-title">${d.name}</div><div class="entry-sub">${d.school}</div></div><div class="entry-date">${d.year}</div></div></div>`;
      }
      if (item.type === "cert") {
        const c = item as ResumeCert;
        return `<div class="entry"><div class="entry-header"><div class="entry-title">${c.name}</div><div class="entry-date">${c.year}</div></div><div class="entry-sub">${c.issuer}</div></div>`;
      }
      return "";
    }).filter(Boolean).join("");
    if (!items) return "";
    return `<div class="section-title">${sec.title}</div>${items}`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_CSS}${css}</style></head><body>
    <div class="sidebar">
      <h1>${ast.name}</h1>
      <div class="role">${ast.role}</div>
      <div class="sidebar-section">Contact</div>
      ${ast.contact.raw.map((c) => `<div class="contact-item">${c}</div>`).join("")}
      ${sidebarSkills ? `<div class="sidebar-section">Skills</div>${sidebarSkills}` : ""}
    </div>
    <div class="main">
      ${ast.summary ? `<div class="summary">${ast.summary}</div>` : ""}
      ${mainSections}
    </div>
  </body></html>`;
}

// ─── 4. Deedy Resume (Two-Column) ────────────────────────────────────────────

export function renderDeedyResume(ast: ResumeAST): string {
  const css = `
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 9.5pt; color: #1a1a1a; background: #fff; max-width: 780px; margin: 0 auto; padding: 16px; }
    .header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; margin-bottom: 12px; }
    .header h1 { font-size: 26pt; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; }
    .header .contact { font-size: 9pt; color: #555; margin-top: 5px; }
    .cols { display: flex; gap: 16px; }
    .left-col { width: 38%; }
    .right-col { flex: 1; }
    .section-title { font-size: 10pt; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #fff; background: #1a1a1a; padding: 3px 8px; margin: 8px 0 5px; }
    .entry { margin-bottom: 7px; }
    .entry-title { font-weight: 700; font-size: 10pt; }
    .entry-sub { color: #555; font-size: 9pt; }
    .entry-date { color: #888; font-size: 8.5pt; }
    ul { margin-left: 14px; margin-top: 3px; }
    li { font-size: 9pt; margin-bottom: 2px; line-height: 1.4; }
    .skill-item { font-size: 9pt; padding: 1px 0; border-bottom: 1px dotted #ddd; }
  `;

  const leftSections = ast.sections.filter((s) =>
    ["Skills", "Education", "Certifications"].some((k) => s.title.toLowerCase().includes(k.toLowerCase()))
  );
  const rightSections = ast.sections.filter((s) =>
    !["Skills", "Education", "Certifications"].some((k) => s.title.toLowerCase().includes(k.toLowerCase()))
  );

  const renderSection = (sec: typeof ast.sections[0]) => {
    const items = sec.items.map((item) => {
      if (item.type === "job") {
        const j = item as ResumeJob;
        return `<div class="entry"><div class="entry-title">${j.title}</div><div class="entry-sub">${j.company}</div><div class="entry-date">${j.date}</div><ul>${j.bullets.map((b) => `<li>${b}</li>`).join("")}</ul></div>`;
      }
      if (item.type === "skillgroup") {
        const s = item as ResumeSkillGroup;
        return `<div class="entry"><div class="entry-title">${s.category}</div>${s.items.map((i) => `<div class="skill-item">${i}</div>`).join("")}</div>`;
      }
      if (item.type === "degree") {
        const d = item as ResumeDegree;
        return `<div class="entry"><div class="entry-title">${d.name}</div><div class="entry-sub">${d.school}</div><div class="entry-date">${d.year}</div></div>`;
      }
      if (item.type === "cert") {
        const c = item as ResumeCert;
        return `<div class="entry"><div class="entry-title">${c.name}</div><div class="entry-sub">${c.issuer} · ${c.year}</div></div>`;
      }
      return "";
    }).join("");
    return `<div class="section-title">${sec.title}</div>${items}`;
  };

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_CSS}${css}</style></head><body>
    <div class="header">
      <h1>${ast.name}</h1>
      <div class="contact">${ast.contact.raw.join("  ·  ")}</div>
    </div>
    <div class="cols">
      <div class="left-col">${leftSections.map(renderSection).join("")}</div>
      <div class="right-col">${rightSections.map(renderSection).join("")}</div>
    </div>
  </body></html>`;
}

// ─── 5. PDF Replica (Classic Professional) ──────────────────────────────────

export function renderClassicPDF(ast: ResumeAST): string {
  const css = `
    body { font-family: 'Inter', -apple-system, sans-serif; font-size: 10pt; color: #111; background: #fff; max-width: 800px; margin: 0 auto; padding: 30px 40px; line-height: 1.4; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { font-size: 22pt; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .header .role { font-size: 11pt; color: #444; margin-bottom: 8px; font-weight: 600; }
    .header .contact { font-size: 9pt; color: #333; display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; }
    .section-title { font-size: 11pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1.5px solid #222; margin: 18px 0 8px; padding-bottom: 3px; }
    .entry { margin-bottom: 12px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
    .entry-title { font-weight: 700; font-size: 10.5pt; color: #000; }
    .entry-sub { font-weight: 600; color: #444; font-size: 9.5pt; }
    .entry-date { font-weight: 600; color: #111; font-size: 9pt; }
    ul { margin-left: 18px; margin-top: 4px; }
    li { margin-bottom: 3px; font-size: 9.5pt; }
    .summary { font-size: 10pt; text-align: justify; margin-bottom: 10px; }
    .skill-line { margin-bottom: 4px; font-size: 9.5pt; }
    .skill-cat { font-weight: 700; }
  `;

  const sections = ast.sections.map((sec) => {
    const items = sec.items.map((item) => {
      if (item.type === "job") {
        const j = item as ResumeJob;
        return `<div class="entry"><div class="entry-header"><span class="entry-title">${j.title}</span><span class="entry-date">${j.date}</span></div>${j.company ? `<div class="entry-sub">${j.company}</div>` : ""}<ul>${j.bullets.map((b) => `<li>${b}</li>`).join("")}</ul></div>`;
      }
      if (item.type === "skillgroup") {
        const s = item as ResumeSkillGroup;
        return `<div class="skill-line"><span class="skill-cat">${s.category}: </span>${s.items.join(", ")}</div>`;
      }
      if (item.type === "degree") {
        const d = item as ResumeDegree;
        return `<div class="entry"><div class="entry-header"><span class="entry-title">${d.name}</span><span class="entry-date">${d.year}</span></div><div class="entry-sub">${d.school}</div></div>`;
      }
      if (item.type === "cert") {
        const c = item as ResumeCert;
        return `<div class="entry"><div class="entry-header"><span class="entry-title">${c.name}</span><span class="entry-date">${c.year}</span></div><div class="entry-sub">${c.issuer}</div></div>`;
      }
      if (item.type === "bullet") return `<ul><li>${item.text}</li></ul>`;
      return "";
    }).join("");
    return `<div class="section-title">${sec.title}</div>${items}`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>${BASE_CSS}${css}</style></head><body>
    <div class="header">
      <h1>${ast.name}</h1>
      <div class="role">${ast.role}</div>
      <div class="contact">${ast.contact.raw.join(" | ")}</div>
    </div>
    ${ast.summary ? `<div class="summary">${ast.summary}</div>` : ""}
    ${sections}
  </body></html>`;
}

// ─── 5. Elite LaTeX (Academic Style) ────────────────────────────────────────

export function renderEliteLaTeX(ast: ResumeAST): string {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap');
    
    body { font-family: 'Libre Baskerville', serif; font-size: 9.5pt; color: #111; background: #fff; max-width: 820px; margin: 0 auto; padding: 40px 50px; line-height: 1.35; }
    
    .header { text-align: center; margin-bottom: 15px; }
    .header h1 { font-size: 26pt; font-weight: 700; margin-bottom: 2px; letter-spacing: 0.5px; font-variant: small-caps; }
    .header .location { font-size: 10pt; margin-bottom: 6px; }
    .header .contact { font-size: 8.5pt; display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; font-family: 'Source Sans 3', sans-serif; }
    .header .contact span { display: flex; align-items: center; gap: 4px; }
    
    .section-title { font-size: 13pt; font-weight: 700; border-bottom: 1px solid #222; margin: 16px 0 8px; padding-bottom: 3px; letter-spacing: 0.5px; }
    
    .entry { margin-bottom: 10px; }
    .entry-main { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
    .entry-title { font-weight: 700; font-size: 10.5pt; }
    .entry-date { font-weight: 700; font-size: 9.5pt; white-space: nowrap; }
    
    .entry-sub { display: flex; justify-content: space-between; font-style: italic; font-size: 9.5pt; color: #222; margin-bottom: 4px; font-family: 'Source Sans 3', sans-serif; }
    
    ul { margin-left: 20px; margin-top: 2px; list-style-type: disc; }
    li { margin-bottom: 3px; font-size: 9.5pt; font-family: 'Source Sans 3', sans-serif; text-align: justify; line-height: 1.4; }
    
    .skills-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    .skills-table td { padding: 3px 0; vertical-align: top; font-size: 9.5pt; font-family: 'Source Sans 3', sans-serif; }
    .skills-cat { font-weight: 700; width: 180px; }
    
    .summary { font-size: 9.5pt; font-family: 'Source Sans 3', sans-serif; text-align: justify; margin-bottom: 10px; line-height: 1.5; }
    
    b, strong { font-weight: 700; color: #000; }
  `;

  const sections = ast.sections.map((sec) => {
    const isSkills = sec.title.toLowerCase().includes("skills");
    
    const items = sec.items.map((item) => {
      if (item.type === "job") {
        const j = item as ResumeJob;

        // If this is in the skills section, format it as a skill row (because parser treats \subsection as job)
        if (isSkills) {
           return `<tr><td class="skills-cat">${j.title}:</td><td>${j.bullets.join(", ")}</td></tr>`;
        }

        let date = j.date;
        let company = j.company;
        let extra = "";
        let location = "";
        let realBullets: string[] = [];

        // Heuristics to fix unstructured items
        if (!date && !company && j.bullets.length > 0) {
           j.bullets.forEach(b => {
             if (b.match(/20\d\d|19\d\d|Current|Present/i) && !date) {
               date = b;
             } else if ((b.toLowerCase().includes("sgpa") || b.toLowerCase().includes("per:")) && !extra) {
               extra = b;
             } else if ((b.includes("React") || b.includes("Java,") || b.includes("Link")) && !extra) {
               extra = b;
             } else if (b.length < 80 && !b.match(/^[A-Z][a-z]+ed /) && !company) {
               company = b;
               if (company.includes("Gurugram") || company.includes("Delhi") || company.includes("Uttar Pradesh")) {
                  const parts = company.split(",");
                  if (parts.length > 1) {
                     location = parts.slice(1).join(",").trim();
                     company = parts[0].trim();
                  }
               }
             } else {
               realBullets.push(b);
             }
           });
        } else {
           realBullets = j.bullets;
        }

        const displayTitle = extra ? `${j.title} | <span style="font-weight:normal">${extra}</span>` : j.title;
        
        return `
          <div class="entry">
            <div class="entry-main">
              <span class="entry-title">${displayTitle}</span>
              <span class="entry-date">${date}</span>
            </div>
            ${company || location ? `
            <div class="entry-sub">
              <span>${company}</span>
              <span>${location}</span>
            </div>` : ""}
            ${realBullets.length > 0 ? `<ul>${realBullets.map((b) => `<li>${b}</li>`).join("")}</ul>` : ""}
          </div>`;
      }
      
      if (isSkills && item.type === "skillgroup") {
        const s = item as ResumeSkillGroup;
        return `<tr><td class="skills-cat">${s.category}:</td><td>${s.items.join(", ")}</td></tr>`;
      }
      if (item.type === "skill" && !isSkills) {
         return `<ul><li>${item.name}</li></ul>`;
      } else if (item.type === "skill" && isSkills) {
         return `<tr><td class="skills-cat"></td><td>${item.name}</td></tr>`;
      }
      
      if (item.type === "degree") {
        const d = item as ResumeDegree;
        return `
          <div class="entry">
            <div class="entry-main">
              <span class="entry-title">${d.name}</span>
              <span class="entry-date">${d.year}</span>
            </div>
            <div class="entry-sub">
              <span>${d.school}</span>
              <span></span>
            </div>
          </div>`;
      }
      if (item.type === "bullet") return `<ul><li>${item.text}</li></ul>`;
      return "";
    }).join("");

    return `
      <div class="section-title">${sec.title}</div>
      ${isSkills ? `<table class="skills-table">${items}</table>` : items}
    `;
  }).join("");

  // Extract structured contact info from unstructured multiline string
  let rawContact = ast.contact.raw.join("  ");
  let address = "Ghaziabad, India"; 
  
  const addrMatch = rawContact.match(/Address:\s*(.*?)(?=\s*(Phone|Email|LinkedIn|GitHub|Website):|$)/i);
  if (addrMatch) address = addrMatch[1].trim();

  const phoneMatch = rawContact.match(/Phone:\s*(.*?)(?=\s*(Address|Email|LinkedIn|GitHub|Website):|$)/i);
  const emailMatch = rawContact.match(/Email:\s*(.*?)(?=\s*(Address|Phone|LinkedIn|GitHub|Website):|$)/i);
  const linkMatch = rawContact.match(/LinkedIn:\s*(.*?)(?=\s*(Address|Phone|Email|GitHub|Website):|$)/i);
  const gitMatch = rawContact.match(/GitHub:\s*(.*?)(?=\s*(Address|Phone|Email|LinkedIn|Website):|$)/i);

  const contactItems = [];
  if (phoneMatch) contactItems.push(`<span>✆ ${phoneMatch[1].trim()}</span>`);
  if (emailMatch) contactItems.push(`<span>✉ ${emailMatch[1].trim()}</span>`);
  if (linkMatch) contactItems.push(`<span>in ${linkMatch[1].trim()}</span>`);
  if (gitMatch) contactItems.push(`<span>git ${gitMatch[1].trim()}</span>`);

  let contactHtml = contactItems.join(" | ");
  if (contactItems.length === 0 && ast.contact.raw.length > 0) {
      contactHtml = ast.contact.raw.map(c => `<span>${c}</span>`).join(" | ");
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>${BASE_CSS}${css}</style></head><body>
    <div class="header">
      <h1>${ast.name}</h1>
      ${address ? `<div class="location">${address}</div>` : ""}
      <div class="contact">
        ${contactHtml}
      </div>
    </div>
    ${ast.summary ? `<div class="summary">${ast.summary}</div>` : ""}
    ${sections}
  </body></html>`;
}

// ─── Template Registry ────────────────────────────────────────────────────────

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  style: string; // tag like "Classic" | "Modern" | "Two-Column"
  accentColor: string;
  render: (ast: ResumeAST) => string;
}

export const TEMPLATES: TemplateInfo[] = [
  { id: "elite-latex", name: "Elite LaTeX", description: "The definitive academic/software engineering style. Serif fonts, right-aligned dates, and clean lines.", style: "Academic", accentColor: "#000000", render: renderEliteLaTeX },
  { id: "pdf-replica", name: "PDF Replica", description: "Clean, centered, and professional sans-serif layout.", style: "Classic", accentColor: "#000000", render: renderClassicPDF },
  { id: "jakes-cv", name: "Jake's CV", description: "Clean, ATS-friendly, single-column. Most popular for CS/tech roles.", style: "Classic", accentColor: "#000000", render: renderJakesCV },
  { id: "awesome-cv", name: "Awesome CV", description: "Bold colored header, modern sans-serif. Great for any industry.", style: "Modern", accentColor: "#00ADB5", render: (ast) => renderAwesomeCV(ast, "#00ADB5") },
  { id: "modern-pro", name: "Modern Pro", description: "Sleek, professional look with subtle accents. Perfect for senior roles.", style: "Modern", accentColor: "#2563EB", render: (ast) => renderAwesomeCV(ast, "#2563EB") },
  { id: "minimalist", name: "Minimalist", description: "Ultra-clean design that focuses entirely on content. Zero distractions.", style: "Classic", accentColor: "#444444", render: renderJakesCV },
  { id: "altacv", name: "AltaCV", description: "Sidebar layout with skill bars. Perfect for visual impact.", style: "Sidebar", accentColor: "#4A90D9", render: (ast) => renderAltaCV(ast, "#4A90D9") },
  { id: "deedy", name: "Deedy Resume", description: "Two-column, high-information density. Popular for FAANG applications.", style: "Two-Column", accentColor: "#1a1a1a", render: renderDeedyResume },
];

export function getTemplate(id: string): TemplateInfo {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function renderTemplate(id: string, ast: ResumeAST, customCSS?: string): string {
  if (customCSS && (id === "legacy-style" || id === "pdf-replica" || id === "elite-latex")) {
    const base = id === "elite-latex" ? renderEliteLaTeX(ast) : renderClassicPDF(ast);
    return base.replace("</style>", `${customCSS}</style>`);
  }
  return getTemplate(id).render(ast);
}
