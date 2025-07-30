import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  query,
  where,
  getDocs,
  collection,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "@/services/FirebaseConfig";

const RequestCommunity = () => {
  const { lecturer } = useLocalSearchParams();
  const router = useRouter();
  const lecturerData = lecturer ? JSON.parse(lecturer) : null;

  // Community details
  const [communityName, setCommunityName] = useState("");
  const [description, setDescription] = useState("");
  const [communityType, setCommunityType] = useState("Academic");
  const [justification, setJustification] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [focusedFields, setFocusedFields] = useState({});

  const communityTypes = [
    "Academic",
    "Social",
    "Professional",
    "Project",
    "General",
  ];

  const handleFocus = (field) => {
    setFocusedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setFocusedFields((prev) => ({ ...prev, [field]: false }));
  };

  const validateForm = () => {
    if (!communityName.trim()) {
      Alert.alert("Validation Error", "Community name is required");
      return false;
    }
    if (!description.trim()) {
      Alert.alert("Validation Error", "Description is required");
      return false;
    }
    if (!justification.trim()) {
      Alert.alert("Validation Error", "Justification is required");
      return false;
    }
    return true;
  };

  const sendMessageToAdmin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 🔍 Get lecturer document ID using their email
      const q = query(
        collection(db, "lecturers"), // 👈 use your actual collection name
        where("email", "==", lecturerData.email)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        Alert.alert("Error", "Lecturer record not found in database.");
        setLoading(false);
        return;
      }

      const docRef = querySnapshot.docs[0];
      const lecturerId = docRef.id;

      const messageContent = `
🏛️ COMMUNITY CREATION REQUEST

📋 Request Details:
• Community Name: ${communityName.trim()}
• Type: ${communityType}
• Requested by: ${lecturerData.name} (${lecturerData.email})

📝 Description:
${description.trim()}

💡 Justification:
${justification.trim()}

⏰ Requested on: ${new Date().toLocaleString()}

Please review and create this community if approved.
    `.trim();

      const messageData = {
        senderId: lecturerId, // ✅ Now using correct ID
        senderName: lecturerData.name,
        senderEmail: lecturerData.email,
        senderType: "lecturer",
        receiverId: "admin",
        receiverType: "admin",
        content: messageContent,
        type: "community_request",
        subject: `Community Creation Request: ${communityName.trim()}`,
        status: "unread",
        priority: "normal",
        metadata: {
          communityName: communityName.trim(),
          communityType: communityType,
          description: description.trim(),
          justification: justification.trim(),
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isRead: false
      };

      await addDoc(collection(db, "messages"), messageData);

      Alert.alert(
        "Request Sent",
        "Your community creation request has been sent to the admin. You will receive a response soon.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!lecturerData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Lecturer data not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen
        options={{
          title: "Request Community",
          headerTitleStyle: { color: "#ffffff" },
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="info" size={20} color="#3D83F5" />
          <Text style={styles.infoBannerText}>
            Send a request to admin for community creation. They will review and
            create the community for you.
          </Text>
        </View>

        {/* Requester Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requester Information</Text>
          <View style={styles.requesterCard}>
            <MaterialIcons name="person" size={24} color="#3D83F5" />
            <View style={styles.requesterDetails}>
              <Text style={styles.requesterName}>{lecturerData.name}</Text>
              <Text style={styles.requesterEmail}>{lecturerData.email}</Text>
              <Text style={styles.requesterType}>Lecturer</Text>
            </View>
          </View>
        </View>

        {/* Community Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Community Name *</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedFields.name && styles.focusedInput,
              ]}
            >
              <MaterialIcons name="groups" size={20} color="#777777" />
              <TextInput
                style={styles.textInput}
                value={communityName}
                onChangeText={setCommunityName}
                onFocus={() => handleFocus("name")}
                onBlur={() => handleBlur("name")}
                placeholder="Enter community name"
                maxLength={50}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Community Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeOptions}>
                {communityTypes.map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeOption,
                      communityType === type && styles.selectedTypeOption,
                    ]}
                    onPress={() => setCommunityType(type)}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        communityType === type && styles.selectedTypeOptionText,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <View
              style={[
                styles.inputWrapper,
                styles.textAreaWrapper,
                focusedFields.description && styles.focusedInput,
              ]}
            >
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                onFocus={() => handleFocus("description")}
                onBlur={() => handleBlur("description")}
                placeholder="Describe the purpose and goals of this community..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
            </View>
            <Text style={styles.characterCount}>
              {description.length}/200 characters
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Justification *</Text>
            <View
              style={[
                styles.inputWrapper,
                styles.textAreaWrapper,
                focusedFields.justification && styles.focusedInput,
              ]}
            >
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={justification}
                onChangeText={setJustification}
                onFocus={() => handleFocus("justification")}
                onBlur={() => handleBlur("justification")}
                placeholder="Explain why this community is needed and how it will benefit members..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={300}
              />
            </View>
            <Text style={styles.characterCount}>
              {justification.length}/300 characters
            </Text>
            <Text style={styles.helperText}>
              Help the admin understand the importance of this community
            </Text>
          </View>
        </View>

        {/* Preview Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Message Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <MaterialIcons name="email" size={20} color="#3D83F5" />
              <Text style={styles.previewTitle}>
                Community Creation Request: {communityName || "Community Name"}
              </Text>
            </View>
            <Text style={styles.previewContent}>
              Your request will be sent to the admin with all the details you've
              provided above.
            </Text>
          </View>
        </View>

        {/* Send Button */}
        <Pressable
          style={[styles.sendButton, loading && styles.disabledButton]}
          onPress={sendMessageToAdmin}
          disabled={loading}
        >
          <MaterialIcons name="send" size={20} color="#fff" />
          <Text style={styles.sendButtonText}>
            {loading ? "Sending..." : "Send Request to Admin"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF4FF",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  infoBannerText: {
    flex: 1,
    fontFamily: "Lato",
    fontSize: 14,
    color: "#1E40AF",
    lineHeight: 20,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionTitle: {
    fontFamily: "LatoBold",
    fontSize: 18,
    color: "#000",
    marginBottom: 16,
  },
  requesterCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  requesterDetails: {
    flex: 1,
  },
  requesterName: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "#000",
  },
  requesterEmail: {
    fontFamily: "Lato",
    fontSize: 14,
    color: "#6D6D6E",
    marginTop: 2,
  },
  requesterType: {
    fontFamily: "Lato",
    fontSize: 12,
    color: "#3D83F5",
    marginTop: 2,
    textTransform: "uppercase",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: "LatoBold",
    fontSize: 14,
    color: "#000",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 12,
  },
  textAreaWrapper: {
    alignItems: "flex-start",
    paddingVertical: 16,
  },
  focusedInput: {
    borderColor: "#3D83F5",
  },
  textInput: {
    flex: 1,
    fontFamily: "Lato",
    fontSize: 16,
    color: "#000",
  },
  textArea: {
    minHeight: 60,
  },
  characterCount: {
    fontFamily: "Lato",
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 4,
  },
  helperText: {
    fontFamily: "Lato",
    fontSize: 12,
    color: "#6D6D6E",
    marginTop: 4,
    fontStyle: "italic",
  },
  typeOptions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  selectedTypeOption: {
    backgroundColor: "#3D83F5",
    borderColor: "#3D83F5",
  },
  typeOptionText: {
    fontFamily: "Lato",
    fontSize: 14,
    color: "#6D6D6E",
  },
  selectedTypeOptionText: {
    color: "#fff",
    fontFamily: "LatoBold",
  },
  previewCard: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  previewTitle: {
    fontFamily: "LatoBold",
    fontSize: 14,
    color: "#000",
    flex: 1,
  },
  previewContent: {
    fontFamily: "Lato",
    fontSize: 14,
    color: "#6D6D6E",
    lineHeight: 20,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3D83F5",
    paddingVertical: 16,
    borderRadius: 12,
    margin: 16,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "#fff",
  },
});

export default RequestCommunity;
