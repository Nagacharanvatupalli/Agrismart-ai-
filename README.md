# 🌾 AgriSmart AI — Smart Agritech & AI Farming Assistant

**AgriSmart AI** is an AI-powered agricultural intelligence platform designed for farmers, agronomists, and agricultural researchers. It combines Google Gemini Multimodal Vision AI, hyper-local Open-Meteo weather intelligence, dynamic soil analytics, precision irrigation management, and regional multilingual speech (Telugu, Hindi, Tamil, Kannada, Marathi, English) into an intuitive, high-performance web experience.

---

## 🚀 Key Features

- 📸 **Live Camera & Crop Disease Scanner**: Snap or upload photos of leaves and stems to diagnose plant diseases, fungal attacks, and pests with instant chemical and biological prescriptions.
- 🗣️ **Multilingual Voice Assistant & TTS**: Real-time voice recognition and Text-to-Speech playback across 6 Indian regional languages (Telugu, Hindi, Tamil, Kannada, Marathi, English).
- 🌦️ **Hyper-Local Climate Risk & Weather**: 7-day agricultural forecasts, spraying windows, heavy rainfall warnings, heatwave alerts, and 30-day extended outlooks.
- 💧 **Smart Irrigation Planner**: Daily crop water requirement calculator based on Penman-Monteith evapotranspiration (ET₀) and crop coefficients (Kc).
- 🧪 **Dynamic Soil Intelligence & pH Interpreter**: Real-time soil nutrient availability analysis (N-P-K), micronutrient lockup diagnostics, and organic amendment suggestions.
- 🌾 **Smart Crop Recommendation Engine**: High-yield crop matching based on season (Kharif/Rabi/Zaid), soil pH, water availability, and economic returns.
- 📱 **Responsive & Glassmorphic UI**: High-end mobile-first UI with dark/light emerald accents, glassmorphic dropdowns, and animated badges.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **Internationalization (i18n)**: `i18next` + `react-i18next` (Supports English, తెలుగు, हिन्दी, தமிழ், ಕನ್ನಡ, मराठी)
- **Voice & Media**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) + `navigator.mediaDevices.getUserMedia`

### **Backend**
- **Framework**: FastAPI (Python 3.10+) + Uvicorn
- **AI Engines**: Google Gemini 2.5 Multimodal Vision AI + Dynamic Fallback Diagnostic Engine
- **Database**: SQLite (local) / PostgreSQL (Supabase) + SQLAlchemy ORM
- **Weather API**: Open-Meteo Hyper-Local Forecasting

---

## 📦 Project Structure

```
agritech/
├── backend/
│   ├── app/
│   │   ├── routers/       # API endpoints (AI, Weather, Crops, Soil, Irrigation, Alerts)
│   │   ├── services/      # Gemini Vision, Weather, Soil, Crop Recommendation, Localization
│   │   ├── models.py      # SQLAlchemy DB models
│   │   ├── schemas.py     # Pydantic validation schemas
│   │   ├── config.py      # Configuration & environment settings
│   │   └── main.py        # FastAPI application entry point
│   ├── seed.py            # Database seeding script
│   └── supabase_schema.sql # PostgreSQL schema definitions
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI (Header, LanguageDropdown, BottomNav)
│   │   ├── views/         # Application screens (Home, AskAgri, Weather, Soil, Crops, Alerts)
│   │   ├── services/      # API client, Open-Meteo, Voice TTS/STT
│   │   └── i18n/          # Multilingual localization dictionaries
│   └── package.json
├── requirements.txt       # Python backend dependencies
└── README.md
```

---

## ⚡ Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r ../requirements.txt
python seed.py
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The application will be running at `http://localhost:5173` with backend API at `http://127.0.0.1:8000`.

---

## 📄 License
This project is licensed under the MIT License.
