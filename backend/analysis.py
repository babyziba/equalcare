import pandas as pd
import io


def analyze_csv(file_bytes):
   try:
       # Load CSV file from bytes
       df = pd.read_csv(io.BytesIO(file_bytes))


       # Normalize column headers to lowercase
       df.columns = df.columns.str.lower()


       # Make sure 'gender' column is present
       if "gender" not in df.columns:
           return {"error": "Missing 'gender' column in CSV"}


       # Total number of rows
       total = len(df)


       # Count gender values (e.g., Female, Male, etc.)
       gender_counts = df["gender"].value_counts().to_dict()


       # Flag potential bias if any group is less than 30% of total
       bias_detected = any(count / total < 0.3 for count in gender_counts.values())


       # Return analysis results
       return {
           "total": total,
           "gender_breakdown": gender_counts,
           "bias_detected": bias_detected
       }


   except Exception as e:
       # Catch any errors that occur during file processing
       return {"error": str(e)}