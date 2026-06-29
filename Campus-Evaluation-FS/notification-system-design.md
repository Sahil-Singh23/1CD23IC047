# Stage 1

This is the REST API design, contract, and structure for the notification platform, prepared for frontend integration.

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

---

# Stage 2

This section explains the database choice, schema design, scalability considerations, and raw SQL queries required to back the Stage 1 APIs reliably.

---

## 1. Database Selection: PostgreSQL
We suggest **PostgreSQL** (a relational SQL database) for the following reasons:
* **Strong ACID Compliance:** Crucial for accurately tracking whether a user has read or deleted a notification across multiple devices/tabs.
* **Efficient Composite Indexing:** Highly-optimized indexes can be created specifically for common read patterns, such as finding a single user's unread notifications ordered by time.
* **Extensible & Flexible:** It can handle unstructured payload/metadata seamlessly using the native `JSONB` data type if we need to store additional event-specific data in the future.

---

## 2. Database Schema
We design a simple, robust table structure with a highly optimized index for fast querying.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crucial composite index to optimize read performance and badge counting
CREATE INDEX idx_notifications_user_unread_date 
ON notifications (user_id, is_read, created_at DESC);
```

---

## 3. High Volume Challenges & Solutions

As data volume grows (e.g., millions of notifications generated per month), the following issues may arise:

### Challenge 1: Degrading Read Performance
* **Problem:** Large table scans will slow down the common queries for pulling notifications and checking the unread count.
* **Solution:** The composite index on `(user_id, is_read, created_at DESC)` ensures that queries avoid full table scans and remain fast. Additionally, we can cache the unread badge count in **Redis** (incrementing on new notifications and resetting/decrementing on reads) so we don't hit the database for every page load.

### Challenge 2: Storage Bloat and High Disk Usage
* **Problem:** Read or stale notifications accumulate indefinitely, consuming database storage and memory.
* **Solution:** Implement a **Data Archival & Retention Policy**. For example, a nightly background cron job deletes or archives read/dismissed notifications older than 30 days:
  ```sql
  DELETE FROM notifications 
  WHERE is_read = TRUE AND created_at < NOW() - INTERVAL '30 days';
  ```

### Challenge 3: Table Size Growth
* **Problem:** Even unread notifications can grow over time, causing the table size to reach tens of millions of rows.
* **Solution:** Implement **Horizontal Table Partitioning** by `created_at` (e.g., monthly partitions) so old partitions can be easily archived or dropped.

---

## 4. Database Queries (PostgreSQL)

Below are the raw SQL queries mapping to the REST APIs designed in Stage 1:

### 4.1. Get Notifications (Paginated)
Retrieves the logged-in user's notifications.
```sql
SELECT id, title, message, is_read, created_at
FROM notifications
WHERE user_id = :user_id
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
```

### 4.2. Mark Notification as Read
Marks a single notification as read.
```sql
UPDATE notifications
SET is_read = TRUE
WHERE id = :id AND user_id = :user_id;
```

### 4.3. Mark All Notifications as Read
Marks all unread notifications as read at once for the authenticated user.
```sql
UPDATE notifications
SET is_read = TRUE
WHERE user_id = :user_id AND is_read = FALSE;
```

### 4.4. Delete a Notification
Removes a specific notification permanently.
```sql
DELETE FROM notifications
WHERE id = :id AND user_id = :user_id;
```

### 4.5. Get Unread Count
Quickly retrieves the badge count of unread notifications. This query is extremely fast due to our composite index.
```sql
SELECT COUNT(*) AS unread_count
FROM notifications
WHERE user_id = :user_id AND is_read = FALSE;
```
