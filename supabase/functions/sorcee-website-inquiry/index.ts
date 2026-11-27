const allowedOrigins = new Set(["https://sorcee.xyz", "https://www.sorcee.xyz"]);
const cors = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, content-type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
});
const json = (body: Record<string, unknown>, status: number, origin: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function countRecent(
  baseUrl: string,
  secretKey: string,
  column: string,
  value: string,
  cutoff: string,
): Promise<number> {
  const params = new URLSearchParams({
    select: "id",
    [column]: "eq." + value,
    created_at: "gte." + cutoff,
  });
  const response = await fetch(baseUrl + "/rest/v1/buyer_inquiries?" + params.toString(), {
    headers: { apikey: secretKey, Prefer: "count=exact", Range: "0-0" },
  });
  if (!response.ok) throw new Error("Rate-limit check failed.");
  const range = response.headers.get("content-range") || "";
  const total = Number(range.split("/").pop());
  return Number.isFinite(total) ? total : 0;
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") || "";
  if (request.method === "OPTIONS") {
    if (!allowedOrigins.has(origin)) return new Response("Forbidden", { status: 403 });
    return new Response("ok", { status: 204, headers: cors(origin) });
  }
  if (!allowedOrigins.has(origin)) return new Response("Forbidden", { status: 403 });
  if (request.method !== "POST") return json({ success: false, message: "Method not allowed." }, 405, origin);

  try {
    const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
    const expectedPublicKey = publishableKeys.default || Deno.env.get("SUPABASE_ANON_KEY") || "";
    if (!expectedPublicKey || request.headers.get("apikey") !== expectedPublicKey) {
      return json({ success: false, message: "Unauthorized request." }, 401, origin);
    }

    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const baseUrl = Deno.env.get("SUPABASE_URL") || "";
    if (!secretKey || !baseUrl) {
      return json({ success: false, message: "Server configuration is incomplete." }, 500, origin);
    }

    const length = Number(request.headers.get("content-length") || 0);
    if (length > 20000) return json({ success: false, message: "Request is too large." }, 413, origin);
    const body = await request.json();
    if (clean(body._honey, 300)) return json({ success: true }, 202, origin);

    const buyerName = clean(body.fullName, 120);
    const buyerEmail = clean(body.email, 254).toLowerCase();
    const company = clean(body.business, 160);
    const country = clean(body.country, 100);
    const phone = clean(body.phone, 40);
    const service = clean(body.service, 100);
    const category = clean(body.category, 100);
    const quantity = Number(body.quantity);
    const specs = clean(body.specs, 4000);
    if (!buyerName || !company || !country || !phone || !service || !category || !specs ||
        !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyerEmail) || !Number.isInteger(quantity) || quantity < 1) {
      return json({ success: false, message: "Please complete all required fields correctly." }, 400, origin);
    }
    const sampleOnly = service === "Sample development only";
    if (!sampleOnly && quantity < 50) {
      return json({ success: false, message: "Production inquiries must start at 50 pieces. Sample requests are reviewed separately." }, 400, origin);
    }

    const forwarded = request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      (request.headers.get("x-forwarded-for") || "").split(",").pop()?.trim() || "unknown";
    const ipHash = await sha256(forwarded + "|sorcee-website-inquiry");
    const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const [ipCount, emailCount] = await Promise.all([
      countRecent(baseUrl, secretKey, "ip_hash", ipHash, cutoff),
      countRecent(baseUrl, secretKey, "buyer_email", buyerEmail, cutoff),
    ]);
    if (ipCount >= 5 || emailCount >= 5) {
      return json({ success: false, message: "Too many inquiries. Please try again later or contact SORCEE by WhatsApp." }, 429, origin);
    }

    const detailLines = [
      "Service: " + service,
      "Specifications: " + specs,
      "Fabric preference: " + clean(body.fabric, 250),
      "Colors: " + clean(body.colors, 250),
      "Size breakdown: " + clean(body.sizes, 500),
      "Customization: " + clean(body.custom, 2000),
      "Additional message: " + clean(body.message, 2000),
      "Reference file names (not uploaded): " + clean(body.reference_files_selected, 1000),
      "Source page: " + clean(body._url, 500),
    ].filter((line) => !line.endsWith(": "));

    const insert = await fetch(baseUrl + "/rest/v1/buyer_inquiries", {
      method: "POST",
      headers: { apikey: secretKey, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        company_name: company,
        country,
        whatsapp: phone,
        product_category: category,
        product_name: null,
        service_type: service,
        quantity,
        currency: "USD",
        message: detailLines.join("\n"),
        source: "website",
        status: "new",
        ip_hash: ipHash,
      }),
    });
    if (!insert.ok) {
      console.error("Buyer inquiry insert failed:", insert.status);
      return json({ success: false, message: "Your inquiry could not be saved. Please contact SORCEE directly." }, 500, origin);
    }
    const rows = await insert.json();
    return json({ success: true, inquiry_number: rows?.[0]?.inquiry_number ?? null }, 201, origin);
  } catch (error) {
    console.error("Inquiry handler error:", error instanceof Error ? error.message : "Unknown error");
    return json({ success: false, message: "A server error occurred. Please try again or contact SORCEE." }, 500, origin);
  }
});
