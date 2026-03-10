const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
    try {
        let dbUrl = process.env.MONGO_URI;

        // If no URI is provided, use an in-memory MongoDB server
        // This allows the app to run instantly without installing a local MongoDB server
        if (!dbUrl) {
            mongod = await MongoMemoryServer.create();
            dbUrl = mongod.getUri();
            console.log('-> No MONGO_URI found in .env, spinning up an ephemeral in-memory MongoDB instance...');
        }

        const conn = await mongoose.connect(dbUrl);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
