const Setting = require('../../models/setting-general.model');

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
    const setting = await Setting.findOne({})

    if (setting) {
        await Setting.updateOne({ _id: setting.id }, req.body)
    } else {
        const record = new Setting(req.body)
        await record.save()
    }
    
    req.flash('success', 'Cập nhật thành công')
    res.redirect(req.headers.referer)
}