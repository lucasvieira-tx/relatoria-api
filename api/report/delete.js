import { createSupabaseAdmin } from "../../lib/supabaseClient.js";

export default async function handler(req, res) {
  console.log("📥 - [Report Delete] Request received");

  if (req.method !== "DELETE") {
    console.error("❌ - [Report Delete] Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseAdmin = createSupabaseAdmin();

  // Auth
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.error("❌ - [Report Delete] Missing Authorization header");
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(
    token
  );
  if (userErr || !userData?.user) {
    console.error(
      "❌ - [Report Delete] Invalid token or user not found",
      userErr?.message
    );
    return res.status(401).json({ error: "Invalid token" });
  }
  const user = userData.user;

  // Params
  const reportId = req.query.id || req.query.report_id || req.body?.id;
  if (!reportId) {
    console.error("❌ - [Report Delete] Missing report id");
    return res.status(400).json({ error: "report id is required" });
  }

  try {
    // Fetch report to validate ownership and get storage path and dataset_id
    const { data: rows, error: fetchErr } = await supabaseAdmin
      .from("report_requests")
      .select("id, owner_id, pdf_path, dataset_id, *")
      .eq("id", reportId)
      .limit(1);

    if (fetchErr) {
      console.error("❌ - [Report Delete] Fetch error:", fetchErr.message);
      return res.status(500).json({ error: "Failed to fetch report" });
    }

    const report = rows?.[0];
    if (!report) {
      console.warn("⚠️ - [Report Delete] Report not found:", reportId);
      return res.status(404).json({ error: "Report not found" });
    }

    if (report.owner_id !== user.id) {
      console.warn("⚠️ - [Report Delete] Forbidden", {
        userId: user.id,
        ownerId: report.owner_id,
      });
      return res.status(403).json({ error: "Forbidden" });
    }

    // Save to history table before deletion
    console.log(
      "💾 - [Report Delete] Saving report to history before deletion..."
    );
    const historyPayload = {
      ...report,
      deleted_at: new Date().toISOString(),
      original_id: report.id,
      deletion_reason: "user_requested",
    };

    // Remove id to let Supabase generate a new one for history
    delete historyPayload.id;

    const { data: historyRecord, error: historyErr } = await supabaseAdmin
      .from("report_requests_history")
      .insert(historyPayload)
      .select()
      .single();

    if (historyErr) {
      console.error(
        "❌ - [Report Delete] Database error saving to history:",
        historyErr.message
      );
      return res
        .status(500)
        .json({ error: "Failed to save report to history" });
    }

    console.log(
      "✅ - [Report Delete] Report saved to history successfully:",
      historyRecord.id
    );

    // Best effort remove PDF from storage
    if (report.pdf_path) {
      try {
        const pathParts = report.pdf_path.split("/");
        let bucketName = "reports";
        let filePath = report.pdf_path;

        if (
          pathParts.length > 1 &&
          (pathParts[0].includes("report") || pathParts[0].includes("pdf"))
        ) {
          bucketName = pathParts[0];
          filePath = pathParts.slice(1).join("/");
        }

        const { error: storageErr } = await supabaseAdmin.storage
          .from(bucketName)
          .remove([filePath]);

        if (storageErr) {
          console.error(
            "⚠️ - [Report Delete] Failed to remove PDF from storage:",
            storageErr.message
          );
        } else {
          console.log("✅ - [Report Delete] PDF removed from storage");
        }
      } catch (storageEx) {
        console.error(
          "⚠️ - [Report Delete] Exception while removing PDF:",
          storageEx.message
        );
      }
    }

    // Delete database row from report_requests
    const { error: deleteErr } = await supabaseAdmin
      .from("report_requests")
      .delete()
      .eq("id", reportId);

    if (deleteErr) {
      console.error("❌ - [Report Delete] Delete error:", deleteErr.message);
      return res.status(500).json({ error: "Failed to delete report" });
    }

    console.log(
      "✅ - [Report Delete] Report deleted from report_requests:",
      reportId
    );

    // Delete associated dataset if it exists
    if (report.dataset_id) {
      console.log(
        "🗑️ - [Report Delete] Deleting associated dataset:",
        report.dataset_id
      );

      // First, get dataset info to remove files from storage if needed
      const { data: datasetInfo, error: datasetFetchErr } = await supabaseAdmin
        .from("datasets")
        .select("filename")
        .eq("id", report.dataset_id)
        .single();

      if (!datasetFetchErr && datasetInfo?.filename) {
        try {
          // Remove dataset file from storage
          const { error: datasetStorageErr } = await supabaseAdmin.storage
            .from("datasets")
            .remove([datasetInfo.filename]);

          if (datasetStorageErr) {
            console.error(
              "⚠️ - [Report Delete] Failed to remove dataset file from storage:",
              datasetStorageErr.message
            );
          } else {
            console.log(
              "✅ - [Report Delete] Dataset file removed from storage"
            );
          }
        } catch (storageEx) {
          console.error(
            "⚠️ - [Report Delete] Exception while removing dataset file:",
            storageEx.message
          );
        }
      }

      // Delete dataset from database
      const { error: datasetDeleteErr } = await supabaseAdmin
        .from("datasets")
        .delete()
        .eq("id", report.dataset_id);

      if (datasetDeleteErr) {
        console.error(
          "❌ - [Report Delete] Failed to delete associated dataset:",
          datasetDeleteErr.message
        );
        // Note: We don't return error here as the main report was deleted successfully
        // But we log the error for monitoring
      } else {
        console.log(
          "✅ - [Report Delete] Associated dataset deleted:",
          report.dataset_id
        );
      }
    }

    console.log(
      "✅ - [Report Delete] Report and associated data deleted successfully"
    );
    return res.status(200).json({
      success: true,
      deleted_id: reportId,
      deleted_dataset_id: report.dataset_id || null,
      history_id: historyRecord.id,
    });
  } catch (err) {
    console.error("❌ - [Report Delete] Unexpected error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
