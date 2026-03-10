const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Disease = require('./models/Disease');
const connectDB = require('./config/db');

dotenv.config();

const seedDiseases = [
    {
        name: 'Common Cold',
        symptoms: ['chills', 'runny_nose', 'headache', 'continuous_sneezing', 'cough', 'sore_throat', 'phlegm', 'chest_pain', 'muscle_pain'],
        recommendedTests: ['CBC (Complete Blood Count)']
    },
    {
        name: 'Flu (Influenza)',
        symptoms: ['fever', 'chills', 'muscle_pain', 'cough', 'congestion', 'runny_nose', 'headache', 'fatigue'],
        recommendedTests: ['Rapid Influenza Diagnostic Tests (RIDTs)']
    },
    {
        name: 'COVID-19',
        symptoms: ['fever', 'cough', 'fatigue', 'loss_of_smell', 'loss_of_taste', 'shortness_of_breath', 'sore_throat'],
        recommendedTests: ['RT-PCR Test', 'Rapid Antigen Test']
    },
    {
        name: 'Malaria',
        symptoms: ['chills', 'vomiting', 'high_fever', 'sweating', 'headache', 'nausea', 'muscle_pain'],
        recommendedTests: ['Microscopic Blood Smear', 'Rapid Diagnostic Test (RDT) for Malaria']
    },
    {
        name: 'Dengue',
        symptoms: ['skin_rash', 'chills', 'joint_pain', 'vomiting', 'fatigue', 'high_fever', 'headache', 'nausea', 'loss_of_appetite', 'pain_behind_the_eyes', 'back_pain', 'muscle_pain', 'red_spots_over_body'],
        recommendedTests: ['NS1 Antigen Test', 'Dengue Antibody Test (IgG/IgM)', 'CBC']
    },
    {
        name: 'Typhoid',
        symptoms: ['chills', 'vomiting', 'fatigue', 'high_fever', 'headache', 'nausea', 'constipation', 'abdominal_pain', 'diarrhoea', 'toxic_look_(typhos)', 'belly_pain'],
        recommendedTests: ['Widal Test', 'Blood Culture', 'Stool Culture']
    }
];

const seedDB = async () => {
    try {
        await connectDB();
        console.log('Clearing existing diseases...');
        await Disease.deleteMany({});

        console.log('Seeding new diseases...');
        await Disease.insertMany(seedDiseases);

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
