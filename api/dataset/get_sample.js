import { createSupabaseAdmin } from "../../lib/supabaseClient.js";

export default async function handler(req, res) {
  console.log("📥 - [Dataset Get Sample] Request received");

  if (req.method !== "GET") {
    console.error("❌ - [Dataset Get Sample] Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseAdmin = createSupabaseAdmin();

  // Auth
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.error("❌ - [Dataset Get Sample] Missing Authorization header");
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(
    token
  );
  if (userErr || !userData?.user) {
    console.error(
      "❌ - [Dataset Get Sample] Invalid token or user not found",
      userErr?.message
    );
    return res.status(401).json({ error: "Invalid token" });
  }
  const user = userData.user;

  // Get report_request_id from query params
  const reportRequestId =
    req.query.report_request_id || req.query.reportRequestId || req.query.id;
  if (!reportRequestId) {
    console.error("❌ - [Dataset Get Sample] Missing report_request_id");
    return res.status(400).json({ error: "report_request_id is required" });
  }

  try {
    // First, fetch the report request to get owner_id and dataset_id
    const { data: reportRequest, error: requestErr } = await supabaseAdmin
      .from("report_requests")
      .select("owner_id, dataset_id")
      .eq("id", reportRequestId)
      .limit(1);

    if (requestErr) {
      console.error(
        "❌ - [Dataset Get Sample] Report request fetch error:",
        requestErr.message
      );
      return res.status(500).json({ error: "Failed to fetch report request" });
    }

    if (!reportRequest || reportRequest.length === 0) {
      console.error("❌ - [Dataset Get Sample] Report request not found", {
        reportRequestId,
      });
      return res.status(404).json({ error: "Report request not found" });
    }

    const requestData = reportRequest[0];
    console.log("✅ - [Dataset Get Sample] Report request found", {
      reportRequestId,
      requestData,
    });

    // Verify ownership of the report request
    if (requestData.owner_id !== user.id) {
      console.warn(
        "⚠️ - [Dataset Get Sample] Access denied - not report request owner",
        {
          reportRequestId,
          ownerId: requestData.owner_id,
          userId: user.id,
        }
      );
      return res
        .status(403)
        .json({ error: "Forbidden: not report request owner" });
    }

    // Now fetch the dataset sample using the dataset_id from report request
    const { data: datasets, error: fetchErr } = await supabaseAdmin
      .from("datasets")
      .select("sample_json")
      .eq("id", requestData.dataset_id)
      .limit(1);

    if (fetchErr) {
      console.error(
        "❌ - [Dataset Get Sample] Dataset fetch error:",
        fetchErr.message
      );
      return res.status(500).json({ error: "Failed to fetch dataset" });
    }

    if (!datasets || datasets.length === 0) {
      console.error("❌ - [Dataset Get Sample] Dataset not found", {
        datasetId: requestData.dataset_id,
      });
      return res.status(404).json({ error: "Dataset not found" });
    }

    const dataset = datasets[0];

    console.log("✅ - [Dataset Get Sample] Sample retrieved successfully", {
      reportRequestId,
      datasetId: requestData.dataset_id,
      dataset,
    });
    return res.status(200).json({
      sample_json: dataset,
    });
  } catch (err) {
    console.error("❌ - [Dataset Get Sample] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
