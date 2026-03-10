import sys
import json
import pickle
import os
import warnings

warnings.filterwarnings('ignore')

def main():
    try:
        # Read symptoms from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input provided"}))
            return
            
        user_symptoms = json.loads(input_data).get("symptoms", [])
        
        # Paths
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_dir, 'models', 'health_model.pkl')
        symptoms_path = os.path.join(base_dir, 'models', 'symptoms_list.json')
        diseases_path = os.path.join(base_dir, 'models', 'diseases_list.json')
        
        # Load model and lists
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
            
        with open(symptoms_path, 'r') as f:
            symptoms_list = json.load(f)
        
        # We assume dataset has 377 labels mapping to 0-376
        with open(diseases_path, 'r') as f:
            diseases_list = json.load(f)
            
        # Create feature array initialized to 0
        features = [0] * len(symptoms_list)
        
        # Set 1 for matching symptoms using partial matching for better UX
        user_symptoms_lower = [s.lower().strip() for s in user_symptoms]
        
        match_count = 0
        for i, symptom in enumerate(symptoms_list):
            sym_lower = symptom.lower().strip()
            # If the user symptom string is found in the actual symptom string, mark 1
            for u_sym in user_symptoms_lower:
                if u_sym in sym_lower or sym_lower in u_sym:
                    features[i] = 1
                    match_count += 1
        # Predict using probabilities to give top 3
        if hasattr(model, 'predict_proba'):
            import numpy as np
            probs = model.predict_proba([features])[0]
            top3_idx = np.argsort(probs)[-3:][::-1]
            
            top_predictions = []
            for idx in top3_idx:
                disease_name = str(diseases_list[idx]).title()
                confidence = float(probs[idx])
                top_predictions.append({
                    "disease": disease_name,
                    "confidence": round(confidence * 100, 1) # return as percentage
                })
            
            predicted_disease = top_predictions[0]["disease"] # Primary fallback
        else:
            prediction_result = model.predict([features])[0]
            predicted_disease = str(prediction_result).title() # Capitalize first letters like "Common Cold"
            top_predictions = [{"disease": predicted_disease, "confidence": 100.0}]
        
        result = {
            "disease": predicted_disease, # Kept for backward compatibility
            "topPredictions": top_predictions,
            # Just send back how many features we activated based on user input
            "matchScore": match_count
        }
        
        # Print JSON ensuring it is on the last line
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
