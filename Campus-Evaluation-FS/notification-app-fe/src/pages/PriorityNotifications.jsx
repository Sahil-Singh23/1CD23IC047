import { useState, useEffect } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";

import { NotificationCard } from "../components/NotificationCard";
import { fetchNotifications } from "../api/notifications";
import { Log } from "../../../logging-middleware/dist/index.js";

const TOKEN = import.meta.env.VITE_AUTH_TOKEN;

const weights = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

export function PriorityNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPriority() {
      try {
        setLoading(true);
        setError("");

        await Log({
          stack: "frontend",
          level: "info",
          package: "page",
          message: "Loading priority notifications",
          token: TOKEN,
        });

        const data = await fetchNotifications(1, 10, "All");
        const list = data.notifications || [];

        const sorted = [...list]
          .sort((a, b) => {
            const weightA = weights[a.Type] || 0;
            const weightB = weights[b.Type] || 0;
            const weightDiff = weightB - weightA;

            if (weightDiff !== 0) {
              return weightDiff;
            }

            return new Date(b.Timestamp) - new Date(a.Timestamp);
          })
          .slice(0, 10);

        setNotifications(sorted);

        await Log({
          stack: "frontend",
          level: "info",
          package: "page",
          message: `Generated priority inbox with ${sorted.length} notifications`,
          token: TOKEN,
        });
      } catch (err) {
        setError(err.message);

        await Log({
          stack: "frontend",
          level: "error",
          package: "page",
          message: err.message,
          token: TOKEN,
        });
      } finally {
        setLoading(false);
      }
    }

    loadPriority();
  }, []);

  return (
    <Box sx={{ maxWidth: 600, margin: "auto", padding: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <StarIcon sx={{ fontSize: 28, color: "#ffb300" }} />
        <Typography variant="h5" fontWeight={700}>
          Priority Inbox
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your most critical updates prioritized by relevance (Placement,
        Results, and Events).
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">
          Failed to load priority notifications.
        </Alert>
      )}

      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info">
          No priority notifications found.
        </Alert>
      )}

      {!loading && !error && notifications.length > 0 && (
        <Stack spacing={2}>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.ID}
              notification={notification}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}