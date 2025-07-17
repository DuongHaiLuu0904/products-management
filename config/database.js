import { connect as mongooseConnect } from 'mongoose';

export async function connect() {
    try {
        await mongooseConnect(process.env.MONGGO_URL);
        console.log('Connected to database');
    } catch (error) {
        console.log('Error connecting to database');
        console.log(error);
    }
}
