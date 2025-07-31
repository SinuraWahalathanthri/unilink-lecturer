import {
  View,
  Text,
  FlatList,
  Pressable,
  SafeAreaView,
  TextInput,
  Platform,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import {
  MaterialCommunityIcons,
  MaterialIcons,
  Ionicons,
} from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useNavigation, router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  or,
  and,
} from "firebase/firestore";
import { db } from "@/services/FirebaseConfig";
import { Image } from "expo-image";
import AppHeader from "@/components/AppHeader";

// Loading Components
interface LoadingComponentProps {
  message?: string;
  size?: "small" | "large";
  color?: string;
  showIcon?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
  overlay?: boolean;
  style?: any;
}

const LoadingComponent: React.FC<LoadingComponentProps> = ({
  message = "Loading...",
  size = "large",
  color = "#3D83F5",
  showIcon = true,
  iconName = "chatbubbles-outline",
  backgroundColor = "rgba(255, 255, 255, 0.95)",
  overlay = true,
  style,
}) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    rotateAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, [pulseAnim, rotateAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const containerStyle = overlay
    ? [loadingStyles.overlayContainer, { backgroundColor }, style]
    : [loadingStyles.inlineContainer, style];

  return (
    <View style={containerStyle}>
      <View style={loadingStyles.loadingContent}>
        <Animated.View
          style={[
            loadingStyles.outerRing,
            {
              transform: [{ rotate: rotateInterpolate }],
              borderColor: color,
            },
          ]}
        />

        <View style={loadingStyles.centerContent}>
          {showIcon && (
            <Animated.View
              style={[
                loadingStyles.iconContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons name={iconName} size={32} color={color} />
            </Animated.View>
          )}

          <ActivityIndicator
            size={size}
            color={color}
            style={loadingStyles.spinner}
          />
        </View>

        <View style={loadingStyles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <LoadingDot key={index} delay={index * 200} color={color} />
          ))}
        </View>

        <Text style={[loadingStyles.loadingText, { color: color }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const LoadingDot: React.FC<{ delay: number; color: string }> = ({
  delay,
  color,
}) => {
  const dotAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const dotAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    dotAnimation.start();
    return () => dotAnimation.stop();
  }, [dotAnim, delay]);

  const dotScale = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.2],
  });

  const dotOpacity = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <Animated.View
      style={[
        loadingStyles.dot,
        {
          backgroundColor: color,
          transform: [{ scale: dotScale }],
          opacity: dotOpacity,
        },
      ]}
    />
  );
};

// Chat Card Skeleton Loader
const ChatCardSkeleton: React.FC = () => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.row}>
          <Animated.View
            style={[loadingStyles.skeletonAvatar, { opacity: shimmerOpacity }]}
          />
        </View>
        <View style={styles.content}>
          <View style={[styles.row, { justifyContent: "space-between" }]}>
            <Animated.View
              style={[
                loadingStyles.skeletonLine,
                { width: "60%", opacity: shimmerOpacity },
              ]}
            />
            <Animated.View
              style={[
                loadingStyles.skeletonLine,
                { width: "20%", opacity: shimmerOpacity },
              ]}
            />
          </View>
          <View
            style={[
              styles.row,
              { justifyContent: "space-between", marginTop: 8 },
            ]}
          >
            <Animated.View
              style={[
                loadingStyles.skeletonLine,
                { width: "40%", height: 12, opacity: shimmerOpacity },
              ]}
            />
          </View>
          <Animated.View
            style={[
              loadingStyles.skeletonLine,
              {
                width: "80%",
                height: 12,
                marginTop: 8,
                opacity: shimmerOpacity,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

// Multiple Chat Card Skeletons
const ChatListSkeleton: React.FC = () => {
  return (
    <View style={{ flex: 1, paddingTop: 16 }}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <View key={item}>
          <ChatCardSkeleton />
          <View style={{ height: 2, backgroundColor: "#E5E5E5" }} />
        </View>
      ))}
    </View>
  );
};

