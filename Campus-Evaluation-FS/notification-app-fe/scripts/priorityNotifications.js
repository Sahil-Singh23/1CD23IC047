import dotenv from "dotenv";

dotenv.config();

const API_URL = "http://4.224.186.213/evaluation-service/notifications";

const weights = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

async function getTopNotifications(limit = 10) {
  try {
    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${process.env.VITE_AUTH_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const { notifications } = await response.json();

    const topNotifications = notifications
      .sort((a, b) => {
        const weightDiff = weights[b.Type] - weights[a.Type];

        if (weightDiff !== 0) {
          return weightDiff;
        }

        return new Date(b.Timestamp) - new Date(a.Timestamp);
      })
      .slice(0, limit);

    console.log("\nTop Priority Notifications\n");

    console.table(
      topNotifications.map((notification, index) => ({
        Rank: index + 1,
        Type: notification.Type,
        Message: notification.Message,
        Timestamp: notification.Timestamp,
      }))
    );
  } catch (error) {
    console.error(error.message);
  }
}

getTopNotifications();