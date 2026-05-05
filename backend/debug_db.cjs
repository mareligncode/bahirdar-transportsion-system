const mongoose = require('mongoose');
require('dotenv').config();

async function debug() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const Route = mongoose.model('Route', new mongoose.Schema({ 
            origin: mongoose.Schema.Types.ObjectId, 
            destination: mongoose.Schema.Types.ObjectId, 
            routeName: String 
        }));
        
        const routes = await Route.find();
        console.log('--- ROUTES ---');
        console.log(JSON.stringify(routes, null, 2));

        const Queue = mongoose.model('Queue', new mongoose.Schema({ 
            station: mongoose.Schema.Types.ObjectId, 
            destination: mongoose.Schema.Types.ObjectId, 
            status: String,
            route: mongoose.Schema.Types.ObjectId
        }));
        
        const queue = await Queue.find();
        console.log('--- QUEUE ---');
        console.log(JSON.stringify(queue, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
