"""
HeatShield AI - Heat Risk Index ML Model
Uses Random Forest Classifier for heat risk prediction.

AMD GPU Acceleration Note:
--------------------------
For large-scale training and inference, this model can be accelerated using:
- AMD Instinct GPUs with ROCm platform
- cuML (RAPIDS) with ROCm backend for GPU-accelerated Random Forest
- AMD ROCm-enabled PyTorch/TensorFlow for deep learning variants

Example with cuML (AMD GPU accelerated):
    from cuml.ensemble import RandomForestClassifier as cuRF
    model = cuRF(n_estimators=200, max_depth=15)
    model.fit(X_train_gpu, y_train_gpu)  # Runs on AMD GPU via ROCm

Current implementation uses scikit-learn CPU for portability.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

from dataset import compute_risk_score, classify_risk, generate_dataset


class HeatRiskModel:
    """ML model for predicting heat risk categories from weather parameters."""

    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=150,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1  # Use all CPU cores; with ROCm, switch to GPU backend
        )
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        self.model_path = "data/heat_risk_model.pkl"
        self.encoder_path = "data/label_encoder.pkl"

    def train(self, df=None):
        """Train the model on the heatwave dataset."""
        if df is None:
            csv_path = "data/sample_data.csv"
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
            else:
                print("📦 No dataset found. Generating synthetic data...")
                df = generate_dataset(n_samples=5000)
                os.makedirs("data", exist_ok=True)
                df.to_csv(csv_path, index=False)

        # Features and labels
        X = df[["temperature", "humidity", "wind_speed"]].values
        y = df["risk_category"].values

        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
        )

        # Train model
        # Note: For AMD GPU acceleration, replace with cuML RandomForest
        # and load data into GPU memory using cuDF
        print("🧠 Training Heat Risk Model...")
        self.model.fit(X_train, y_train)
        self.is_trained = True

        # Evaluate
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        print(f"✅ Model Accuracy: {accuracy:.4f}")
        print("\n📊 Classification Report:")
        print(classification_report(
            y_test, y_pred,
            target_names=self.label_encoder.classes_
        ))

        # Save model
        os.makedirs("data", exist_ok=True)
        joblib.dump(self.model, self.model_path)
        joblib.dump(self.label_encoder, self.encoder_path)
        print(f"💾 Model saved to {self.model_path}")

        return accuracy

    def load(self):
        """Load a pre-trained model from disk."""
        if os.path.exists(self.model_path) and os.path.exists(self.encoder_path):
            self.model = joblib.load(self.model_path)
            self.label_encoder = joblib.load(self.encoder_path)
            self.is_trained = True
            print("✅ Model loaded from disk.")
            return True
        return False

    def predict(self, temperature, humidity, wind_speed):
        """
        Predict heat risk for given weather parameters.

        Returns:
            dict with risk_score (0-100), risk_category, and confidence
        """
        if not self.is_trained:
            if not self.load():
                self.train()

        # Compute the numerical risk score
        risk_score = round(float(compute_risk_score(temperature, humidity, wind_speed)), 2)

        # ML model prediction
        features = np.array([[temperature, humidity, wind_speed]])
        predicted_class = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]

        category = self.label_encoder.inverse_transform([predicted_class])[0]
        confidence = round(float(max(probabilities)) * 100, 1)

        return {
            "risk_score": risk_score,
            "risk_category": category,
            "confidence": confidence,
            "input": {
                "temperature": temperature,
                "humidity": humidity,
                "wind_speed": wind_speed
            }
        }

    def predict_batch(self, weather_data_list):
        """
        Predict risk for multiple weather data points (e.g., 7-day forecast).

        Args:
            weather_data_list: list of dicts with temperature, humidity, wind_speed

        Returns:
            list of prediction results
        """
        results = []
        for data in weather_data_list:
            result = self.predict(
                data["temperature"],
                data["humidity"],
                data["wind_speed"]
            )
            if "day" in data:
                result["day"] = data["day"]
            if "date" in data:
                result["date"] = data["date"]
            results.append(result)
        return results


if __name__ == "__main__":
    model = HeatRiskModel()
    model.train()

    # Test predictions
    print("\n🔍 Sample Predictions:")
    test_cases = [
        (28, 40, 15),  # Mild
        (35, 55, 8),   # Moderate
        (42, 65, 3),   # Hot & humid
        (47, 30, 2),   # Extreme heat
    ]
    for temp, hum, wind in test_cases:
        result = model.predict(temp, hum, wind)
        print(f"  🌡 {temp}°C | 💧{hum}% | 💨{wind}km/h → "
              f"Score: {result['risk_score']} | "
              f"Category: {result['risk_category']} | "
              f"Confidence: {result['confidence']}%")
