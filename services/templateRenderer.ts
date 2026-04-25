import { ResumeAST, ResumeJob, ResumeSkillGroup, ResumeDegree, ResumeCert } from "./dslParser";

// ─── Shared CSS Utilities ────────────────────────────────────────────────────

const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { -webkit-print-color-adjust: exact; }
  a { text-decoration: none; color: inherit; }
  @page { margin: 0; }
  @media print {
    body { margin: 0; padding: 0; }
    .no-print { display: none !important; }
  }
`;

const INJECTED_JS = `
<script>
  (function() {
    let btn = document.createElement('button');
    btn.className = 'no-print';
    btn.innerText = '🔗 LINK';
    btn.style.cssText = 'position:absolute; display:none; background:#00F0FF; color:black; border:none; padding:6px 12px; border-radius:4px; font-size:10px; font-weight:900; cursor:pointer; z-index:9999; font-family:sans-serif; box-shadow:0 4px 15px rgba(0,240,255,0.4); letter-spacing:1px;';
    document.body.appendChild(btn);

    document.addEventListener('mouseup', () => {
      let sel = window.getSelection();
      let text = sel.toString().trim();
      if (text && text.length > 1) {
        let range = sel.getRangeAt(0);
        let rect = range.getBoundingClientRect();
        btn.style.left = (rect.left + window.pageXOffset + (rect.width / 2) - 30) + 'px';
        btn.style.top = (rect.top + window.pageYOffset - 35) + 'px';
        btn.style.display = 'block';
        btn.onmousedown = (e) => e.preventDefault(); // prevent losing selection
        btn.onclick = () => {
          let url = prompt('Enter URL for "' + text + '":', 'https://');
          if (url) {
            window.parent.postMessage({ type: 'MAKE_LINK', text: text, url: url }, '*');
          }
          btn.style.display = 'none';
          sel.removeAllRanges();
        };
      } else {
        btn.style.display = 'none';
      }
    });

    document.addEventListener('mousedown', () => {
      if (btn.style.display === 'block') {
        // give small delay so click can register if it was on the button
        setTimeout(() => { if (!window.getSelection().toString().trim()) btn.style.display = 'none'; }, 100);
      }
    });
  })();
