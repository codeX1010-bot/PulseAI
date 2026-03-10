const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    symptoms: [{
        type: String,
        required: true
    }],
    recommendedTests: [{
        type: String
    }]
});

module.exports = mongoose.model('Disease', diseaseSchema);
