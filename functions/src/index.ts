import { setGlobalOptions } from "firebase-functions";
import * as logger from "firebase-functions/logger";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { onRequest } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import userRoutes from "./routes/userRoutes";
import teamRoutes from "./routes/teamRoutes";

dotenv.config();

// Initialize Firebase Admin
admin.initializeApp();

// Initialize app
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/users", userRoutes);
app.use("/teams", teamRoutes);

// Health check endpoint
interface HealthResponse {
  message: string;
}

app.get("/health", (req: Request, res: Response<HealthResponse>) => {
  logger.info("Request received at /health endpoint");
  res.status(200).send({ message: "OK" });
});

// Export the Express app as a Cloud Function
export const api = onRequest(app);

// Cost control
setGlobalOptions({ maxInstances: 10 });
