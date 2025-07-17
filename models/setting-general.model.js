import { Schema, model } from 'mongoose';

const settingGeneralSchema = new Schema({
    webSiteName: String,
    logo: String,
    public_id: String,
    phone: String,
    email: String,
    address: String,
    copyRight: String,
}, {
    timestamps: true
});

const settingGeneral = model('settingGeneral', settingGeneralSchema, 'setting-general');
export default settingGeneral;