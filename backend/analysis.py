import pandas as pd
import io
from bias_predictor import predict_bias_impact


# Analyze uploaded CSV for gender bias
def analyze_csv(file_bytes, category=""):
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
        df.columns = df.columns.str.lower()

        # Step 1: Identify gender column
        possible_cols = ["gender", "sex", "gndr", "biological_sex"]
        gender_col = next((col for col in df.columns if col in possible_cols), None)

        if not gender_col:
            return {"error": "No recognizable gender column found."}

        # Step 2: Normalize gender values
        normalize_map = {
            0: "female",
            1: "male",
            "0": "female",
            "1": "male",
            "m": "male",
            "f": "female",
            "male": "male",
            "female": "female",
            "fem": "female",
            "masc": "male",
        }

        if df[gender_col].dtype in ["int64", "float64"]:
            df["normalized_gender"] = df[gender_col].map(normalize_map)
        else:
            df["normalized_gender"] = (
                df[gender_col].astype(str).str.strip().str.lower().map(normalize_map)
            )

        if df["normalized_gender"].isnull().all():
            return {"error": f"Could not normalize values in column '{gender_col}'."}

        # Step 3: Calculate counts and percentages
        total = len(df)
        gender_counts = df["normalized_gender"].value_counts().to_dict()
        gender_percents = {
            k: round((v / total) * 100, 1) for k, v in gender_counts.items()
        }

        # Step 4: Determine bias level
        min_percent = min(gender_percents.values())

        if min_percent >= 40:
            bias_label = "balanced"
        elif 35 <= min_percent < 40:
            bias_label = "mild_imbalance"
        else:
            bias_label = "significant_bias"

        # Step 5: Predict impact using ML logic (rule-based for now)
        normalized_category = category.strip().title()
        print(f"Normalized category passed: '{normalized_category}'")
        impact_info = predict_bias_impact(df, normalized_category)
        print("Impact info object:", impact_info)


        return {
            "total": total,
            "gender_breakdown": gender_counts,
            "gender_percentages": gender_percents,
            "bias_detected": bias_label != "balanced",
            "bias_level": bias_label,
            "impact_note": impact_info.get("impact_note"),
            "source": impact_info.get("source"),
        }

    except Exception as e:
        return {"error": str(e)}
