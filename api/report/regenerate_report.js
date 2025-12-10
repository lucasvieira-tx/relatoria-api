import { createSupabaseAdmin } from "../../lib/supabaseClient.js";

/**
 * POST /api/report/regenerate_report
 * Body: { id: string }
 * Header: Authorization: Bearer <jwt>
 *
 * Response:
 * { success: true, message: "Report regeneration initiated" }
 */

export default async function handler(req, res) {
  console.log("📥 - [Report Regenerate] Request received");

  if (req.method !== "POST") {
    console.error("❌ - [Report Regenerate] Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseAdmin = createSupabaseAdmin();

  // AUTH
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.error("❌ - [Report Regenerate] Missing Authorization header");
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    console.error("❌ - [Report Regenerate] Missing token");
    return res.status(401).json({ error: "Missing token" });
  }

  // get user from token (validate)
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(
    token
  );
  if (userErr || !userData?.user) {
    console.error(
      "❌ - [Report Regenerate] Invalid token or user not found",
      userErr?.message
    );
    return res.status(401).json({ error: "Invalid token" });
  }
  const user = userData.user;
  console.log("✅ - [Report Regenerate] User authenticated:", user.id);

  // parse body
  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    console.error("❌ - [Report Regenerate] Invalid JSON body", e.message);
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { id } = body || {};
  console.log("📦 - [Report Regenerate] Payload received:", { id });

  if (!id) {
    console.error("❌ - [Report Regenerate] Missing id");
    return res.status(400).json({ error: "id is required" });
  }

  try {
    // Fetch current report request
    console.log("🔍 - [Report Regenerate] Fetching current report request...");
    const { data: currentReport, error: fetchErr } = await supabaseAdmin
      .from("report_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr) {
      console.error(
        "❌ - [Report Regenerate] Database error fetching report:",
        fetchErr.message
      );
      return res.status(500).json({ error: fetchErr.message });
    }

    if (!currentReport) {
      console.warn("⚠️ - [Report Regenerate] Report not found:", id);
      return res.status(404).json({ error: "Report not found" });
    }

    // Verify ownership
    if (currentReport.owner_id !== user.id) {
      console.warn(
        "⚠️ - [Report Regenerate] User unauthorized to regenerate report:",
        { userId: user.id, ownerId: currentReport.owner_id }
      );
      return res.status(403).json({ error: "Forbidden: not the report owner" });
    }

    console.log("✅ - [Report Regenerate] Report found and ownership verified");

    // Save to history table
    console.log("💾 - [Report Regenerate] Saving current report to history...");
    const historyPayload = {
      ...currentReport,
      regenerated_at: new Date().toISOString(),
      original_id: currentReport.id,
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
        "❌ - [Report Regenerate] Database error saving to history:",
        historyErr.message
      );
      return res.status(500).json({ error: historyErr.message });
    }

    console.log(
      "✅ - [Report Regenerate] Report saved to history successfully:",
      historyRecord.id
    );

    // Update status to pending
    console.log(
      "🔄 - [Report Regenerate] Updating report status to pending..."
    );
    const { data: updatedReport, error: updateErr } = await supabaseAdmin
      .from("report_requests")
      .update({
        status: "pending",
        updated_at: new Date().toISOString(),
        ai_response: null, // Clear previous response
        html_report_path: null, // Clear previous paths
        pdf_path: null,
        sent_via_email: false, // Reset email flag
        error_message: null, // Clear any previous errors
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      console.error(
        "❌ - [Report Regenerate] Database error updating status:",
        updateErr.message
      );
      return res.status(500).json({ error: updateErr.message });
    }

    console.log(
      "✅ - [Report Regenerate] Report status updated to pending:",
      updatedReport.id
    );

    return res.status(200).json({
      success: true,
      message: "Report regeneration initiated",
      request_id: id,
      history_id: historyRecord.id,
    });
  } catch (err) {
    console.error("❌ - [Report Regenerate] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
