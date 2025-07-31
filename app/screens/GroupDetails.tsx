import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import {
  Feather,
  MaterialIcons,
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import axios from "axios";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/services/FirebaseConfig";
import { Stack } from "expo-router";

// Cloudinary configuration
const CLOUDINARY_URL_BASE = "https://api.cloudinary.com/v1_1/dudwypfcf";
const IMAGE_UPLOAD_PRESET = "unilink";
const PDF_UPLOAD_PRESET = "unilink-docs";

const MessageItem = ({ message, isCurrentUser }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const openPDF = (url) => {
    Linking.openURL(url).catch((err) => {
      Alert.alert("Error", "Unable to open PDF");
    });
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case "image":
        return (
          <TouchableOpacity onPress={() => Linking.openURL(message.file_url)}>
            <Image
              source={{ uri: message.file_url }}
              style={styles.messageImage}
              contentFit="cover"
            />
          </TouchableOpacity>
        );
      case "pdf":
        return (
          <TouchableOpacity
            style={styles.pdfContainer}
            onPress={() => openPDF(message.file_url)}
          >
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={32}
              color={isCurrentUser ? "#fff" : "#e74c3c"}
            />
            <View style={styles.pdfInfo}>
              <Text
                style={[
                  styles.pdfName,
                  isCurrentUser ? styles.currentUserText : styles.otherUserText,
                ]}
                numberOfLines={1}
              >
                {message.file_name || "Document.pdf"}
              </Text>
              <Text
                style={[
                  styles.pdfSize,
                  isCurrentUser ? styles.currentUserTime : styles.otherUserTime,
                ]}
              >
                PDF Document
              </Text>
            </View>
          </TouchableOpacity>
        );
      default:
        return (
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText,
            ]}
          >
            {message.message_text}
          </Text>
        );
    }
  };

  return (
    <View
      style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
      ]}
    >
      {!isCurrentUser && (
        <View style={styles.messageHeader}>
          <Image
            source={require("../../assets/images/adminAvatar.png")}
            style={styles.messageAvatar}
          />
          <Text style={styles.senderName}>{message.user_name}</Text>
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          message.type !== "text" && styles.mediaBubble,
        ]}
      >
        {renderMessageContent()}
        <Text
          style={[
            styles.messageTime,
            isCurrentUser ? styles.currentUserTime : styles.otherUserTime,
          ]}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
};

