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

---

# Stage 3

This section analyzes query performance, explains indexing strategies, and writes an optimized query for specific category notifications.

---

## 1. Query Analysis

The legacy developer wrote the following query to fetch unread notifications for a student:
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

### 1.1. Is this query accurate?
**Yes, it is logically correct.** It correctly filters the notifications table by the student's ID (`studentID = 1042`), filters out read notifications (`isRead = false`), and sorts them in ascending order of their creation date (`createdAt ASC`).

### 1.2. Why is this query performing slowly?
As the database scaled to 50,000 students and 5,000,000 notifications, the query slowed down because:
1. **Full Table Scan:** In the absence of a proper index, the database must perform a sequential scan of all 5,000,000 rows to find those matching `studentID = 1042` and `isRead = false`.
2. **Sorting Overhead (Filesort):** The query performs `ORDER BY createdAt ASC`. Since the records are not pre-sorted in the database, the engine must fetch all filtered unread rows and sort them in-memory or on-disk (using temporary files). This is highly CPU and memory intensive.

---

## 2. Recommended Improvement & Computational Cost

### 2.1. Proposed Change
To resolve the slow scan and sorting issues, we must add a **composite index** on the exact filter and sort columns:

```sql
CREATE INDEX idx_notifications_student_unread_created 
ON notifications (studentID, isRead, createdAt ASC);
```

### 2.2. Expected Computational Cost (Time Complexity)

| Phase | Time Complexity Before (No Index) | Time Complexity After (With Composite Index) |
| :--- | :--- | :--- |
| **Filtering (Search)** | **$O(N)$** (Sequential search scanning $N = 5,000,000$ rows) | **$O(\log N)$** (Binary search on B-tree index) |
| **Sorting** | **$O(M \log M)$** (Sorting $M$ matching unread notifications) | **$O(1)$** (The index is already stored pre-sorted by `createdAt ASC`) |
| **Total Query Cost** | **$O(N + M \log M)$** | **$O(\log N + K)$** (where $K$ is the number of rows matching the query) |

*This reduces execution time from seconds to milliseconds.*

---

## 3. Critiquing "Index on Every Column" Advice

Another developer suggested adding individual indexes on *every single column* to be safe. 

**This is a bad idea (an indexing anti-pattern) for several reasons:**

1. **Severe Write Overhead:** Every `INSERT`, `UPDATE`, and `DELETE` operation requires updating not just the row, but also every single index on the table. With 5,000,000 rows and multiple columns, write performance will drop drastically.
2. **Storage and RAM Bloat:** Indexes require physical disk space and memory (RAM). Indexing every column will result in index sizes that can easily exceed the actual table data size, crowding out the database cache.
3. **Ineffective for Multi-Column Filtering:** Databases generally use only one index per table access. Having individual indexes on `studentID`, `isRead`, and `createdAt` separately does **not** help speed up a combined filter and sort; the database would have to scan one index and then filter the rest manually. A single **composite index** is far superior.

---

## 4. Query for Placement Notifications (Last 7 Days)

