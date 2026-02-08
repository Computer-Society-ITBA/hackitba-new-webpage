/*
import * as logger from "firebase-functions/logger";
import dotenv from 'dotenv';
import { Request, Response } from "express";
import {onRequest} from "firebase-functions/v2/https";
import { app } from "./index";

interface RequestData {
    message: string;
}

interface ResponseData {
    message: string;
    id: number;
}

dotenv.config();

app.post("/datos", (req:Request<RequestData>, res:Response<ResponseData|{ error: string }>) => {

}); 

exports.api = onRequest(app);
*/