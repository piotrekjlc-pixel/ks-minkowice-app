import { cfg, response, upcomingTrainings } from "../lib/common.mjs";

function matchId(date) {
  const [day, month, year] = date.split(".");
  return `match-${year}-${month}-${day}`;
}

export default async (request) => {
  if (request.method === "OPTIONS") return response({ ok: true });
  if (request.method !== "GET") return response({ error: "Method not allowed" }, 405);

  const matches = cfg.matches.map((match) => ({
    id: matchId(match[0]),
    date: match[0],
    time: match[1],
    home: match[2],
    away: match[3],
    type: match[4]
  }));

  return response({
    trainings: upcomingTrainings(8),
    matches,
    players: cfg.players,
  });
};
