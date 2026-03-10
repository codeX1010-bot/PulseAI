const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin'],
        default: 'patient',
    },
    age: {
        type: Number,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    locality: {
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
