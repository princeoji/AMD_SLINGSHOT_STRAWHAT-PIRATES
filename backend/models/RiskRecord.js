/**
 * HeatShield AI - Risk Record Schema
 * Stores historical heat risk predictions for analytics.
 */

const mongoose = require("mongoose");

const riskRecordSchema = new mongoose.Schema({
    city: {
        type: String,
        required: true,
        index: true,
    },
    temperature: {
        type: Number,
        required: true,
    },
    humidity: {
        type: Number,
        required: true,
    },
    windSpeed: {
        type: Number,
        required: true,
    },
    riskScore: {
        type: Number,
        required: true,
    },
    riskCategory: {
        type: String,
        enum: ["Low", "Medium", "High", "Severe"],
        required: true,
    },
    confidence: {
        type: Number,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

module.exports = mongoose.model("RiskRecord", riskRecordSchema);