</script>
`;

function formatText(str: string): string {
  const linkIcon = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 2px; opacity: 0.5; display: inline-block; vertical-align: middle;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`;
  
  return str
    .replace(/🔗/g, linkIcon) // Replace existing emoji with a clean SVG
    .replace(/\\link\s*{([^}]+)}\s*{([^}]+)}/g, `<a href="$1" target="_blank" style="color: #007AFF; text-decoration: underline; text-decoration-style: dashed; text-underline-offset: 2px; font-weight: 500;">$2${linkIcon}</a>`)
    .replace(/\\textbf\s*{([^}]+)}/g, "<strong>$1</strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderContact(ast: ResumeAST, separator = " | "): string {
  const rawContact = ast.contact.raw.join("  ");
  const contactItems: string[] = [];
  
  // 1. Extract structured "Key: value" contacts
  const phoneMatch = rawContact.match(/Phone:\s*(\+?[\d\s\-().]+)/i);
  const emailMatch = rawContact.match(/Email:\s*([^\s]+@[^\s]+)/i);
  // Match "LinkedIn: url" but NOT if it's inside a \link command
  const linkedinMatch = rawContact.match(/LinkedIn:\s*(?!\\link)([^\s]+)/i);
  const githubMatch = rawContact.match(/GitHub:\s*(?!\\link)([^\s]+)/i);

  if (phoneMatch) {
    const p = phoneMatch[1].trim();
    contactItems.push(`<span><a href="tel:${p}">${p}</a></span>`);
  }
  if (emailMatch) {
    const e = emailMatch[1].trim();
    contactItems.push(`<span><a href="mailto:${e}">${e}</a></span>`);
  }
  if (linkedinMatch) {
    const l = linkedinMatch[1].trim();
    const url = l.startsWith("http") ? l : `https://${l}`;
    contactItems.push(`<span><a href="${url}" target="_blank">${l}</a></span>`);
  }
  if (githubMatch) {
    const g = githubMatch[1].trim();
    const url = g.startsWith("http") ? g : `https://${g}`;
    contactItems.push(`<span><a href="${url}" target="_blank">${g}</a></span>`);
  }

  // 2. Extract \link{url}{label} commands from contact (handles DSL-style links)
  const linkCmdRegex = /\\link\s*{([^}]+)}\s*{([^}]+)}/g;
  let m;
  while ((m = linkCmdRegex.exec(rawContact)) !== null) {
    const url = m[1].trim();
    const label = m[2].trim();
    // Avoid duplicating if we already matched this as a structured contact
    const alreadyHas = contactItems.some(ci => ci.includes(url) || ci.includes(label));
    if (!alreadyHas) {
      contactItems.push(`<span><a href="${url}" target="_blank">${label}</a></span>`);
    }
  }

  // 3. Fallback: if no structured contacts found, run formatText on the raw strings
  if (contactItems.length === 0 && ast.contact.raw.length > 0) {
    return ast.contact.raw.map(c => `<span>${formatText(c)}</span>`).join(separator);
  }
  
  return contactItems.join(separator);
}

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
        return `<div class="job-header"><span><span class="job-title">${formatText(j.title)}</span> — <span class="job-company">${formatText(j.company)}</span></span><span class="job-date">${j.date}</span></div><ul>${j.bullets.map((b) => `<li>${formatText(b)}</li>`).join("")}</ul>`;
      }
      if (item.type === "skillgroup") {
        const s = item as ResumeSkillGroup;
        return `<div class="skill-row"><span class="skill-cat">${formatText(s.category)}:</span><span>${formatText(s.items.join(", "))}</span></div>`;
      }
      if (item.type === "degree") {
        const d = item as ResumeDegree;
        return `<div class="edu-row"><span><b>${formatText(d.name)}</b>, ${formatText(d.school)}</span><span>${d.year}</span></div>`;
      }
      if (item.type === "cert") {
        const c = item as ResumeCert;
        return `<div class="cert-row"><span><b>${formatText(c.name)}</b> — ${formatText(c.issuer)}</span><span>${c.year}</span></div>`;
      }
      if (item.type === "bullet") return `<ul><li>${formatText(item.text)}</li></ul>`;
      return "";
    }).join("");
    return `<div class="section-title">${sec.title}</div>${items}`;
  }).join("<br/>");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_CSS}${css}</style></head><body>
    <div class="header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1; margin-left: ${ast.qrcode ? '80px' : '0'};">
          <h1>${ast.name}</h1>
          <div class="contact">${renderContact(ast, "<span>|</span>")}</div>
        </div>
        ${ast.qrcode ? `
        <div style="width: 70px; text-align: center;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(ast.qrcode)}" 
               style="width: 60px; height: 60px; border: 1px solid #eee; padding: 2px;" 
               alt="QR Code" />
          <div style="font-size: 7px; color: #888; margin-top: 2px; font-weight: bold; letter-spacing: 0.5px;">SCAN ME</div>
        </div>
        ` : ""}
      </div>
    </div>
    ${ast.summary ? `<div class="summary">${formatText(ast.summary)}</div>` : ""}
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
        return `<div class="entry"><div class="entry-header"><div><div class="entry-title">${formatText(j.title)}</div><div class="entry-sub">${formatText(j.company)}</div></div><div class="entry-date">${j.date}</div></div><ul>${j.bullets.map((b) => `<li>${formatText(b)}</li>`).join("")}</ul></div>`;
      }
      if (item.type === "skillgroup") {
        const s = item as ResumeSkillGroup;
        return `<div class="skill-row"><span class="skill-cat">${formatText(s.category)}</span><span>${formatText(s.items.join(" · "))}</span></div>`;
      }
      if (item.type === "degree") {
        const d = item as ResumeDegree;
        return `<div class="entry"><div class="entry-header"><div><div class="entry-title">${formatText(d.name)}</div><div class="entry-sub">${formatText(d.school)}</div></div><div class="entry-date">${d.year}</div></div></div>`;
      }
      if (item.type === "cert") {
        const c = item as ResumeCert;
        return `<div class="entry"><div class="entry-header"><div class="entry-title">${formatText(c.name)}</div><div class="entry-date">${c.year}</div></div><div class="entry-sub">${formatText(c.issuer)}</div></div>`;
      }
      if (item.type === "bullet") return `<ul><li>${formatText(item.text)}</li></ul>`;
      return "";
    }).join("");
    return `<div class="section-title">${sec.title}</div>${items}`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_CSS}${css}</style></head><body>
    <div class="header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1>${ast.name}</h1>
        <div class="role">${ast.role}</div>
        <div class="contact">${renderContact(ast, "  ·  ")}</div>
      </div>
      ${ast.qrcode ? `
      <div style="background: white; padding: 6px; border-radius: 4px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(ast.qrcode)}" 
             style="width: 50px; height: 50px; display: block;" 
             alt="QR Code" />
        <div style="font-size: 6px; color: #333; margin-top: 4px; font-weight: bold;">PORTFOLIO</div>
      </div>
      ` : ""}
    </div>
    <div class="body">
      ${ast.summary ? `<div class="summary">${formatText(ast.summary)}</div>` : ""}
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
        <div class="skill-name">${formatText(skill)}</div>
        <div class="skill-bar-bg"><div class="skill-bar-fill" style="width:${80 + idx * 5}%"></div></div>
      </div>`).join("")
  ).join("");

  const mainSections = ast.sections.map((sec) => {
    const items = sec.items.map((item) => {
      if (item.type === "job") {
        const j = item as ResumeJob;
        return `<div class="entry"><div class="entry-header"><div><div class="entry-title">${formatText(j.title)}</div><div class="entry-sub">${formatText(j.company)}</div></div><div class="entry-date">${j.date}</div></div><ul>${j.bullets.map((b) => `<li>${formatText(b)}</li>`).join("")}</ul></div>`;
      }
      if (item.type === "skillgroup") return ""; // shown in sidebar
      if (item.type === "degree") {
        const d = item as ResumeDegree;
        return `<div class="entry"><div class="entry-header"><div><div class="entry-title">${formatText(d.name)}</div><div class="entry-sub">${formatText(d.school)}</div></div><div class="entry-date">${d.year}</div></div></div>`;
      }
      if (item.type === "cert") {
        const c = item as ResumeCert;
        return `<div class="entry"><div class="entry-header"><div class="entry-title">${formatText(c.name)}</div><div class="entry-date">${c.year}</div></div><div class="entry-sub">${formatText(c.issuer)}</div></div>`;
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
      ${renderContact(ast, "<br/>")}
      ${sidebarSkills ? `<div class="sidebar-section">Skills</div>${sidebarSkills}` : ""}
    </div>
    <div class="main">
      ${ast.summary ? `<div class="summary">${formatText(ast.summary)}</div>` : ""}
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
        return `<div class="entry"><div class="entry-title">${formatText(j.title)}</div><div class="entry-sub">${formatText(j.company)}</div><div class="entry-date">${j.date}</div><ul>${j.bullets.map((b) => `<li>${formatText(b)}</li>`).join("")}</ul></div>`;
      }
      if (item.type === "skillgroup") {
        const s = item as ResumeSkillGroup;
        return `<div class="entry"><div class="entry-title">${formatText(s.category)}</div>${s.items.map((i) => `<div class="skill-item">${formatText(i)}</div>`).join("")}</div>`;
      }
      if (item.type === "degree") {
        const d = item as ResumeDegree;
        return `<div class="entry"><div class="entry-title">${formatText(d.name)}</div><div class="entry-sub">${formatText(d.school)}</div><div class="entry-date">${d.year}</div></div>`;
      }
      if (item.type === "cert") {
        const c = item as ResumeCert;
        return `<div class="entry"><div class="entry-title">${formatText(c.name)}</div><div class="entry-sub">${formatText(c.issuer)} · ${c.year}</div></div>`;
      }
      return "";
    }).join("");
    return `<div class="section-title">${sec.title}</div>${items}`;
  };

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${BASE_CSS}${css}</style></head><body>
    <div class="header">
      <h1>${ast.name}</h1>
      <div class="contact">${renderContact(ast, "  ·  ")}</div>
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
        return `<div class="entry"><div class="entry-header"><span class="entry-title">${formatText(j.title)}</span><span class="entry-date">${j.date}</span></div>${j.company ? `<div class="entry-sub">${formatText(j.company)}</div>` : ""}<ul>${j.bullets.map((b) => `<li>${formatText(b)}</li>`).join("")}</ul></div>`;
      }
      if (item.type === "skillgroup") {
        const s = item as ResumeSkillGroup;
        return `<div class="skill-line"><span class="skill-cat">${formatText(s.category)}: </span>${formatText(s.items.join(", "))}</div>`;
      }
      if (item.type === "degree") {
        const d = item as ResumeDegree;
        return `<div class="entry"><div class="entry-header"><span class="entry-title">${formatText(d.name)}</span><span class="entry-date">${d.year}</span></div><div class="entry-sub">${formatText(d.school)}</div></div>`;
      }
      if (item.type === "cert") {
        const c = item as ResumeCert;
        return `<div class="entry"><div class="entry-header"><span class="entry-title">${formatText(c.name)}</span><span class="entry-date">${c.year}</span></div><div class="entry-sub">${formatText(c.issuer)}</div></div>`;
      }
      if (item.type === "bullet") return `<ul><li>${formatText(item.text)}</li></ul>`;
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
      <div class="contact">${renderContact(ast, " | ")}</div>
    </div>
    ${ast.summary ? `<div class="summary">${formatText(ast.summary)}</div>` : ""}
    ${sections}
  </body></html>`;
}

