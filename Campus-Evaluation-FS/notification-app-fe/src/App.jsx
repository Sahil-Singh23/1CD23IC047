import { Routes, Route, Link } from "react-router-dom";
import { AppBar, Toolbar, Button } from "@mui/material";

import { NotificationsPage } from "./pages/NotificationsPage";
import { PriorityNotifications } from "./pages/PriorityNotifications";

export default function App() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" component={Link} to="/">
            All Notifications
          </Button>

          <Button color="inherit" component={Link} to="/priority">
            Priority Inbox
          </Button>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<NotificationsPage />} />
        <Route path="/priority" element={<PriorityNotifications />} />
      </Routes>
    </>
  );
}