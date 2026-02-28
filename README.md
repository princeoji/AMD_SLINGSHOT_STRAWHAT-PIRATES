# 🔥 HeatShield AI — Heatwave Risk Intelligence Platform

> **AI-powered heatwave prediction and visualization to protect lives across India**

HeatShield AI transforms raw weather data into actionable heat risk intelligence using Machine Learning, real-time analytics, and interactive visualizations. Built for government bodies, disaster management authorities, smart cities, schools, and outdoor worker safety.

---

## 🧠 Problem Statement

India faces increasing heatwaves due to climate change, yet:
- Only raw temperature data is available — no AI-based risk scores
- No predictive alerts exist for future heatwave risk
- No action-oriented advisories are provided to the public

**HeatShield AI solves this** by converting raw weather data → AI-predicted risk scores → visual alerts → actionable safety recommendations.

---

## 🏗 System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   React + TW    │────▶│  Node.js + Express│────▶│  Python + Scikit-learn │
│   Dashboard     │◀────│  Backend API     │◀────│  ML Microservice      │
└─────────────────┘     └───────┬──────────┘     └─────────────────────┘
                                │
                        ┌───────┴──────────┐
                        │    MongoDB       │
                        │  (Historical)    │
                        └──────────────────┘
                                │
                        ┌───────┴──────────┐
                        │  OpenWeatherMap  │
                        │  API (optional)  │
                        └──────────────────┘
```

### Process Flow
```
User Selects City → Weather API / Mock Data → ML Risk Model → Risk Classification → Dashboard Alert & Advisory
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS 3, Recharts, Vite |
| Backend | Node.js, Express.js, Mongoose |
| ML Service | Python 3, Scikit-learn, Flask, Pandas, NumPy |
| Database | MongoDB (optional) |
| Architecture | Microservices |

---

## 🌟 Key Features & USP

| Feature | Description |
|---------|-------------|
| 🔥 **AI Heat Risk Index** | ML-predicted score (0-100) instead of raw temperature |
| 📊 **7-Day Forecast** | Predictive risk forecast, not just current conditions |
| 🗺 **India Heatmap** | Color-coded map with 15 major cities |
| 💧 **Safety Advisories** | Action-oriented recommendations per risk level |
| 📍 **Location-Based** | City-specific predictions with real weather data |
| 🔄 **Auto-Refresh** | Real-time updates every 60 seconds |
| 🎯 **Nationwide Scale** | Designed for all of India with expandable city support |

---

## 🤖 AI Model Logic

### Heat Risk Index Calculation

The model uses a **Random Forest Classifier** trained on synthetic Indian heatwave data covering 15 cities across different seasons.

**Input Features:**
- Temperature (°C)
- Humidity (%)
- Wind Speed (km/h)

**Risk Scoring Formula:**
```
Heat Index (HI) = Rothfusz regression equation (accounts for humidity)
Risk Score = temp_factor(40pts) + heat_index_factor(35pts) + humidity_factor(20pts) - wind_relief(5pts)
```

**Risk Categories:**
| Score Range | Category | Color | Action Level |
|------------|----------|-------|-------------|
| 0–24 | Low | 🟢 Green | Normal activity |
| 25–49 | Medium | 🟡 Yellow | Take precautions |
| 50–74 | High | 🟠 Orange | Limit outdoor exposure |
| 75–100 | Severe | 🔴 Red | Emergency protocols |

### AMD GPU Acceleration

For production-scale deployments, the ML model can be accelerated using:
- **AMD Instinct GPUs** with the ROCm platform
- **cuML (RAPIDS)** with ROCm backend for GPU-accelerated Random Forest
- **ONNX Runtime** for optimized inference on AMD hardware

```python
# Example with AMD GPU + cuML
from cuml.ensemble import RandomForestClassifier as cuRF
model = cuRF(n_estimators=200, max_depth=15)
model.fit(X_train_gpu, y_train_gpu)  # Accelerated on AMD GPU via ROCm
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **Python** 3.9+
- **MongoDB** (optional — backend works without it)

### 1. Clone & Setup

```bash
cd HeatShield-AI
```

### 2. Start the ML Service
```bash
cd ml-service
pip install -r requirements.txt
python dataset.py      # Generate training data
python model.py        # Train the model
python app.py          # Start Flask API on port 8000
```

### 3. Start the Backend
```bash
cd backend
npm install
# (Optional) Set OPENWEATHER_API_KEY in .env for real data
node server.js         # Start Express API on port 5000
```

### 4. Start the Frontend
```bash
cd frontend
npm install
npm run dev            # Start React app on port 3000
```

### 5. Open Dashboard
Visit **http://localhost:3000** in your browser.

> **Note:** The project works out of the box with **mock weather data**. No API keys or MongoDB required for demo.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather/live?city=Delhi` | Live weather data |
| GET | `/api/weather/cities` | List supported cities |
| GET | `/api/risk/predict?city=Delhi` | Heat risk prediction |
| GET | `/api/risk/all` | Risk for all cities (heatmap) |
| GET | `/api/forecast/7days?city=Delhi` | 7-day risk forecast |
| GET | `/api/health` | Backend health check |

### ML Service Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict` | Single risk prediction |
| POST | `/forecast` | Batch 7-day prediction |
| GET | `/health` | ML service health check |

---

## ♻️ Sustainability & Social Impact

### Preventing Heat-Related Deaths
- **Early warning system** alerts communities before heatwave peaks
- **Action-oriented advisories** tell people exactly what to do at each risk level
- **Worker protection** by recommending outdoor work suspension during dangerous hours

### Supporting Climate Resilience
- **Data-driven decision making** for government disaster management
- **Historical tracking** reveals long-term heat trends via MongoDB storage
- **Predictive capability** enables proactive rather than reactive response

### Government & Smart City Integration
- Dashboard designed for **real-time monitoring** at city/district/national level
- API architecture enables **easy integration** with existing smart city platforms
- Scalable to all **700+ Indian districts** with additional city data

### Responsible AI
- Transparent model with explainable risk scoring formula
- No personal data collection — uses only weather metrics
- Open-source architecture for community contribution and audit

---

## 📁 Project Structure

```
HeatShield-AI/
├── ml-service/                 # Python ML Microservice
│   ├── app.py                  # Flask API server
│   ├── model.py                # ML model (RandomForest)
│   ├── dataset.py              # Synthetic dataset generator
│   ├── data/                   # Training data & saved model
│   └── requirements.txt
├── backend/                    # Node.js Backend
│   ├── server.js               # Express entry point
│   ├── config/db.js            # MongoDB connection
│   ├── models/RiskRecord.js    # Mongoose schema
│   ├── routes/                 # API route handlers
│   ├── services/               # Weather & ML clients
│   ├── .env                    # Environment variables
│   └── package.json
├── frontend/                   # React Dashboard
│   ├── src/
│   │   ├── App.jsx             # Main dashboard
│   │   ├── components/         # UI components
│   │   ├── services/api.js     # API client
│   │   └── index.css           # Tailwind + custom styles
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 📜 License

Built for the AMD Hackathon — HeatShield AI: Using technology responsibly for climate resilience and public safety.
