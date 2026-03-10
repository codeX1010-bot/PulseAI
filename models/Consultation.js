const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'completed'],
        default: 'pending'
    },
    notes: {
        type: String
    },
    diseasePredicted: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);