export default function GroupDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { communityId, name } = route.params;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [groupInfo, setGroupInfo] = useState(null);
  const [currentLecturerId, setCurrentLecturerId] = useState(null);
  const flatListRef = useRef(null);

  // Get current lecturer ID
  const getCurrentLecturerId = useCallback(async () => {
    if (!user?.email) return null;

    try {
      const lecturerQuery = query(
        collection(db, "lecturers"),
        where("email", "==", user.email)
      );
      const lecturerSnapshot = await getDocs(lecturerQuery);

      if (!lecturerSnapshot.empty) {
        const lecturerId = lecturerSnapshot.docs[0].id;
        setCurrentLecturerId(lecturerId);
        return lecturerId;
      }
    } catch (error) {
      console.error("Error fetching lecturer ID:", error);
    }
    return null;
  }, [user]);

  // Fetch group information
  const fetchGroupInfo = useCallback(async () => {
    try {
      const groupDoc = await getDoc(doc(db, "communities", communityId));
      if (groupDoc.exists()) {
        setGroupInfo({ id: groupDoc.id, ...groupDoc.data() });
      }
    } catch (error) {
      console.error("Error fetching group info:", error);
    }
  }, [communityId]);

  // Listen to messages
  useEffect(() => {
    const messagesRef = collection(db, "community_messages");
    const q = query(
      messagesRef,
      where("community_id", "==", communityId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messageList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [communityId]);

  // Fetch group info and lecturer ID on mount
  useEffect(() => {
    fetchGroupInfo();
    getCurrentLecturerId();
  }, [fetchGroupInfo, getCurrentLecturerId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async (messageData = null) => {
    const messageToSend = messageData || {
      message_text: inputText.trim(),
      type: "text",
    };

    if (
      (!messageToSend.message_text?.trim() && messageToSend.type === "text") ||
      !currentLecturerId
    )
      return;

    try {
      const messagesRef = collection(db, "community_messages");
      await addDoc(messagesRef, {
        community_id: communityId,
        ...messageToSend,
        user_id: currentLecturerId,
        user_name: user.email,
        timestamp: serverTimestamp(),
      });

      if (messageToSend.type === "text") {
        setInputText("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  // Cloudinary upload function
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
    formData.append(
      "folder",
      isImage ? "images/chat-images" : "docs/chat-pdfs"
    );

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

  // Handle image upload
  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setUploading(true);

      try {
        // Resize + compress
        const compressed = await manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.5, format: SaveFormat.JPEG }
        );

        // Upload compressed image
        const uploadedUrl = await uploadFileToCloudinary(compressed, true);
        if (uploadedUrl) {
          await sendMessage({
            type: "image",
            file_url: uploadedUrl,
            message_text: "Image",
          });
        }
      } catch (error) {
        console.error("Image upload error:", error);
        Alert.alert("Error", "Failed to upload image.");
      } finally {
        setUploading(false);
      }
    }
  };

  // Handle PDF upload
  const handlePDFUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setUploading(true);

        const uploadedUrl = await uploadFileToCloudinary(
          result.assets[0],
          false
        );
        if (uploadedUrl) {
          await sendMessage({
            type: "pdf",
            file_url: uploadedUrl,
            file_name: result.assets[0].name,
            message_text: result.assets[0].name,
          });
        }
        setUploading(false);
      }
    } catch (error) {
      console.error("PDF upload error:", error);
      Alert.alert("Error", "Failed to upload PDF.");
      setUploading(false);
    }
  };

  // Show attachment options
  const showAttachmentOptions = () => {
    Alert.alert("Send Attachment", "Choose what you want to send", [
      { text: "Image", onPress: handleImageUpload },
      { text: "PDF Document", onPress: handlePDFUpload },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const showGroupInfo = () => {
    Alert.alert(
      name,
      groupInfo?.description || "Group chat for university community",
      [{ text: "OK" }]
    );
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.user_id === currentLecturerId;
    return <MessageItem message={item} isCurrentUser={isCurrentUser} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.groupInfo} onPress={showGroupInfo}>
            <View style={styles.groupPlaceholder}>
              <FontAwesome name="graduation-cap" size={20} color="#4e4cafff" />
            </View>
            <View style={styles.groupDetails}>
              <Text style={styles.groupName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.groupStatus}>
                <View style={styles.onlineIndicator} />
                Online
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.moreButton} onPress={showGroupInfo}>
            <Feather name="more-vertical" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => {
                if (groupInfo?.file_sharing) {
                  showAttachmentOptions();
                } else {
                  Alert.alert(
                    "Permission Denied",
                    "Admin hasn't given access to share files."
                  );
                }
              }}
              disabled={uploading}
            >
              <MaterialIcons
                name="attach-file"
                size={20}
                color={groupInfo?.file_sharing ? "#666" : "#ccc"}
              />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!uploading}
            />

            {uploading ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator size="small" color="#3D83F5" />
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  inputText.trim() && styles.sendButtonActive,
                ]}
                onPress={() => sendMessage()}
                disabled={!inputText.trim()}
              >
                <MaterialIcons
                  name="send"
                  size={20}
                  color={inputText.trim() ? "#fff" : "#999"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backButton: {
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  groupPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#ece8f5ff",
    justifyContent: "center",
    alignItems: "center",
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    fontFamily: "LatoBold",
  },
  groupStatus: {
    fontSize: 12,
    color: "#48d562",
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#48d562",
    marginRight: 4,
  },
  moreButton: {
    marginLeft: 12,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  currentUserMessage: {
    alignItems: "flex-end",
  },
  otherUserMessage: {
    alignItems: "flex-start",
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  senderName: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  currentUserBubble: {
    backgroundColor: "#3D83F5",
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  currentUserText: {
    color: "#fff",
  },
  otherUserText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  currentUserTime: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  otherUserTime: {
    color: "#999",
  },
  inputContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
    color: "#333",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e5e5e5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: "#3D83F5",
  },
  attachButton: {
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 4,
  },
  mediaBubble: {
    padding: 8,
  },
  pdfContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  pdfInfo: {
    marginLeft: 12,
    flex: 1,
  },
  pdfName: {
    fontSize: 14,
    fontWeight: "500",
  },
  pdfSize: {
    fontSize: 12,
    marginTop: 2,
  },
});
