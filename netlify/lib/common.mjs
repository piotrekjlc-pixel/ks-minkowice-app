import { getStore } from "@netlify/blobs";
import cfg from "../functions/config.json" with { type: "json" };

export function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "Content-Type, X-Admin-Pin",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    },
  });
}

export function store() {
  return getStore("ks-minkowice-attendance");
}

export function authPlayer(name, pin) {
  return Boolean(cfg.pins[name]) && cfg.pins[name] === String(pin || "");
}

export function authAdmin(pin) {
  return String(pin || "") === String(cfg.adminPin);
}

function warsawDateParts(date = new Date()) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  return Object.fromEntries(
    f.formatToParts(date)
      .filter((x) => x.type !== "literal")
      .map((x) => [x.type, x.value])
  );
}

export function upcomingTrainings(count = 8) {
  const out = [];
  for (let i = 0; i < 30 && out.length < count; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const p = warsawDateParts(d);
    if (p.weekday === "Tue" || p.weekday === "Thu") {
      const ymd = `${p.year}-${p.month}-${p.day}`;
      out.push({
        id: `training-${ymd}`,
        date: ymd,
        label: p.weekday === "Tue" ? "Wtorek" : "Czwartek",
        time: "18:30",
        place: "Minkowice Oławskie",
      });
    }
  }
  return out;
}

export { cfg };
