/**
 * HeatShield AI - Express Backend Server with Real-Time WebSocket Support
 *
 * Serves as the central API layer connecting:
 * - Frontend React dashboard (via REST + WebSocket)
 * - Python ML microservice
 * - OpenWeatherMap API (live weather data)
 * - MongoDB database
 *
 * Architecture: Microservices with Socket.IO real-time broadcast
 */

require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

// Import routes
const weatherRoutes = require("./routes/weather");
const riskRoutes = require("./routes/risk");
const forecastRoutes = require("./routes/forecast");

// Import services for real-time broadcast
const { getLiveWeather, getSupportedCities } = require("./services/weatherService");
const { predictRisk } = require("./services/mlService");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
});

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
        realtime: true,
        connectedClients: io.engine.clientsCount,
        timestamp: new Date().toISOString(),
        mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
        weatherSource: "open-meteo (live)",
    });
});

// Root
app.get("/", (req, res) => {
    res.json({
        name: "HeatShield AI API",
        version: "2.0.0 — Real-Time",
        realtime: "Socket.IO enabled",
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

// ─── REAL-TIME BROADCAST ENGINE ────────────────────────────────
const BROADCAST_INTERVAL = 30000; // 30 seconds
let broadcastTimer = null;
let lastBroadcastData = null;

/**
 * Fetches live weather + risk for all cities and broadcasts to all connected clients.
 */
async function broadcastWeatherUpdate() {
    try {
        const cities = getSupportedCities();
        const results = [];

        // Fetch weather + risk for all cities in parallel
        const promises = cities.map(async (city) => {
            try {
                const weather = await getLiveWeather(city);
                const prediction = await predictRisk(
                    weather.temperature,
                    weather.humidity,
                    weather.wind_speed
                );
                return { city, weather, prediction };
            } catch (err) {
                console.warn(`⚠️  Broadcast: failed for ${city}: ${err.message}`);
                return null;
            }
        });

        const resolved = await Promise.all(promises);
        for (const r of resolved) {
            if (r) results.push(r);
        }

        const payload = {
            data: results,
            timestamp: new Date().toISOString(),
            source: results[0]?.weather?.source || "open-meteo",
        };

        lastBroadcastData = payload;

        // Emit to all connected clients
        io.emit("weather:update", payload);
        console.log(`📡 Broadcast: sent weather update for ${results.length} cities to ${io.engine.clientsCount} client(s)`);
    } catch (error) {
        console.error("❌ Broadcast error:", error.message);
    }
}

// ─── SOCKET.IO CONNECTION HANDLING ─────────────────────────────
io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id} (total: ${io.engine.clientsCount})`);

    // Send the last broadcast data immediately so new clients don't wait 30s
    if (lastBroadcastData) {
        socket.emit("weather:update", lastBroadcastData);
    }

    // Allow clients to request data for a specific city on-demand
    socket.on("request:city", async (city) => {
        try {
            const weather = await getLiveWeather(city);
            const prediction = await predictRisk(
                weather.temperature,
                weather.humidity,
                weather.wind_speed
            );
            socket.emit("city:update", {
                city,
                weather,
                prediction,
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            socket.emit("city:error", { city, error: err.message });
        }
    });

    socket.on("disconnect", () => {
        console.log(`🔌 Client disconnected: ${socket.id} (total: ${io.engine.clientsCount})`);
    });
});

// ─── START SERVER ──────────────────────────────────────────────
async function start() {
    // Try connecting to MongoDB (non-blocking)
    await connectDB();

    server.listen(PORT, () => {
        console.log("");
        console.log("🔥 ═══════════════════════════════════════════");
        console.log("   HeatShield AI Backend Server — v2.0 REAL-TIME");
        console.log(`   Running on http://localhost:${PORT}`);
        console.log("   ML Service: " + (process.env.ML_SERVICE_URL || "http://localhost:8000"));
        console.log("   Weather Source: 🌐 Open-Meteo (LIVE — no API key needed)");
        console.log("   WebSocket: ✅ Socket.IO active");
        console.log(`   Broadcast interval: ${BROADCAST_INTERVAL / 1000}s`);
        console.log("🔥 ═══════════════════════════════════════════");
        console.log("");

        // Start the real-time broadcast loop
        broadcastWeatherUpdate(); // immediate first broadcast
        broadcastTimer = setInterval(broadcastWeatherUpdate, BROADCAST_INTERVAL);
        console.log("📡 Real-time broadcast engine started.");
    });
}

start();
