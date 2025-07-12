const express = require("express");
const router = express.Router();

const controller = require("../../controllers/clients/comment.controller");
const authMiddleware = require("../../middlewares/client/auth.middleware");

router.post("/create", authMiddleware.reuireAuth, controller.createPost);

router.patch("/edit/:id", authMiddleware.reuireAuth, controller.editPatch);

router.delete("/delete/:id", authMiddleware.reuireAuth, controller.deleteItem);

module.exports = router;
