"""
HeatShield AI - ML Microservice (Flask)
Provides REST API endpoints for heat risk prediction.

Endpoints:
    POST /predict       - Single weather prediction
    POST /forecast      - Batch prediction (7-day forecast)
    GET  /health        - Health check

AMD GPU Note: This microservice can be deployed on AMD Instinct GPU servers
for high-throughput inference using ROCm + ONNX Runtime or TensorRT alternatives.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from model import HeatRiskModel

app = Flask(__name__)
CORS(app)

# Initialize and load/train the model at startup
print("🚀 Initializing HeatShield AI ML Service...")
model = HeatRiskModel()
if not model.load():
    print("📦 No pre-trained model found. Training new model...")
    model.train()
print("✅ ML Service ready!")


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "HeatShield AI ML Service",
        "model_loaded": model.is_trained
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict heat risk for a single set of weather parameters.

    Request body:
        {
            "temperature": 42.0,
            "humidity": 30.0,
            "wind_speed": 5.0
        }

    Response:
        {
            "risk_score": 78.5,
            "risk_category": "Severe",
            "confidence": 94.2,
            "input": { ... }
        }
    """
    try:
        data = request.get_json()

        temperature = float(data.get("temperature", 35))
        humidity = float(data.get("humidity", 50))
        wind_speed = float(data.get("wind_speed", 10))

        result = model.predict(temperature, humidity, wind_speed)

        return jsonify({
            "success": True,
            "prediction": result
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400


@app.route("/forecast", methods=["POST"])
def forecast():
    """
    Predict heat risk for multiple days (batch prediction).

    Request body:
        {
            "forecast_data": [
                {"day": 1, "date": "2024-05-01", "temperature": 40, "humidity": 35, "wind_speed": 8},
                {"day": 2, "date": "2024-05-02", "temperature": 42, "humidity": 30, "wind_speed": 5},
                ...
            ]
        }

    Response:
        {
            "success": true,
            "predictions": [ ... ]
        }
    """
    try:
        data = request.get_json()
        forecast_data = data.get("forecast_data", [])

        if not forecast_data:
            return jsonify({
                "success": False,
                "error": "No forecast data provided"
            }), 400

        predictions = model.predict_batch(forecast_data)

        return jsonify({
            "success": True,
            "predictions": predictions
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
