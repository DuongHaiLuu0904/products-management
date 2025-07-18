import { Router } from "express";
const router = Router();

import * as controller from "../../controllers/clients/comment.controller.js";
import { requireAuth } from "../../middlewares/client/auth.middleware.js";
import * as commentValidate from "../../validates/client/comment.validate.js";

// Áp dụng security headers cho tất cả routes
router.use(commentValidate.securityHeaders);

router.post("/create", requireAuth, commentValidate.validateCreate, controller.createPost);

router.patch("/edit/:id", requireAuth, commentValidate.validateEdit, controller.editPatch);

router.delete("/delete/:id", requireAuth, commentValidate.validateDelete, controller.deleteItem);

export default router;
