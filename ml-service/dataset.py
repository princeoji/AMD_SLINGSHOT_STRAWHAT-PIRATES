"""
HeatShield AI - Synthetic Heatwave Dataset Generator
Generates a realistic Indian heatwave dataset for training the Heat Risk Index model.

Note: For production-scale dataset generation and model training,
AMD GPU acceleration (via ROCm + cuML/Rapids) can significantly speed up processing.
"""

import pandas as pd
import numpy as np
import os

def calculate_heat_index(temperature, humidity):
    """
    Calculate the Heat Index using the Rothfusz regression equation.
    This gives a 'feels like' temperature accounting for humidity.
    """
    T = temperature * 9/5 + 32  # Convert to Fahrenheit
    RH = humidity

    HI = (-42.379 + 2.04901523*T + 10.14333127*RH
           - 0.22475541*T*RH - 0.00683783*T*T
           - 0.05481717*RH*RH + 0.00122874*T*T*RH
           + 0.00085282*T*RH*RH - 0.00000199*T*T*RH*RH)

    HI = (HI - 32) * 5/9  # Convert back to Celsius
    return HI


def compute_risk_score(temperature, humidity, wind_speed):
    """
    Compute a Heat Risk Score (0-100) based on temperature, humidity, and wind speed.
    Higher temperature and humidity increase risk; higher wind speed slightly reduces it.
    """
    heat_index = calculate_heat_index(temperature, humidity)

    # Normalize components
    temp_factor = np.clip((temperature - 25) / 25, 0, 1) * 40      # 0-40 points
    hi_factor = np.clip((heat_index - 30) / 30, 0, 1) * 35         # 0-35 points
    humidity_factor = np.clip(humidity / 100, 0, 1) * 20            # 0-20 points
    wind_relief = np.clip(wind_speed / 30, 0, 1) * 5                # 0-5 points relief

    score = temp_factor + hi_factor + humidity_factor - wind_relief
    return np.clip(score, 0, 100)


def classify_risk(score):
    """Classify risk score into categories."""
    if score < 25:
        return "Low"
    elif score < 50:
        return "Medium"
    elif score < 75:
        return "High"
    else:
        return "Severe"


def generate_dataset(n_samples=5000, seed=42):
    """
    Generate a synthetic heatwave dataset for Indian cities.
    Ensures balanced risk categories by combining realistic seasonal data
    with targeted extreme weather scenarios.
    """
    np.random.seed(seed)

    # Major Indian cities with typical temperature ranges
    cities = {
        "Delhi":       {"temp_range": (20, 48), "humidity_range": (15, 70)},
        "Mumbai":      {"temp_range": (22, 40), "humidity_range": (50, 95)},
        "Chennai":     {"temp_range": (24, 44), "humidity_range": (40, 90)},
        "Kolkata":     {"temp_range": (18, 43), "humidity_range": (45, 90)},
        "Bengaluru":   {"temp_range": (18, 38), "humidity_range": (30, 80)},
        "Hyderabad":   {"temp_range": (20, 45), "humidity_range": (25, 75)},
        "Ahmedabad":   {"temp_range": (20, 48), "humidity_range": (15, 65)},
        "Jaipur":      {"temp_range": (15, 47), "humidity_range": (10, 60)},
        "Lucknow":     {"temp_range": (15, 46), "humidity_range": (20, 75)},
        "Nagpur":      {"temp_range": (18, 48), "humidity_range": (15, 70)},
        "Bhopal":      {"temp_range": (16, 46), "humidity_range": (15, 70)},
        "Varanasi":    {"temp_range": (15, 46), "humidity_range": (20, 80)},
        "Patna":       {"temp_range": (15, 44), "humidity_range": (30, 85)},
        "Thiruvananthapuram": {"temp_range": (24, 36), "humidity_range": (60, 95)},
        "Chandigarh":  {"temp_range": (12, 44), "humidity_range": (20, 70)},
    }

    records = []
    city_names = list(cities.keys())

    # --- Part 1: Generate balanced samples for each risk category ---
    # Target: ~30% Low, ~30% Medium, ~25% High, ~15% Severe
    category_targets = {
        "Low":    int(n_samples * 0.30),
        "Medium": int(n_samples * 0.30),
        "High":   int(n_samples * 0.25),
        "Severe": int(n_samples * 0.15),
    }

    # Temperature ranges that produce each risk category
    category_temp_ranges = {
        "Low":    (20, 32),
        "Medium": (33, 40),
        "High":   (39, 46),
        "Severe": (44, 50),
    }
    category_humidity_ranges = {
        "Low":    (10, 40),
        "Medium": (30, 60),
        "High":   (45, 80),
        "Severe": (55, 95),
    }

    for category, target_count in category_targets.items():
        t_lo, t_hi = category_temp_ranges[category]
        h_lo, h_hi = category_humidity_ranges[category]
        generated = 0
        attempts = 0

        while generated < target_count and attempts < target_count * 5:
            attempts += 1
            city_name = np.random.choice(city_names)
            month = np.random.choice([4, 5, 6]) if category in ["High", "Severe"] else np.random.randint(1, 13)

            temperature = round(np.random.uniform(t_lo, t_hi), 1)
            humidity = round(np.random.uniform(h_lo, h_hi), 1)
            wind_speed = round(np.clip(np.random.exponential(6 if category != "Severe" else 3), 0, 30), 1)

            risk_score = round(compute_risk_score(temperature, humidity, wind_speed), 2)
            actual_category = classify_risk(risk_score)

            # Only keep if it matches our target category
            if actual_category == category:
                records.append({
                    "city": city_name,
                    "month": month,
                    "temperature": temperature,
                    "humidity": humidity,
                    "wind_speed": wind_speed,
                    "risk_score": risk_score,
                    "risk_category": actual_category,
                })
                generated += 1

    # --- Part 2: Fill any remaining with random samples ---
    remaining = n_samples - len(records)
    for _ in range(remaining):
        city_name = np.random.choice(city_names)
        temperature = round(np.random.uniform(20, 50), 1)
        humidity = round(np.random.uniform(10, 95), 1)
        wind_speed = round(np.clip(np.random.exponential(8), 0, 30), 1)

        risk_score = round(compute_risk_score(temperature, humidity, wind_speed), 2)
        risk_category = classify_risk(risk_score)

        records.append({
            "city": city_name,
            "month": np.random.randint(1, 13),
            "temperature": temperature,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "risk_score": risk_score,
            "risk_category": risk_category,
        })

    df = pd.DataFrame(records)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)  # Shuffle

    return df


if __name__ == "__main__":
    print("🔥 Generating HeatShield AI Training Dataset...")
    df = generate_dataset(n_samples=5000)

    os.makedirs("data", exist_ok=True)
    df.to_csv("data/sample_data.csv", index=False)

    print(f"✅ Dataset generated: {len(df)} samples")
    print(f"📊 Risk distribution:\n{df['risk_category'].value_counts()}")
    print(f"🌡  Temperature range: {df['temperature'].min()}°C - {df['temperature'].max()}°C")
    print(f"💧 Humidity range: {df['humidity'].min()}% - {df['humidity'].max()}%")
    print(f"💨 Wind speed range: {df['wind_speed'].min()} - {df['wind_speed'].max()} km/h")
    print(f"\n📁 Saved to data/sample_data.csv")
