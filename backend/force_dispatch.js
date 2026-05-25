const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const { default: QueueAutomator } = await import('./services/queueAutomator.js');

        const routeID = '69e9c35105b21a67f2ed0747'; // Bahir Dar - Gondar
        const stationID = '69e927d7a7c404ce29547d2e';
        const adminID = '69e9bf7105b21a67f2ed0579';

        console.log('--- TRIGGERING FORCE DISPATCH ---');
        const result = await QueueAutomator.processNextInQueue(routeID, stationID, adminID);
        console.log('RESULT:', JSON.stringify(result, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('CRITICAL ERROR:', err);
        process.exit(1);
    }
}

run();
