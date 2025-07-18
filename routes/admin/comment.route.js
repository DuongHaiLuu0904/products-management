import { Router } from "express";
const router = Router();

import * as controller from "../../controllers/admin/comment.controller.js";
import * as validate from "../../validates/admin/comment.validate.js";

router.get("/", validate.index, controller.index);

router.patch("/change-status/:status/:id", validate.changeStatus, controller.changeStatus);

router.patch("/change-multi", validate.changeMulti, controller.changeMulti);

router.delete("/delete/:id", validate.deleteItem, controller.deleteItem);

router.get("/detail/:id", validate.detail, controller.detail);

export default router;
