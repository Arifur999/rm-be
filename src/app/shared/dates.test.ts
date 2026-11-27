import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, daysBetween, dhakaToday, isDateString, parseDateRange } from "./dates.js";

test("dhakaToday rolls over at Dhaka midnight, not UTC midnight", () => {
    // 2026-01-01 18:30 UTC is 2026-01-02 00:30 in Dhaka (UTC+6)
    assert.equal(dhakaToday(new Date("2026-01-01T18:30:00Z")), "2026-01-02");
    assert.equal(dhakaToday(new Date("2026-01-01T17:59:00Z")), "2026-01-01");
});

test("addDays crosses month and year ends", () => {
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
    assert.equal(daysBetween("2026-01-01", "2026-01-31"), 30);
});

test("isDateString rejects junk and impossible days", () => {
    assert.ok(isDateString("2026-11-25"));
    assert.ok(!isDateString("2026-13-40"));
    assert.ok(!isDateString("2026-02-30"));
    assert.ok(!isDateString("25-11-2026"));
    assert.ok(!isDateString(undefined));
});

test("parseDateRange defaults and validates", () => {
    const single = parseDateRange({ from: "2026-11-01" }, true);
    assert.equal(single.toKey, "2026-11-01");
    assert.equal(parseDateRange({}, false), null);
    assert.equal(parseDateRange({}, true).fromKey, dhakaToday());
    assert.throws(() => parseDateRange({ from: "2026-11-10", to: "2026-11-01" }, true));
    assert.throws(() => parseDateRange({ from: "bad" }, true));
});
