import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import {
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  collection,
} from "firebase/firestore";
import { db } from "@/services/FirebaseConfig";
import { useAuth } from "@/context/AuthContext";

export const PushNotificationHandler = () => {
  const { user } = useAuth();

  useEffect(() => {
    const registerForPushNotificationsAsync = async () => {
      if (!user?.email) return;

      try {
        const lecturerQuery = query(
          collection(db, "lecturers"),
          where("email", "==", user.email)
        );
        const snapshot = await getDocs(lecturerQuery);

        if (snapshot.empty) return;
        const lecturerDoc = snapshot.docs[0];
        const lecturerId = lecturerDoc.id;

        if (Device.isDevice) {
          const { status: existingStatus } =
            await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }

          if (finalStatus !== "granted") return;

          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: "71f13f80-90e6-4a15-90f0-6da12aa30077",
          });

          const token = tokenData.data;

          await updateDoc(doc(db, "lecturers", lecturerId), {
            expoPushToken: token,
          });
        }
      } catch (err) {
        console.error("Push Notification Error:", err);
      }
    };

    registerForPushNotificationsAsync();
  }, [user]);

  // Optional: handle incoming notification taps
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log("User tapped notification with data:", data);
        // Handle navigation if needed
      }
    );

    return () => subscription.remove();
  }, []);

  return null;
};
