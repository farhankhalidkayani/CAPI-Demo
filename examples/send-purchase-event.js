import { randomUUID } from "node:crypto";
import { buildEvent, sendEvents } from "../src/capi.js";

const pixelId = process.env.META_PIXEL_ID;
const accessToken = process.env.META_ACCESS_TOKEN;
const testEventCode = process.env.META_TEST_EVENT_CODE;
const dryRun = !pixelId || !accessToken;

if (dryRun) {
  console.log("No META_PIXEL_ID/META_ACCESS_TOKEN set — running in dry-run mode (no network call).\n");
}

const event = buildEvent({
  eventName: "Purchase",
  eventId: randomUUID(), // must match the browser Pixel's event_id to dedup
  eventSourceUrl: "https://example.com/checkout/thank-you",
  email: "customer@example.com",
  phone: "+15551234567",
  externalId: "crm-customer-4821",
  clientIpAddress: "203.0.113.42",
  clientUserAgent: "Mozilla/5.0",
  customData: { currency: "USD", value: 49.99 },
});

const result = await sendEvents({ pixelId, accessToken, events: [event], testEventCode, dryRun });
console.log(JSON.stringify(result, null, 2));
