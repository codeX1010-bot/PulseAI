const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Disease = require('../models/Disease');

exports.getSymptoms = (req, res) => {
    try {
        const symptomsPath = path.join(__dirname, '..', 'models', 'symptoms_list.json');
        if (fs.existsSync(symptomsPath)) {
            const symptomsData = JSON.parse(fs.readFileSync(symptomsPath, 'utf8'));
            return res.status(200).json({ symptoms: symptomsData });
        }
        return res.status(404).json({ error: 'Symptoms data not found' });
    } catch (err) {
        console.error('Error reading symptoms list:', err);
        res.status(500).json({ error: 'Failed to load symptoms list' });
    }
};


exports.predictDisease = async (req, res) => {
    try {
        const { symptoms } = req.body;

        if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
            return res.status(400).json({ error: 'Please provide an array of symptoms' });
        }

        const pythonScriptPath = path.join(__dirname, '..', 'predict.py');
        const pythonProcess = spawn('python', [pythonScriptPath]);

        let pythonOutput = '';
        let pythonError = '';

        pythonProcess.stdout.on('data', (data) => {
            pythonOutput += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            pythonError += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error('Python script error:', pythonError);
                return res.status(500).json({ error: 'Failed to run prediction model', details: pythonError });
            }

            try {
                // Parse the last line of python output to avoid warnings breaking JSON
                const lines = pythonOutput.trim().split('\n');
                const lastLine = lines[lines.length - 1];
                const result = JSON.parse(lastLine);

                if (result.error) {
                    return res.status(500).json({ error: result.error });
                }

                // Optional: Look up recommended tests from our Mongo DB if they exist for this disease
                let recommendedTests = [];
                const dbDisease = await Disease.findOne({ name: { $regex: new RegExp('^' + result.disease + '$', 'i') } });

                if (dbDisease && dbDisease.recommendedTests && dbDisease.recommendedTests.length > 0) {
                    recommendedTests = dbDisease.recommendedTests;
                } else {
                    recommendedTests = ['General Health Checkup', 'Consult a doctor for specific tests'];
                }

                return res.status(200).json({
                    disease: result.disease,
                    topPredictions: result.topPredictions || [],
                    matchScore: result.matchScore,
                    recommendedTests: recommendedTests
                });

            } catch (e) {
                console.error('Failed to parse Python output:', pythonOutput);
                return res.status(500).json({ error: 'Invalid output from prediction model' });
            }
        });

        // Send data to python script
        pythonProcess.stdin.write(JSON.stringify({ symptoms }));
        pythonProcess.stdin.end();

    } catch (error) {
        console.error('Prediction Error:', error);
        res.status(500).json({ error: 'Server primarily encountered an error during prediction' });
    }
};
