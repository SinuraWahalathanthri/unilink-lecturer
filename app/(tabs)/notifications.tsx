import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/services/FirebaseConfig";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";

const NotificationItem = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
}) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case "event":
        return "event";
      case "community":
        return "groups";
      case "message":
        return "email";
      case "announcement":
        return "campaign";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "event":
        return "#10B981";
      case "community":
        return "#3D83F5";
      case "message":
        return "#F59E0B";
      case "announcement":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    const now = new Date();
    const notificationDate = timestamp.toDate();
    const diffTime = Math.abs(now - notificationDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  };

  return (
    <Pressable
      style={[
        styles.notificationItem,
        !notification.is_read && styles.unreadNotification,
      ]}
      onPress={() => onPress(notification)}
    >
      <View style={styles.notificationContent}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: getNotificationColor(notification.related_type),
            },
          ]}
        >
          <MaterialIcons
            name={getNotificationIcon(notification.related_type)}
            size={20}
            color="#fff"
          />
        </View>

        <View style={styles.notificationDetails}>
          <Text
            style={[
              styles.notificationText,
              !notification.is_read && styles.unreadText,
            ]}
            numberOfLines={2}
          >
            {notification.message_text}
          </Text>
          <View style={styles.notificationMeta}>
            <Text style={styles.notificationType}>
              {notification.related_type.charAt(0).toUpperCase() +
                notification.related_type.slice(1)}
            </Text>
            <Text style={styles.notificationTime}>
              {formatTimestamp(notification.timestamp)}
            </Text>
          </View>
        </View>

        {!notification.is_read && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.notificationActions}>
        {!notification.is_read && (
          <Pressable
            style={styles.actionButton}
            onPress={() => onMarkAsRead(notification)}
          >
            <MaterialIcons name="done" size={18} color="#10B981" />
          </Pressable>
        )}
        <Pressable
          style={styles.actionButton}
          onPress={() => onDelete(notification)}
        >
          <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
        </Pressable>
      </View>
    </Pressable>
  );
};

const Notifications = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get lecturer ID from email
  useEffect(() => {
    if (user?.email) {
      const fetchLecturerId = async () => {
        const q = query(
          collection(db, "lecturers"),
          where("email", "==", user.email)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setCurrentUserId(snapshot.docs[0].id);
        } else {
          console.warn("Lecturer not found for email:", user.email);
        }
      };

      fetchLecturerId();
    }
  }, [user]);

  useEffect(() => {
    if (currentUserId) fetchNotifications();
  }, [currentUserId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("lecturer_id", "==", currentUserId),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(notificationsQuery);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification) => {
    if (!notification.is_read) await markAsRead(notification);

    switch (notification.related_type) {
      case "event":
        router.push(`/events/${notification.related_id}`);
        break;
      case "community":
        router.push(`/communities/${notification.related_id}`);
        break;
      case "message":
        router.push(`/messages/${notification.related_id}`);
        break;
      default:
        break;
    }
  };

  const markAsRead = async (notification) => {
    try {
      await updateDoc(doc(db, "notifications", notification.id), {
        is_read: true,
      });

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      Alert.alert("Error", "Failed to mark as read");
    }
  };

  const deleteNotification = async (notification) => {
    Alert.alert(
      "Delete",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "notifications", notification.id));
              setNotifications((prev) =>
                prev.filter((item) => item.id !== notification.id)
              );
            } catch (error) {
              console.error("Error deleting notification:", error);
              Alert.alert("Error", "Failed to delete notification");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View
        style={[
          styles.container,
          { paddingTop: Platform.OS === "ios" ? 0 : 36 },
        ]}
      >
        <View style={{ paddingHorizontal: 16 }}>
          <AppHeader />
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={handleNotificationPress}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="notifications-none" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>
                You don't have any notifications yet.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  activeFilterTab: {
    backgroundColor: "#3D83F5",
  },
  filterTabText: {
    fontFamily: "Lato",
    fontSize: 14,
    color: "#6D6D6E",
  },
  activeFilterTabText: {
    fontFamily: "LatoBold",
    color: "#fff",
  },
  filterBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  activeFilterBadge: {
    backgroundColor: "#fff",
  },
  filterBadgeText: {
    fontFamily: "LatoBold",
    fontSize: 10,
    color: "#6D6D6E",
  },
  activeFilterBadgeText: {
    color: "#3D83F5",
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  unreadNotification: {
    backgroundColor: "#F8FAFC",
  },
  notificationContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationDetails: {
    flex: 1,
  },
  notificationText: {
    fontFamily: "Lato",
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  unreadText: {
    fontFamily: "LatoBold",
    color: "#000",
  },
  notificationMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  notificationType: {
    fontFamily: "LatoBold",
    fontSize: 11,
    color: "#3D83F5",
    textTransform: "uppercase",
  },
  notificationTime: {
    fontFamily: "Lato",
    fontSize: 11,
    color: "#9CA3AF",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3D83F5",
    marginLeft: 8,
  },
  notificationActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: "LatoBold",
    fontSize: 18,
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: "Lato",
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default Notifications;