// Empty State Component
const EmptyState: React.FC<{ onStartChat: () => void; activeTab: string }> = ({
  onStartChat,
  activeTab,
}) => {
  const isStudentTab = activeTab === "students";

  return (
    <View style={loadingStyles.emptyStateContainer}>
      <Ionicons
        name={isStudentTab ? "school-outline" : "people-outline"}
        size={64}
        color="#ccc"
      />
      <Text style={loadingStyles.emptyStateTitle}>
        No active chats with {isStudentTab ? "students" : "admins"}
      </Text>
      <Text style={loadingStyles.emptyStateSubtitle}>
        Start connecting by starting a new conversation with{" "}
        {isStudentTab ? "your students" : "admins"}
      </Text>
      <Pressable style={loadingStyles.startChatButton} onPress={onStartChat}>
        <MaterialIcons name="add" color="#ffffff" size={20} />
        <Text style={loadingStyles.startChatText}>
          Start New Chat with {isStudentTab ? "Student" : "Admin"}
        </Text>
      </Pressable>
    </View>
  );
};

// Refreshing Indicator
const RefreshIndicator: React.FC = () => {
  return (
    <View style={loadingStyles.refreshContainer}>
      <ActivityIndicator size="small" color="#3D83F5" />
      <Text style={loadingStyles.refreshText}>Refreshing chats...</Text>
    </View>
  );
};

// Tab Component
const TabButton: React.FC<{
  title: string;
  isActive: boolean;
  onPress: () => void;
  icon: string;
}> = ({ title, isActive, onPress, icon }) => {
  return (
    <Pressable
      style={[
        styles.tabButton,
        isActive ? styles.activeTab : styles.inactiveTab,
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isActive ? "#3D83F5" : "#666"}
        style={{ marginRight: 8 }}
      />
      <Text style={[styles.tabText, { color: isActive ? "#3D83F5" : "#666" }]}>
        {title}
      </Text>
    </Pressable>
  );
};

const ChatCard = ({ item, onPress, type }) => (
  <Pressable style={styles.card} onPress={() => onPress(item)}>
    <View style={styles.row}>
      <View style={styles.row}>
        {type === "admin" ? (
          <View style={styles.adminAvatar}>
            <Ionicons name="person" size={24} color="#3D83F5" />
          </View>
        ) : (
          <Image
            source={require("../../assets/images/image.png")}
            style={styles.profileImage}
          />
        )}
        <View style={styles.dot2} />
      </View>
      <View style={styles.content}>
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.metaTextLight}>{item.time}</Text>
        </View>
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <View style={styles.metaRow}>
            <Text
              style={[
                styles.tag,
                { color: type === "admin" ? "#28a745" : "#BF272E" },
              ]}
            >
              {type === "admin" ? "Admin" : "Student"}
            </Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>
              {type === "admin" ? item.institutional_id : item.degree}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={2} style={styles.metaTextLight}>
          {item.lastMessage}
        </Text>
      </View>
    </View>
  </Pressable>
);

