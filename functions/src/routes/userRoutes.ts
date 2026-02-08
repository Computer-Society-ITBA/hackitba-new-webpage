import express from "express";
import { register, registerEvent, login, getUsers, getUserById } from "../controllers/userControllers";
import { validateToken } from "../middleware/authMiddleware";

const router = express.Router();

// GET /api/users
router.get("/", validateToken, getUsers);

// GET /api/users/:id
router.get("/:id", validateToken, getUserById);

// POST /api/users/register
router.post("/register", register);
router.post("/register-event", validateToken, registerEvent);
router.post("/login", login);

export default router;