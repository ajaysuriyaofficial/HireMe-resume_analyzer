/* =====================================================================
   HIREme — Intelligent Resume Analyzer
   Rule-Based Resume Analysis and Requirement Matching
   100% vanilla JavaScript. No external libraries or APIs.
   ===================================================================== */

(function () {
  "use strict";

  /* -------------------------------------------------------------------
     0. STATE
     ------------------------------------------------------------------- */
  const state = {
    jd: {
      raw: "",
      skills: [],      // required skills found in JD
      keywords: []      // meaningful keywords found in JD
    },
    candidates: []       // array of candidate objects
  };

  let candidateCounter = 0;

  /* -------------------------------------------------------------------
     1. STATIC DATA — STOP WORDS & SKILL DICTIONARY
     ------------------------------------------------------------------- */
  const STOP_WORDS = new Set([
    "the", "a", "an", "and", "or", "is", "are", "to", "of", "for", "with",
    "in", "on", "at", "from", "this", "that", "we", "you", "your", "our",
    "be", "as", "will", "have", "has", "it", "by", "an", "any", "such",
    "who", "which", "their", "they", "them", "us", "if", "than", "then",
    "into", "about", "also", "can", "may", "should", "must", "etc", "eg",
    "i.e", "e.g", "looking", "seeking", "candidate", "candidates", "role",
    "position", "job", "company", "team", "including", "include"
  ]);

  // Skill dictionary stored directly in JavaScript. No external source.
  const SKILL_DICTIONARY = [
    "java", "javascript", "python", "c", "c++", "c#", "html", "css",
    "sql", "mysql", "postgresql", "mongodb", "git", "github", "react",
    "angular", "vue", "node.js", "nodejs", "express", "django", "flask",
    "machine learning", "artificial intelligence", "deep learning",
    "data science", "data analysis", "cloud computing", "aws", "azure",
    "gcp", "docker", "kubernetes", "linux", "communication", "leadership",
    "problem solving", "teamwork", "project management", "agile",
    "scrum", "rest api", "api", "typescript", "php", "ruby", "swift",
    "kotlin", "r", "excel", "power bi", "tableau", "figma", "photoshop",
    "testing", "debugging", "devops", "ci/cd", "microservices",
    "data structures", "algorithms", "oop", "object oriented programming",
    "networking", "cybersecurity", "unit testing", "time management",
    "critical thinking", "analytical skills", "sql server", "firebase",
    "graphql", "redux", "sass", "bootstrap", "tailwind", "jquery",
    "spring boot", "spring", ".net", "asp.net", "unix", "bash", "shell scripting"
  ];

  // Keywords that hint at years of experience.
  const EXPERIENCE_HINTS = [
    "experience", "years", "yrs", "internship", "intern", "worked",
    "developed", "built", "implemented", "led", "managed", "designed",
    "created", "maintained", "deployed", "collaborated"
  ];

  // Keywords that hint at education background.
  const EDUCATION_HINTS = [
    "bachelor", "b.e", "be", "b.tech", "btech", "master", "m.tech",
    "mtech", "msc", "bsc", "degree", "university", "college", "engineering",
    "computer science", "diploma", "graduate", "postgraduate", "phd"
  ];

  /* -------------------------------------------------------------------
     2. TEXT PROCESSING FUNCTIONS
     ------------------------------------------------------------------- */

  // Step 1 — Normalize text: lowercase, strip punctuation, collapse spaces.
  function normalizeText(text) {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[^\w\s.+#/-]/g, " ")   // keep characters useful for skills like c++ / c# / node.js
      .replace(/\s+/g, " ")
      .trim();
  }

  // Step 1b — Tokenize normalized text into words.
  function tokenizeText(normalized) {
    if (!normalized) return [];
    return normalized.split(" ").filter(Boolean);
  }

  // Step 2 — Remove stop words from a token list.
  function removeStopWords(tokens) {
    return tokens.filter((word) => !STOP_WORDS.has(word) && word.length > 2);
  }

  // Step 2b — Extract meaningful, de-duplicated keywords from raw text.
  function extractKeywords(rawText) {
    const normalized = normalizeText(rawText);
    const tokens = tokenizeText(normalized);
    const meaningful = removeStopWords(tokens);
    return Array.from(new Set(meaningful));
  }

  // Step 3 — Extract known skills from raw text using the skill dictionary.
  function extractSkills(rawText) {
    const normalized = normalizeText(rawText);
    const found = [];
    SKILL_DICTIONARY.forEach((skill) => {
      const skillNormalized = normalizeText(skill);
      // Use word-boundary-aware search so "r" doesn't match inside "your".
      const pattern = new RegExp(
        "(^|[^a-z0-9])" + escapeRegExp(skillNormalized) + "($|[^a-z0-9])",
        "i"
      );
      if (pattern.test(" " + normalized + " ")) {
        found.push(titleCaseSkill(skill));
      }
    });
    return Array.from(new Set(found));
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function titleCaseSkill(skill) {
    // Preserve known stylings for common skills.
    const specialCase = {
      "javascript": "JavaScript", "html": "HTML", "css": "CSS", "sql": "SQL",
      "mysql": "MySQL", "postgresql": "PostgreSQL", "mongodb": "MongoDB",
      "git": "Git", "github": "GitHub", "react": "React", "angular": "Angular",
      "vue": "Vue", "node.js": "Node.js", "nodejs": "Node.js",
      "express": "Express", "django": "Django", "flask": "Flask",
      "aws": "AWS", "azure": "Azure", "gcp": "GCP", "docker": "Docker",
      "kubernetes": "Kubernetes", "linux": "Linux", "c++": "C++",
      "c#": "C#", "php": "PHP", "typescript": "TypeScript", "r": "R",
      "api": "API", "rest api": "REST API", "oop": "OOP",
      "ci/cd": "CI/CD", "unix": "Unix", "bash": "Bash", ".net": ".NET",
      "asp.net": "ASP.NET"
    };
    if (specialCase[skill]) return specialCase[skill];
    return skill.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /* -------------------------------------------------------------------
     3. EXPERIENCE / EDUCATION DETECTION
     ------------------------------------------------------------------- */

  function detectExperience(rawText) {
    const normalized = normalizeText(rawText);
    // Look for a number followed by "year(s)" / "yr(s)".
    const yearMatch = normalized.match(/(\d+)\s*\+?\s*(years|year|yrs|yr)/);
    const hintHits = EXPERIENCE_HINTS.filter((hint) => normalized.includes(hint));
    return {
      years: yearMatch ? parseInt(yearMatch[1], 10) : null,
      hintCount: hintHits.length,
      detected: Boolean(yearMatch) || hintHits.length > 0
    };
  }

  function detectEducation(rawText) {
    const normalized = normalizeText(rawText);
    const hintHits = EDUCATION_HINTS.filter((hint) => normalized.includes(hint));
    return {
      hintCount: hintHits.length,
      detected: hintHits.length > 0
    };
  }

  /* -------------------------------------------------------------------
     4. SCORING FUNCTIONS
     ------------------------------------------------------------------- */

  // Skill match: percentage of JD-required skills found in resume.
  function calculateSkillMatch(jdSkills, resumeSkills) {
    if (jdSkills.length === 0) return { score: null, matched: [], missing: [] };
    const resumeSet = new Set(resumeSkills.map((s) => s.toLowerCase()));
    const matched = jdSkills.filter((s) => resumeSet.has(s.toLowerCase()));
    const missing = jdSkills.filter((s) => !resumeSet.has(s.toLowerCase()));
    const score = Math.round((matched.length / jdSkills.length) * 100);
    return { score, matched, missing };
  }

  // Keyword match: overlap between JD keywords and resume keywords.
  function calculateKeywordMatch(jdKeywords, resumeKeywords) {
    if (jdKeywords.length === 0) return { score: null, matched: [] };
    const resumeSet = new Set(resumeKeywords);
    const matched = jdKeywords.filter((k) => resumeSet.has(k));
    const score = Math.round((matched.length / jdKeywords.length) * 100);
    return { score, matched };
  }

  // Experience match: rule-based estimate from detected hints/years.
  function calculateExperienceMatch(experienceInfo) {
    if (!experienceInfo.detected) return { score: null, label: "Not detected" };
    let score = 40; // baseline for any detected experience language
    if (experienceInfo.years !== null) {
      score = Math.min(100, 50 + experienceInfo.years * 10);
    } else {
      score = Math.min(100, 40 + experienceInfo.hintCount * 8);
    }
    const label = experienceInfo.years !== null
      ? experienceInfo.years + " year(s) mentioned"
      : "Relevant experience language detected";
    return { score, label };
  }

  // Education match: rule-based estimate from detected hints.
  function calculateEducationMatch(educationInfo) {
    if (!educationInfo.detected) return { score: null, label: "Not detected" };
    const score = Math.min(100, 55 + educationInfo.hintCount * 10);
    return { score, label: "Education background detected" };
  }

  // Overall score with dynamic weight redistribution when a category
  // cannot be detected, so the result never misrepresents missing data.
  function calculateOverallScore(parts) {
    const weights = { skill: 0.60, keyword: 0.20, experience: 0.10, education: 0.10 };
    let totalWeight = 0;
    let weightedSum = 0;

    Object.keys(weights).forEach((key) => {
      const value = parts[key];
      if (value !== null && value !== undefined) {
        weightedSum += value * weights[key];
        totalWeight += weights[key];
      }
    });

    if (totalWeight === 0) return 0;
    // Redistribute: scale up by the inverse of the weight actually used.
    return Math.round(weightedSum / totalWeight);
  }

  // Recommendation logic based on overall score.
  function generateRecommendation(score) {
    if (score >= 90) return { label: "Highly Recommended", css: "rec-high" };
    if (score >= 75) return { label: "Recommended", css: "rec-good" };
    if (score >= 60) return { label: "Consider", css: "rec-consider" };
    return { label: "Low Match", css: "rec-low" };
  }

  /* -------------------------------------------------------------------
     5. CORE ANALYSIS PIPELINE
     ------------------------------------------------------------------- */

  function analyzeJobDescription(rawText) {
    const skills = extractSkills(rawText);
    const keywords = extractKeywords(rawText);
    state.jd = { raw: rawText, skills, keywords };
    return state.jd;
  }

  function analyzeResume(candidate) {
    const rawText = candidate.rawText;

    const resumeSkills = extractSkills(rawText);
    const resumeKeywords = extractKeywords(rawText);
    const experienceInfo = detectExperience(rawText);
    const educationInfo = detectEducation(rawText);

    const skillResult = calculateSkillMatch(state.jd.skills, resumeSkills);
    const keywordResult = calculateKeywordMatch(state.jd.keywords, resumeKeywords);
    const experienceResult = calculateExperienceMatch(experienceInfo);
    const educationResult = calculateEducationMatch(educationInfo);

    const overallScore = calculateOverallScore({
      skill: skillResult.score,
      keyword: keywordResult.score,
      experience: experienceResult.score,
      education: educationResult.score
    });

    const recommendation = generateRecommendation(overallScore);

    candidate.resumeSkills = resumeSkills;
    candidate.resumeKeywords = resumeKeywords;
    candidate.experienceInfo = experienceInfo;
    candidate.educationInfo = educationInfo;
    candidate.skillResult = skillResult;
    candidate.keywordResult = keywordResult;
    candidate.experienceResult = experienceResult;
    candidate.educationResult = educationResult;
    candidate.overallScore = overallScore;
    candidate.recommendation = recommendation;
    candidate.summary = buildAnalysisSummary(candidate);

    return candidate;
  }

  function buildAnalysisSummary(candidate) {
    const matched = candidate.skillResult.matched || [];
    const missing = candidate.skillResult.missing || [];

    let text = "";
    if (matched.length > 0) {
      text += "Candidate demonstrates alignment with the required " +
        joinWithAnd(matched) + " skills. ";
    } else {
      text += "No direct overlap was found between the candidate's resume and the required skills. ";
    }

    if (missing.length > 0) {
      text += joinWithAnd(missing) + (missing.length > 1 ? " were" : " was") +
        " not detected in the provided resume. ";
    } else if (state.jd.skills.length > 0) {
      text += "All required skills were detected. ";
    }

    if (candidate.experienceResult.score === null) {
      text += "No clear experience information was detected. ";
    }
    if (candidate.educationResult.score === null) {
      text += "No clear education information was detected. ";
    }

    return text.trim();
  }

  function joinWithAnd(list) {
    if (list.length === 1) return list[0];
    if (list.length === 2) return list[0] + " and " + list[1];
    return list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
  }

  /* -------------------------------------------------------------------
     6. RANKING
     ------------------------------------------------------------------- */

  function rankCandidates() {
    return [...state.candidates].sort((a, b) => b.overallScore - a.overallScore);
  }

  /* -------------------------------------------------------------------
     7. DOM ELEMENTS
     ------------------------------------------------------------------- */

  const el = {
    jdInput: document.getElementById("jdInput"),
    analyzeJdBtn: document.getElementById("analyzeJdBtn"),
    jdResults: document.getElementById("jdResults"),
    jdSkillTags: document.getElementById("jdSkillTags"),
    jdKeywordTags: document.getElementById("jdKeywordTags"),

    candidateName: document.getElementById("candidateName"),
    resumeInput: document.getElementById("resumeInput"),
    resumeFile: document.getElementById("resumeFile"),
    addResumeBtn: document.getElementById("addResumeBtn"),
    jdWarning: document.getElementById("jdWarning"),

    candidatesGrid: document.getElementById("candidatesGrid"),
    candidatesEmpty: document.getElementById("candidatesEmpty"),

    rankingBody: document.getElementById("rankingBody"),

    statTotal: document.getElementById("statTotal"),
    statAnalyzed: document.getElementById("statAnalyzed"),
    statAverage: document.getElementById("statAverage"),
    statTop: document.getElementById("statTop"),

    loadDemoBtn: document.getElementById("loadDemoBtn"),
    clearBtn: document.getElementById("clearBtn"),

    detailOverlay: document.getElementById("detailOverlay"),
    detailClose: document.getElementById("detailClose"),
    detailName: document.getElementById("detailName"),
    detailFilename: document.getElementById("detailFilename"),
    ringProgress: document.getElementById("ringProgress"),
    scoreRingValue: document.getElementById("scoreRingValue"),
    barSkill: document.getElementById("barSkill"),
    valSkill: document.getElementById("valSkill"),
    barKeyword: document.getElementById("barKeyword"),
    valKeyword: document.getElementById("valKeyword"),
    barExperience: document.getElementById("barExperience"),
    valExperience: document.getElementById("valExperience"),
    barEducation: document.getElementById("barEducation"),
    valEducation: document.getElementById("valEducation"),
    detailMatched: document.getElementById("detailMatched"),
    detailMissing: document.getElementById("detailMissing"),
    detailKeywords: document.getElementById("detailKeywords"),
    detailSummary: document.getElementById("detailSummary"),

    navToggle: document.getElementById("navToggle"),
    mobileNav: document.getElementById("mobileNav"),
    liveRegion: document.getElementById("liveRegion")
  };

  const RING_CIRCUMFERENCE = 2 * Math.PI * 60; // r=60

  /* -------------------------------------------------------------------
     8. RENDER FUNCTIONS
     ------------------------------------------------------------------- */

  function renderTag(text, container) {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = text;
    container.appendChild(span);
  }

  function renderJdResults() {
    el.jdSkillTags.innerHTML = "";
    el.jdKeywordTags.innerHTML = "";

    if (state.jd.skills.length === 0) {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = "No known skills detected — add explicit skill names";
      el.jdSkillTags.appendChild(span);
    } else {
      state.jd.skills.forEach((s) => renderTag(s, el.jdSkillTags));
    }

    // Show a manageable number of keywords (top 18) to avoid overwhelming the UI.
    state.jd.keywords.slice(0, 18).forEach((k) => renderTag(k, el.jdKeywordTags));

    el.jdResults.classList.remove("hidden");
  }

  function matchClass(score) {
    if (score >= 75) return "match-high";
    if (score >= 60) return "match-mid";
    return "match-low";
  }

  function renderCandidates() {
    el.candidatesGrid.innerHTML = "";

    if (state.candidates.length === 0) {
      el.candidatesEmpty.classList.remove("hidden");
    } else {
      el.candidatesEmpty.classList.add("hidden");
    }

    state.candidates.forEach((candidate) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "candidate-card";
      card.setAttribute("aria-haspopup", "dialog");
      card.addEventListener("click", () => openDetail(candidate));

      const top = document.createElement("div");
      top.className = "candidate-top";

      const nameWrap = document.createElement("div");
      const name = document.createElement("div");
      name.className = "candidate-name";
      name.textContent = candidate.name;
      const file = document.createElement("div");
      file.className = "candidate-file";
      file.textContent = candidate.fileLabel;
      nameWrap.appendChild(name);
      nameWrap.appendChild(file);

      const badge = document.createElement("span");
      badge.className = "match-badge " + matchClass(candidate.overallScore);
      badge.textContent = candidate.overallScore + "%";

      top.appendChild(nameWrap);
      top.appendChild(badge);

      const barTrack = document.createElement("div");
      barTrack.className = "progress-track candidate-bar";
      const barFill = document.createElement("div");
      barFill.className = "progress-fill";
      barFill.style.width = candidate.overallScore + "%";
      barTrack.appendChild(barFill);

      const meta = document.createElement("div");
      meta.className = "candidate-meta";
      const matchedCount = candidate.skillResult.matched.length;
      const totalSkills = state.jd.skills.length;
      meta.textContent = matchedCount + " / " + totalSkills + " required skills matched · " +
        candidate.recommendation.label;

      card.appendChild(top);
      card.appendChild(barTrack);
      card.appendChild(meta);

      el.candidatesGrid.appendChild(card);
    });
  }

  function renderRanking() {
    const ranked = rankCandidates();
    el.rankingBody.innerHTML = "";

    if (ranked.length === 0) {
      const tr = document.createElement("tr");
      tr.className = "empty-row";
      tr.innerHTML = "<td colspan=\"8\">No ranked candidates yet.</td>";
      el.rankingBody.appendChild(tr);
      return;
    }

    ranked.forEach((candidate, index) => {
      const tr = document.createElement("tr");
      tr.tabIndex = 0;
      tr.addEventListener("click", () => openDetail(candidate));
      tr.addEventListener("keypress", (e) => {
        if (e.key === "Enter") openDetail(candidate);
      });

      const missingText = candidate.skillResult.missing.length > 0
        ? candidate.skillResult.missing.join(", ")
        : "None";

      tr.innerHTML =
        "<td class=\"rank-cell\">#" + (index + 1) + "</td>" +
        "<td>" + escapeHtml(candidate.name) + "</td>" +
        "<td>" + candidate.overallScore + "%</td>" +
        "<td>" + scoreOrDash(candidate.skillResult.score) + "</td>" +
        "<td>" + scoreOrDash(candidate.keywordResult.score) + "</td>" +
        "<td>" + scoreOrDash(candidate.experienceResult.score) + "</td>" +
        "<td>" + escapeHtml(missingText) + "</td>" +
        "<td><span class=\"rec-pill " + candidate.recommendation.css + "\">" +
          candidate.recommendation.label + "</span></td>";

      el.rankingBody.appendChild(tr);
    });
  }

  function scoreOrDash(score) {
    return score === null || score === undefined ? "—" : score + "%";
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderStats() {
    const total = state.candidates.length;
    const analyzed = state.candidates.filter((c) => c.overallScore !== undefined).length;
    const avg = analyzed > 0
      ? Math.round(state.candidates.reduce((sum, c) => sum + c.overallScore, 0) / analyzed)
      : 0;
    const top = rankCandidates()[0];

    el.statTotal.textContent = total;
    el.statAnalyzed.textContent = analyzed;
    el.statAverage.textContent = avg + "%";
    el.statTop.textContent = top ? top.name : "—";
  }

  function renderAll() {
    renderCandidates();
    renderRanking();
    renderStats();
  }

  /* -------------------------------------------------------------------
     9. DETAIL PANEL
     ------------------------------------------------------------------- */

  let lastFocusedElement = null;

  function openDetail(candidate) {
    lastFocusedElement = document.activeElement;

    el.detailName.textContent = candidate.name;
    el.detailFilename.textContent = candidate.fileLabel;

    setRing(candidate.overallScore);
    el.scoreRingValue.textContent = candidate.overallScore + "%";

    setBar(el.barSkill, el.valSkill, candidate.skillResult.score);
    setBar(el.barKeyword, el.valKeyword, candidate.keywordResult.score);
    setBar(el.barExperience, el.valExperience, candidate.experienceResult.score);
    setBar(el.barEducation, el.valEducation, candidate.educationResult.score);

    fillList(el.detailMatched, candidate.skillResult.matched, "No matched skills detected.");
    fillList(el.detailMissing, candidate.skillResult.missing, "No missing skills — full match.");

    el.detailKeywords.innerHTML = "";
    const relevantKeywords = candidate.keywordResult.matched.slice(0, 20);
    if (relevantKeywords.length === 0) {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = "No overlapping keywords detected";
      el.detailKeywords.appendChild(span);
    } else {
      relevantKeywords.forEach((k) => renderTag(k, el.detailKeywords));
    }

    el.detailSummary.textContent = candidate.summary;

    el.detailOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    el.detailClose.focus();

    document.addEventListener("keydown", onDetailKeydown);
  }

  function setRing(score) {
    const offset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * score) / 100;
    el.ringProgress.style.strokeDasharray = String(RING_CIRCUMFERENCE);
    el.ringProgress.style.strokeDashoffset = String(offset);
  }

  function setBar(barEl, valEl, score) {
    if (score === null || score === undefined) {
      barEl.style.width = "0%";
      valEl.textContent = "N/A";
    } else {
      barEl.style.width = score + "%";
      valEl.textContent = score + "%";
    }
  }

  function fillList(listEl, items, emptyMessage) {
    listEl.innerHTML = "";
    if (!items || items.length === 0) {
      const li = document.createElement("li");
      li.className = "empty-note";
      li.textContent = emptyMessage;
      listEl.appendChild(li);
      return;
    }
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      listEl.appendChild(li);
    });
  }

  function closeDetail() {
    el.detailOverlay.classList.add("hidden");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onDetailKeydown);
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function onDetailKeydown(e) {
    if (e.key === "Escape") closeDetail();
  }

  /* -------------------------------------------------------------------
     10. CANDIDATE CREATION
     ------------------------------------------------------------------- */

  function addCandidateFromForm() {
    const rawText = el.resumeInput.value.trim();

    if (state.jd.skills.length === 0 && state.jd.keywords.length === 0) {
      el.jdWarning.classList.remove("hidden");
      announce("Please analyze a job description before adding resumes.");
      return;
    }
    el.jdWarning.classList.add("hidden");

    if (!rawText) {
      announce("Please paste resume text or upload a .txt file before adding.");
      return;
    }

    candidateCounter += 1;
    const name = el.candidateName.value.trim() || "Candidate " + candidateCounter;
    const fileLabel = el.resumeFile.files && el.resumeFile.files[0]
      ? el.resumeFile.files[0].name
      : "Pasted resume text";

    const candidate = {
      id: "c" + candidateCounter,
      name,
      fileLabel,
      rawText
    };

    analyzeResume(candidate);
    state.candidates.push(candidate);

    el.candidateName.value = "";
    el.resumeInput.value = "";
    el.resumeFile.value = "";

    renderAll();
    announce(name + " added and analyzed. Overall match " + candidate.overallScore + " percent.");
  }

  function handleResumeFile() {
    const file = el.resumeFile.files && el.resumeFile.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".txt")) {
      announce("Only .txt files are supported for local parsing. Please paste the resume text instead.");
      el.resumeFile.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      el.resumeInput.value = String(e.target.result || "");
      if (!el.candidateName.value.trim()) {
        el.candidateName.value = file.name.replace(/\.txt$/i, "");
      }
    };
    reader.readAsText(file);
  }

  /* -------------------------------------------------------------------
     11. DEMO DATA
     ------------------------------------------------------------------- */

  function loadDemoData() {
    const demoJd =
      "We are looking for a Software Engineer with experience in JavaScript, HTML, CSS, SQL and Git.\n" +
      "Required skills:\n" +
      "JavaScript\nHTML\nCSS\nSQL\nGit\nReact\nAWS\nProblem solving\nCommunication skills\n" +
      "3+ years of experience preferred. Bachelor's degree in Computer Science or related field required.";

    el.jdInput.value = demoJd;
    analyzeJobDescription(demoJd);
    renderJdResults();

    const demoResumes = [
      {
        name: "Arun Kumar",
        fileLabel: "arun_kumar_resume.txt",
        text:
          "Arun Kumar. Software Engineer with 4 years of experience building web applications " +
          "using JavaScript, React, HTML and CSS. Strong knowledge of SQL and Git for version control. " +
          "Deployed applications on AWS. Excellent communication skills and experience leading a small team. " +
          "Bachelor of Engineering in Computer Science, Anna University."
      },
      {
        name: "Priya Sharma",
        fileLabel: "priya_sharma_resume.txt",
        text:
          "Priya Sharma. Front-end developer with 2 years of experience in JavaScript, HTML, CSS and Git. " +
          "Worked on internal tools using SQL for reporting. Good problem solving and communication skills. " +
          "Bachelor's degree in Information Technology."
      },
      {
        name: "Rahul Krishnan",
        fileLabel: "rahul_krishnan_resume.txt",
        text:
          "Rahul Krishnan. Recent graduate with academic project experience in Python and basic HTML and CSS. " +
          "Familiar with Git for coursework submissions. Currently building problem solving skills through " +
          "online courses. Bachelor of Technology, Computer Science, 2024."
      }
    ];

    demoResumes.forEach((demo) => {
      candidateCounter += 1;
      const candidate = {
        id: "c" + candidateCounter,
        name: demo.name,
        fileLabel: demo.fileLabel,
        rawText: demo.text
      };
      analyzeResume(candidate);
      state.candidates.push(candidate);
    });

    renderAll();
    announce("Demo data loaded: one job description and three sample resumes.");
  }

  /* -------------------------------------------------------------------
     12. RESET
     ------------------------------------------------------------------- */

  function resetApplication() {
    state.jd = { raw: "", skills: [], keywords: [] };
    state.candidates = [];
    candidateCounter = 0;

    el.jdInput.value = "";
    el.jdResults.classList.add("hidden");
    el.jdSkillTags.innerHTML = "";
    el.jdKeywordTags.innerHTML = "";

    el.candidateName.value = "";
    el.resumeInput.value = "";
    el.resumeFile.value = "";
    el.jdWarning.classList.add("hidden");

    renderAll();
    announce("Analysis cleared. The application has been reset.");
  }

  /* -------------------------------------------------------------------
     13. MISC UI
     ------------------------------------------------------------------- */

  function announce(message) {
    el.liveRegion.textContent = message;
  }

  function toggleMobileNav() {
    const isOpen = el.mobileNav.classList.toggle("open");
    el.navToggle.setAttribute("aria-expanded", String(isOpen));
  }

  /* -------------------------------------------------------------------
     14. EVENT WIRING
     ------------------------------------------------------------------- */

  el.analyzeJdBtn.addEventListener("click", function () {
    const text = el.jdInput.value.trim();
    if (!text) {
      announce("Please paste a job description before analyzing.");
      return;
    }
    analyzeJobDescription(text);
    renderJdResults();
    // Re-score any existing candidates against the updated JD.
    state.candidates.forEach(analyzeResume);
    renderAll();
    announce("Job description analyzed. " + state.jd.skills.length + " required skills detected.");
  });

  el.addResumeBtn.addEventListener("click", addCandidateFromForm);
  el.resumeFile.addEventListener("change", handleResumeFile);

  el.loadDemoBtn.addEventListener("click", loadDemoData);
  el.clearBtn.addEventListener("click", resetApplication);

  el.detailClose.addEventListener("click", closeDetail);
  el.detailOverlay.addEventListener("click", function (e) {
    if (e.target === el.detailOverlay) closeDetail();
  });

  el.navToggle.addEventListener("click", toggleMobileNav);
  el.mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      el.mobileNav.classList.remove("open");
      el.navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* -------------------------------------------------------------------
     15. INITIAL RENDER
     ------------------------------------------------------------------- */
  renderAll();

})();
