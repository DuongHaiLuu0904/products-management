import { Router } from "express";
const router = Router();

import { index, changeStatus, changeMulti, deleteItem, detail } from "../../controllers/admin/comment.controller.js";

router.get("/", index);

router.patch("/change-status/:status/:id", changeStatus);

router.patch("/change-multi", changeMulti);

router.delete("/delete/:id", deleteItem);

router.get("/detail/:id", detail);

export default router;
