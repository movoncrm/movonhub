import { promises as fs } from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { newId } from "@/lib/id";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface UploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

function shouldUseSupabase(): boolean {
  return (
    (process.env.DATA_ADAPTER || "local").toLowerCase() === "supabase" &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export async function saveAdvisorPhoto(file: File, slug: string): Promise<UploadResult> {
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, error: "Please choose a photo." };
  }
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, error: "Photo must be a JPG, PNG or WebP image." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Photo must be smaller than 5MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = EXT[file.type] || "jpg";
  const filename = `${slug}-${newId().slice(0, 8)}.${ext}`;

  if (shouldUseSupabase()) {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    const { error } = await supabase.storage
      .from("advisor-photos")
      .upload(filename, buffer, { contentType: file.type, upsert: false });
    if (error) return { ok: false, error: "Photo upload failed." };
    const { data } = supabase.storage.from("advisor-photos").getPublicUrl(filename);
    return { ok: true, url: data.publicUrl };
  }

  const dir = path.join(process.cwd(), "public", "uploads", "advisors");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  return { ok: true, url: `/uploads/advisors/${filename}` };
}
