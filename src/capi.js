import { createHash } from "node:crypto";

const GRAPH_VERSION = "v19.0";

/** Meta requires PII fields (em, ph, fn, ln, ...) as lowercase-trimmed SHA-256 hex. */
export function hashPII(value) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function buildEvent({
  eventName,
  eventId,
  eventSourceUrl,
  email,
  phone,
  externalId,
  clientIpAddress,
  clientUserAgent,
  fbc,
  fbp,
  customData,
}) {
  const userData = {
    ...(email && { em: [hashPII(email)] }),
    ...(phone && { ph: [hashPII(phone)] }),
    ...(externalId && { external_id: [hashPII(externalId)] }), // CRM/customer id — boosts match confidence alongside em/ph/fbc/fbp
    ...(clientIpAddress && { client_ip_address: clientIpAddress }),
    ...(clientUserAgent && { client_user_agent: clientUserAgent }),
    ...(fbc && { fbc }),
    ...(fbp && { fbp }),
  };

  return {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl,
    action_source: "website",
    user_data: userData,
    ...(customData && { custom_data: customData }),
  };
}

/**
 * Sends one or more events to Meta's Conversions API.
 * event_id + matching Pixel event_id is what dedups browser vs server events.
 */
export async function sendEvents({ pixelId, accessToken, events, testEventCode, dryRun }) {
  const body = {
    data: events,
    ...(testEventCode && { test_event_code: testEventCode }),
  };

  // No Meta account needed to see this work: dryRun builds the real request
  // and returns it instead of calling graph.facebook.com.
  if (dryRun) {
    return { dry_run: true, would_post_to: `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId || "<PIXEL_ID>"}/events`, body };
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${accessToken}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Meta CAPI error ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}
