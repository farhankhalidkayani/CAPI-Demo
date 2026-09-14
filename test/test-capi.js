import assert from "node:assert";
import { createHash } from "node:crypto";
import { hashPII, buildEvent } from "../src/capi.js";

// hashPII: lowercase + trim before hashing, matching Meta's spec
const expected = createHash("sha256").update("test@example.com").digest("hex");
assert.strictEqual(hashPII("  Test@Example.com  "), expected);

// buildEvent: PII is hashed, non-PII passed through, missing fields omitted
const event = buildEvent({
  eventName: "Purchase",
  eventId: "abc-123",
  eventSourceUrl: "https://example.com",
  email: "a@b.com",
  externalId: "crm-42",
  customData: { currency: "USD", value: 10 },
});
assert.strictEqual(event.event_name, "Purchase");
assert.strictEqual(event.action_source, "website");
assert.deepStrictEqual(event.user_data.em, [hashPII("a@b.com")]);
assert.deepStrictEqual(event.user_data.external_id, [hashPII("crm-42")]);
assert.strictEqual(event.user_data.ph, undefined);
assert.strictEqual(event.custom_data.value, 10);

console.log("All CAPI tests passed.");
