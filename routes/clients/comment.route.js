import { Router } from "express";
const router = Router();

import { createPost, editPatch, deleteItem } from "../../controllers/clients/comment.controller.js";
import { reuireAuth } from "../../middlewares/client/auth.middleware.js";

router.post("/create", reuireAuth, createPost);

router.patch("/edit/:id", reuireAuth, editPatch);

router.delete("/delete/:id", reuireAuth, deleteItem);

export default router;
