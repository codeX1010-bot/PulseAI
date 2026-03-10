from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
from groq import Groq
import os
import json
import traceback

# Load environment variables
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=os.path.join(BASE_DIR, 'public'), static_url_path='')
CORS(app)

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI")
try:
    import certifi
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client.get_database("smarthealth_db")
    users_collection = db.get_collection("users")
    history_collection = db.get_collection("history")
    client.admin.command('ping')
    print("✅ Successfully connected to MongoDB Atlas")
except Exception as e:
    print(f"❌ MongoDB Connection Error: {e}")

# Groq AI Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = None
AI_MODEL = "llama-3.3-70b-versatile"

if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        print(f"✅ Groq AI Initialized (Model: {AI_MODEL})")
    except Exception as e:
        print(f"❌ Groq Initialization Error: {e}")
else:
    print("⚠️ GROQ_API_KEY missing. AI features will be disabled.")


def ask_ai(prompt):
    """Helper: Send a prompt to Groq and return the response text."""
    response = groq_client.chat.completions.create(
        model=AI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_completion_tokens=1024,
    )
    return response.choices[0].message.content.strip()


def clean_json(raw_text):
    """Helper: Extract JSON from potential markdown code blocks."""
    if "```json" in raw_text:
        raw_text = raw_text.split("```json")[1].split("```")[0].strip()
    elif "```" in raw_text:
        raw_text = raw_text.split("```")[1].split("```")[0].strip()
    return raw_text


# Serve Frontend Pages
@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(os.path.join(BASE_DIR, 'public'), path)

# --- DEBUG (temporary) ---
@app.route('/debug')
def debug_info():
    import glob
    info = {
        "BASE_DIR": BASE_DIR,
        "static_folder": app.static_folder,
        "cwd": os.getcwd(),
        "files_in_base": os.listdir(BASE_DIR) if os.path.exists(BASE_DIR) else "BASE_DIR not found",
        "public_exists": os.path.exists(os.path.join(BASE_DIR, 'public')),
        "public_files": os.listdir(os.path.join(BASE_DIR, 'public')) if os.path.exists(os.path.join(BASE_DIR, 'public')) else "no public dir",
    }
    return jsonify(info)

