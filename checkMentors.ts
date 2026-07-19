import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env = fs.readFileSync(".env.local", "utf-8");
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
if (!urlMatch || !keyMatch) process.exit(1);

const url = urlMatch[1].trim() + "/rest/v1/?apikey=" + keyMatch[1].trim();

fetch(url)
  .then((res) => res.json())
  .then((data) => {
    fs.writeFileSync("schema.json", JSON.stringify(data, null, 2));
    console.log("Schema saved to schema.json");
  })
  .catch((err) => console.error(err));
