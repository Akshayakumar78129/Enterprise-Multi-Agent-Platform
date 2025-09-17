import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import churnRoutes from "./domains/churn-prediction/churnPrediction.routes";

const app = express();

app.use(cors());
app.use(bodyParser.json());



// Back-compat and new dashboard route namespace
app.use("/api/churn", churnRoutes);
app.use("/api/churn-prediction", churnRoutes);

export default app;
