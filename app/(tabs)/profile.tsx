import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/services/FirebaseConfig";
import { useAuth } from "@/context/AuthContext";

const LecturerProfile = () => {
  const router = useRouter();
  const { user: lecturerData, setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // If you want to sync lecturer status update with context and firestore
  const handleStatusToggle = async () => {
    if (!lecturerData) return;

    const newStatus = lecturerData.status === "Active" ? "Deactive" : "Active";

    Alert.alert(
      "Change Status",
      `Are you sure you want to ${
        newStatus === "Active" ? "activate" : "deactivate"
      } your profile?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setLoading(true);
              // Assuming lecturerData.id is the Firestore document id
              const lecturerRef = doc(db, "lecturers", lecturerData.id);
              await updateDoc(lecturerRef, { status: newStatus });

              // Update context with new status
              setUser({ ...lecturerData, status: newStatus });

              Alert.alert(
                "Success",
                `Profile ${newStatus.toLowerCase()} successfully`
              );
            } catch (error) {
              console.error("Error updating status:", error);
              Alert.alert("Error", "Failed to update status");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatOfficeHours = (officeHours) => {
    if (!officeHours || officeHours.length === 0) return "Not set";

    return officeHours
      .map((hour) => `${hour.day}: ${hour.from} - ${hour.to} (${hour.mode})`)
      .join("\n");
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontFamily: "Lato", fontSize: 16 }}>
            Updating status...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lecturerData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ fontFamily: "Lato", fontSize: 16 }}>
            No profile data available
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.headerContainer}>
          <View style={styles.profileImageContainer}>
            <Pressable
            >
              <Image
                source={require("../../assets/images/image.png")}
                style={styles.profileImage}
              />
            </Pressable>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    lecturerData.status === "Active" ? "#10b981" : "#ef4444",
                },
              ]}
            >
              <Text style={styles.statusText}>
                {lecturerData.status || "Deactive"}
              </Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.lecturerName}>
              {lecturerData.name || "Unknown Lecturer"}
            </Text>
            <Text style={styles.lecturerId}>
              ID: {lecturerData.lecturer_id || "N/A"}
            </Text>
          </View>
        </View>

        {/* Profile Details */}
        <View style={styles.detailsContainer}>
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.detailItem}>
              <MaterialIcons name="person" size={20} color="#3D83F5" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Full Name</Text>
                <Text style={styles.detailValue}>
                  {lecturerData.name || "Not provided"}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="badge" size={20} color="#3D83F5" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>NIC Number</Text>
                <Text style={styles.detailValue}>
                  {lecturerData.nic || "Not provided"}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="location-on" size={20} color="#3D83F5" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Office Location</Text>
                <Text style={styles.detailValue}>
                  {lecturerData.office_location || "Not provided"}
                </Text>
              </View>
            </View>
          </View>

          {/* Meeting Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meeting Information</Text>

            <View style={styles.detailItem}>
              <MaterialIcons name="videocam" size={20} color="#3D83F5" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Google Meet Link</Text>
                <Text
                  style={[styles.detailValue, styles.linkText]}
                  numberOfLines={1}
                >
                  {lecturerData.google_meet_link || "Not provided"}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="schedule" size={20} color="#3D83F5" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Office Hours</Text>
                <Text style={styles.detailValue}>
                  {formatOfficeHours(lecturerData.office_hours)}
                </Text>
              </View>
            </View>
          </View>

          {/* Account Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Status</Text>

            <View style={styles.statusCard}>
              <View style={styles.statusCardHeader}>
                <MaterialIcons
                  name={
                    lecturerData.status === "Active" ? "check-circle" : "cancel"
                  }
                  size={24}
                  color={
                    lecturerData.status === "Active" ? "#10b981" : "#ef4444"
                  }
                />
                <Text
                  style={[
                    styles.statusCardTitle,
                    {
                      color:
                        lecturerData.status === "Active"
                          ? "#10b981"
                          : "#ef4444",
                    },
                  ]}
                >
                  {lecturerData.status === "Active"
                    ? "Active Profile"
                    : "Inactive Profile"}
                </Text>
              </View>
              <Text style={styles.statusCardDescription}>
                {lecturerData.status === "Active"
                  ? "Your profile is visible to students and you can receive consultation requests."
                  : "Your profile is hidden from students. You won't receive new consultation requests."}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    marginBottom:20
  },
  headerContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginTop:Platform.OS === "android" ? 25 : 0, // Adjust for Android status bar
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  statusBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  statusText: {
    fontFamily: "LatoBold",
    fontSize: 12,
    color: "#ffffff",
  },
  profileInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  lecturerName: {
    fontFamily: "LatoBold",
    fontSize: 24,
    color: "#000",
    textAlign: "center",
  },
  lecturerId: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "#6D6D6E",
    marginTop: 4,
  },
  statusToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusToggleText: {
    fontFamily: "LatoBold",
    fontSize: 14,
    color: "#ffffff",
  },
  detailsContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "LatoBold",
    fontSize: 18,
    color: "#000",
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: "Lato",
    fontSize: 13,
    color: "#6D6D6E",
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "#000",
    lineHeight: 22,
  },
  linkText: {
    color: "#3D83F5",
  },
  statusCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  statusCardTitle: {
    fontFamily: "LatoBold",
    fontSize: 16,
  },
  statusCardDescription: {
    fontFamily: "Lato",
    fontSize: 14,
    color: "#6D6D6E",
    lineHeight: 20,
  },
});

export default LecturerProfile;
