# 🌅 SuPrabhaat (सुप्रभात)

> **Autonomous Daily WhatsApp & Facebook Morning Devotional Blessings Bot & Sacred Gallery**  
> *Crafted with devotion, resilience, and elegance.*

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Google GenAI](https://img.shields.io/badge/Google_GenAI-Gemini_3.8_Flash-orange.svg)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-blue.svg)](https://www.docker.com/)
[![Kubernetes Helm](https://img.shields.io/badge/Helm_Chart-v2-blueviolet.svg)](https://helm.sh/)
[![Author](https://img.shields.io/badge/Author-bowofarjun-red.svg)](https://github.com/bowofarjun)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Overview

**SuPrabhaat** (सुप्रभात) is an enterprise-grade autonomous devotional platform built on Node.js (ESM). It automatically generates high-resolution Hindu deity artwork and 2-line devotional morning blessings using Google Gemini Generative AI, scheduled daily at **07:00 AM IST** (customizable via cron).

In addition to autonomous daily scheduling, **SuPrabhaat features a devotional web portal** enabling users to:
1. **Browse sacred deity artwork** with interactive Day-of-the-Week filters (**Monday pre-selected by default**).
2. **Send blessings on-demand** to WhatsApp contacts and Facebook Pages with real-time AI blessing customization.
3. **Scan WhatsApp Web QR code** directly in the browser with persistent session storage across container/pod restarts.
4. **Trigger scheduled routines manually** with a single click or test without sending using the safe `--dry-run` mode.

---

## 🕉️ Traditional Day-to-Deity Mapping

Following ancient Vedic traditions, each day of the week is dedicated to a specific deity and accompanied by authentic Devanagari lettering and themes:

| Day | Deity | Traditional Greeting | Transliteration | Spiritual Focus | Default Artwork |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Monday** ⭐ *(Default)* | **Lord Shiva & Shiva Parivar** | **शुभ सोमवार** | *Shubh Somvaar* | Inner Peace, Meditation, Auspicious Starts | `monday_shiva_shubh_somvaar_2026-09-14_12-23-24_IST.png` |
| **Tuesday** | **Lord Hanuman** | **शुभ मंगलवार** | *Shubh Mangalvaar* | Devotion, Supreme Strength, Protection | `tuesday_hanuman_shubh_mangalvaar_2026-09-26_17-16-56_IST.jpg` |
| **Wednesday** | **Lord Ganesha** | **शुभ बुधवार** | *Shubh Budhvaar* | Intellect, Removal of Obstacles, Prosperity | `wednesday_ganesha_shubh_budhvaar_2026-09-26_17-17-22_IST.jpg` |
| **Thursday** | **Lord Vishnu / Shri Krishna** | **शुभ गुरुवार** | *Shubh Guruvaar* | Compassion, Dharma, Spiritual Guidance | `thursday_vishnu_shubh_guruvaar_2026-08-27_03-59-19_IST.png` |
| **Friday** | **Goddess Lakshmi** | **शुभ शुक्रवार** | *Shubh Shukravaar* | Radiance, Fortune, Inner & Outer Abundance | `friday_lakshmi_shubh_shukravaar_2026-09-26_17-17-52_IST.jpg` |
| **Saturday** | **Lord Shani Dev** | **शुभ शनिवार** | *Shubh Shanivaar* | Right Conduct, Patience, Divine Karma | `saturday_shani_shubh_shanivaar_2026-09-26_17-18-24_IST.jpg` |
| **Sunday** | **Lord Surya** | **शुभ रविवार** | *Shubh Ravivaar* | Life Force, Solar Vitality, New Dawn | `sunday_surya_shubh_ravivaar_2026-09-13_09-03-34_IST.png` |

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 SuPrabhaat Web Portal                       │
│    (Default: Monday Gallery • On-Demand Send • QR Link)     │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│    Express REST Endpoints    │ │  Daily Scheduler (node-cron)│
│  /api/images, /api/dispatch  │ │     07:00 AM IST Trigger    │
└──────────────┬───────────────┘ └─────────────┬───────────────┘
               │                               │
               └───────────────┬───────────────┘
                               │
                               ▼
               ┌───────────────────────────────┐
               │    GenAI Service (Gemini)     │
               │   2-Line Devotional Blessing  │
               └───────────────┬───────────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│   WhatsApp Web Dispatch     │   │     Facebook Page POST      │
│ (LocalAuth Persistent PVC)  │   │      (Meta Graph API)       │
└─────────────────────────────┘   └─────────────────────────────┘
```

---

## ✨ Key Features

- **Google Gemini Generative AI Integration**: Uses `@google/genai` (with `gemini-3.8-flash`) to generate uplifting 2-line devotional morning blessings with serene emojis tailored to the deity of the day.
- **Resilient Fallback Engine**: If internet access or AI API quota is unavailable, automatically serves curated high-definition artwork and authentic blessings without missing the morning delivery.
- **Interactive Web Dashboard**:
  - Filter pills for each day of the week with **Monday selected by default**.
  - Full-screen high-resolution image preview lightbox.
  - On-Demand Send modal with real-time Gemini AI blessing regeneration and editing.
  - Integrated WhatsApp QR code scanner widget with auto-refresh.
- **Safe Dry-Run Mode**: Test generation, AI prompts, image rendering, and mocked dispatch via `--dry-run` or the web UI checkbox without sending messages to contacts.
- **Production Containerization**: Multi-stage Linux Dockerfile packaging headless Chromium, Noto Emoji fonts, and non-root security privileges (`UID 10001`).
- **Kubernetes Helm Chart**: Packaged under `deploy/charts/morning-bot/` featuring `PersistentVolumeClaim` (PVC) session persistence mounted to `/app/.wwebjs_auth`.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- Google Gemini API Key ([Get one free at Google AI Studio](https://aistudio.google.com/))

### 2. Installation
```bash
git clone https://github.com/bowofarjun/suprabhaat.git
cd suprabhaat
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and set your credentials:
```ini
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
RECIPIENT_NUMBERS=919876543210,919123456789
FB_PAGE_ID=your_facebook_page_id
FB_PAGE_ACCESS_TOKEN=your_meta_page_token
CRON_SCHEDULE="0 7 * * *"
CRON_TIMEZONE="Asia/Kolkata"
DRY_RUN=false
```

### 4. Running the Platform
```bash
# Start server with web portal & scheduler
npm start

# Run in Development mode with auto-reload
npm run dev

# Run in safe Dry-Run mode
npm run dry-run

# Run full automated test suite
npm test
```

Open your browser at **`http://localhost:3000`** to view the sacred gallery and on-demand control dashboard!

---

## 🌐 Web Portal Usage

1. **Sacred Gallery**:
   - The gallery opens with **Monday (Lord Shiva / Somvaar) selected by default**.
   - Click on any day tab (**Tuesday** through **Sunday**, or **All Days**) to filter the sacred artwork.
   - Click any artwork to open the high-resolution lightbox.
2. **Send On-Demand**:
   - Click **"Send On Demand"** in the top navigation or **"⚡ Send This Blessing"** on any card.
   - Select the target day and deity.
   - Click **"✨ Regenerate with AI"** to craft a fresh devotional 2-line blessing using Gemini.
   - Select dispatch channels (**WhatsApp Web** and/or **Facebook Page**).
   - Check **"Simulate with Dry-Run Mode"** if you want to test without messaging real recipients.
   - Click **"🌸 Send Blessings Now"**.
3. **WhatsApp Authentication**:
   - Click the WhatsApp status badge in the header.
   - Scan the QR code with WhatsApp on your mobile phone (**Settings > Linked Devices > Link a Device**).
   - The session will be stored permanently in `./.wwebjs_auth`.

---

## 📡 REST API Reference

### Health Probes
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health/liveness` | `GET` | Kubernetes liveness probe (200 OK) |
| `/health/readiness` | `GET` | Kubernetes readiness probe (checks WhatsApp & Scheduler) |

### Application Endpoints
| Endpoint | Method | Parameters / Body | Description |
| :--- | :--- | :--- | :--- |
| `/api/days` | `GET` | None | Returns all 7 days with deities and greetings |
| `/api/images` | `GET` | `?day=monday` (default) or `all` | Returns artwork collection filtered by day |
| `/api/status` | `GET` | None | Returns live status of WhatsApp, QR, Facebook, Cron |
| `/api/blessing/preview` | `POST` | `{"day": "monday"}` | Generates a fresh AI blessing preview without sending |
| `/api/dispatch/on-demand` | `POST` | `{"day": "monday", "channels": ["whatsapp"], "dryRun": true}` | Dispatches devotional blessing immediately |
| `/api/scheduler/trigger` | `POST` | None | Manually triggers today's morning routine |
| `/api/history` | `GET` | None | Returns history of recent dispatches |

#### Example: Trigger On-Demand Dry-Run via cURL
```bash
curl -X POST http://localhost:3000/api/dispatch/on-demand \
  -H "Content-Type: application/json" \
  -d '{
    "day": "monday",
    "channels": ["whatsapp", "facebook"],
    "dryRun": true
  }'
```

---

## 🐳 Docker Deployment

### Run with Docker Compose
```bash
docker compose up -d --build
```

### Build and Run Standalone Container
```bash
docker build -t bowofarjun/suprabhaat:latest .
docker run -d \
  -p 3000:3000 \
  --name suprabhaat \
  -v suprabhaat_auth:/app/.wwebjs_auth \
  -e GEMINI_API_KEY="your_api_key" \
  -e RECIPIENT_NUMBERS="919876543210" \
  bowofarjun/suprabhaat:latest
```

---

## ☸️ Kubernetes Deployment (Helm Chart)

The production Helm chart is packaged at `deploy/charts/morning-bot/` with `PersistentVolumeClaim` (PVC) session storage:

```bash
# 1. Inspect and lint the Helm chart
helm lint deploy/charts/morning-bot

# 2. Deploy to Kubernetes cluster
helm install suprabhaat deploy/charts/morning-bot \
  --set secrets.geminiApiKey="your_gemini_key" \
  --set env.recipientNumbers="919876543210" \
  --set persistence.size="2Gi"
```

---

## 🧪 Testing & Validation

SuPrabhaat includes a test suite covering the Day-to-Deity mapping, Gallery filtering, GenAI fallback resilience, and Helm chart specifications:

```bash
npm test
```

Output:
```text
# tests 19
# pass 19
# fail 0
```

---

## 📄 License & Standards

- **Repository**: [github.com/bowofarjun/suprabhaat](https://github.com/bowofarjun)
- **Author**: Arjun Mishra ([bowofarjun](https://github.com/bowofarjun))
- **License**: MIT
