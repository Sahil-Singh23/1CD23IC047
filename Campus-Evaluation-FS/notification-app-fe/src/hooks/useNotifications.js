import { useState, useEffect } from "react";
import { fetchNotifications } from "../api/notifications";
import { Log } from "../../../logging-middleware/dist/index.js";

const TOKEN = import.meta.env.VITE_AUTH_TOKEN;

export function useNotifications(page, filter) {
  const [notifications, setNotifications] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        await Log({
          stack: "frontend",
          level: "info",
          package: "hook",
          message: `Loading notifications (page=${page}, filter=${filter})`,
          token: TOKEN,
        });

        const data = await fetchNotifications(page, 10, filter);

        setNotifications(data.notifications || []);

        if (data.totalPages) {
          setTotalPages(data.totalPages);
        }

        await Log({
          stack: "frontend",
          level: "info",
          package: "hook",
          message: `Loaded ${data.notifications?.length ?? 0} notifications`,
          token: TOKEN,
        });
      } catch (err) {
        setError(err.message);

        await Log({
          stack: "frontend",
          level: "error",
          package: "hook",
          message: err.message,
          token: TOKEN,
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [page, filter]);

  return {
    notifications,
    totalPages,
    loading,
    error,
  };
}