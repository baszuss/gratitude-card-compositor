require("dotenv").config();

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const BASE_URL = "https://services.leadconnectorhq.com";

async function searchContacts(query) {
  const params = new URLSearchParams({
    locationId: GHL_LOCATION_ID,
    query,
  });

  const res = await fetch(`${BASE_URL}/contacts/?${params}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${GHL_API_KEY}`,
      Version: "2021-07-28",
    },
  });

  if (!res.ok) {
    console.error("Search error:", res.status, await res.text());
    return;
  }

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

searchContacts("Jasmin");
