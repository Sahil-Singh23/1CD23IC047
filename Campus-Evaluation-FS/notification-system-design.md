# Stage 1

This document defines the REST API contract for the notification platform so the frontend application can integrate with it.

---

## 1. Core Actions
The notification platform supports five essential actions:
1. **Get Notifications:** Retrieve list of notifications for the logged-in user.
2. **Mark as Read:** Mark a specific notification as read.
3. **Mark All as Read:** Mark all notifications for the user as read.
4. **Delete Notification:** Delete/dismiss a specific notification.
5. **Get Unread Count:** Get the badge count for unread notifications.

---

## 2. REST API Endpoints

### 2.1. Get Notifications
* **Method:** `GET`
* **URL:** `/api/notifications`
* **Request Headers:**
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Accept: application/json
  ```
* **Response JSON:**
  ```json
  [
    {
      "id": "1",
      "title": "Grade Updated",
      "message": "Your Math assignment has been graded.",
      "isRead": false,
      "createdAt": "2026-06-29T10:00:00Z"
    },
    {
      "id": "2",
      "title": "System Maintenance",
      "message": "The portal will be down for 1 hour tonight.",
      "isRead": true,
      "createdAt": "2026-06-29T09:00:00Z"
    }
  ]
  ```

---

### 2.2. Mark Notification as Read
* **Method:** `PATCH`
* **URL:** `/api/notifications/:id/read`
* **Request Headers:**
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```
* **Response JSON:**
  ```json
  {
    "id": "1",
    "isRead": true
  }
  ```

---

### 2.3. Mark All Notifications as Read
* **Method:** `POST`
* **URL:** `/api/notifications/read-all`
* **Request Headers:**
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json
  ```
* **Response JSON:**
  ```json
  {
    "success": true,
    "markedCount": 5
  }
  ```

---

### 2.4. Delete a Notification
* **Method:** `DELETE`
* **URL:** `/api/notifications/:id`
* **Request Headers:**
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Accept: application/json
  ```
* **Response JSON:**
  ```json
  {
    "id": "1",
    "deleted": true
  }
  ```

---

### 2.5. Get Unread Count
* **Method:** `GET`
* **URL:** `/api/notifications/unread-count`
* **Request Headers:**
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Accept: application/json
  ```
* **Response JSON:**
  ```json
  {
    "unreadCount": 1
  }
  ```

---

## 3. Real-time Notifications

We use **Server-Sent Events (SSE)** for simple, real-time notification delivery.

### SSE Connection
* **Method:** `GET`
* **URL:** `/api/notifications/stream`
* **Request Headers:**
  ```http
  Authorization: Bearer <JWT_TOKEN>
  Accept: text/event-stream
  Cache-Control: no-cache
  Connection: keep-alive
  ```

### Message Format
The server pushes a JSON event whenever a new notification arrives:
```text
event: notification
data: { "id": "3", "title": "New Evaluation", "message": "A new campus evaluation is available.", "isRead": false, "createdAt": "2026-06-29T10:30:00Z" }
```
