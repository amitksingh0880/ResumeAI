/**
 * Link Service
 * Scans resume DSL source to extract all linkable items (projects, skills,
 * companies, certifications, etc.) and provides utilities to add/edit/remove
 * hyperlinks in the DSL source.
 */

export interface LinkableItem {
  id: string;           // unique key for React
  label: string;        // display text (e.g. "CraveQuest")
  category: "project" | "skill" | "company" | "certification" | "education" | "contact" | "other";
  currentUrl: string;   // "" if not linked
  section: string;      // which resume section it belongs to
}

/**
 * Scan the DSL source and extract all items that could be hyperlinked.
 * Returns already-linked items (with their URL) and unlinked items.
 */
export function extractLinkableItems(source: string): LinkableItem[] {
  const items: LinkableItem[] = [];
  const seen = new Set<string>();

  function addItem(label: string, category: LinkableItem["category"], section: string, url = "") {
    const trimmed = label.trim();
    if (!trimmed || trimmed.length < 2) return;
    const key = `${category}:${trimmed}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      id: key,
      label: trimmed,
      category,
      currentUrl: url,
      section,
    });
  }

  // 1. Find existing \link{url}{label} commands
  const linkRegex = /\\link\s*{([^}]+)}\s*{([^}]+)}/g;
  let match;
  while ((match = linkRegex.exec(source)) !== null) {
    const url = match[1].trim();
    const label = match[2].trim();
    // Determine category heuristically
    let cat: LinkableItem["category"] = "other";
    if (/github\.com|gitlab\.com|bitbucket\.org/i.test(url)) cat = "project";
    else if (/linkedin\.com/i.test(url)) cat = "contact";
    else if (/\.edu|university|college/i.test(url)) cat = "education";
    else cat = "project";
    addItem(label, cat, "Linked", url);
  }

  // 2. Extract job titles and companies
  const jobRegex = /\\job\s*{([^}]*)}\s*{([^}]*)}\s*{([^}]*)}/g;
  while ((match = jobRegex.exec(source)) !== null) {
    const title = match[1].replace(/\\link\s*{[^}]+}\s*{([^}]+)}/g, "$1").trim();
    const company = match[2].replace(/\\link\s*{[^}]+}\s*{([^}]+)}/g, "$1").trim();
    
    // Check if the company is already linked in the raw source
    const companyRaw = match[2].trim();
    const companyLinkMatch = companyRaw.match(/\\link\s*{([^}]+)}\s*{([^}]+)}/);
    
    if (company) {
      addItem(company, "company", "Experience", companyLinkMatch ? companyLinkMatch[1] : "");
    }
    // Job title with a project name (e.g. "Java Development Intern")
    if (title && !title.match(/intern|engineer|developer|manager|lead|analyst|designer/i)) {
      addItem(title, "project", "Experience");
    }
  }

  // 3. Extract project names from subsection commands
  const subsectionRegex = /\\subsection\s*{([^}]+)}/g;
  while ((match = subsectionRegex.exec(source)) !== null) {
    let raw = match[1].trim();
    // Check if already has a link inside
    const innerLink = raw.match(/\\link\s*{([^}]+)}\s*{([^}]+)}/);
    if (innerLink) {
      addItem(innerLink[2].trim(), "project", "Projects", innerLink[1].trim());
    } else {
      // Strip any pipe-separated tech stack  e.g. "CraveQuest | React, Express.js"
      const name = raw.split("|")[0].trim();
      if (name && !name.match(/^(Master|Bachelor|Intermediate|High School|Education|Experience|Projects|Technical|Skills|Certifications)/i)) {
        addItem(name, "project", "Projects");
      }
    }
  }

  // 4. Extract skill items from \skillgroup{category}{items}
  const skillGroupRegex = /\\skillgroup\s*{([^}]*)}\s*{([^}]*)}/g;
  while ((match = skillGroupRegex.exec(source)) !== null) {
    const category = match[1].trim();
    const itemsStr = match[2];
    
    // Split by comma and extract each skill
    const skillItems = itemsStr.split(",").map(s => s.trim()).filter(Boolean);
    for (const skillRaw of skillItems) {
      const skillLink = skillRaw.match(/\\link\s*{([^}]+)}\s*{([^}]+)}/);
      if (skillLink) {
        addItem(skillLink[2].trim(), "skill", `Skills / ${category}`, skillLink[1].trim());
      } else {
        const clean = skillRaw.replace(/\s+/g, " ").trim();
        if (clean && clean.length > 1) {
          addItem(clean, "skill", `Skills / ${category}`);
        }
      }
    }
  }

  // 5. Extract certifications from \cert{name}{issuer}{year}
  const certRegex = /\\cert\s*{([^}]*)}\s*{([^}]*)}\s*{([^}]*)}/g;
  while ((match = certRegex.exec(source)) !== null) {
    const name = match[1].replace(/\\link\s*{[^}]+}\s*{([^}]+)}/g, "$1").trim();
    const certLink = match[1].match(/\\link\s*{([^}]+)}\s*{([^}]+)}/);
    addItem(name, "certification", "Certifications", certLink ? certLink[1] : "");
  }

  // 6. Extract degree/education from \degree{name}{school}{year}
  const degreeRegex = /\\degree\s*{([^}]*)}\s*{([^}]*)}\s*{([^}]*)}/g;
  while ((match = degreeRegex.exec(source)) !== null) {
    const school = match[2].replace(/\\link\s*{[^}]+}\s*{([^}]+)}/g, "$1").trim();
    const schoolLink = match[2].match(/\\link\s*{([^}]+)}\s*{([^}]+)}/);
    if (school) {
      addItem(school, "education", "Education", schoolLink ? schoolLink[1] : "");
    }
  }

  return items;
}

/**
 * Add or update a link for a specific text in the DSL source.
 * If the text already has a \link wrapper, update the URL.
 * If not, wrap the first occurrence in a \link command.
 */
export function upsertLink(source: string, label: string, url: string): string {
  // Escape special regex chars in the label
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Case 1: Already wrapped in \link{oldUrl}{label} — update the URL
  const existingLink = new RegExp(`\\\\link\\s*{[^}]+}\\s*{${escaped}}`, "g");
  if (existingLink.test(source)) {
    return source.replace(existingLink, `\\link{${url}}{${label}}`);
  }

  // Case 2: Not linked yet — find the first plain-text occurrence and wrap it
  // Be careful not to match inside existing \link commands or other commands
  // Try matching inside \skillgroup, \job, \subsection, \bullet, \cert first
  
  // Strategy: replace the FIRST occurrence of the exact label that isn't inside a \link
  const plainIdx = findPlainTextOccurrence(source, label);
  if (plainIdx >= 0) {
    return source.substring(0, plainIdx) + `\\link{${url}}{${label}}` + source.substring(plainIdx + label.length);
  }

  return source;
}

/**
 * Remove a link for a label — unwrap \link{url}{label} back to just label
 */
export function removeLink(source: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const linkPattern = new RegExp(`\\\\link\\s*{[^}]+}\\s*{${escaped}}`, "g");
  return source.replace(linkPattern, label);
}

/**
 * Find the index of the first occurrence of `label` in `source` that is NOT
 * already inside a \link{...}{...} command.
 */
function findPlainTextOccurrence(source: string, label: string): number {
  let searchFrom = 0;
  while (searchFrom < source.length) {
    const idx = source.indexOf(label, searchFrom);
    if (idx < 0) return -1;
    
    // Check if this occurrence is inside a \link command
    // Look backwards from idx for \link{...}{
    const before = source.substring(Math.max(0, idx - 200), idx);
    // If the text before ends with an unclosed \link{...}{ pattern, skip
    const linkCheck = before.match(/\\link\s*{[^}]*}\s*{[^}]*$/);
    if (linkCheck) {
      searchFrom = idx + label.length;
      continue;
    }
    
    return idx;
  }
  return -1;
}
