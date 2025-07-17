import { Router } from 'express'
const router = Router()

import multer from 'multer'
const upload = multer()

import { createPost } from '../../validates/admin/product-category.validate.js'
import { upload as _upload } from '../../middlewares/admin/uploadCloud.middleware.js'
import { index, changeStatus, changeMulti, deleteItem, create, createPost as _createPost, edit, editPATCH, detail } from '../../controllers/admin/product-category.controller.js'


router.get('/', index)

router.patch("/change-status/:status/:id", changeStatus)

router.patch("/change-multi", changeMulti)

router.delete("/delete/:id", deleteItem)

router.get('/create', create)

router.post('/create', upload.single('thumbnail'), _upload, createPost, _createPost)

router.get('/edit/:id', edit)

router.patch('/edit/:id', upload.single('thumbnail'), _upload, createPost, editPATCH)

router.get('/detail/:id', detail)

export default router