import { buildEvent, sendEvents } from "../src/capi.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { eventId, email, phone } = req.body;
  const pixelId = process.env.META_PIXEL_ID || "000000000000000";
  const accessToken = process.env.META_ACCESS_TOKEN;
  const testEventCode = process.env.META_TEST_EVENT_CODE;
  const dryRun = !process.env.META_PIXEL_ID || !accessToken;

  const event = buildEvent({
    eventName: "Purchase",
    eventId,
    eventSourceUrl: `https://${req.headers.host}/`,
    email,
    phone,
    clientIpAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
    clientUserAgent: req.headers["user-agent"],
    customData: { currency: "USD", value: 49.99 },
  });

  try {
    const result = await sendEvents({ pixelId, accessToken, events: [event], testEventCode, dryRun });
    res.status(200).json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
