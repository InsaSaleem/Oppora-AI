import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Load from .env.local
const env = fs.readFileSync(".env.local", "utf-8");
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.log("Supabase URL or Key missing in .env.local");
  process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function checkSaved() {
  const { data, error } = await supabase
    .from("saved_opportunities")
    .select("id, opportunity_id, saved_at, opportunities(*)");

  if (error) {
    console.error("Fetch Error:", error);
  } else {
    console.log("Fetch Success. Data count:", data?.length);
  }
}

checkSaved();
