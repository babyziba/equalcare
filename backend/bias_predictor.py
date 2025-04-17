import pandas as pd

# Reference impact thresholds and studies for each category
IMPACT_STUDIES = {
    "Heart Attack": {
        "thresholds": {
            "significant": 0.35,
            "mild": 0.40
        },
        "impact": "Women are 50% more likely to be misdiagnosed when experiencing a heart attack compared to men, despite having similar risk levels.",
        "source": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10945154/#ref-list1"
    },
    "Stroke": {
        "thresholds": {
            "significant": 0.35,
            "mild": 0.40
        },
        "impact": "Bias in stroke trials can lead to delayed diagnosis in women and older patients.",
        "source": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4344423/"
    },
    # Add more categories here as needed
}

def predict_bias_impact(df, category=""):
    results = {}

    # Normalize category input
    category = category.strip().title()
    print(f"Impact predictor received category: '{category}'")
    print("Available categories:", list(IMPACT_STUDIES.keys()))  # <- Debug line

    # Normalize column names
    df.columns = df.columns.str.lower()

    # Find gender/sex column
    gender_col = next((col for col in df.columns if col in ["gender", "sex"]), None)
    if not gender_col:
        return {"error": "Missing gender or sex column for impact prediction."}

    try:
        df = df.dropna(subset=[gender_col])
        df[gender_col] = df[gender_col].astype(str).str.strip().str.lower()
        gender_counts = df[gender_col].value_counts().to_dict()
        total = len(df)

        female_count = gender_counts.get("female", 0)
        female_percent = female_count / total if total > 0 else 0

        impact_info = IMPACT_STUDIES.get(category)

        # Log if match was found or not
        if impact_info:
            print("Impact info found!")
        else:
            print("⚠️ No impact info found for this category.")

        if impact_info:
            bias_level = "Balanced"
            if female_percent < impact_info["thresholds"]["significant"]:
                bias_level = "Significant Bias"
            elif female_percent < impact_info["thresholds"]["mild"]:
                bias_level = "Mild Imbalance"

            results = {
                "bias_level": bias_level,
                "female_percent": round(female_percent * 100, 2),
                "impact_note": impact_info["impact"],
                "source": impact_info["source"]
            }
        else:
            results = {
                "bias_level": "Unknown",
                "female_percent": round(female_percent * 100, 2),
                "impact_note": "No impact data available for this category.",
                "source": None
            }

    except Exception as e:
        results = {"error": f"Impact analysis failed: {str(e)}"}

    return results
