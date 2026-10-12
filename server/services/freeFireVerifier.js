const axios = require("axios");

const DEFAULT_LOOKUP_URL =
    "https://siambhau69.eu.cc/freefireinfo/bhau";

function normalizeUid(value) {
    return String(value || "").trim();
}

function isValidFreeFireUid(value) {
    return /^\d{6,12}$/.test(normalizeUid(value));
}

function getAccount(data) {
    return (
        data?.basicInfo ||
        data?.AccountInfo ||
        data?.accountInfo ||
        data?.account ||
        data?.player ||
        data?.data?.basicInfo ||
        data?.data?.AccountInfo ||
        data?.data?.accountInfo ||
        data?.data?.account ||
        data?.data?.player ||
        data?.data ||
        data
    );
}

function parsePlayer(data) {
    const account = getAccount(data);

    const name = String(
        account?.nickname ||
        account?.AccountName ||
        account?.accountName ||
        account?.name ||
        account?.playerName ||
        ""
    ).trim();

    const region = String(
        account?.region ||
        account?.AccountRegion ||
        account?.accountRegion ||
        ""
    ).trim().toUpperCase();

    return name ? { name, region } : null;
}

function parseAccountId(data) {
    const account = getAccount(data);

    return String(
        account?.accountId ||
        account?.AccountId ||
        account?.accountID ||
        account?.id ||
        ""
    ).trim();
}

async function lookupFreeFirePlayer(uid) {
    const normalizedUid = normalizeUid(uid);

    if (!isValidFreeFireUid(normalizedUid)) {
        const error = new Error(
            "Enter a valid numeric Free Fire UID."
        );

        error.code = "INVALID_UID_FORMAT";
        throw error;
    }

    const apiKey = String(
        process.env.FF_LOOKUP_API_KEY || ""
    ).trim();

    if (!apiKey) {
        const error = new Error(
            "Free Fire UID verification is not configured."
        );

        error.code = "LOOKUP_NOT_CONFIGURED";
        throw error;
    }

    const apiUrl =
        process.env.FF_LOOKUP_API_URL ||
        DEFAULT_LOOKUP_URL;

    const requestedRegion = String(
        process.env.FF_LOOKUP_REGION || "BD"
    ).trim().toUpperCase();

    const response = await axios.get(apiUrl, {
        params: {
            uid: normalizedUid,
            region: requestedRegion,
            key: apiKey
        },
        headers: {
            Accept: "application/json"
        },
        timeout: 10000,
        maxRedirects: 2
    });

    const player = parsePlayer(response.data);

    if (!player) {
        const error = new Error("Player not found.");
        error.code = "PLAYER_NOT_FOUND";
        throw error;
    }

    const returnedUid = parseAccountId(response.data);

    if (
        returnedUid &&
        returnedUid !== normalizedUid
    ) {
        const error = new Error(
            "The API returned a different UID."
        );

        error.code = "UID_MISMATCH";
        throw error;
    }

    if (
        player.region &&
        player.region !== requestedRegion
    ) {
        const error = new Error(
            `This UID belongs to the ${player.region} server, not ${requestedRegion}.`
        );

        error.code = "WRONG_REGION";
        throw error;
    }

    return {
        uid: normalizedUid,
        playerName: player.name,
        playerRegion:
            player.region || requestedRegion
    };
}

module.exports = {
    isValidFreeFireUid,
    lookupFreeFirePlayer,
    normalizeUid,
    parsePlayer
};