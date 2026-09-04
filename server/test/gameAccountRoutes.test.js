const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const gameAccountRoutes = require("../routes/gameAccountRoutes");

async function withServer(run) {
    const app = express();
    app.use(express.json());
    app.use("/api/game-accounts", gameAccountRoutes);

    const server = await new Promise(resolve => {
        const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });

    try {
        const address = server.address();
        await run(`http://127.0.0.1:${address.port}`);
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
}

test("reports whether Free Fire verification is configured", async () => {
    process.env.JWT_SECRET = "test-only-secret";
    delete process.env.FF_LOOKUP_API_KEY;

    await withServer(async baseUrl => {
        let response = await fetch(
            `${baseUrl}/api/game-accounts/free-fire/config`
        );
        let result = await response.json();
        assert.equal(result.enabled, false);

        process.env.FF_LOOKUP_API_KEY = "test-api-key";
        response = await fetch(
            `${baseUrl}/api/game-accounts/free-fire/config`
        );
        result = await response.json();
        assert.equal(result.enabled, true);
    });
});

test("verifies a BD player and returns a matching signed token", async () => {
    const originalGet = axios.get;
    process.env.JWT_SECRET = "test-only-secret";
    process.env.FF_LOOKUP_API_KEY = "test-api-key";

    axios.get = async () => ({
        data: {
            AccountInfo: {
                AccountName: "Nirmal FF",
                AccountRegion: "BD"
            }
        }
    });

    try {
        await withServer(async baseUrl => {
            const response = await fetch(
                `${baseUrl}/api/game-accounts/free-fire/verify`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid: "2312730961" })
                }
            );
            const result = await response.json();

            assert.equal(response.status, 200);
            assert.equal(result.playerName, "Nirmal FF");
            assert.equal(result.playerRegion, "BD");

            const token = jwt.verify(
                result.verificationToken,
                process.env.JWT_SECRET
            );
            assert.equal(token.uid, "2312730961");
            assert.equal(token.playerName, "Nirmal FF");
            assert.equal(token.purpose, "free-fire-uid-verification");
        });
    } finally {
        axios.get = originalGet;
    }
});

test("rejects a player returned from the wrong region", async () => {
    const originalGet = axios.get;
    process.env.JWT_SECRET = "test-only-secret";
    process.env.FF_LOOKUP_API_KEY = "test-api-key";

    axios.get = async () => ({
        data: {
            AccountInfo: {
                AccountName: "Other Region",
                AccountRegion: "SG"
            }
        }
    });

    try {
        await withServer(async baseUrl => {
            const response = await fetch(
                `${baseUrl}/api/game-accounts/free-fire/verify`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uid: "3312730961" })
                }
            );
            const result = await response.json();

            assert.equal(response.status, 404);
            assert.match(result.message, /SG server/);
        });
    } finally {
        axios.get = originalGet;
    }
});

test("rejects malformed UIDs without contacting the provider", async () => {
    process.env.JWT_SECRET = "test-only-secret";
    process.env.FF_LOOKUP_API_KEY = "test-api-key";

    await withServer(async baseUrl => {
        const response = await fetch(
            `${baseUrl}/api/game-accounts/free-fire/verify`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: "bad-uid" })
            }
        );

        assert.equal(response.status, 400);
    });
});

test("reports unavailable when no provider key is configured", async () => {
    process.env.JWT_SECRET = "test-only-secret";
    delete process.env.FF_LOOKUP_API_KEY;

    await withServer(async baseUrl => {
        const response = await fetch(
            `${baseUrl}/api/game-accounts/free-fire/verify`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: "4312730961" })
            }
        );

        assert.equal(response.status, 503);
    });
});
