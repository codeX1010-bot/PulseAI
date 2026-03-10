const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const Disease = require('./models/Disease');

const app = express();

// Sample disease data to auto-seed if the database is empty
const seedDiseases = [
  { name: 'Common Cold', symptoms: ['chills', 'runny_nose', 'headache', 'continuous_sneezing', 'cough', 'sore_throat', 'phlegm', 'chest_pain', 'muscle_pain'], recommendedTests: ['CBC (Complete Blood Count)'] },
  { name: 'Flu (Influenza)', symptoms: ['fever', 'chills', 'muscle_pain', 'cough', 'congestion', 'runny_nose', 'headache', 'fatigue'], recommendedTests: ['Rapid Influenza Diagnostic Tests (RIDTs)'] },
  { name: 'COVID-19', symptoms: ['fever', 'cough', 'fatigue', 'loss_of_smell', 'loss_of_taste', 'shortness_of_breath', 'sore_throat'], recommendedTests: ['RT-PCR Test', 'Rapid Antigen Test'] },
  { name: 'Malaria', symptoms: ['chills', 'vomiting', 'high_fever', 'sweating', 'headache', 'nausea', 'muscle_pain'], recommendedTests: ['Microscopic Blood Smear', 'Rapid Diagnostic Test (RDT) for Malaria'] },
  { name: 'Dengue', symptoms: ['skin_rash', 'chills', 'joint_pain', 'vomiting', 'fatigue', 'high_fever', 'headache', 'nausea', 'loss_of_appetite', 'pain_behind_the_eyes', 'back_pain', 'muscle_pain', 'red_spots_over_body'], recommendedTests: ['NS1 Antigen Test', 'Dengue Antibody Test (IgG/IgM)', 'CBC'] },
  { name: 'Typhoid', symptoms: ['chills', 'vomiting', 'fatigue', 'high_fever', 'headache', 'nausea', 'constipation', 'abdominal_pain', 'diarrhoea', 'toxic_look_(typhos)', 'belly_pain'], recommendedTests: ['Widal Test', 'Blood Culture', 'Stool Culture'] }
];

const startServer = async () => {
  // 1. Connect to Database (using in-memory DB since no local server)
  await connectDB();

  // 2. Auto-seed if the database is empty
  try {
    const count = await Disease.countDocuments();
    if (count === 0) {
      console.log('-> Database is empty. Seeding initial diseases automatically...');
      await Disease.insertMany(seedDiseases);
      console.log('-> Database seeded successfully!');
    }
  } catch (err) {
    console.error('Error auto-seeding data:', err);
  }

  // 3. Mount Middleware
  app.use(cors());
  app.use(express.json()); // Parses incoming JSON
  app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

  // 4. Mount API Routes
  app.use('/api', require('./routes/apiRoutes'));

  // 5. Serve static files from public directory (Frontend UI)
  app.use(express.static('public'));

  // 6. Start listening
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`================================`);
    console.log(`Server running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
    console.log(`================================`);
  });
};

startServer();
