// src/domains/churn-prediction/churn.routes.ts

import { Router } from "express";
import { ChurnController } from "./churnPrediction.controller";

const router = Router();

router.post("/summary", ChurnController.dashboardSummary);
router.post("/feature-importance", ChurnController.featureImportance);
router.post("/segment-comparison", ChurnController.segmentComparison);
router.post("/risk-trends", ChurnController.riskTrends);
router.post("/customers", ChurnController.customers);
router.post("/export", ChurnController.exportData);

export default router;
