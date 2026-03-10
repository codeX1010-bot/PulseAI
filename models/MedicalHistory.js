const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pastPredictions: [{
        disease: String,
        date: { type: Date, default: Date.now }
    }],
    ongoingMedications: [{
        type: String
    }],
    previousPrescriptions: [{
        type: String // Alternatively, paths to uploaded files
    }]
}, { timestamps: true });

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);
