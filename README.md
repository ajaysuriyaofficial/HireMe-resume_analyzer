# HIREme — Intelligent Resume Analyzer

**Rule-Based Resume Analysis and Requirement Matching**

## Problem Statement

Organizations often receive a large number of resumes for a single job opening. Manually comparing each resume with the corresponding Job Description (JD) is time-consuming, labor-intensive, and prone to human error. As the number of applications increases, recruiters may overlook qualified candidates or spend excessive time reviewing resumes that do not meet the required qualifications.

Many existing resume screening tools are costly, require internet connectivity, or depend on complex software frameworks, making them less accessible for small organizations and educational purposes. HIREme addresses this with a simple, efficient, and fully local method to evaluate resumes against job requirements.

## Objectives

- Extract required skills and keywords from a pasted Job Description.
- Extract skills and keywords from candidate resumes (pasted text or `.txt` upload).
- Score each candidate against the JD using a transparent, weighted formula.
- Rank candidates automatically and highlight skill gaps.
- Run entirely offline, in the browser, with no installation.

## Features

- Job description skill and keyword extraction
- Resume-to-JD matching with transparent scoring
- Automatic candidate ranking with recommendation labels
- Candidate detail view with score breakdown, strengths, and gaps
- Circular and bar score visualizations (pure SVG/CSS)
- Built-in demo data for quick presentation
- One-click reset
- Fully responsive, accessible interface

## Technology Used

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)

No frameworks, no build tools, no external libraries, no third-party or AI APIs.

## System Requirements

Any modern desktop or mobile web browser (Chrome, Edge, Firefox, Safari). No internet connection is required after the files are downloaded.

## How to Run

1. Download or clone the project folder.
2. Open `index.html` directly in a web browser (double-click the file, or right-click → Open With → your browser).
3. No installation, server, or build step is required.

## How the Analysis Works

1. **Normalize text** — lowercase the input, strip stray punctuation, and collapse whitespace, while preserving characters used in real skill names (e.g. `c++`, `node.js`).
2. **Tokenize & remove stop words** — split into words and discard common filler words (the, a, and, or, etc.) and very short tokens.
3. **Extract keywords** — the de-duplicated, meaningful words remaining after stop-word removal.
4. **Extract skills** — match the normalized text against a built-in skill dictionary (JavaScript, Python, SQL, Git, Communication, etc.) stored directly in `script.js`.
5. **Detect experience & education signals** — look for year mentions (e.g. "4 years") and phrases like "developed", "led", "bachelor", "b.tech" to estimate experience and education presence.
6. **Score each category**:
   - Skill Match = matched required skills ÷ total required skills
   - Keyword Match = overlapping keywords ÷ total JD keywords
   - Experience Match = rule-based estimate from detected experience language
   - Education Match = rule-based estimate from detected education language
7. **Combine into an Overall Score** using weights Skill 60%, Keyword 20%, Experience 10%, Education 10%. If a category cannot be detected for a given resume, its weight is redistributed proportionally across the remaining detected categories, so an undetected category never silently drags the score down or up.
8. **Rank & recommend** — candidates are sorted by Overall Score and labeled:
   - 90–100: Highly Recommended
   - 75–89: Recommended
   - 60–74: Consider
   - Below 60: Low Match

All scores are analytical assistance only and are explicitly labeled as such in the interface — they are not a substitute for human evaluation.

## Scoring Methodology (Reference)

```
Overall Score = (Skill Match × 0.60) + (Keyword Match × 0.20)
              + (Experience Match × 0.10) + (Education Match × 0.10)
```

Weights are automatically redistributed among the categories that were actually detected for a given resume.

## Project Architecture

```
index.html   Structure: navigation, hero, JD input, resume input,
             candidate cards, ranking table, detail dialog,
             how-it-works, features, privacy sections.
style.css    Ocean Blue & Golden design system: color tokens,
             glassmorphism cards, responsive layout, accessible
             focus states.
script.js    All logic: text normalization, tokenization, stop-word
             removal, skill dictionary matching, experience/education
             detection, weighted scoring, ranking, rendering, demo
             data, and reset — organized into named functions:
             normalizeText(), tokenizeText(), removeStopWords(),
             extractKeywords(), extractSkills(), calculateSkillMatch(),
             calculateKeywordMatch(), calculateExperienceMatch(),
             calculateEducationMatch(), calculateOverallScore(),
             generateRecommendation(), analyzeResume(),
             rankCandidates(), renderAll() / renderRanking() /
             renderCandidates() (display layer), resetApplication(),
             loadDemoData().
README.md    This file.
```

## Limitations

- Only `.txt` resume uploads are supported; PDF/DOCX parsing is intentionally not implemented to keep the project fully vanilla and offline.
- Skill detection is dictionary-based (keyword/phrase matching), not semantic understanding — synonyms outside the dictionary or unconventional phrasing may be missed.
- Experience and education detection rely on common phrase patterns and explicit year mentions; unusual resume formats may reduce detection accuracy.
- This is a decision-support tool, not an automated hiring system.

## Future Enhancements

- Expandable, user-editable skill dictionary via the UI.
- Support for `.docx`/`.pdf` parsing using purely client-side, dependency-free parsers.
- Export ranking results to CSV.
- Configurable scoring weights per role.
- Multi-language stop-word and skill support.

## Demo Instructions

1. Open `index.html`.
2. Click **Load Demo Data** in the Resume Analyzer section.
3. This populates one sample Job Description and three sample candidates (Arun Kumar, Priya Sharma, Rahul Krishnan) with different skill combinations, producing visibly different rankings.
4. Scroll to **Candidate Ranking** to see the sorted table, or click any candidate card / table row to open the detailed score breakdown.
5. Click **Clear Analysis** to reset the application to its initial state.

## Constraints Compliance

This project uses only HTML, CSS and vanilla JavaScript. No external packages, libraries or third-party APIs are used for resume analysis. All resume analysis and comparison logic (text normalization, keyword extraction, skill matching, weighted scoring, and ranking) is implemented manually in native JavaScript inside `script.js`. The application works fully offline by opening `index.html` directly in a browser.
