import { Router } from 'express'
const router = Router()

import { index, create, createPost, edit, editPatch, detail, deleteItem, permissions, permissionsPatch } from '../../controllers/admin/role.controller.js'

router.get('/', index)

router.get('/create', create)

router.post('/create', createPost)

router.get('/edit/:id', edit)

router.patch('/edit/:id', editPatch)

router.get('/detail/:id', detail)

router.delete("/delete/:id", deleteItem)

router.get('/permissions', permissions)

router.patch('/permissions', permissionsPatch)

export default router