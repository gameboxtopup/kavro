const axios = require("axios");

const DEFAULT_LOOKUP_URL = "https://api.gameskinbo.com/ff-info/get";

function normalizeUid(value) {
    return String(value || "").trim();
}

function isValidFreeFireUid(value) {
    return /^\d{6,12}$/.test(normalizeUid(value));
}

function parsePlayer(data) {
    const account =
        data?.AccountInfo ||
        data?.accountInfo ||
        data?.account ||
        data?.player ||
        data?.data?.AccountInfo ||
        data?.data?.accountInfo ||
        data?.data?.account ||
        data?.data?.player ||
        data?.data ||
        data;

    const name = String(
        account?.AccountName ||
        account?.accountName ||
        account?.nickname ||
        account?.name ||
        account?.playerName ||
        ""
    ).trim();

    const region = String(
        account?.AccountRegion ||
        account?.accountRegion ||
        account?.region ||
        ""
    ).trim().toUpperCase();

    return name ? { name, region } : null;
}

async function lookupFreeFirePlayer(uid) {
    const normalizedUid = normalizeUid(uid);

    if (!isValidFreeFireUid(normalizedUid)) {
        const error = new Error("Enter a valid numeric Free Fire UID.");
        error.code = "INVALID_UID_FORMAT";
        throw error;
    }

    const apiKey = process.env.FF_LOOKUP_API_KEY;

    if (!apiKey) {
        const error = new Error("Free Fire UID verification is not configured.");
        error.code = "LOOKUP_NOT_CONFIGURED";
        throw error;
    }

    const apiUrl = process.env.FF_LOOKUP_API_URL || DEFAULT_LOOKUP_URL;
    const requestedRegion = String(
        process.env.FF_LOOKUP_REGION || "BD"
    ).toUpperCase();

    const response = await axios.get(apiUrl, {
        params: { uid: normalizedUid, region: requestedRegion },
        headers: { "x-api-key": apiKey, Accept: "application/json" },
        timeout: 10000,
        maxRedirects: 2
    });

    const player = parsePlayer(response.data);

    if (!player) {
        const error = new Error("Player not found.");
        error.code = "PLAYER_NOT_FOUND";
        throw error;
    }

    if (player.region && player.region !== requestedRegion) {
        const error = new Error(
            `This UID belongs to the ${player.region} server, not ${requestedRegion}.`
        );
        error.code = "WRONG_REGION";
        throw error;
    }

    return {
        uid: normalizedUid,
        playerName: player.name,
        playerRegion: player.region || requestedRegion
    };
}

module.exports = {
    isValidFreeFireUid,
    lookupFreeFirePlayer,
    normalizeUid,
    parsePlayer
};
