/**
 * HeatShield AI - Risk Prediction Routes
 * GET /api/risk/predict?city=Delhi - Get heat risk prediction for a city
 * GET /api/risk/all - Get risk for all cities (for heatmap)
 */

const express = require("express");
const router = express.Router();
const { getLiveWeather, getSupportedCities } = require("../services/weatherService");
const { predictRisk } = require("../services/mlService");

let RiskRecord;
try {
    RiskRecord = require("../models/RiskRecord");
} catch (e) {
    RiskRecord = null;
}

// GET /api/risk/predict?city=Delhi
router.get("/predict", async (req, res) => {
    try {
        const city = req.query.city || "Delhi";

        // 1. Get live weather
        const weather = await getLiveWeather(city);

        // 2. Get risk prediction from ML service
        const prediction = await predictRisk(
            weather.temperature,
            weather.humidity,
            weather.wind_speed
        );

        // 3. Try to save to database
        if (RiskRecord) {
            try {
                await RiskRecord.create({
                    city,
                    temperature: weather.temperature,
                    humidity: weather.humidity,
                    windSpeed: weather.wind_speed,
                    riskScore: prediction.risk_score,
                    riskCategory: prediction.risk_category,
                    confidence: prediction.confidence,
                });
            } catch (dbErr) {
                console.warn("DB save failed:", dbErr.message);
            }
        }

        res.json({
            success: true,
            data: {
                weather,
                prediction,
                city,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// GET /api/risk/all - Risk for all cities (heatmap data)
router.get("/all", async (req, res) => {
    try {
        const cities = getSupportedCities();
        const results = [];

        for (const city of cities) {
            const weather = await getLiveWeather(city);
            const prediction = await predictRisk(
                weather.temperature,
                weather.humidity,
                weather.wind_speed
            );
            results.push({
                city,
                weather,
                prediction,
            });
        }

        res.json({
            success: true,
            data: results,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

module.exports = router;
