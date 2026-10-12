const axios = require("axios");

function baseUrl() {
    return String(process.env.RECHARGE_API_BASE_URL || "https://api.rechargegame.games").replace(/\/+$/, "");
}

function headers() {
    const key = String(process.env.RECHARGE_API_KEY || "").trim();
    if (!key) {
        const error = new Error("RechargeGames API is not configured.");
        error.code = "RECHARGE_NOT_CONFIGURED";
        throw error;
    }
    return { "X-API-Key": key, Accept: "application/json", "Content-Type": "application/json" };
}

async function createRechargeOrder({ productKey, playerId, buyerRef, region, note = "" }) {
    if (!productKey || !playerId || !buyerRef) throw new Error("RechargeGames product key, player ID and buyer reference are required.");
    const response = await axios.post(`${baseUrl()}/v1/orders`, {
        product_key: productKey,
        product: productKey.split("/").pop(),
        region: region || process.env.RECHARGE_FREE_FIRE_REGION || "Bangladesh",
        quantity: 1,
        player_id: String(playerId),
        buyer_ref: buyerRef,
        note,
        ...(String(process.env.RECHARGE_TEST_MODE || "").toLowerCase() === "true" ? { test: true } : {})
    }, { headers: headers(), timeout: 20000 });
    return response.data;
}

async function getRechargeOrder(orderId) {
    const response = await axios.get(`${baseUrl()}/v1/orders/${encodeURIComponent(orderId)}`, { headers: headers(), timeout: 20000 });
    return response.data;
}

function providerStatus(data) { return String(data?.status || "pending").toLowerCase(); }
function isDelivered(data) { return providerStatus(data) === "delivered"; }
function isFailed(data) { return providerStatus(data) === "failed"; }

module.exports = { createRechargeOrder, getRechargeOrder, providerStatus, isDelivered, isFailed };
