/**
 * HeatShield AI - Weather Routes
 * GET /api/weather/live?city=Delhi - Fetch live weather data
 * GET /api/weather/cities - Get supported cities
 */

const express = require("express");
const router = express.Router();
const { getLiveWeather, getSupportedCities } = require("../services/weatherService");

// GET /api/weather/live?city=Delhi
router.get("/live", async (req, res) => {
    try {
        const city = req.query.city || "Delhi";
        const weather = await getLiveWeather(city);

        res.json({
            success: true,
            data: weather,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// GET /api/weather/cities
router.get("/cities", (req, res) => {
    res.json({
        success: true,
        cities: getSupportedCities(),
    });
});

module.exports = router;
