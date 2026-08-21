import { cfg, response, upcomingTrainings } from "../lib/common.mjs";

export default async (request) => {
  if (request.method === "OPTIONS") return response({ ok: true });
  if (request.method !== "GET") return response({ error: "Method not allowed" }, 405);

  return response({
    trainings: upcomingTrainings(8),
    matches: cfg.matches,
    players: cfg.players,
  });
};
