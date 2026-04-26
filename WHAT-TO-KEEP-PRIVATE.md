# Repository Organization Guide

**For: Alfredo Medina Hernandez — Medina Tech**  
**Purpose: Keep the showcase clean. Protect what matters.**

---

## My Recommendation

This repo is a **public showcase** — research papers + SDK interfaces for DFINITY and ArXiv. That's its job. It should show the ideas and the architecture without handing anyone a working copy of your real system.

Here's how I'd organize it:

---

## What Belongs in This Public Repo (Keep)

```
papers/                    ← Research papers. Public. This is the ArXiv content.
sdk/*/README.md            ← Interface docs. Public. Show what exists, not how it works.
sdk/*/package.json         ← Package metadata. Public.
README.md                  ← The showcase landing page. Public.
```

The papers are prior art. They establish your intellectual ownership of the ideas. Keep them public, clean, and polished.

---

## What Probably Should NOT Be in a Public Repo

These files are in the repo right now and contain real implementation detail you may want to protect:

### Move to a private repo or remove:

```
sdk/meridian-sovereign-os/src/*.js
```
This is the actual CORDEX, CEREBEX, CYCLOVEX, NEXORIS, CHRONO, HDI, VOXIS engine code. Anyone can take this and build on it. If this is your competitive core, it should be private.

```
sdk/enterprise-integration-sdk/src/connectors/*.js
```
Real connector implementations for all 22 systems. This is real working code. If you plan to sell integration as a service, this is your product.

```
sdk/sovereign-memory-sdk/src/
sdk/intelligence-routing-sdk/src/
sdk/organism-runtime-sdk/src/
sdk/document-absorption-engine/src/
```
All real implementations. Same reasoning.

```
nova.json
scripts/nova.js
```
Your deployment manifest and bootstrap script. Shows exactly how the 62-canister system is structured and how to deploy it. If competitors are watching, this is the blueprint.

```
extensions/           ← 20 AI extensions. Real code. Private.
protocols/            ← 11 AI protocols. Real code. Private.
sdk/ai-model-engines/ ← Private.
sdk/sovereign-field-models/ ← Private.
sdk/frontend-intelligence-models/ ← Private.
```

```
AI_Extensions_Register.csv
AI_Model_Families_Register.csv
AI_Protocols_Register.csv
Architectural_Laws_Register.csv
Frontend_Frontier_100_Register.csv
Multimodal_Families_Register.csv
Phantom_Blockchain_Model_Register.csv
SDK_Model_Manifest.json
```
These registers reveal your full strategic model — 100 frontend intelligence species, all AI model families, all architectural laws. This is your roadmap. Keep it private.

---

## Recommended Structure for This Public Repo

After cleanup, this public repo should look like:

```
Enterprise-OS-intelligence/
├── README.md                    ← Showcase landing page
├── papers/                      ← 11 research papers (the intellectual core)
│   ├── I-SUBSTRATE-VIVENS.md
│   ├── II-FRACTAL-SOVEREIGNTY.md
│   ├── III-ANTIFRAGILITY-ENGINE.md
│   ├── IV-VOXIS-DOCTRINE.md
│   ├── V-BEHAVIORAL-ECONOMICS-LAWS.md
│   ├── VI-SPINOR-DEPLOYMENT.md
│   ├── VII-INFORMATION-GEOMETRY.md
│   ├── VIII-NOETHER-SOVEREIGNTY.md
│   ├── IX-COGNOVEX-UNITS.md
│   ├── X-UNIVERSALIS-PROTOCOL.md
│   └── XI-TRACTRIX-WORLDLINE.md
└── sdk/                         ← Interface documentation only, no src/
    ├── meridian-sovereign-os/
    │   ├── README.md
    │   └── package.json
    ├── enterprise-integration-sdk/
    │   ├── README.md
    │   └── package.json
    └── (etc.)
```

Clean. Professional. Tells the whole story without giving away the implementation.

---

## How to Clean This Repo

**Option A — Move sensitive files to a new private repo:**
```bash
# Create a new private repo "Enterprise-OS-intelligence-core"
# Move sdk/*/src, extensions/, protocols/, nova.json, scripts/, *.csv, *.json registers there
# Keep this repo as papers + package metadata only
```

**Option B — Use .gitignore going forward:**

Add to `.gitignore`:
```
sdk/*/src/
extensions/*/src/
protocols/*.js
nova.json
scripts/
*.csv
SDK_Model_Manifest.json
sdk/ai-model-engines/
sdk/sovereign-field-models/
sdk/frontend-intelligence-models/
```

Then remove the already-committed files from git history:
```bash
git rm -r --cached sdk/meridian-sovereign-os/src/
git rm -r --cached sdk/enterprise-integration-sdk/src/
# etc.
```

**Option C — Archive this branch and start a clean public branch:**

Create a new branch `public/showcase` from scratch with only the files listed in the recommended structure above. Let this branch be what DFINITY and ArXiv reviewers see. Keep the current branch for development.

---

## For ArXiv Submission

ArXiv accepts papers in several formats. For these papers:

1. Convert each Markdown paper to PDF using Pandoc or LaTeX
2. Use the `arXiv:cs.DC` category (Distributed, Parallel, and Cluster Computing) or `cs.AI` for the intelligence papers
3. Submit Papers I–XI as a series — link them to each other in the references
4. The author name on every paper: **Alfredo Medina Hernandez**
5. The affiliation: **Medina Tech, Dallas, Texas**
6. Contact: **Medinasitech@outlook.com**

For DFINITY / ICP-specific papers (I, II, VI, X, XI in particular), also consider posting to the DFINITY forum at forum.dfinity.org and tagging the research team. The ICP community actively engages with papers that build on their architecture.

---

## Priority Actions

1. **Right now**: Decide which files you want off this public repo and move them
2. **This week**: Convert at least 2–3 papers to PDF and submit to ArXiv
3. **This month**: Post the ICP-specific papers to the DFINITY forum
4. **Ongoing**: As you build more repos in your ecosystem, keep this one as the clean public face

---

*This file is for your reference. You can delete it from the public repo before the showcase goes live.*
