import { getSupabaseServiceClient } from "../packages/shared/supabaseClient.js";

export function createSupabaseAdmin() {
  return getSupabaseServiceClient(process.env);
}
