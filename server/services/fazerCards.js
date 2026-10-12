const axios = require("axios");

const BASE_URL = (process.env.FAZER_API_BASE_URL || "https://api.fzr.cards/api/v2").replace(/\/$/, "");

function getHeaders() {
    if (!process.env.FAZER_API_KEY) {
        throw new Error("FAZER_API_KEY is not configured on the server.");
    }

    return {
        "X-Api-Key": process.env.FAZER_API_KEY,
        Accept: "application/json",
        "Content-Type": "application/json"
    };
}

function getProviderOrderId(data) {
    return String(
        data?.id ||
        data?.order_id ||
        data?.orderId ||
        data?.order?.id ||
        ""
    );
}

function getProviderStatus(data) {
    return String(
        data?.status ||
        data?.order?.status ||
        data?.data?.status ||
        data?.data?.order?.status ||
        ""
    ).toLowerCase();
}

async function createPubgTopup({ categoryId, offerId, playerId, idempotencyKey }) {
    if (!categoryId || !offerId || !playerId) {
        throw new Error("PUBG FazerCards category, offer, and player ID are required.");
    }

    const response = await axios.post(
        `${BASE_URL}/topups/order`,
        {
            category_id: String(categoryId),
            offer_id: String(offerId),
            fields: { player_id: String(playerId) }
        },
        {
            headers: {
                ...getHeaders(),
                "Idempotency-Key": String(idempotencyKey)
            },
            timeout: 30000
        }
    );

    return {
        raw: response.data,
        id: getProviderOrderId(response.data),
        status: getProviderStatus(response.data)
    };
}

async function getOrder(providerOrderId) {
    const response = await axios.get(
        `${BASE_URL}/orders/${encodeURIComponent(providerOrderId)}`,
        { headers: getHeaders(), timeout: 20000 }
    );

    return {
        raw: response.data,
        id: getProviderOrderId(response.data) || String(providerOrderId),
        status: getProviderStatus(response.data)
    };
}

function isCompleted(status) {
    return ["completed", "complete", "success", "successful", "delivered", "done"].includes(String(status).toLowerCase());
}

function isFailed(status) {
    return ["failed", "failure", "refunded", "cancelled", "canceled", "rejected", "error"].includes(String(status).toLowerCase());
}

module.exports = {
    createPubgTopup,
    getOrder,
    getProviderStatus,
    isCompleted,
    isFailed
};
