# ⚡ SportSentry AI

> **AI-powered sports content piracy detection and automated DMCA takedown platform.**  
> Built for hackathon — Phase 1 MVP using Google Gemini + NVIDIA LLaMA AI APIs.

![Tech Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)
![Tech Stack](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square&logo=react)
![Tech Stack](https://img.shields.io/badge/AI-Gemini_1.5_Flash-4285F4?style=flat-square&logo=google)
![Tech Stack](https://img.shields.io/badge/DB-SQLite-003B57?style=flat-square&logo=sqlite)

---

## 🎯 What It Does

Sports organizations lose **billions annually** to unauthorized redistribution of match clips and highlights. SportSentry AI solves this with a 3-step automated pipeline:

```
1. Register Official Clip  →  2. AI Compares Against Suspects  →  3. Auto-Generate DMCA Takedown
```

### Core Features (MVP Phase 1)

| Feature | Description |
|---|---|
| 🎬 **Asset Registration** | Upload official sports clips/images with rights metadata |
| 🌐 **Live YouTube Search** | Automatically search YouTube via API to find suspect clips matching your asset |
| 👁️ **True Multimodal AI** | Gemini 2.0 Flash analyzes actual video frames (thumbnails) alongside metadata |
| 🤖 **AI Detection** | NVIDIA LLaMA / Gemini fallback — returns similarity score, classification, risk level |
| ⚖️ **Automated Enforcement** | One-click DMCA takedown email generation and "Send to Legal" integration |
| 📊 **Dashboard** | Real-time overview of all detections and case statuses |

---

## 🏗️ Tech Stack

### Backend
- **FastAPI** (Python) — REST API
- **SQLite** — Local database (via SQLAlchemy ORM)
- **Google Gemini 1.5 Flash** — Multimodal AI analysis (primary fallback)
- **NVIDIA LLaMA 3.1 405B** — Primary AI model via NVIDIA NIM API
- **python-dotenv** — Environment config

### Frontend
- **React 18** — UI framework
- **React Router v6** — Client-side routing
- **Vanilla CSS** — Custom dark theme design system (no Tailwind dependency)

---

## 📁 Project Structure

```
hackthron project AI-agent/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, static files
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models.py            # DB models (OfficialAsset, SuspectAsset, Detection, Case)
│   │   ├── routers/
│   │   │   ├── assets.py        # POST/GET official assets + suspects
│   │   │   ├── detections.py    # AI analysis endpoint
│   │   │   └── cases.py         # Case creation + DMCA drafts
│   │   └── services/
│   │       └── gemini_service.py  # AI comparison + takedown generation
│   ├── seed_db.py               # Populate suspect assets for demo
│   ├── requirements.txt
│   └── .env                     # API keys (not committed to git)
└── frontend/
    └── src/
        ├── api/client.js        # All API calls to backend
        ├── components/
        │   ├── Badge.js         # Risk/Classification/Status badges
        │   └── SimilarityBar.js # Animated similarity % bar
        └── pages/
            ├── Dashboard.js     # KPI cards + detections table
            ├── Analyze.js       # Run AI comparisons
            ├── NewAsset.js      # Upload official clip
            ├── Cases.js         # All cases with filters
            └── CaseDetail.js    # Full case + DMCA draft
```

---

## 🚀 Local Setup & Run

### Prerequisites
- Python 3.10–3.13 *(avoid 3.14 — some packages are not yet 3.14-compatible)*
- Node.js 18+
- A virtual environment (`.venv`) in the project root

### Step 1 — Clone & Set Up Virtual Environment

```powershell
cd "d:\hackthron project AI-agent"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Step 2 — Install Backend Dependencies

```powershell
cd backend
pip install -r requirements.txt
```

### Step 3 — Configure API Keys

Edit `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
NVIDIA_API_KEY=nvapi-your_nvidia_key_here
```

> **Get Gemini key free:** https://aistudio.google.com  
> The NVIDIA key is optional — Gemini is the fallback.

### Step 4 — Seed the Database

```powershell
# Must be inside backend/ with venv active
cd "d:\hackthron project AI-agent"
.\.venv\Scripts\Activate.ps1
cd backend
python seed_db.py
```

Expected output: `Seeded 5 suspect assets.`

### Step 5 — Start the Backend

```powershell
# In backend/ with venv active
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend running at: **http://localhost:8000**  
📖 Interactive API docs: **http://localhost:8000/docs**

### Step 6 — Start the Frontend

```powershell
# In a NEW terminal window
cd "d:\hackthron project AI-agent\frontend"
npm install    # first time only
npm start
```

✅ Frontend running at: **http://localhost:3000**

---

## 🧪 How to Test — Step by Step

### Test 1: Dashboard Loads ✅
1. Open **http://localhost:3000**
2. You should see the SportSentry AI dashboard with 4 KPI cards
3. The table shows "No detections yet" — this is correct before running analysis

---

### Test 2: Register an Official Asset ✅
1. Click **"+ Register Asset"** in the navbar
2. Fill in the form:
   - **File:** Upload any `.mp4` or `.jpg` file (even a small test video)
   - **Title:** `FIFA World Cup 2024 — Official Highlights`
   - **Owner:** `FIFA`
   - **Event Name:** `World Cup 2024`
3. Click **"⬆ Register Asset"**
4. You'll be redirected back to the Dashboard

---

### Test 3: Run AI Analysis ✅
1. Click **"Analyze"** in the navbar
2. Select your registered official asset from the dropdown
3. You'll see 5 pre-seeded suspect clips listed (YouTube, TikTok, Twitter, etc.)
4. Click **"🔍 Analyze"** on any suspect row
5. Wait 10–30 seconds for AI response
6. You'll see:
   - Similarity score bar (e.g. 78%)
   - Classification badge (e.g. `⚠ PIRACY_LIKELY`)
   - Risk badge (e.g. HIGH)
   - AI reason text below

---

### Test 4: Create a Case & DMCA Draft ✅
1. After analysis completes, click **"📋 Open Case"**
2. Wait ~10 seconds while Gemini drafts the takedown email
3. You'll land on the Case Detail page showing:
   - Official vs Suspect asset info
   - AI evidence points
   - Full DMCA email draft (ready to copy)
4. Click **"⎘ Copy"** to copy the email to clipboard
5. Change status from `OPEN` → `ACTIONED` and click **Update**

---

### Test 5: Cases List ✅
1. Click **"Cases"** in the navbar
2. See all cases with filter buttons: `ALL | OPEN | ACTIONED | IGNORED`
3. Click **"View →"** to go back to any case

---

### Test 6: API Directly ✅
Visit these URLs to verify backend data:  
- http://localhost:8000/api/official-assets/
- http://localhost:8000/api/suspects/
- http://localhost:8000/api/detections/
- http://localhost:8000/api/cases/
- http://localhost:8000/docs (Swagger UI — interactive)

---

## 🎤 How to Present (Hackathon Pitch)

### Hook (30 seconds)
> *"Every weekend, billions of dollars worth of sports content gets stolen and reposted within minutes. Rights holders have no way to track it. SportSentry AI uses Gemini to automatically detect pirated sports clips and generate DMCA takedowns in seconds — not days."*

### Live Demo Flow (3 minutes)

| Step | Action | What to Show |
|---|---|---|
| 1 | Open Dashboard | KPI cards — "This is mission control" |
| 2 | Open Analyze page | "Here are 5 suspect clips our system found" |
| 3 | Select official asset + click Analyze | Live AI call — show the loading spinner |
| 4 | Result appears | Point out similarity %, classification, risk level |
| 5 | Click Open Case | AI drafts DMCA email — click Copy |
| 6 | Show Case Status | Update to ACTIONED — "rights holder has acted" |
| 7 | Show `/docs` | "This is a real production API — judges can test it" |

### Key Talking Points
- 🤖 **Dual AI** — NVIDIA LLaMA for speed, Gemini as fallback
- ⚡ **End-to-end pipeline** — detect → classify → takedown in one click
- 📊 **Evidence-backed** — detailed AI reasoning, not just a score
- 🏗️ **Real architecture** — FastAPI + SQLite, extendable to PostgreSQL + auth

### Likely Judge Questions

| Question | Answer |
|---|---|
| "Where do suspect clips come from?" | "We use the live YouTube Data API to search for unauthorized clips based on the official asset's title and event name." |
| "Is the AI actually analyzing video?" | "Yes! We use Gemini 2.0 Flash's true multimodal capabilities to visually analyze the pirated video thumbnail frames alongside metadata." |
| "Can it scale?" | "SQLite → PostgreSQL is a config change. FastAPI handles async at scale. Storage moves to S3" |
| "What about false positives?" | "Human review step built in — every detection creates a case that a human approves before hitting 'Send to Legal'." |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NVIDIA_API_KEY` | Optional | NVIDIA NIM API key (primary AI) |
| `GEMINI_API_KEY` | Optional | Google Gemini API key (fallback AI) |

> At least one key must be set for AI analysis to work.

---

## ⚠️ Known MVP Limitations

- No authentication (by design for MVP — add JWT later)
- File storage is local `uploads/` directory (use S3 in production)
- SQLite database (use PostgreSQL in production)

---

## 📡 API Reference

### Official Assets
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/official-assets/` | Upload clip + metadata (multipart) |
| `GET` | `/api/official-assets/` | List all official assets |
| `GET` | `/api/official-assets/{id}` | Get single asset |

### Suspects
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/suspects/` | List all pre-seeded suspect clips |

### Detections
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/detections/analyze` | Run AI comparison `{ official_asset_id, suspect_asset_id }` |
| `GET` | `/api/detections/` | All detections with asset metadata |
| `GET` | `/api/detections/{id}` | Single detection with full AI output |

### Cases
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/cases/{detection_id}/create` | Create case + generate DMCA draft |
| `GET` | `/api/cases/` | All cases |
| `GET` | `/api/cases/{id}` | Full case with detection + assets |
| `PATCH` | `/api/cases/{id}` | Update status `{ status: "OPEN"\|"ACTIONED"\|"IGNORED" }` |

---

## 📄 License

MIT — Built for hackathon purposes.
