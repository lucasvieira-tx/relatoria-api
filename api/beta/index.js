import { createSupabaseAdmin } from "../../lib/supabaseClient.js";

export default async function handler(req, res) {
  console.log("📥 - [Beta Lead] Request received");

  if (req.method !== "POST") {
    console.error("❌ - [Beta Lead] Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email } = req.body || {};

  if (!name || !email) {
    console.error("❌ - [Beta Lead] Missing name or email", { name, email });
    return res.status(400).json({ error: "name and email are required" });
  }

  // validação simples de email para evitar dados inválidos na tabela
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    console.error("❌ - [Beta Lead] Invalid email format", { email });
    return res.status(400).json({ error: "invalid email format" });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from("leads")
      .insert({ name: String(name).trim(), email: String(email).trim() });

    if (error) {
      console.error("❌ - [Beta Lead] Insert error:", error.message);
      return res.status(500).json({ error: "Failed to store lead" });
    }

    console.log("✅ - [Beta Lead] Lead stored successfully", { email });
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error("❌ - [Beta Lead] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
