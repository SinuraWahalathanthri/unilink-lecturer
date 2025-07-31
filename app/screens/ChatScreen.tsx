import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  SafeAreaView,
  ImageBackground,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { Entypo, Feather, Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useNavigation } from "expo-router";
import { db } from "@/services/FirebaseConfig";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import * as ImageManipulator from "expo-image-manipulator";

const batch = writeBatch(db);
type Message = {
  id: string;
  sender_id?: string;
  receiver_id?: string;
  messageType?: string;
  text?: string | null;
  imageUrl?: string | null;
  createdAt?: any;
  isRead?: boolean;
  [key: string]: any;
};

const CLOUDINARY_URL_BASE = "https://api.cloudinary.com/v1_1/dudwypfcf";
const IMAGE_UPLOAD_PRESET = "unilink";
const PDF_UPLOAD_PRESET = "unilink-docs";

export default function ChatScreen() {
  const navigation = useNavigation();
  const {
    lecturer,
    studentEmail,
    adminEmail,
    adminId,
    chatType = "student",
  } = useLocalSearchParams();

  const lecturerDetails = lecturer ? JSON.parse(lecturer) : null;
  const lecturerId = lecturerDetails?.lecturer_id;
  const [lecturerDocId, setLecturerDocId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const isAdminChat = chatType === "admin";

  const lecturerData = {
    id: lecturerDetails?.lecturer_id,
    name: lecturerDetails?.name,
    designation: lecturerDetails?.designation || lecturerDetails?.title,
    department: lecturerDetails?.department || "Faculty of Computing",
  };

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [imageUrl, setImageUrl] = useState(null);

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);

  const [otherUserData, setOtherUserData] = useState<{
    name?: string;
    degree?: string;
    email?: string;
    profileImage?: string;
    institutional_id?: string;
    role?: string;
  } | null>(null);

  console.log("lecturerDocId:", lecturerDocId);
  console.log("otherUserId:", otherUserId);
  console.log("chatType:", chatType);

  // Fetch the other user's ID based on chat type
  useEffect(() => {
    const fetchOtherUserId = async () => {
      try {
        if (isAdminChat && adminId) {
          // Admin chat - use the provided adminId
          setOtherUserId(adminId);
        } else if (!isAdminChat && studentEmail) {
          // Student chat - fetch student ID by email
          const q = query(
            collection(db, "students"),
            where("email", "==", studentEmail)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            setOtherUserId(snapshot.docs[0].id);
          } else {
            console.warn("Student not found in Firestore");
          }
        }
      } catch (err) {
        console.error("Error fetching other user doc ID:", err);
      }
    };

    fetchOtherUserId();
  }, [studentEmail, adminEmail, adminId, isAdminChat]);

  // Fetch other user's details
  useEffect(() => {
    const fetchOtherUserDetails = async () => {
      if (!otherUserId) return;

      try {
        const collectionName = isAdminChat ? "admins" : "students";

        const docRef = doc(db, collectionName, otherUserId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setOtherUserData(docSnap.data());
        } else {
          console.warn(`${isAdminChat ? "Admin" : "Student"} doc not found`);
        }
      } catch (error) {
        console.error(
          `Error fetching ${isAdminChat ? "admin" : "student"} details:`,
          error
        );
      }
    };

    fetchOtherUserDetails();
  }, [otherUserId, isAdminChat]);

  // Fetch lecturer document ID
  useEffect(() => {
    const fetchLecturerDocId = async () => {
      try {
        const q = query(
          collection(db, "lecturers"),
          where("lecturer_id", "==", lecturerDetails?.lecturer_id)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setLecturerDocId(snapshot.docs[0].id);
        } else {
          console.warn("Lecturer not found in Firestore");
        }
      } catch (err) {
        console.error("Error fetching lecturer doc ID:", err);
      }
    };

    fetchLecturerDocId();
  }, []);

  // Listen to messages
  useEffect(() => {
    if (!lecturerDocId || !otherUserId) return;

    const q1 = query(
      collection(db, "messages"),
      where("sender_id", "==", lecturerDocId),
      where("receiver_id", "==", otherUserId),
      orderBy("createdAt", "asc")
    );

    const q2 = query(
      collection(db, "messages"),
      where("sender_id", "==", otherUserId),
      where("receiver_id", "==", lecturerDocId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const data1 = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages((prev) => {
        // Merge unique messages from q1
        const newMessages = [
          ...prev.filter((m) => !data1.some((d) => d.id === m.id)),
          ...data1,
        ];
        // Sort combined messages by createdAt
        return newMessages.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return a.createdAt.seconds - b.createdAt.seconds;
        });
      });
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const data2 = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages((prev) => {
        const newMessages = [
          ...prev.filter((m) => !data2.some((d) => d.id === m.id)),
          ...data2,
        ];
        return newMessages.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return a.createdAt.seconds - b.createdAt.seconds;
        });
      });
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [lecturerDocId, otherUserId]);

  const handleSendMessage = async () => {
    if (!messageText.trim() && !imageUrl) return;

    if (!lecturerDocId || !otherUserId) {
      Alert.alert("Error", "Sender/receiver info missing");
      return;
    }

    const newMessage = {
      sender_id: lecturerDocId,
      receiver_id: otherUserId,
      messageType:
        imageUrl && messageText ? "image_text" : imageUrl ? "image" : "text",
      text: messageText || null,
      imageUrl: imageUrl || null,
      createdAt: serverTimestamp(),
      isRead: false,
    };

    try {
      await addDoc(collection(db, "messages"), newMessage);
      setMessageText("");
      setImageUrl(null);
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleLongPress = (message: Message) => {
    setSelectedMessage(message);
    setDeleteModalVisible(true);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    try {
      await deleteDoc(doc(db, "messages", selectedMessage.id));
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== selectedMessage.id)
      );
    } catch (error) {
      console.error("Error deleting message:", error);
    } finally {
      setDeleteModalVisible(false);
    }
  };

  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setLoading(true);

      // ✅ Resize + compress
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Upload compressed image
      const uploadedUrl = await uploadFileToCloudinary(compressed, true);
      if (uploadedUrl) setImageUrl(uploadedUrl);
      setLoading(false);
    }
  };

  const uploadFileToCloudinary = async (file, isImage = true) => {
    const formData = new FormData();

    formData.append("file", {
      uri: file.uri,
      name: `upload.${isImage ? "jpg" : "pdf"}`,
      type: isImage ? "image/jpeg" : "application/pdf",
    });

    formData.append(
      "upload_preset",
      isImage ? IMAGE_UPLOAD_PRESET : PDF_UPLOAD_PRESET
    );
    formData.append("folder", isImage ? "images/profile-images" : "docs/pdfs");

    try {
      const response = await axios.post(
        `${CLOUDINARY_URL_BASE}/${isImage ? "image" : "raw"}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.secure_url;
    } catch (error) {
      console.error(
        "Cloudinary upload failed",
        error.response?.data || error.message
      );
      Alert.alert("Upload failed", "Please try again later.");
      return null;
    }
  };

  // Mark messages as read
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!lecturerDocId || !otherUserId) return;

      try {
        const unreadQuery = query(
          collection(db, "messages"),
          where("sender_id", "==", otherUserId),
          where("receiver_id", "==", lecturerDocId),
          where("isRead", "==", false)
        );

        const snapshot = await getDocs(unreadQuery);
        const batch = writeBatch(db);

        snapshot.forEach((docSnap) => {
          const docRef = doc(db, "messages", docSnap.id);
          batch.update(docRef, { isRead: true });
        });

        if (!snapshot.empty) {
          await batch.commit();
          console.log("Marked unread messages as read.");
        }
      } catch (err) {
        console.error("Failed to mark messages as read:", err);
      }
    };

    markMessagesAsRead();
  }, [lecturerDocId, otherUserId, messages]);

  const handleImagePress = (url: string) => {
    setPreviewImageUrl(url);
    setIsImagePreviewVisible(true);
  };

  // Update header based on chat type
  useLayoutEffect(() => {
    if (!otherUserData) return;

    const getHeaderTitle = () => {
      if (isAdminChat) {
        return (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={styles.adminAvatar}>
              <Ionicons name="person" size={24} color="#3D83F5" />
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                {otherUserData.name || "Admin"}
              </Text>
            </View>
          </View>
        );
      } else {
        return (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={
                otherUserData.profileImage
                  ? { uri: otherUserData.profileImage }
                  : require("../../assets/images/profileImage.png")
              }
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                marginRight: 10,
              }}
            />
            <View>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                {otherUserData.name || "Student"}
              </Text>
              <Text style={{ fontSize: 12, color: "#666" }}>
                {otherUserData.degree || otherUserData.email || ""}
              </Text>
            </View>
          </View>
        );
      }
    };

    navigation.setOptions({
      headerShown: true,
      headerTitle: () => getHeaderTitle(),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              `${isAdminChat ? "Admin" : "Student"} Profile`,
              `${otherUserData.name}'s profile clicked.`
            );
          }}
          style={{ marginRight: 15 }}
        >
          <Feather name="user" size={24} color="#333" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUserData, isAdminChat]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Stack.Screen
        options={{
          headerShown: true,
        }}
      />

      <ImageBackground
        source={require("../../assets/images/chat-bg.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView
          style={{ flex: 1, padding: 16, marginBottom: 5, paddingVertical: 10 }}
          showsVerticalScrollIndicator={false}
          snapToEnd
        >
          {messages.map((msg) => {
            const isLecturer = msg.sender_id === lecturerDocId;

            const formattedTime = msg.createdAt?.toDate
              ? msg.createdAt.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <TouchableOpacity
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  { alignItems: isLecturer ? "flex-end" : "flex-start" },
                ]}
                onLongPress={() => handleLongPress(msg)}
              >
                {msg.imageUrl && (
                  <TouchableOpacity
                    onPress={() => handleImagePress(msg.imageUrl!)}
                  >
                    <Image
                      source={{ uri: msg.imageUrl }}
                      style={styles.imageMessage}
                    />
                    <View style={styles.metaContainer}>
                      <Text style={styles.timeText}>{formattedTime}</Text>
                      {isLecturer && (
                        <Ionicons
                          name="checkmark-done"
                          size={14}
                          color={msg.isRead ? "#1E88E5" : "#777"}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                )}

                {msg.text && (
                  <View
                    style={[
                      styles.messageContainer,
                      isLecturer
                        ? styles.lecturerMessage
                        : styles.otherUserMessage,
                    ]}
                  >
                    <Text style={styles.messageText}>{msg.text}</Text>
                    <View style={styles.metaContainer}>
                      <Text style={styles.timeText}>{formattedTime}</Text>
                      {isLecturer && (
                        <Ionicons
                          name="checkmark-done"
                          size={14}
                          color={msg.isRead ? "#1E88E5" : "#777"}
                        />
                      )}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ImageBackground>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.footerContainer}>
          {imageUrl && (
            <View
              style={[
                styles.imagePreviewContainer,
                { alignSelf: "flex-start" },
              ]}
            >
              <TouchableOpacity
                onPress={() => setImageUrl(null)}
                style={styles.cancelButton}
              >
                <Entypo name="cross" size={15} color="black" />
              </TouchableOpacity>
              <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleImageUpload}>
              <Entypo name="plus" size={20} color="#777" />
            </TouchableOpacity>
            <View style={styles.textinputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={`Message ${isAdminChat ? "admin" : "student"}...`}
                placeholderTextColor="#999"
                value={messageText}
                onChangeText={setMessageText}
              />
            </View>
            <TouchableOpacity
              style={{
                marginLeft: 10,
                backgroundColor: "#1E88E5",
                borderRadius: 20,
                padding: 8,
              }}
              onPress={handleSendMessage}
            >
              <Entypo name="paper-plane" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Image Preview Modal */}
      <Modal visible={isImagePreviewVisible} transparent={true}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => setIsImagePreviewVisible(false)}
            style={{ position: "absolute", top: 40, right: 20, zIndex: 1 }}
          >
            <Text style={{ color: "#fff", fontSize: 18 }}>✕</Text>
          </TouchableOpacity>

          {previewImageUrl && (
            <Image
              source={{ uri: previewImageUrl }}
              style={{ width: "90%", height: "70%", borderRadius: 12 }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Delete Message Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalContainer}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteText}>Delete this message?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelText2}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteMessage}>
                <Text style={styles.deleteButton}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  timeText: {
    fontSize: 10,
    color: "#555",
    marginRight: 6,
    marginBottom: 10,
  },

  statusIcon: {
    fontSize: 14,
    marginTop: -10,
    marginRight: 10,
  },

  metaContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  background: {
    flex: 1,
  },

  // Admin avatar style
  adminAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3D83F5",
  },

  messageWrapper: {
    marginVertical: 6,
    maxWidth: "100%",
  },

  messageContainer: {
    borderRadius: 8,
    maxWidth: "80%",
  },

  messageText: {
    padding: 16,
    borderRadius: 8,
    overflow: "hidden",
    fontSize: 14,
  },

  lecturerMessage: {
    backgroundColor: "#e0dbd6",
    color: "#222",
    alignSelf: "flex-end",
  },

  otherUserMessage: {
    backgroundColor: "#d2e0fb",
    color: "#222",
    alignSelf: "flex-start",
  },

  imageMessage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 6,
  },

  footerContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#fafafa",
    borderTopWidth: 1,
    borderColor: "#d9d4cf",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
  },

  textinputContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    marginLeft: 10,
    alignItems: "center",
    height: 40,
  },

  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },

  imagePreviewContainer: {
    padding: 16,
  },

  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginTop: -14,
    marginBottom: -10,
    marginLeft: -14,
  },

  cancelButton: {
    position: "absolute",
    top: 10,
    right: 25,
    zIndex: 1,
    padding: 2,
    borderRadius: 100,
    backgroundColor: "#fafafa",
  },

  // Delete Modal Styles
  deleteModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  deleteModal: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },

  deleteText: {
    fontSize: 16,
    marginBottom: 20,
    fontFamily: "Lato",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 50,
  },

  cancelText2: {
    color: "gray",
    fontSize: 16,
    fontFamily: "Lato",
  },

  deleteButton: {
    color: "red",
    fontSize: 16,
    fontFamily: "Lato",
  },
});
