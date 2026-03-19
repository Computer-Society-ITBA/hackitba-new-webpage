import express from "express";
import {
  register,
  registerEvent,
  login,
  getUsers,
  getUserById,
  updateUser,
  requestPasswordReset,
  confirmPasswordReset,
  approveParticipantAndAssignTeam,
  getPendingParticipants,
  getIncompleteUsers,
  verifyEmail,
  resendVerificationEmail,
  changeEmail,
  sendAdminEmail,
  deleteUserByAdmin,
  getIncompleteMailLog,
  sendIncompleteReminderAll,
  sendIncompleteReminderOne,
  resetEventSignup,
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

// GET /api/users/incomplete-mail-log
router.get("/incomplete-mail-log", validateToken, requireAdmin, getIncompleteMailLog);

// POST /api/users/send-incomplete-reminder-all
router.post("/send-incomplete-reminder-all", validateToken, requireAdmin, sendIncompleteReminderAll);

// POST /api/users/send-incomplete-reminder/:userId
router.post("/send-incomplete-reminder/:userId", validateToken, requireAdmin, sendIncompleteReminderOne);

// GET /api/users/:id
router.get("/:id", validateToken, getUserById);

// PATCH /api/users/:id
router.patch("/:id", validateToken, updateUser);

// POST /api/users/:id/reset-event-signup
router.post("/:id/reset-event-signup", validateToken, resetEventSignup);

// POST /api/users/register
router.post("/register", register);
router.post("/register-event", validateToken, registerEvent);
router.post("/login", login);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", confirmPasswordReset);

// POST /api/users/approve-and-assign-team
router.post("/approve-and-assign-team", validateToken, requireAdmin, approveParticipantAndAssignTeam);

// DELETE /api/users/:uid (Admin-only)
router.delete("/:uid", validateToken, requireAdmin, deleteUserByAdmin);

export default router;
