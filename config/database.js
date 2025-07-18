import { connect } from 'mongoose';

export async function mongooseConnect() {
    try {
        await connect(process.env.MONGGO_URL);
        console.log('Connected to database');
    } catch (error) {
        console.log('Error connecting to database');
        console.log(error);
    }
}
