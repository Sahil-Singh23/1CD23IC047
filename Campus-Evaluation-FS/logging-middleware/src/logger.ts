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
        "Authorization": `Bearer ${"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzYWhpbDA5MTIwNUBnbWFpbC5jb20iLCJleHAiOjE3ODI3MTEzNDYsImlhdCI6MTc4MjcxMDQ0NiwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjJkZGY3MjAwLTAyZDgtNDhlMC1hZDM5LWYwM2Q5ZDk3YTkwMyIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InNhaGlsIHNpbmdoIiwic3ViIjoiN2M4YTkzNjktZGY1Yy00MGIwLWE3MmYtYTIzYTAxYzgyN2E1In0sImVtYWlsIjoic2FoaWwwOTEyMDVAZ21haWwuY29tIiwibmFtZSI6InNhaGlsIHNpbmdoIiwicm9sbE5vIjoiMWNkMjNpYzA0NyIsImFjY2Vzc0NvZGUiOiJBcG5wVG0iLCJjbGllbnRJRCI6IjdjOGE5MzY5LWRmNWMtNDBiMC1hNzJmLWEyM2EwMWM4MjdhNSIsImNsaWVudFNlY3JldCI6IlB6S1FkVFhKUmZkeWpCZXQifQ.ZVwxQq_mkNDtmF9_AxB-oGay4IIZeOfX5mpAlQjj8YM"}`
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