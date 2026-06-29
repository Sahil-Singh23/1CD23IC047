import { Card, CardContent, Typography, Box, Stack } from "@mui/material";
import WorkIcon from "@mui/icons-material/Work";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EventIcon from "@mui/icons-material/Event";
import NotificationsIcon from "@mui/icons-material/Notifications";

const typeConfigs = {
  Placement: {
    color: "#1976d2", // primary blue
    bgColor: "#e3f2fd",
    icon: <WorkIcon sx={{ color: "#1976d2" }} />,
  },
  Result: {
    color: "#2e7d32", // success green
    bgColor: "#e8f5e9",
    icon: <AssignmentIcon sx={{ color: "#2e7d32" }} />,
  },
  Event: {
    color: "#ed6c02", // warning orange
    bgColor: "#fff3e0",
    icon: <EventIcon sx={{ color: "#ed6c02" }} />,
  },
};

const fallbackConfig = {
  color: "#757575", // grey
  bgColor: "#f5f5f5",
  icon: <NotificationsIcon sx={{ color: "#757575" }} />,
};

export function NotificationCard({ notification }) {
  if (!notification) return null;

  const { Type, Message, Timestamp } = notification;
  const config = typeConfigs[Type] || fallbackConfig;

  const formattedDate = new Date(Timestamp).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card
      elevation={1}
      sx={{
        borderLeft: `5px solid ${config.color}`,
        borderRadius: "8px",
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: config.bgColor,
              flexShrink: 0,
            }}
          >
            {config.icon}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: "space-between", alignItems: "center", mb: 0.5 }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ color: config.color, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.5px" }}
              >
                {Type || "Notification"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formattedDate}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.5 }}>
              {Message}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
