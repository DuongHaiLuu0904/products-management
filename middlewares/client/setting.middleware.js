const SettingGeneral = require('../../models/setting-general.model')

module.exports.infoSetting = async (req, res, next) => {
    const setting = await SettingGeneral.findOne({})

    res.locals.setting = setting
    next()
}