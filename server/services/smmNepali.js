const ENDPOINT = process.env.SMM_PROVIDER_URL || "https://smmnepali.com/api/v2";

async function callSmm(payload) {
  if (!process.env.SMMNEPALI_API_KEY) throw new Error("SMMNEPALI_API_KEY is not configured");
  const body = new URLSearchParams({ key: process.env.SMMNEPALI_API_KEY, ...payload });
  const response = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!response.ok) throw new Error(`SMM provider HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

module.exports = { addOrder: (service, link, quantity) => callSmm({ action: "add", service: String(service), link, quantity: String(quantity) }) };
