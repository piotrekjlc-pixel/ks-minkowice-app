import {
  cfg,
  response,
  store,
  authPlayer,
  authAdmin,
  upcomingTrainings,
} from "../lib/common.mjs";

export default async (request) => {
  if (request.method === "OPTIONS") return response({ ok: true });

  const s = store();

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return response({ error: "Bad JSON" }, 400);
    }

    const { player, pin, eventId, status } = body || {};

    if (!authPlayer(player, pin)) {
      return response({ error: "Nieprawidłowy PIN" }, 401);
    }

    if (!["yes", "no"].includes(status)) {
      return response({ error: "Błędny status" }, 400);
    }

    const valid = upcomingTrainings(8).some((t) => t.id === eventId);
    if (!valid) {
      return response({ error: "Nieprawidłowy lub nieaktualny trening" }, 400);
    }

    const key = `${eventId}/${encodeURIComponent(player)}`;
    await s.setJSON(key, {
      player,
      status,
      updatedAt: new Date().toISOString(),
    });

    return response({ ok: true });
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    const adminPin = url.searchParams.get("adminPin");
    const eventId = url.searchParams.get("eventId");

    if (!authAdmin(adminPin)) {
      return response({ error: "Nieprawidłowy PIN trenera" }, 401);
    }

    if (!eventId) {
      return response({ error: "Brak eventId" }, 400);
    }

    const listed = await s.list({ prefix: `${eventId}/` });
    const answers = {};

    for (const item of listed.blobs) {
      const data = await s.get(item.key, { type: "json" });
      if (data?.player) answers[data.player] = data;
    }

    const rows = cfg.players.map((player) => ({
      player,
      status: answers[player]?.status || "none",
      updatedAt: answers[player]?.updatedAt || null,
    }));

    return response({ eventId, rows });
  }

  return response({ error: "Method not allowed" }, 405);
};
