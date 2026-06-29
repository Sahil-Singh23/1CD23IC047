import { useState } from "react";
import {
  Alert,
  Badge,
  Box,
  CircularProgress,
  Divider,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";
import { Log } from "../../../logging-middleware/dist/index.js";

const TOKEN = import.meta.env.VITE_AUTH_TOKEN;

export function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);

  const {
    notifications,
    totalPages,
    loading,
    error,
  } = useNotifications(page, filter);

  // Temporary until read/unread logic is implemented
  const unreadCount = notifications.length;

  const handleFilterChange = async (_, value) => {
    if (!value) return;

    await Log({
      stack: "frontend",
      level: "info",
      package: "page",
      message: `Notification filter changed to ${value}`,
      token: TOKEN,
    });

    setFilter(value);
    setPage(1);
  };

  const handlePageChange = async (_, value) => {
    await Log({
      stack: "frontend",
      level: "info",
      package: "page",
      message: `Notification page changed to ${value}`,
      token: TOKEN,
    });

    setPage(value);
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 4 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
        <Badge badgeContent={unreadCount} color="primary" max={99}>
          <NotificationsIcon sx={{ fontSize: 28 }} />
        </Badge>

        <Typography variant="h5" fontWeight={700}>
          Notifications
        </Typography>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ mb: 3 }}>
        <NotificationFilter
          value={filter}
          onChange={handleFilterChange}
        />
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error">
          Failed to load notifications.
        </Alert>
      )}

      {!loading && !error && notifications.length === 0 && (
        <Alert severity="info">
          No notifications found.
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

      {!loading && !error && totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}