# --- AUTHENTICATION ENDPOINTS ---

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'patient')
        name = data.get('name', email)
        locality = data.get('locality', 'New York')
        age = data.get('age')
        gender = data.get('gender', '')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            return jsonify({"error": "User with this email already exists"}), 409

        new_user = {
            "email": email, "password": password, "role": role, "name": name,
            "locality": locality, "age": age, "gender": gender,
            "created_at": datetime.now()
        }
        result = users_collection.insert_one(new_user)
        return jsonify({"message": "User registered successfully", "userId": str(result.inserted_id), "role": role, "email": email, "name": name, "locality": locality, "age": age, "gender": gender}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email, password, role = data.get('email'), data.get('password'), data.get('role')
        user = users_collection.find_one({"email": email})
        if not user or user['password'] != password:
            return jsonify({"error": "Invalid credentials"}), 401
        if role and user['role'] != role:
            return jsonify({"error": f"Role mismatch. Registered as {user['role']}"}), 403
        return jsonify({
            "userId": str(user['_id']), 
            "email": user['email'], 
            "role": user['role'], 
            "name": user.get('name', user['email']),
            "locality": user.get('locality', 'New York'),
            "age": user.get('age', ''),
            "gender": user.get('gender', '')
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/profile/<email>', methods=['GET'])
def get_profile(email):
    user = users_collection.find_one({"email": email})
    if not user: return jsonify({"error": "User not found"}), 404
    return jsonify({
        "email": user['email'], 
        "role": user['role'], 
        "name": user.get('name', user['email']),
        "locality": user.get('locality', 'Not Set'),
        "age": user.get('age', ''),
        "gender": user.get('gender', '')
    }), 200

@app.route('/api/user/profile', methods=['PUT'])
def update_profile():
    data = request.get_json()
    email = data.get('email')
    new_name = data.get('name')
    new_locality = data.get('locality')
    new_age = data.get('age')
    new_gender = data.get('gender')
    
    update_data = {}
    if new_name: update_data["name"] = new_name
    if new_locality: update_data["locality"] = new_locality
    if new_age is not None: update_data["age"] = new_age
    if new_gender: update_data["gender"] = new_gender
    
    users_collection.update_one({"email": email}, {"$set": update_data})
    return jsonify({"message": "Profile updated", "name": new_name, "locality": new_locality, "age": new_age, "gender": new_gender}), 200

# --- CONVERSATIONAL AI ENDPOINTS ---

@app.route('/api/consultation/start', methods=['POST'])
def start_consultation():
    if groq_client is None:
        return jsonify({"error": "AI is not configured. Please set GROQ_API_KEY and restart."}), 503
        
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        prompt = f"""Act as a medical assistant. The user says: "{text}"
Extract the core medical symptoms from this text. 
Format the output as a JSON list of strings. 
Only return the JSON list, nothing else."""
        
        raw_text = ask_ai(prompt)
        symptoms = json.loads(clean_json(raw_text))
        return jsonify({"symptoms": symptoms})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": "AI Extraction failed. Please try again."}), 500

@app.route('/api/consultation/question', methods=['POST'])
def get_consultation_question():
    if groq_client is None:
        return jsonify({"error": "AI is not configured."}), 503
        
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', [])
        qa_history = data.get('qa_history', [])
        
        prompt = f"""Act as a medical doctor. 
The patient has these symptoms: {symptoms}
Our conversation history is: {qa_history}

Ask ONE relevant follow-up question to help narrow down the diagnosis.
Keep the question concise and professional.
Return ONLY the question text."""
        
        question = ask_ai(prompt)
        return jsonify({"question": question})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": "Failed to generate question"}), 500

@app.route('/api/consultation/finish', methods=['POST'])
def finish_consultation():
    if groq_client is None:
        return jsonify({"error": "AI is not configured."}), 503
        
    try:
        data = request.get_json()
        email = data.get('email')
        symptoms = data.get('symptoms', [])
        qa_history = data.get('qa_history', [])
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        prompt = f"""Act as a specialist medical diagnostic assistant.
Patient Symptoms: {symptoms}
Consultation Q&A: {qa_history}

Provide the top 3 potential medical conditions in order of probability.
For EACH condition, provide:
1. Condition Name ("disease")
2. Confidence percentage ("confidence")
3. Brief medical advice ("advice")
4. The SPECIFIC type of specialist to visit ("specialist") - e.g., Cardiologist, Dermatologist, ER etc.
5. Priority level ("priority"): "Urgent" or "Routine".
6. A list of 3-4 specific precautions the patient should take immediately ("precautions")

Format your response as a JSON list of objects: 
[
    {{"disease": "Condition Name", "confidence": 85, "advice": "...", "specialist": "Cardiologist", "priority": "Urgent", "precautions": ["Avoid strenuous activity", "Stay hydrated", "Monitor temperature"]}},
    ...
]
Return ONLY the JSON list."""
        
        raw_text = ask_ai(prompt)
        predictions = json.loads(clean_json(raw_text))
        
        # Save to history
        record = {
            "email": email,
            "symptoms": symptoms,
            "qa_history": qa_history,
            "predictions": predictions,
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": datetime.now()
        }
        history_collection.insert_one(record)
        
        return jsonify({"predictions": predictions})
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": "Final prediction failed"}), 500

@app.route('/api/history/<email>', methods=['GET'])
def get_user_history(email):
    try:
        cursor = history_collection.find({"email": email}).sort("timestamp", -1).limit(20)
        history_list = []
        for record in cursor:
            preds = record.get("predictions", [{}])
            top = preds[0] if preds else {}
            history_list.append({
                "id": str(record["_id"]),
                "date": record.get("timestamp", datetime.now()).strftime("%B %d, %Y"),
                "symptoms": record.get("symptoms", []),
                "topDisease": top.get("disease", "Unknown"),
                "confidence": top.get("confidence", "N/A"),
                "precautions": top.get("precautions", []),
                "advice": top.get("advice", ""),
                "specialist": top.get("specialist", ""),
                "priority": top.get("priority", ""),
                "latitude": record.get("latitude"),
                "longitude": record.get("longitude")
            })
        return jsonify({"history": history_list}), 200
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"history": []}), 200

if __name__ == '__main__':
    app.run(port=5001, debug=True)
