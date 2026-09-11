// src/appApi.js
//
// Calls the internal employee-lookup endpoint built into the Lovable app, rather than
// querying Supabase directly. The Supabase service-role key never leaves Lovable — this
// service authenticates with a shared secret instead. See README for the endpoint contract.

const APP_API_URL = process.env.GRATITUDE_APP_API_URL;
const SHARED_SECRET = process.env.CARD_COMPOSITOR_SHARED_SECRET;

async function fetchEmployeeByEmail(email) {
  if (!APP_API_URL) throw new Error("GRATITUDE_APP_API_URL is not set");
  if (!SHARED_SECRET) throw new Error("CARD_COMPOSITOR_SHARED_SECRET is not set");

  const res = await fetch(APP_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": SHARED_SECRET,
    },
    body: JSON.stringify({ email }),
  });

  if (res.status === 404) {
    throw new Error(`No employee found for email "${email}"`);
  }
  if (res.status === 401) {
    throw new Error("Unauthorized calling internal employee-lookup — check CARD_COMPOSITOR_SHARED_SECRET");
  }
  if (!res.ok) {
    throw new Error(`Employee lookup failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  // Expected shape: { full_name, first_name, title, qr_slug }
  return {
    full_name: data.full_name,
    first_name: data.first_name,
    title: data.title || "",
    specialty: "", // no distinct specialty field — leave blank (hides the line)
    qr_slug: data.qr_slug,
    photo_url: data.photo_url || "",
  };
}

module.exports = { fetchEmployeeByEmail };
