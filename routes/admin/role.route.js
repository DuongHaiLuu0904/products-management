import { Router } from 'express'
const router = Router()

import * as controller from '../../controllers/admin/role.controller.js'
import * as roleValidate from '../../validates/admin/role.validate.js'

router.get('/', controller.index)

router.get('/create', controller.create)

router.post('/create', roleValidate.validateCreatePost, controller.createPost)

router.get('/edit/:id', roleValidate.validateEditGet, controller.edit)

router.patch('/edit/:id', roleValidate.validateEditPatch, controller.editPatch)

router.get('/detail/:id', roleValidate.validateDetailGet, controller.detail)

router.delete("/delete/:id", roleValidate.validateDelete, controller.deleteItem)

router.get('/permissions', controller.permissions)

router.patch('/permissions', roleValidate.validatePermissionsPatch, controller.permissionsPatch)

export default router