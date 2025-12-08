import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import uploadCreateHandler from "./api/upload/create.js";
import uploadStatusHandler from "./api/upload/status.js";
import datasetPreviewHandler from "./api/dataset/preview.js";
import datasetSaveMappingHandler from "./api/dataset/save_mapping.js";
import reportCreateHandler from "./api/report/index.js";
import reportStatusHandler from "./api/report/status.js";
import reportViewHandler from "./api/report/view.js";
import reportSendEmailHandler from "./api/report/send_email.js";
import reportDeleteHandler from "./api/report/delete.js";
import libraryHandler from "./api/library/index.js";
import dashboardHandler from "./api/dashboard/index.js";
import bussinessInfoHandler from "./api/bussiness_info/index.js";
import bussinessInfoStatusHandler from "./api/bussiness_info/status.js";
import aiReportHandler from "./api/report/ai_report.js";
import betaLeadHandler from "./api/beta/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "RelatorIA API is running",
    version: "1.0.0",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "api", env: process.env.NODE_ENV || "dev" });
});

app.post("/api/upload/create", (req, res) =>
  uploadCreateHandler(req, res).catch((error) => {
    console.error("Error in /api/upload/create:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.get("/api/upload/status", (req, res) =>
  uploadStatusHandler(req, res).catch((error) => {
    console.error("Error in /api/upload/status:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.get("/api/dataset/preview", (req, res) =>
  datasetPreviewHandler(req, res).catch((error) => {
    console.error("Error in /api/dataset/preview:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.post("/api/dataset/save_mapping", (req, res) =>
  datasetSaveMappingHandler(req, res).catch((error) => {
    console.error("Error in /api/dataset/save_mapping:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.get("/api/report/status", (req, res) =>
  reportStatusHandler(req, res).catch((error) => {
    console.error("Error in /api/report/status:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.post("/api/report", (req, res) =>
  reportCreateHandler(req, res).catch((error) => {
    console.error("Error in /api/report", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.get("/api/report/view", (req, res) =>
  reportViewHandler(req, res).catch((error) => {
    console.error("Error in /api/report/view:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.post("/api/report/send_email", (req, res) =>
  reportSendEmailHandler(req, res).catch((error) => {
    console.error("Error in /api/report/send_email:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.delete("/api/report/delete", (req, res) =>
  reportDeleteHandler(req, res).catch((error) => {
    console.error("Error in /api/report/delete:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.get("/api/library", (req, res) =>
  libraryHandler(req, res).catch((error) => {
    console.error("Error in /api/library:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.get("/api/dashboard", (req, res) =>
  dashboardHandler(req, res).catch((error) => {
    console.error("Error in /api/dashboard:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.post("/api/bussiness_info", (req, res) =>
  bussinessInfoHandler(req, res).catch((error) => {
    console.error("Error in /api/bussiness_info:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.get("/api/bussiness_info/status", (req, res) =>
  bussinessInfoStatusHandler(req, res).catch((error) => {
    console.error("Error in /api/bussiness_info/status:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.get("/api/report/ai_report", (req, res) =>
  aiReportHandler(req, res).catch((error) => {
    console.error("Error in /api/report/ai_report:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.post("/api/beta", (req, res) =>
  betaLeadHandler(req, res).catch((error) => {
    console.error("Error in /api/beta:", error);
    res.status(500).json({ error: "Internal server error" });
  })
);

app.listen(PORT, () => {
  console.log(`🚀 [API] Server running on http://localhost:${PORT}`);
  console.log(`📝 [API] Environment: ${process.env.NODE_ENV || "development"}`);
});

