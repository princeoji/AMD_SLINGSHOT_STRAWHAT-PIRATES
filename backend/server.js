/**
 * HeatShield AI - Express Backend Server
 *
 * Serves as the central API layer connecting:
 * - Frontend React dashboard
 * - Python ML microservice
 * - OpenWeatherMap API
 * - MongoDB database
 *
 * Architecture: Microservices with clear separation of concerns
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Import routes
const weatherRoutes = require("./routes/weather");
const riskRoutes = require("./routes/risk");
const forecastRoutes = require("./routes/forecast");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use("/api/weather", weatherRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/forecast", forecastRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "HeatShield AI Backend",
        timestamp: new Date().toISOString(),
        mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
    });
});

// Root
app.get("/", (req, res) => {
    res.json({
        name: "HeatShield AI API",
        version: "1.0.0",
        endpoints: {
            health: "/api/health",
            weather: "/api/weather/live?city=Delhi",
            cities: "/api/weather/cities",
            predict: "/api/risk/predict?city=Delhi",
            riskAll: "/api/risk/all",
            forecast: "/api/forecast/7days?city=Delhi",
        },
    });
});

// Start server
async function start() {
    // Try connecting to MongoDB (non-blocking)
    await connectDB();

    app.listen(PORT, () => {
        console.log("");
        console.log("🔥 ═══════════════════════════════════════════");
        console.log("   HeatShield AI Backend Server");
        console.log(`   Running on http://localhost:${PORT}`);
        console.log("   ML Service: " + (process.env.ML_SERVICE_URL || "http://localhost:8000"));
        console.log("🔥 ═══════════════════════════════════════════");
        console.log("");
    });
}

start();
