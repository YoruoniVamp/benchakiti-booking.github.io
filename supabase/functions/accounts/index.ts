import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function loginEmail(username: string) {
  const bytes = new TextEncoder().encode(username.trim().toLowerCase());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const safeName = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `user-${safeName}@park-login.invalid`;
}

function validUsername(value: unknown): value is string {
  return typeof value === "string" && value.trim().length >= 8 && value.trim().length <= 100 && /[A-Za-z]/.test(value);
}

function validPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
}

function getPrivilegedKey() {
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keys) {
    try {
      const parsed = JSON.parse(keys);
      if (parsed.default) return parsed.default;
      const first = Object.values(parsed)[0];
      if (typeof first === "string") return first;
    } catch { /* Fall through to the legacy server-only environment variable. */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const publicKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
const privilegedKey = getPrivilegedKey();

const adminClient = createClient(supabaseUrl, privilegedKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

async function signedInCaller(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return null;
  const callerClient = createClient(supabaseUrl, publicKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await callerClient.auth.getUser();
  if (error || !data.user) return null;
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, username, phone, is_admin, is_head")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError || !profile) return null;
  return profile;
}

async function findProfile(username: string) {
  const pattern = username.replace(/[\\%_]/g, "\\$&");
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, username, phone, is_admin, is_head")
    .ilike("username", pattern)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function createAuthUser(username: string, password: string, phone = "") {
  const { data, error } = await adminClient.auth.admin.createUser({
    email: loginEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username, phone },
  });
  if (error) throw error;
  const { error: profileError } = await adminClient.from("profiles").update({ username, phone }).eq("id", data.user.id);
  if (profileError) {
    await adminClient.auth.admin.deleteUser(data.user.id);
    throw profileError;
  }
  return data.user;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed." }, 405);
  if (!supabaseUrl || !publicKey || !privilegedKey) return response({ error: "Account service is not configured." }, 503);

  try {
    const body = await request.json();
    const action = String(body.action || "");

    if (action === "register") {
      const username = String(body.username || "").trim();
      const password = body.password;
      const phone = String(body.phone || "").trim();
      if (!validUsername(username)) return response({ error: "Username needs 8–100 characters and at least one English letter." }, 400);
      if (!validPassword(password)) return response({ error: "Password needs at least 8 characters with uppercase, lowercase, and a number." }, 400);
      if (phone && !/^[+0-9()\-\s]{8,20}$/.test(phone)) return response({ error: "Enter a valid telephone number or leave it blank." }, 400);
      const forwardedFor = request.headers.get("x-forwarded-for") || "unknown";
      const clientAddress = request.headers.get("cf-connecting-ip") || forwardedFor.split(",")[0].trim();
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(clientAddress || "unknown"));
      const clientKey = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      const { data: allowed, error: limitError } = await adminClient.rpc("park_claim_registration_slot", { p_client_key: clientKey });
      if (limitError) throw limitError;
      if (!allowed) return response({ error: "Too many accounts were created from this connection. Please try again in an hour." }, 429);
      try {
        const user = await createAuthUser(username, password, phone);
        return response({ username: user.user_metadata.username, id: user.id }, 201);
      } catch (error) {
        const message = String(error?.message || "");
        if (/already|duplicate|unique/i.test(message)) return response({ error: "That username is already registered. Choose another." }, 409);
        throw error;
      }
    }

    const caller = await signedInCaller(request);
    if (!caller?.is_admin) return response({ error: "Administrator access is required." }, 403);

    if (action === "create") {
      const username = String(body.username || "").trim();
      const password = body.password;
      const phone = String(body.phone || "").trim();
      const role = body.role === "admin" && caller.is_head ? "admin" : "user";
      if (!validUsername(username)) return response({ error: "Username needs 8–100 characters and at least one English letter." }, 400);
      if (!validPassword(password)) return response({ error: "Password needs at least 8 characters with uppercase, lowercase, and a number." }, 400);
      if (phone && !/^[+0-9()\-\s]{8,20}$/.test(phone)) return response({ error: "Enter a valid telephone number or leave it blank." }, 400);
      const duplicate = await findProfile(username);
      if (duplicate) return response({ error: "That username is already registered. Choose another." }, 409);
      if (body.role === "admin" && !caller.is_head) return response({ error: "Only the head account can grant administrator access." }, 403);
      const user = await createAuthUser(username, password, phone);
      if (role === "admin") {
        const { error } = await adminClient.from("profiles").update({ is_admin: true, is_head: false }).eq("id", user.id);
        if (error) throw error;
      }
      return response({ id: user.id, username, role }, 201);
    }

    if (action === "update") {
      const original = String(body.original || "");
      const target = await findProfile(original);
      if (!target) return response({ error: "Account not found." }, 404);
      if (target.is_head && !caller.is_head) return response({ error: "Only the head account can manage this account." }, 403);
      if (target.is_head && caller.id !== target.id) return response({ error: "The head account cannot be changed by another account." }, 403);

      const username = String(body.username || original).trim();
      const password = String(body.password || "");
      const phone = String(body.phone ?? target.phone ?? "").trim();
      if (!validUsername(username)) return response({ error: "Username needs 8–100 characters and at least one English letter." }, 400);
      if (password && !validPassword(password)) return response({ error: "Password needs at least 8 characters with uppercase, lowercase, and a number." }, 400);
      if (phone && !/^[+0-9()\-\s]{8,20}$/.test(phone)) return response({ error: "Enter a valid telephone number or leave it blank." }, 400);

      const duplicate = await findProfile(username);
      if (duplicate && duplicate.id !== target.id) return response({ error: "That username is already in use." }, 409);
      const requestedRole = body.role === "admin" ? "admin" : body.role === "user" ? "user" : target.is_admin ? "admin" : "user";
      if (requestedRole !== (target.is_admin ? "admin" : "user") && !caller.is_head) {
        return response({ error: "Only the head account can change administrator access." }, 403);
      }
      if (target.is_head && requestedRole !== "admin") return response({ error: "The head account must retain administrator access." }, 403);

      const authUpdate: Record<string, unknown> = { user_metadata: { username, phone } };
      if (username !== target.username) authUpdate.email = loginEmail(username);
      if (password) authUpdate.password = password;
      const { error: authError } = await adminClient.auth.admin.updateUserById(target.id, authUpdate);
      if (authError) throw authError;

      const { error: profileError } = await adminClient.from("profiles").update({
        username,
        phone,
        is_admin: target.is_head || requestedRole === "admin",
        is_head: target.is_head,
      }).eq("id", target.id);
      if (profileError) throw profileError;

      if (username !== target.username) {
        await adminClient.from("court_bookings").update({ username_snapshot: username }).eq("user_id", target.id);
        await adminClient.from("equipment_bookings").update({ username_snapshot: username }).eq("user_id", target.id);
      }
      return response({ id: target.id, username, role: target.is_head ? "head" : requestedRole });
    }

    if (action === "delete") {
      const username = String(body.username || "");
      const target = await findProfile(username);
      if (!target) return response({ error: "Account not found." }, 404);
      if (target.id === caller.id || target.is_head && !caller.is_head) return response({ error: "This account cannot be deleted." }, 403);
      if (target.is_head) return response({ error: "The head account cannot be deleted." }, 403);
      const { error } = await adminClient.auth.admin.deleteUser(target.id);
      if (error) throw error;
      return response({ deleted: username });
    }

    return response({ error: "Unknown account action." }, 400);
  } catch (error) {
    console.error("accounts function failed", error);
    return response({ error: String(error?.message || "Account request failed.") }, 500);
  }
});
