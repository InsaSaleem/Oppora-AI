import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function check() {
  const { data, error } = await supabase.from("mentor_students").select("*").limit(1);
  if (error) console.error("Error mentor_students:", error.message);
  else console.log("mentor_students exists, rows:", data.length);
  
  const { data: mData, error: mErr } = await supabase.from("mentorships").select("*").limit(1);
  if (mErr) console.error("Error mentorships:", mErr.message);
  else console.log("mentorships exists, rows:", mData.length);
}
check();
