import Setting from '../../models/setting-general.model.js';
import cloudinaryHelper from "../../helpers/uploadToCloudinary.js";

// [GET] /admin/setting/general
export async function general(req, res) {
    const setting = await Setting.findOne({})

    res.render('admin/pages/setting/index', {
        title: 'Trang cài đặt',
        setting: setting,
    });
}

// [PATCH] /admin/setting/general
export async function generalPatch(req, res) {
    try {
        const setting = await Setting.findOne({})

        if (setting) {
            // If a new logo is being uploaded and there's an existing public_id, delete the old image
            if (req.body.public_id && setting.public_id) {
                await cloudinaryHelper.deleteFromCloudinary(setting.public_id);
            }
            
            await Setting.updateOne({ _id: setting.id }, req.body)
        } else {
            const record = new Setting(req.body)
            await record.save()
        }
        
        req.flash('success', 'Cập nhật thành công')
    } catch (error) {
        console.log(error);
        req.flash('error', 'Cập nhật thất bại!');
    }
    
    res.redirect(req.headers.referer)
}