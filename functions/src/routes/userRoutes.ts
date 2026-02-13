import express from "express";
import {
  register,
  registerEvent,
  login,
  getUsers,
  getUserById,
  updateUser,
  requestPasswordReset,
} from "../controllers/userControllers";
import {validateToken} from "../middleware/authMiddleware";

// eslint-disable-next-line new-cap
const router = express.Router();

// GET /api/users
router.get("/", validateToken, getUsers);

// GET /api/users/:id
router.get("/:id", validateToken, getUserById);

// PATCH /api/users/:id
router.patch("/:id", validateToken, updateUser);

// POST /api/users/register
router.post("/register", register);
router.post("/register-event", validateToken, registerEvent);
router.post("/login", login);
router.post("/request-password-reset", requestPasswordReset);

export default router;