// ─── 5. Elite LaTeX (Academic Style) ────────────────────────────────────────

export function renderEliteLaTeX(ast: ResumeAST): string {
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;600&display=swap');
    
    body { font-family: 'Libre Baskerville', serif; font-size: 9.5pt; color: #111; background: #fff; max-width: 820px; margin: 0 auto; padding: 0.3in 0.4in; line-height: 1.3; }
    
    .header { text-align: center; margin-bottom: 8px; }
    .header h1 { font-size: 24pt; font-weight: 700; margin-bottom: 0px; letter-spacing: 0.5px; font-variant: small-caps; }
    .header .location { font-size: 9.5pt; margin-bottom: 4px; }
    .header .contact { font-size: 8.5pt; display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; font-family: 'Source Sans 3', sans-serif; }
    .header .contact span { display: flex; align-items: center; gap: 4px; }
    
    .section-title { font-size: 12pt; font-weight: 700; border-bottom: 1px solid #222; margin: 12px 0 6px; padding-bottom: 2px; letter-spacing: 0.5px; }
    
    .entry { margin-bottom: 6px; }
    .entry-main { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1px; }
    .entry-title { font-weight: 700; font-size: 10pt; }
    .entry-date { font-weight: 700; font-size: 9pt; white-space: nowrap; }
    
    .entry-sub { display: flex; justify-content: space-between; font-style: italic; font-size: 9pt; color: #222; margin-bottom: 2px; font-family: 'Source Sans 3', sans-serif; }
    
    ul { margin-left: 18px; margin-top: 1px; list-style-type: disc; }
    li { margin-bottom: 2px; font-size: 9pt; font-family: 'Source Sans 3', sans-serif; text-align: justify; line-height: 1.35; }
    
    .skills-table { width: 100%; border-collapse: collapse; margin-top: 2px; }
    .skills-table td { padding: 2px 0; vertical-align: top; font-size: 9pt; font-family: 'Source Sans 3', sans-serif; }
    .skills-cat { font-weight: 700; width: 160px; }
    
    .summary { font-size: 9pt; font-family: 'Source Sans 3', sans-serif; text-align: justify; margin-bottom: 8px; line-height: 1.4; }
    
    b, strong { font-weight: 700; color: #000; }
  `;

  const sections = ast.sections.map((sec) => {
    const isSkills = sec.title.toLowerCase().includes("skills");
    
    const items = sec.items.map((item) => {
      if (item.type === "job") {
        const j = item as ResumeJob;

        // If this is in the skills section, format it as a skill row
        if (isSkills) {
           return `<tr><td class="skills-cat">${formatText(j.title)}:</td><td>${formatText(j.bullets.join(", "))}</td></tr>`;
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
             } else if ((b.includes("React") || b.includes("Java,")) && !extra) {
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

        const displayTitle = extra ? `${formatText(j.title)} | <span style="font-weight:normal">${formatText(extra)}</span>` : formatText(j.title);
        
        return `
          <div class="entry">
            <div class="entry-main">
              <span class="entry-title">${displayTitle}</span>
              <span class="entry-date">${date}</span>
            </div>
            ${company || location ? `
            <div class="entry-sub">
              <span>${formatText(company)}</span>
              <span>${location}</span>
            </div>` : ""}
            ${realBullets.length > 0 ? `<ul>${realBullets.map((b) => `<li>${formatText(b)}</li>`).join("")}</ul>` : ""}
          </div>`;
      }
      
      if (isSkills && item.type === "skillgroup") {
        const s = item as ResumeSkillGroup;
        return `<tr><td class="skills-cat">${formatText(s.category)}:</td><td>${formatText(s.items.join(", "))}</td></tr>`;
      }
      if (item.type === "skill" && !isSkills) {
         return `<ul><li>${formatText(item.name)}</li></ul>`;
      } else if (item.type === "skill" && isSkills) {
         return `<tr><td class="skills-cat"></td><td>${formatText(item.name)}</td></tr>`;
      }
      
      if (item.type === "degree") {
        const d = item as ResumeDegree;
        return `
          <div class="entry">
            <div class="entry-main">
              <span class="entry-title">${formatText(d.name)}</span>
              <span class="entry-date">${d.year}</span>
            </div>
            <div class="entry-sub">
              <span>${formatText(d.school)}</span>
              <span></span>
            </div>
          </div>`;
      }
      if (item.type === "bullet") return `<ul><li>${formatText(item.text)}</li></ul>`;
      return "";
    }).join("");

    return `
      <div class="section-title">${sec.title}</div>
      ${isSkills ? `<table class="skills-table">${items}</table>` : items}
    `;
  }).join("");

  const contactHtml = renderContact(ast, " | ");
  const address = ast.contact.location || "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>${BASE_CSS}${css}</style></head><body>
    <div class="header">
      <h1>${ast.name}</h1>
      ${address ? `<div class="location">${address}</div>` : ""}
      <div class="contact">
        ${contactHtml}
      </div>
    </div>
    ${ast.summary ? `<div class="summary">${formatText(ast.summary)}</div>` : ""}
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
  const html = getTemplate(id).render(ast);
  let finalHtml = html.replace("</body>", `${INJECTED_JS}</body>`);
  
  if (customCSS) {
    finalHtml = finalHtml.replace("</style>", `\n/* User Custom CSS */\n${customCSS}\n</style>`);
  }
  
  return finalHtml;
}
