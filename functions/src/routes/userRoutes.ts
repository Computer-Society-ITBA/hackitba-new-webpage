import express from "express";
import {
  register,
  registerEvent,
  login,
  getUsers,
  getUserById,
  updateUser,
  requestPasswordReset,
  approveParticipantAndAssignTeam,
  getPendingParticipants,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/userControllers";
import {validateToken, requireAdmin} from "../middleware/authMiddleware";

// eslint-disable-next-line new-cap
const router = express.Router();

// GET /api/users
router.get("/", validateToken, getUsers);

// GET /api/users/verify-email (BEFORE dynamic routes)
router.get("/verify-email", verifyEmail);

// Admin-only routes (BEFORE dynamic routes)
// GET /api/users/pending-participants
router.get("/pending-participants", validateToken, requireAdmin, getPendingParticipants);

// GET /api/users/:id
router.get("/:id", validateToken, getUserById);

// PATCH /api/users/:id
router.patch("/:id", validateToken, updateUser);

// POST /api/users/register
router.post("/register", register);
router.post("/resend-verification-email", resendVerificationEmail);
router.post("/register-event", validateToken, registerEvent);
router.post("/login", login);
router.post("/request-password-reset", requestPasswordReset);

// POST /api/users/approve-and-assign-team
router.post("/approve-and-assign-team", validateToken, requireAdmin, approveParticipantAndAssignTeam);

export default router;
