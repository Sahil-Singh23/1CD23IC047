import { Log } from "../../../logging-middleware/dist/index.js";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const TOKEN = import.meta.env.VITE_AUTH_TOKEN;

export async function fetchNotifications(page = 1, limit = 10, type = "All") {
  let url = `${BASE_URL}/notifications?page=${page}&limit=${limit}`;

  if (type !== "All") {
    url += `&notification_type=${type}`;
  }

  await Log({
    stack: "frontend",
    level: "info",
    package: "api",
    message: `Fetching notifications page=${page} type=${type}`,
    token: TOKEN,
  });

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    if (!response.ok) {
      await Log({
        stack: "frontend",
        level: "error",
        package: "api",
        message: `Notification API failed (${response.status})`,
        token: TOKEN,
      });

      throw new Error("Failed to fetch notifications");
    }

    const data = await response.json();

    await Log({
      stack: "frontend",
      level: "info",
      package: "api",
      message: `Fetched ${data.notifications?.length ?? 0} notifications`,
      token: TOKEN,
    });

    return data;
  } catch (err) {
    await Log({
      stack: "frontend",
      level: "error",
      package: "api",
      message: err.message,
      token: TOKEN,
    });

    throw err;
  }
}