// Admin Search Modal Component
const AdminSearchModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSelectAdmin: (admin: any) => void;
}> = ({ visible, onClose, onSelectAdmin }) => {
  const [admins, setAdmins] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "admins")); // ✅ Changed from "users"
      const adminsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAdmins(adminsList);
      setFilteredAdmins(adminsList);
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === "") {
      setFilteredAdmins(admins);
    } else {
      const filtered = admins.filter(
        (admin) =>
          admin.name.toLowerCase().includes(text.toLowerCase()) ||
          admin.email.toLowerCase().includes(text.toLowerCase()) ||
          (admin.institutional_id &&
            admin.institutional_id.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredAdmins(filtered);
    }
  };

  React.useEffect(() => {
    if (visible) {
      fetchAdmins();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={loadingStyles.modalOverlay}>
      <View style={[loadingStyles.modalContainer, { maxHeight: "85%" }]}>
        <View style={loadingStyles.modalHeader}>
          <Text style={loadingStyles.modalTitle}>Chat with Admin</Text>
          <Pressable onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color="#333" />
          </Pressable>
        </View>

        {/* Search Input */}
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.textInput}
            placeholder="Search admins by name, email, or ID..."
            value={searchText}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
        </View>

        {loading ? (
          <View style={loadingStyles.modalLoadingContainer}>
            <ActivityIndicator size="large" color="#3D83F5" />
            <Text style={loadingStyles.modalLoadingText}>
              Loading admins...
            </Text>
          </View>
        ) : filteredAdmins.length === 0 ? (
          <View style={loadingStyles.modalEmptyContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={loadingStyles.modalEmptyText}>
              {searchText
                ? "No admins found matching your search"
                : "No admins found"}
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredAdmins.map((admin) => (
              <Pressable
                key={admin.id}
                style={loadingStyles.studentItem}
                onPress={() => {
                  onSelectAdmin(admin);
                  onClose();
                }}
              >
                <View style={loadingStyles.studentInfo}>
                  <Text style={loadingStyles.studentName}>{admin.name}</Text>
                  <Text style={loadingStyles.studentDegree}>
                    ID: {admin.institutional_id} • {admin.email}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default function ChatScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("students");
  const [studentChats, setStudentChats] = useState([]);
  const [adminChats, setAdminChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const fetchAllStudents = async () => {
    setStudentsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "students"));
      const students = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllStudents(students);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchStudentChats = async () => {
    if (!user?.email) return;

    // Get lecturer doc ID using email
    const lecturerQuery = query(
      collection(db, "lecturers"),
      where("email", "==", user.email)
    );

    const lecturerSnapshot = await getDocs(lecturerQuery);
    if (lecturerSnapshot.empty) return;

    const lecturerDoc = lecturerSnapshot.docs[0];
    const lecturerId = lecturerDoc.id;

    // Fetch messages received by lecturer from students
    const receivedMessagesQuery = query(
      collection(db, "messages"),
      where("receiver_id", "==", lecturerId)
    );
    const receivedMessagesSnapshot = await getDocs(receivedMessagesQuery);

    // Build threads object keyed by sender_id (students)
    const threads = {};

    for (let docSnap of receivedMessagesSnapshot.docs) {
      const data = docSnap.data();

      // Only count if sender is NOT lecturer (i.e., student)
      if (data.sender_id === lecturerId) continue;

      const otherUser = data.sender_id;

      if (!threads[otherUser]) {
        threads[otherUser] = {
          messages: [],
          unreadCount: 0,
        };
      }

      threads[otherUser].messages.push(data);

      if (!data.isRead) {
        threads[otherUser].unreadCount += 1;
      }
    }

    const chatList = [];

    for (let studentId in threads) {
      const studentDoc = await getDoc(doc(db, "students", studentId));
      if (!studentDoc.exists()) continue;

      const studentData = studentDoc.data();

      // Sort messages by createdAt descending
      const sortedMessages = threads[studentId].messages.sort(
        (a, b) => b.createdAt.seconds - a.createdAt.seconds
      );
      const latestMessage = sortedMessages[0];

      chatList.push({
        id: studentId,
        name: studentData.name,
        email: studentData.email,
        degree: studentData.degree,
        lastMessage: latestMessage.text || "📷 Image",
        unreadCount: threads[studentId].unreadCount,
        time: new Date(
          latestMessage.createdAt.seconds * 1000
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }

    setStudentChats(chatList);
  };

  const fetchAdminChats = async () => {
    if (!user?.email) return;

    // Get lecturer doc ID using email
    const lecturerQuery = query(
      collection(db, "lecturers"),
      where("email", "==", user.email)
    );

    const lecturerSnapshot = await getDocs(lecturerQuery);
    if (lecturerSnapshot.empty) return;

    const lecturerDoc = lecturerSnapshot.docs[0];
    const lecturerId = lecturerDoc.id;

    // Fetch messages received by lecturer from any sender
    const receivedMessagesQuery = query(
      collection(db, "messages"),
      where("receiver_id", "==", lecturerId)
    );
    const receivedMessagesSnapshot = await getDocs(receivedMessagesQuery);

    const threads = {};

    for (let docSnap of receivedMessagesSnapshot.docs) {
      const data = docSnap.data();

      // Skip if sender is the lecturer themselves
      if (data.sender_id === lecturerId) continue;

      const otherUser = data.sender_id;

      if (!threads[otherUser]) {
        threads[otherUser] = {
          messages: [],
          unreadCount: 0,
        };
      }

      threads[otherUser].messages.push(data);

      if (!data.isRead) {
        threads[otherUser].unreadCount += 1;
      }
    }

    const chatList = [];

    for (let adminId in threads) {
      // Get admin document
      const adminDoc = await getDoc(doc(db, "admins", adminId));
      if (!adminDoc.exists()) continue;

      const adminData = adminDoc.data();

      const sortedMessages = threads[adminId].messages.sort(
        (a, b) => b.createdAt.seconds - a.createdAt.seconds
      );
      const latestMessage = sortedMessages[0];

      chatList.push({
        id: adminId,
        name: adminData.name,
        email: adminData.email,
        department: adminData.department,
        university_id: adminData.university_id,
        lastMessage: latestMessage.text || "📷 Image",
        unreadCount: threads[adminId].unreadCount,
        time: new Date(
          latestMessage.createdAt.seconds * 1000
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }

    setAdminChats(chatList);
  };

  const fetchChats = async () => {
    setLoading(true);
    await Promise.all([fetchStudentChats(), fetchAdminChats()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchChats();
    fetchAllStudents();
  }, []);

  const navigateToStudentChat = (student) => {
    router.push({
      pathname: "/screens/ChatScreen", // Your individual chat screen
      params: {
        lecturer: JSON.stringify(user),
        studentEmail: student.email,
        chatType: "student",
      },
    });
  };

  const navigateToAdminChat = (admin) => {
    router.push({
      pathname: "/screens/ChatScreen",
      params: {
        lecturer: JSON.stringify(user),
        adminEmail: admin.email,
        adminId: admin.id,
        chatType: "admin",
      },
    });
  };
  const handleSelectAdmin = (admin) => {
    navigateToAdminChat(admin);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    setRefreshing(false);
  };

  const openStudentModal = () => {
    setModalVisible(true);
    if (allStudents.length === 0) {
      fetchAllStudents();
    }
  };

  const openAdminModal = () => {
    setAdminModalVisible(true);
  };

  const getCurrentChats = () => {
    return activeTab === "students" ? studentChats : adminChats;
  };

  const getCurrentChatType = () => {
    return activeTab === "students" ? "student" : "admin";
  };

  const handleChatPress = (item) => {
    if (activeTab === "students") {
      navigateToStudentChat(item);
    } else {
      navigateToAdminChat(item);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View
        style={[
          styles.container,
          { paddingTop: Platform.OS === "ios" ? 0 : 36 },
        ]}
      >
        <AppHeader />

        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text style={styles.title}>Connect & Chat</Text>
              <Text style={styles.subTitle}>
                Chat with{" "}
                {activeTab === "students" ? "your students" : "administrators"}
              </Text>
            </View>
            <Pressable
              onPress={
                activeTab === "students" ? openStudentModal : openAdminModal
              }
              style={{
                paddingVertical: 10,
                paddingHorizontal: 10,
                backgroundColor: "#3D83F5",
                borderRadius: 4,
              }}
            >
              <MaterialIcons name="add" color={"#ffffff"} size={24} />
            </Pressable>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TabButton
              title="Students"
              icon="school-outline"
              isActive={activeTab === "students"}
              onPress={() => setActiveTab("students")}
            />
            <TabButton
              title="Admins"
              icon="people-outline"
              isActive={activeTab === "admins"}
              onPress={() => setActiveTab("admins")}
            />
          </View>
        </View>

        <View style={{ flex: 1 }}>
          {loading ? (
            <ChatListSkeleton />
          ) : getCurrentChats().length === 0 ? (
            <EmptyState
              onStartChat={
                activeTab === "students" ? openStudentModal : openAdminModal
              }
              activeTab={activeTab}
            />
          ) : (
            <>
              {refreshing && <RefreshIndicator />}
              <FlatList
                data={getCurrentChats()}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ChatCard
                    item={item}
                    onPress={handleChatPress}
                    type={getCurrentChatType()}
                  />
                )}
                contentContainerStyle={{
                  paddingBottom: Platform.OS === "ios" ? 80 : 40,
                  marginTop: 16,
                }}
                ItemSeparatorComponent={() => (
                  <View style={{ height: 2, backgroundColor: "#E5E5E5" }} />
                )}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                showsVerticalScrollIndicator={false}
              />
            </>
          )}
        </View>

        {/* Students Modal */}
        {modalVisible && (
          <View style={loadingStyles.modalOverlay}>
            <View style={loadingStyles.modalContainer}>
              <View style={loadingStyles.modalHeader}>
                <Text style={loadingStyles.modalTitle}>All Students</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={22} color="#333" />
                </Pressable>
              </View>

              {studentsLoading ? (
                <View style={loadingStyles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#3D83F5" />
                  <Text style={loadingStyles.modalLoadingText}>
                    Loading students...
                  </Text>
                </View>
              ) : allStudents.length === 0 ? (
                <View style={loadingStyles.modalEmptyContainer}>
                  <Ionicons name="people-outline" size={48} color="#ccc" />
                  <Text style={loadingStyles.modalEmptyText}>
                    No students found
                  </Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {allStudents.map((student) => (
                    <Pressable
                      key={student.id}
                      style={loadingStyles.studentItem}
                      onPress={() => {
                        setModalVisible(false);
                        navigateToStudentChat(student);
                      }}
                    >
                      <View style={loadingStyles.studentInfo}>
                        <Text style={loadingStyles.studentName}>
                          {student.name}
                        </Text>
                        <Text style={loadingStyles.studentDegree}>
                          {student.degree}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}

        {/* Admin Search Modal */}
        <AdminSearchModal
          visible={adminModalVisible}
          onClose={() => setAdminModalVisible(false)}
          onSelectAdmin={handleSelectAdmin}
        />
      </View>
    </SafeAreaView>
  );
}

const loadingStyles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  inlineContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  outerRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: "dashed",
    opacity: 0.3,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
  },
  iconContainer: {
    position: "absolute",
    top: 8,
  },
  spinner: {
    position: "absolute",
    bottom: 8,
  },
  dotsContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
    fontFamily: "Lato",
  },
  // Skeleton styles
  skeletonAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e0e0e0",
  },
  skeletonLine: {
    height: 16,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
  },
  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  startChatButton: {
    backgroundColor: "#3D83F5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  startChatText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  // Refresh indicator styles
  refreshContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    marginTop: 16,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  refreshText: {
    marginLeft: 8,
    color: "#3D83F5",
    fontSize: 14,
    fontFamily: "Lato",
  },
  // Modal styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "100%",
    maxHeight: "80%",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "LatoBold",
  },
  modalLoadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  modalLoadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
    fontFamily: "Lato",
  },
  modalEmptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  modalEmptyText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
    fontFamily: "Lato",
  },
  studentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontWeight: "500",
    fontSize: 16,
    fontFamily: "LatoBold",
  },
  studentDegree: {
    color: "#777",
    fontSize: 14,
    marginTop: 2,
    fontFamily: "Lato",
  },
});

const styles = StyleSheet.create({
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#3d83f5",
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 2,
  },
  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
  },
  cardTitle: {
    fontFamily: "LatoBold",
    fontSize: 16,
    lineHeight: 29,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  image: {
    width: 148,
    height: 65,
    alignSelf: "center",
    marginTop: 14,
  },
  content: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontFamily: "LatoBold",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "600",
  },
  subTitle: {
    marginTop: 6,
    fontFamily: "Lato",
    fontSize: 16,
    lineHeight: 19,
    color: "#6B6B6B",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: -4,
    marginBottom: 5,
  },
  tag: {
    fontFamily: "LatoBold",
    fontSize: 14,
  },
  metaText: {
    color: "#6B6B6B",
    fontFamily: "LatoBold",
    fontSize: 14,
  },
  metaTextLight: {
    color: "#6B6B6B",
    fontFamily: "Lato",
    fontSize: 14,
    marginTop: 4,
  },
  dot: {
    marginHorizontal: 6,
    color: "#6B6B6B",
    fontSize: 20,
  },
  dot2: {
    width: 10,
    height: 10,
    marginHorizontal: 6,
    backgroundColor: "#48d562",
    borderRadius: 10,
    position: "absolute",
    top: 50,
    bottom: 2,
    right: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    alignItems: "center",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  author: {
    fontFamily: "LatoBold",
    color: "#3A3A3A",
    fontSize: 13,
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    alignSelf: "center",
    borderRadius: 100,
  },
  inputContainer: {
    marginTop: 8,
  },
  label: {
    fontFamily: "Lato",
    fontSize: 14,
    lineHeight: 20,
    color: "#505050",
  },
  searchInputWrapper: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16,
    backgroundColor: "#f3f4f6",
  },
  textInput: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Lato",
    marginLeft: 8,
    paddingVertical: 0,
    flex: 1,
  },
  focusedInput: {
    borderColor: "#3D83F5",
    borderWidth: 1,
  },
  // Tab styles
  tabContainer: {
    flexDirection: "row",
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inactiveTab: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "LatoBold",
  },
});
