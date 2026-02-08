import express from "express";
import { register, registerEvent } from "../controllers/userControllers";
import { validateToken } from "../middleware/authMiddleware";
import { login } from "../controllers/userControllers";

const router = express.Router();

// POST /api/users/register
router.post("/register", register);
router.post("/register-event", validateToken, registerEvent);
router.post("/login", login);

export default router;