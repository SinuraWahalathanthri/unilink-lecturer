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
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
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

const ChatCard = ({ item, onPress }) => (
  <Pressable style={styles.card} onPress={() => onPress(item)}>
    <View style={styles.row}>
      <View style={styles.row}>
        <Image
          source={require("../../assets/images/hackthonImage.png")}
          style={styles.profileImage}
        />
        <View style={styles.dot2} />
      </View>
      <View style={styles.content}>
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.metaTextLight}>{item.time}</Text>
        </View>
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <View style={styles.metaRow}>
            <Text style={styles.tag}>Student</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>{item.degree}</Text>
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

export default function ChatScreen() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [allStudents, setAllStudents] = useState([]);

  const fetchAllStudents = async () => {
    const snapshot = await getDocs(collection(db, "students"));
    const students = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setAllStudents(students);
  };

  const fetchChats = async () => {
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

    // Fetch messages where lecturer is either sender or receiver
    const messagesSnapshot = await getDocs(
      query(
        collection(db, "messages")
        // Firestore doesn't support OR, so just get all messages where
        // receiver_id == lecturerId OR sender_id == lecturerId
        // Here we just fetch all messages where lecturer is either sender or receiver
      )
    );

    // We'll get all messages where lecturer is either sender or receiver:
    // For unread count, only count messages where:
    // sender_id !== lecturerId (i.e., sender is student)
    // receiver_id === lecturerId
    // AND isRead === false

    // But Firestore doesn't support OR in queries easily, so better to do two queries:

    // 1. Messages received by lecturer (receiver_id == lecturerId)
    const receivedMessagesQuery = query(
      collection(db, "messages"),
      where("receiver_id", "==", lecturerId)
    );
    const receivedMessagesSnapshot = await getDocs(receivedMessagesQuery);

    // 2. Messages sent by lecturer (sender_id == lecturerId) - usually no unread needed here

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

    setChats(chatList);
    setLoading(false);
  };

  useEffect(() => {
    fetchChats();
    fetchAllStudents();
  }, []);

  const navigateToChat = (student) => {
    router.push({
      pathname: "/screens/ChatScreen",
      params: {
        lecturer: JSON.stringify(user),
        studentEmail: student.email,
      },
    });
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
              <Text style={styles.title}>Connect with Students</Text>
              <Text style={styles.subTitle}>
                View all chats with your students
              </Text>
            </View>
            <Pressable
              onPress={() => setModalVisible(true)}
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
        </View>

        <View style={{ flex: 1 }}>
          {loading ? (
            <Text style={{ padding: 20 }}>Loading chats...</Text>
          ) : chats.length === 0 ? (
            <Text style={{ padding: 20 }}>You have no active chats.</Text>
          ) : (
            <FlatList
              data={chats}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ChatCard item={item} onPress={navigateToChat} />
              )}
              contentContainerStyle={{
                paddingBottom: Platform.OS === "ios" ? 80 : 40,
                marginTop: 16,
              }}
              ItemSeparatorComponent={() => (
                <View style={{ height: 2, backgroundColor: "#E5E5E5" }} />
              )}
            />
          )}
        </View>

        {modalVisible && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
              padding: 16,
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 12,
                width: "100%",
                maxHeight: "80%",
                padding: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                  All Students
                </Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={22} color="#333" />
                </Pressable>
              </View>
              <ScrollView>
                {allStudents.map((student) => (
                  <Pressable
                    key={student.id}
                    style={{
                      paddingVertical: 10,
                      borderBottomColor: "#eee",
                      borderBottomWidth: 1,
                    }}
                    onPress={() => {
                      setModalVisible(false);
                      router.push({
                        pathname: "/screens/ChatScreen",
                        params: {
                          lecturer: JSON.stringify(user),
                          studentEmail: student.email,
                        },
                      });
                    }}
                  >
                    <Text style={{ fontWeight: "500" }}>{student.name}</Text>
                    <Text style={{ color: "#777", fontSize: 12 }}>
                      {student.degree}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
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
    color: "#BF272E",
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

  ////////////
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
});
