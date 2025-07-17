import SettingGeneral from '../../models/setting-general.model.js'

export async function infoSetting(req, res, next) {
    const setting = await SettingGeneral.findOne({})

    res.locals.setting = setting
    next()
}