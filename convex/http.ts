import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

/**
 * POST /sos
 * Called by the SakhiSafe GSM hardware device when the SOS button is pressed.
 *
 * Expected body (JSON):
 * {
 *   "deviceId": "SG-XXXX",
 *   "latitude": 19.076,      // optional – GPS coordinates from device
 *   "longitude": 72.877      // optional
 * }
 */
http.route({
  path: "/sos",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : null;
    if (!deviceId) {
      return new Response(
        JSON.stringify({ error: "deviceId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const latitude =
      typeof body.latitude === "number" ? body.latitude : undefined;
    const longitude =
      typeof body.longitude === "number" ? body.longitude : undefined;

    try {
      const alertId = await ctx.runMutation(internal.alerts.createFromDevice, {
        deviceId,
        latitude,
        longitude,
      });
      return new Response(
        JSON.stringify({ success: true, alertId }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return new Response(
        JSON.stringify({ error: message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

export default http;
