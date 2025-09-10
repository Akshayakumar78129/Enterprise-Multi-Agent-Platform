// src/domains/churn-prediction/churn.routes.ts

import { Router } from "express";
import { ChurnController } from "./churnPrediction.controller";

const router = Router();

router.post("/summary", ChurnController.dashboardSummary);

export default router;
