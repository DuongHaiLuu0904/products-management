const Setting = require('../../models/setting-general.model');
const { deleteFromCloudinary } = require("../../helpers/uploadToCloudinary");

// [GET] /admin/setting/general
module.exports.general = async (req, res) => {
    const setting = await Setting.findOne({})

    res.render('admin/pages/setting/index', {
        title: 'Trang cài đặt',
        setting: setting,
    });
}

// [PATCH] /admin/setting/general
module.exports.generalPatch = async (req, res) => {
    try {
        const setting = await Setting.findOne({})

        if (setting) {
            // If a new logo is being uploaded and there's an existing public_id, delete the old image
            if (req.body.public_id && setting.public_id) {
                await deleteFromCloudinary(setting.public_id);
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