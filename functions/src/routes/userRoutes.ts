import express from "express";
import { register, registerEvent } from "../controllers/userControllers";
import { validateToken } from "../middleware/authMiddleware";

const router = express.Router();

// POST /api/users/register
router.post("/register", register);
router.post("/register-event", validateToken, registerEvent);

export default router;