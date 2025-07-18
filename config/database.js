import { connect } from 'mongoose';

export async function mongooseConnect() {
    try {
        await connect(process.env.MONGGO_URL, {
            // Connection pooling settings
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds
            
            // Retry settings
            retryWrites: true,
            retryReads: true,
            
            // Heartbeat settings
            heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
            
            // Connection management
            connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
        });
        console.log('Connected to database');
        return true;
    } catch (error) {
        console.log('Error connecting to database');
        console.log(error);
        return false;
    }
}
