import assert from "node:assert/strict";
import { test } from "node:test";
import { buildExpiryAlerts, fillDailySeries } from "./dashboard.utils.js";

test("fillDailySeries fills missing days with zero", () => {
    const series = fillDailySeries(
        "2026-11-29",
        "2026-12-02",
        new Map([["2026-11-30", 5000]]),
        new Map([["2026-12-02", 700]])
    );
    assert.deepEqual(series, [
        { date: "2026-11-29", income: 0, expense: 0 },
        { date: "2026-11-30", income: 5000, expense: 0 },
        { date: "2026-12-01", income: 0, expense: 0 },
        { date: "2026-12-02", income: 0, expense: 700 },
    ]);
});

test("buildExpiryAlerts keeps soon/expired papers, soonest first", () => {
    const alerts = buildExpiryAlerts(
        [
            {
                id: "a",
                name: "Noah",
                number: "DM-GA-1",
                expiries: {
                    fitness_expiry: "2026-12-20", // 25 days -> in
                    tax_token_expiry: "2027-03-01", // far -> out
                    insurance_expiry: "2026-11-20", // expired -> in
                    route_permit_expiry: null,
                },
            },
        ],
        "2026-11-25",
        30
    );
    assert.deepEqual(
        alerts.map((a) => [a.document, a.days_left]),
        [
            ["ইন্স্যুরেন্স", -5],
            ["ফিটনেস", 25],
        ]
    );
});
