// hooks/usePushNotifications.js
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/services/FirebaseConfig";

export default function usePushNotifications(userEmail) {
    useEffect(() => {
        const registerPushToken = async () => {
            const { status } = await Notifications.getPermissionsAsync();
            let finalStatus = status;

            if (status !== 'granted') {
                const { status: askStatus } = await Notifications.requestPermissionsAsync();
                finalStatus = askStatus;
            }

            if (finalStatus !== 'granted') return;

            const tokenData = await Notifications.getExpoPushTokenAsync();
            const pushToken = tokenData.data;

            if (Platform.OS === 'android') {
                Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }

            // Update lecturer's document with push token
            if (userEmail) {
                const q = query(collection(db, "lecturers"), where("email", "==", userEmail));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const lecturerDoc = snapshot.docs[0];
                    await updateDoc(doc(db, "lecturers", lecturerDoc.id), {
                        expoPushToken: pushToken,
                    });
                }
            }
        };

        registerPushToken();
    }, [userEmail]);
}
