import { createSupabaseAdmin } from "../../lib/supabaseClient.js";

export default async function handler(req, res) {
  console.log("📥 - [Library] Request received");

  if (req.method !== "GET") {
    console.error("❌ - [Library] Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseAdmin = createSupabaseAdmin();

  const auth = req.headers.authorization;
  if (!auth) {
    console.error("❌ - [Library] Missing Authorization header");
    return res.status(401).json({ error: "Missing auth header" });
  }

  const token = auth.replace("Bearer ", "");
  const { data: userData } = await supabaseAdmin.auth.getUser(token);

  if (!userData?.user) {
    console.error("❌ - [Library] Invalid token or user not found");
    return res.status(401).json({ error: "Invalid token" });
  }

  const user = userData.user;
  console.log("✅ - [Library] User authenticated:", user.id);

  console.log("🔍 - [Library] Fetching reports from database...");
  const { data: reports, error } = await supabaseAdmin
    .from("report_requests")
    .select("id, status, created_at, pdf_path, dataset_id, datasets(filename)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ - [Library] Database error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  console.log(
    "✅ - [Library] Reports fetched successfully:",
    reports?.length || 0,
    "reports"
  );
  return res.status(200).json({ reports });
}
