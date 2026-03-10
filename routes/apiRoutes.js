const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');

// Test route
router.get('/status', (req, res) => {
    res.json({ message: 'API is working properly' });
});

// Get Symptoms Route
router.get('/symptoms', predictionController.getSymptoms);


// Disease Prediction Route
router.post('/predict', predictionController.predictDisease);

module.exports = router;