To find all students who received a "Placement" notification in the last 7 days (where `notificationType` is an enum of `Event`, `Result`, `Placement`):

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= NOW() - INTERVAL '7 days';
```
*(Note: `SELECT DISTINCT` is used to ensure each student ID is only returned once, even if they received multiple placement notifications).*

---

# Stage 4

This section outlines performance improvements to prevent database overwhelm caused by redundant querying on each page load.

---

## 1. Why Page Load Querying is Inefficient
Fetching notifications from the relational database on every single page load is highly inefficient because:
* **High Read Amplification:** A student navigating through different pages on a portal makes dozens of page transitions. Executing a database scan for every single transition is highly redundant since notifications rarely change between clicks.
* **Database Contention:** With 50,000 active students clicking through the application, the database is slammed with thousands of duplicate read requests per second, driving up CPU and disk I/O.
* **Unnecessary Network and Latency Costs:** Fetching full notification payloads repeatedly introduces substantial application latency and degrades the overall user experience.

---

## 2. Performance Improvement Strategies & Trade-offs

To resolve this issue and improve system performance, we suggest three main strategies:

### Strategy 1: Server-Side In-Memory Caching (Redis)
Store each user's active notification feed and unread badge count in an in-memory cache like **Redis**. The API first checks Redis; if the data exists, it returns it instantly without hitting the main database.

* **Advantages:**
  * Sub-millisecond retrieval speeds (extreme performance boost).
  * Drastically reduces primary database read load by up to 90%+.
* **Trade-offs:**
  * **Cache Invalidation Complexity:** The cache must be carefully invalidated or updated whenever a new notification is sent, marked as read, or deleted.
  * **Infrastructure Overhead:** Requires hosting and maintaining a Redis cluster, adding to operational complexity and cost.

---

### Strategy 2: Event-Driven Real-time Push (Server-Sent Events)
As designed in Stage 1, establish a long-lived **Server-Sent Events (SSE)** connection when the student logs in. The frontend fetches the notification list **only once** on application startup. From that point on, new notifications are pushed in real-time over the stream, updating the UI memory state without querying the database again.

* **Advantages:**
  * Completely eliminates query-on-page-load behavior.
  * Eliminates redundant API polling or pull requests.
  * Provides an instant, seamless, real-time user experience.
* **Trade-offs:**
  * **Connection Scaling Limits:** Maintaining 50,000 active, persistent TCP connections requires high-concurrency servers (like Node.js or Go) and correctly configured load balancers.
  * **Server Memory Consumption:** Each persistent connection consumes socket handles and server memory.

---

### Strategy 3: Client-Side State Management and Browser Caching
Utilize global state management (e.g., React Context, Redux, or TanStack/React Query) paired with browser storage (`sessionStorage` or `localStorage`). The frontend fetches notifications once and caches them in client-side state. Subsequent page transitions simply read from the in-memory frontend state.

* **Advantages:**
  * Zero server requests or database queries during page navigation.
  * Extremely easy to implement on the frontend.
* **Trade-offs:**
  * **Stale Data Risk:** If a user has the application open in multiple tabs, changes in one tab (e.g., marking a notification as read) will not sync automatically to other tabs unless paired with a real-time push channel (like SSE).

---

# Stage 5

This section analyzes the synchronous "Notify All" bottleneck, explains how partial failures are handled, and redesigns the system for highly reliable and fast execution.

---

## 1. Shortcomings of the Synchronous Loop
The proposed synchronous loop implementation has critical flaws:
1. **Blocking & Slowness:** It runs in a sequential `for` loop. Sending an email takes ~100ms. For 50,000 students, the loop would take **over 1.3 hours** to run, blocking the server and causing the HR's HTTP request to timeout.
2. **Cascading Failures:** If the code crashes or the server restarts midway, the process stops. There is no way to resume or know who was missed without duplicate sending.
3. **Tight Coupling:** Email APIs, DB writes, and socket pushes are synchronous. If the external Email API is slow or down, the database saves and app pushes are completely blocked.

---

## 2. Mid-Loop Failure Impact
When the `send_email` call fails for 200 students midway:
* **The Entire Process Stops:** The loop crashes or throws an exception.
* **Partial State Inconsistency:** Students before the failure received the notification. Students after the failure receive absolutely nothing.
* **Double Sending Risk:** Restarting the loop would send duplicate notifications to those who already received them.

---

## 3. High Performance Redesign: Decoupling via Queue

To make this system extremely reliable and lightning-fast:
* **Decouple Database Writes & Email Sending:** These operations **must happen separately**. Emails are external and slow; DB writes are internal and fast. They should never block each other.
* **Asynchronous Message Queue:** The HTTP request accepts the job, pushes a bulk event to a Message Queue (e.g., Redis-backed BullMQ or RabbitMQ), and **instantly returns a `202 Accepted` status** to the HR (taking under 10ms).
* **Worker Pools:** Independent background workers pull tasks from the queue and execute them concurrently.

---

## 4. Revised Pseudocode (Asynchronous)

```javascript
// 1. API Route Handler (Runs in 10ms)
function notify_all(student_ids, message):
    // Push the bulk job to the queue and return immediately
    MessageQueue.enqueue("bulk_notification", { student_ids, message })
    return { success: true, message: "Bulk notification accepted and processing in background." }

// 2. Queue Job Splitter (Runs in background)
function process_bulk_notification(bulk_job):
    const { student_ids, message } = bulk_job.data
    for student_id in student_ids:
        // Enqueue separate, independent tasks for email and in-app DB/Push
        MessageQueue.enqueue("send_email_task", { student_id, message })
        MessageQueue.enqueue("save_and_push_task", { student_id, message })

// 3. Email Worker (Handles retries and failures independently)
function process_send_email_task(email_job):
    const { student_id, message } = email_job.data
    try {
        send_email(student_id, message)
    } catch (err) {
        // Failed jobs are automatically retried by the queue framework (e.g., with exponential backoff)
        throw err 
    }

// 4. DB & Push Worker
function process_save_and_push_task(in_app_job):
    const { student_id, message } = in_app_job.data
    try {
        save_to_db(student_id, message)
        push_to_app(student_id, message) // Real-time SSE stream push
    } catch (err) {
        throw err
    }
```
