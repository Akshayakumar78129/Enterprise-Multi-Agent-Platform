import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import churnRoutes from "./domains/churn-prediction/churnPrediction.routes";

const app = express();

app.use(cors());
app.use(bodyParser.json());



app.use("/api/churn", churnRoutes);

export default app;
