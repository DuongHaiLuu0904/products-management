import { Router } from 'express'
const router = Router()

import multer from 'multer'
const upload = multer()

import { index, create, createPost, edit, editPatch, changeStatus, deleteItem, detail } from '../../controllers/admin/user.controller.js'
import { createPost as _createPost, createPatch } from '../../validates/admin/account.validate.js'
import { upload as _upload } from '../../middlewares/admin/uploadCloud.middleware.js'


router.get('/', index)

router.get('/create', create)

router.post('/create', upload.single('avatar'), _upload,_createPost, createPost)

router.get('/edit/:id', edit)

router.patch('/edit/:id', upload.single('avatar'), _upload, createPatch, editPatch)

router.patch('/change-status/:status/:id', changeStatus)

router.delete("/delete/:id", deleteItem)

router.get('/detail/:id', detail)

export default router