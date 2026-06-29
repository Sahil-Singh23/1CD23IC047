import type{ LogRequest, LogResponse } from "./types.js";
const LOG_URL =
  "http://4.224.186.213/evaluation-service/logs";
export async function Log({
  stack,
  level,
  package: pkg,
  message,
}: LogRequest): Promise<LogResponse | null> {
  try {
    const response = await fetch(LOG_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.JWT_TOKEN}`
      },
      body: JSON.stringify({
        stack,
        level,
        package: pkg,
        message,
      }),
    });
    if (!response.ok) {
      throw new Error(`Logging failed (${response.status})`);
    }
    return await response.json();
  } catch (err) {
    console.error("Logger Error:", err);
    return null;
  }
}