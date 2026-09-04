const test = require("node:test");
const assert = require("node:assert/strict");

const {
    isValidFreeFireUid,
    normalizeUid,
    parsePlayer
} = require("../services/freeFireVerifier");

test("normalizes and validates numeric Free Fire UIDs", () => {
    assert.equal(normalizeUid(" 2312730961 "), "2312730961");
    assert.equal(isValidFreeFireUid("2312730961"), true);
    assert.equal(isValidFreeFireUid("12345"), false);
    assert.equal(isValidFreeFireUid("123ABC789"), false);
    assert.equal(isValidFreeFireUid("1234567890123"), false);
});

test("parses the documented Games Kinbo player response", () => {
    assert.deepEqual(
        parsePlayer({
            AccountInfo: {
                AccountName: "Kavro Player",
                AccountRegion: "bd"
            }
        }),
        {
            name: "Kavro Player",
            region: "BD"
        }
    );
});

test("parses a nested provider-neutral response", () => {
    assert.deepEqual(
        parsePlayer({
            data: {
                player: {
                    nickname: "Nirmal FF",
                    region: "BD"
                }
            }
        }),
        {
            name: "Nirmal FF",
            region: "BD"
        }
    );
});

test("rejects responses without a player name", () => {
    assert.equal(parsePlayer({ AccountInfo: { AccountRegion: "BD" } }), null);
});
