import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { buildEvent, sendEvents } from "./src/capi.js";

const accessToken = process.env.META_ACCESS_TOKEN;
const testEventCode = process.env.META_TEST_EVENT_CODE;
const port = process.env.PORT || 3000;
const dryRun = !process.env.META_PIXEL_ID || !accessToken;
const pixelId = process.env.META_PIXEL_ID || "000000000000000";

if (dryRun) {
  console.log("No META_PIXEL_ID/META_ACCESS_TOKEN set — running in dry-run mode (no network call to Meta).\n");
}

const indexHtml = (await readFile(new URL("./public/index.html", import.meta.url), "utf8")).replace(
  "__PIXEL_ID__",
  pixelId
);

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(indexHtml);
    return;
  }

  if (req.method === "POST" && req.url === "/api/purchase") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const { eventId, email, phone } = JSON.parse(body);

    const event = buildEvent({
      eventName: "Purchase",
      eventId,
      eventSourceUrl: `http://localhost:${port}/`,
      email,
      phone,
      clientIpAddress: req.socket.remoteAddress,
      clientUserAgent: req.headers["user-agent"],
      customData: { currency: "USD", value: 49.99 },
    });

    try {
      const result = await sendEvents({ pixelId, accessToken, events: [event], testEventCode, dryRun });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(port, () => console.log(`http://localhost:${port}`));
