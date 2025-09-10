
import { Request, Response } from "express";
import { ChurnProcessingService } from "./churnPredictionProcessing.service";

export class ChurnController {
  static async dashboardSummary(req: Request, res: Response) {
    try {
      const filters = req.body || {};
      const result = await ChurnProcessingService.getDashboardSummary(filters);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch churn dashboard summary" });
    }
  }
}
