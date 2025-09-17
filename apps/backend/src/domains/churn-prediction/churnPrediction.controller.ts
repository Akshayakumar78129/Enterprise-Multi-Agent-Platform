
import { Request, Response } from "express";
import { ChurnProcessingService } from "./churnPredictionProcessing.service";

export class ChurnController {
  static async dashboardSummary(req: Request, res: Response) {
    try {
      const filters = req.body || {};
      console.log('[ChurnController] Dashboard Summary Request');
      console.log('[ChurnController] Received filters:', JSON.stringify(filters, null, 2));

      const result = await ChurnProcessingService.getDashboardSummary(filters);

      console.log('[ChurnController] Processing complete. Result summary:', {
        customerStats: result.customerStats?.length || 0,
        segmentRisk: result.segmentRisk?.length || 0,
        monthlyRisk: result.monthlyRisk?.length || 0,
        probabilityDistribution: result.probabilityDistribution?.length || 0,
        featureImportance: result.featureImportance?.length || 0
      });

      res.json(result);
    } catch (err) {
      console.error('[ChurnController] Error in dashboardSummary:', err);
      // Return empty data structure (no mock data)
      const emptyResult = {
        customerStats: [],
        segmentRisk: [],
        monthlyRisk: [],
        probabilityDistribution: [],
        featureImportance: []
      };
      res.json(emptyResult);
    }
  }

  static async featureImportance(req: Request, res: Response) {
    try {
      const filters = req.body || {};
      const result = await ChurnProcessingService.getFeatureImportance(filters);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch feature importance" });
    }
  }

  static async segmentComparison(req: Request, res: Response) {
    try {
      const filters = req.body || {};
      const result = await ChurnProcessingService.getSegmentComparison(filters);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch segment comparison" });
    }
  }

  static async riskTrends(req: Request, res: Response) {
    try {
      const filters = req.body || {};
      const result = await ChurnProcessingService.getRiskTrends(filters);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch risk trends" });
    }
  }

  static async customers(req: Request, res: Response) {
    try {
      const filters = req.body || {};
      const result = await ChurnProcessingService.getCustomers(filters);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  }

  static async exportData(req: Request, res: Response) {
    try {
      const filters = req.body || {};
      const format = req.query.format as string || 'csv';
      const result = await ChurnProcessingService.exportData(filters, format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="churn-data-${Date.now()}.csv"`);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="churn-data-${Date.now()}.json"`);
      }
      
      res.send(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to export data" });
    }
  }
}
