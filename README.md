# 🫀 Pulse — AI Health Intelligence Platform

**Pulse** is a modern, AI-powered health consultation platform that provides real-time symptom analysis, medical diagnostics, and specialist recommendations.

Built with a premium Apple-inspired MedTech design featuring glassmorphism, refined animations, and a clinical dark theme.

---

## ✨ Features

- 🩺 **AI Consultation** — Conversational symptom analysis with follow-up questions
- 📊 **Diagnostic Reports** — Top 3 condition predictions with confidence scores
- ⚠️ **Precautions** — Auto-generated safety precautions per diagnosis
- 🏥 **Nearby Hospitals Map** — Geolocation-powered hospital finder
- 📍 **GPS-Tagged Reports** — Each consultation records location for traceability
- 🔎 **Specialist Locator** — Find the right doctor near you via Google Maps
- 📋 **Past Reports** — Expandable consultation history with full details
- 🔒 **User Authentication** — Secure signup/login with role-based access

## 🛠️ Tech Stack

| Component     | Technology               |
|---------------|--------------------------|
| **Frontend**  | HTML, CSS (custom), JS   |
| **Backend**   | Python, Flask            |
| **AI Engine** | Groq API (Llama 3)       |
| **Database**  | MongoDB                  |
| **Design**    | Glassmorphism, Inter UI  |

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- MongoDB (local or Atlas)
- Groq API Key ([get one free](https://console.groq.com))

### Installation

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/PulseAI.git
cd PulseAI

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and Groq API key

# Run
python app.py
```

Visit `http://localhost:5001` in your browser.

### Environment Variables

Create a `.env` file with:

```env
MONGO_URI=mongodb+srv://your_connection_string
GROQ_API_KEY=your_groq_api_key
```

## 📁 Project Structure

```
Pulse/
├── app.py              # Flask backend (routes, AI, auth)
├── requirements.txt    # Python dependencies
├── .env                # Environment secrets (not tracked)
├── .gitignore          # Git exclusions
├── models/             # ML model & symptom data
│   ├── disease_symptoms.json
│   ├── diseases_list.json
│   └── symptoms_list.json
└── public/             # Frontend
    ├── index.html      # Main dashboard
    ├── login.html      # Auth page
    ├── css/premium.css # Design system
    ├── js/app.js       # Dashboard logic
    ├── js/auth.js      # Auth logic
    └── img/            # Graphics
```

## 📄 License

This project is for educational purposes.

---

<p align="center">
  Built with ❤️ by <strong>Soumyadeep Bose</strong>
</p>
