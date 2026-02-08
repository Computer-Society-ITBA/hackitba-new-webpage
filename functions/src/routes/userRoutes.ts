import express from "express";
import { register } from "../controllers/userControllers";

const router = express.Router();

// POST /api/users/register
router.post("/register", register);

export default router;