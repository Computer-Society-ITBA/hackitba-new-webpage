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
  getIncompleteUsers,
  verifyEmail,
  resendVerificationEmail,
  changeEmail,
  sendAdminEmail,
  deleteUserByAdmin,
} from "../controllers/userControllers";
import {validateToken, requireAdmin} from "../middleware/authMiddleware";

// eslint-disable-next-line new-cap
const router = express.Router();

// GET /api/users
router.get("/", validateToken, getUsers);

// GET /api/users/verify-email (BEFORE dynamic routes)
router.get("/verify-email", verifyEmail);

// POST /api/users/resend-verification-email (BEFORE dynamic routes)
router.post("/resend-verification-email", resendVerificationEmail);

// POST /api/users/change-email (BEFORE dynamic routes)
router.post("/change-email", changeEmail);

// POST /api/users/send-email (Admin-only)
router.post("/send-email", validateToken, requireAdmin, sendAdminEmail);

// Admin-only routes (BEFORE dynamic routes)
// GET /api/users/pending-participants
router.get("/pending-participants", validateToken, requireAdmin, getPendingParticipants);

// GET /api/users/incomplete
router.get("/incomplete", validateToken, requireAdmin, getIncompleteUsers);

// GET /api/users/:id
router.get("/:id", validateToken, getUserById);

// PATCH /api/users/:id
router.patch("/:id", validateToken, updateUser);

// POST /api/users/register
router.post("/register", register);
router.post("/register-event", validateToken, registerEvent);
router.post("/login", login);
router.post("/request-password-reset", requestPasswordReset);

// POST /api/users/approve-and-assign-team
router.post("/approve-and-assign-team", validateToken, requireAdmin, approveParticipantAndAssignTeam);

// DELETE /api/users/:uid (Admin-only)
router.delete("/:uid", validateToken, requireAdmin, deleteUserByAdmin);

export default router;
