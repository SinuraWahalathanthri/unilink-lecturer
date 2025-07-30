import {
  FlatList,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams, useRouter } from "expo-router";
import CommonStyles from "@/constants/CommonStyles";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/services/FirebaseConfig";

const ConsultationReqCard = ({ item, lecturerData }) => {
  const [sessionStatus, setSessionStatus] = useState(
    item.sessionStatus || "not-started"
  );

  // Helper function to get priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#ef4444";
    }
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "#f59e0b";
      case "accepted":
        return "#10b981";
      case "declined":
        return "#ef4444";
      case "completed":
        return "#6366f1";
      case "started":
        return "#3B82F6";
      case "ended":
        return "#8B5CF6";
      default:
        return "#f59e0b";
    }
  };

  // Helper function to get mode icon
  const getModeIcon = (mode) => {
    switch (mode?.toLowerCase()) {
      case "in-person":
        return "location-on";
      case "online":
        return "videocam";
      default:
        return "help-outline";
    }
  };

  // Helper function to format preferred dates array
  const formatPreferredDates = (dates) => {
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return "Not specified";
    }
    return dates.join(", ");
  };

  // Check if consultation can be started/ended
  const canStartSession = () => {
    if (!item.scheduledDateTime || item.status !== "accepted") return false;

    const scheduledTime = item.scheduledDateTime.toDate();
    const now = new Date();

    if (item.mode === "online") {
      // For online: can start on the scheduled date
      return (
        now.toDateString() === scheduledTime.toDateString() &&
        sessionStatus === "not-started"
      );
    } else {
      // For physical: can end 1 minute after scheduled time
      const oneMinuteAfter = new Date(scheduledTime.getTime() + 60000);
      return now >= oneMinuteAfter && sessionStatus === "not-started";
    }
  };

  const canEndSession = () => {
    return sessionStatus === "started";
  };

  const handleStartSession = async () => {
    try {
      const consultationRef = doc(db, "consultations", item.id);
      await updateDoc(consultationRef, {
        status: "started",
        sessionStatus: "started",
        sessionStartTime: serverTimestamp(),
      });

      setSessionStatus("started");

      if (item.mode === "online" && lecturerData?.google_meet_link) {
        // Open Google Meet link
        Linking.openURL(lecturerData.google_meet_link);
      }
    } catch (error) {
      console.error("Error starting session:", error);
      Alert.alert("Error", "Failed to start session");
    }
  };

  const handleEndSession = async () => {
    try {
      const consultationRef = doc(db, "consultations", item.id);
      await updateDoc(consultationRef, {
        status: "ended",
        sessionStatus: "ended",
        sessionEndTime: serverTimestamp(),
      });

      setSessionStatus("ended");

      Alert.alert("Session Ended", "Consultation completed successfully.", [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("Error ending session:", error);
      Alert.alert("Error", "Failed to end session");
    }
  };

  const handleJoinMeeting = () => {
    if (lecturerData?.google_meet_link) {
      Linking.openURL(lecturerData.google_meet_link);
      handleStartSession();
    } else {
      Alert.alert("Error", "Meeting link not available");
    }
  };

  const renderActionButtons = () => {
    if (item.status === "pending") {
      return (
        <View style={{ flexDirection: "row", marginTop: 10, gap: 8 }}>
          <Pressable
            style={{
              flexDirection: "row",
              gap: 4,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#ef4444",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 100,
              marginLeft: "auto",
            }}
          >
            <MaterialIcons name="close" size={18} color={"#ef4444"} />
            <Text
              style={{
                fontFamily: "LatoBold",
                fontSize: 14,
                color: "#ef4444",
              }}
            >
              Decline
            </Text>
          </Pressable>
          <Pressable
            style={{
              flexDirection: "row",
              gap: 4,
              alignItems: "center",
              backgroundColor: "#10b981",
              borderWidth: 1,
              borderColor: "#10b981",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 100,
            }}
            onPress={() =>
              router.push({
                pathname: "/screens/ConsultationAccept",
                params: { consultation: JSON.stringify(item) },
              })
            }
          >
            <MaterialIcons name="check" size={18} color={"#fff"} />
            <Text
              style={{ fontFamily: "LatoBold", fontSize: 14, color: "#fff" }}
            >
              Accept
            </Text>
          </Pressable>
        </View>
      );
    }

    if (item.status === "accepted" || sessionStatus === "started") {
      const canStart = canStartSession();
      const canEnd = canEndSession();

      return (
        <View style={{ marginTop: 10 }}>
          {/* Session status indicator for active sessions */}
          {sessionStatus === "started" && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginBottom: 10,
                backgroundColor: "#E3F2FD",
                padding: 8,
                borderRadius: 8,
              }}
            >
              <MaterialIcons
                name="radio-button-checked"
                size={20}
                color={"#1976D2"}
              />
              <Text
                style={{
                  fontFamily: "LatoBold",
                  color: "#1976D2",
                  fontSize: 16,
                }}
              >
                Session In Progress
              </Text>
            </View>
          )}

          <View
            style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}
          >
            {item.mode === "online" &&
              sessionStatus === "not-started" &&
              canStart && (
                <Pressable
                  style={{
                    flexDirection: "row",
                    gap: 4,
                    alignItems: "center",
                    backgroundColor: "#3B82F6",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 100,
                  }}
                  onPress={handleJoinMeeting}
                >
                  <MaterialIcons name="videocam" size={18} color={"#fff"} />
                  <Text
                    style={{
                      fontFamily: "LatoBold",
                      fontSize: 14,
                      color: "#fff",
                    }}
                  >
                    Join Meeting
                  </Text>
                </Pressable>
              )}

            {item.mode === "in-person" &&
              sessionStatus === "not-started" &&
              canStart && (
                <Pressable
                  style={{
                    flexDirection: "row",
                    gap: 4,
                    alignItems: "center",
                    backgroundColor: "#10b981",
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 100,
                  }}
                  onPress={handleStartSession}
                >
                  <MaterialIcons name="play-arrow" size={18} color={"#fff"} />
                  <Text
                    style={{
                      fontFamily: "LatoBold",
                      fontSize: 14,
                      color: "#fff",
                    }}
                  >
                    Start Session
                  </Text>
                </Pressable>
              )}

            {sessionStatus === "started" && canEnd && (
              <Pressable
                style={{
                  flexDirection: "row",
                  gap: 4,
                  alignItems: "center",
                  backgroundColor: "#ef4444",
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 100,
                }}
                onPress={handleEndSession}
              >
                <MaterialIcons name="stop" size={18} color={"#fff"} />
                <Text
                  style={{
                    fontFamily: "LatoBold",
                    fontSize: 14,
                    color: "#fff",
                  }}
                >
                  End Session
                </Text>
              </Pressable>
            )}

            {!canStart &&
              !canEnd &&
              sessionStatus === "not-started" &&
              item.status === "accepted" && (
                <View
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: "#f3f4f6",
                    borderRadius: 100,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Lato",
                      fontSize: 12,
                      color: "#6D6D6E",
                    }}
                  >
                    {item.mode === "online"
                      ? "Available on scheduled date"
                      : "Available 1 min after scheduled time"}
                  </Text>
                </View>
              )}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#fff",
        width: "100%",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ flex: 1, alignItems: "flex-start" }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View
              style={{
                padding: 10,
                backgroundColor: "#e2e6f5",
                borderRadius: 100,
              }}
            >
              <MaterialIcons name="person" color={"#0F4996"} size={24} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontFamily: "LatoBold", fontSize: 16 }}>
                {item.studentDetails?.name || "Unknown Student"}
              </Text>
              <Text
                style={{
                  fontFamily: "Lato",
                  fontSize: 13,
                  color: "#6D6D6E",
                  marginTop: 5,
                }}
              >
                {item.studentDetails?.institutional_id || "N/A"} •{" "}
                {item.studentDetails?.faculty || "N/A"}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text
              style={{
                fontFamily: "LatoBold",
                fontSize: 16,
                color: "#000",
              }}
            >
              {item.topic || "Topic Not Provided"}
            </Text>
            <Text
              style={{
                fontFamily: "Lato",
                fontSize: 13,
                color: "#6D6D6E",
                marginTop: 5,
              }}
            >
              {item.description ||
                "No description provided for this consultation."}
            </Text>
          </View>

          {/* Mode and Preferred Dates */}
          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#f3f4f6",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 100,
                alignItems: "center",
                gap: 4,
              }}
            >
              <MaterialIcons
                name={getModeIcon(item.mode)}
                size={16}
                color={"#6D6D6E"}
              />
              <Text
                style={{
                  fontFamily: "Lato",
                  fontSize: 12,
                  color: "#6D6D6E",
                  textTransform: "capitalize",
                }}
              >
                {item.mode || "Not specified"}
              </Text>
            </View>
            {item.preferredDate &&
              Array.isArray(item.preferredDate) &&
              item.preferredDate.length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: "#f3f4f6",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 100,
                    alignItems: "center",
                    gap: 4,
                    flex: 1,
                  }}
                >
                  <MaterialIcons name="schedule" size={16} color={"#6D6D6E"} />
                  <Text
                    style={{
                      fontFamily: "Lato",
                      fontSize: 12,
                      color: "#6D6D6E",
                    }}
                    numberOfLines={1}
                  >
                    {formatPreferredDates(item.preferredDate)}
                  </Text>
                </View>
              )}
          </View>
        </View>

        {/* Priority and Status */}
        <View style={{ marginLeft: "auto", alignItems: "flex-end", gap: 5 }}>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: getPriorityColor(item.priority),
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 100,
              alignItems: "center",
              gap: 2,
            }}
          >
            <MaterialIcons name="info-outline" size={18} color={"#fff"} />
            <Text
              style={{
                fontFamily: "LatoBold",
                fontSize: 13,
                color: "#fff",
                textTransform: "uppercase",
              }}
            >
              {item.priority || "High"}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: getStatusColor(
                sessionStatus === "started"
                  ? "started"
                  : sessionStatus === "ended"
                  ? "ended"
                  : item.status
              ),
              paddingHorizontal: 8,
              paddingVertical: 5,
              borderRadius: 100,
              alignItems: "center",
              gap: 2,
            }}
          >
            <Text
              style={{
                fontFamily: "LatoBold",
                fontSize: 13,
                color: "#fff",
                textTransform: "uppercase",
              }}
            >
              {sessionStatus === "started"
                ? "In Progress"
                : sessionStatus === "ended"
                ? "Completed"
                : item.status || "Pending"}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer - Date and Actions */}
      <View style={{ marginTop: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <MaterialIcons name="calendar-today" size={20} color={"#6D6D6E"} />
          <Text style={{ fontFamily: "Lato", color: "#6D6D6E", fontSize: 14 }}>
            Requested:{" "}
            {item.createdAt?.toDate
              ? item.createdAt.toDate().toLocaleString()
              : "Date Not Available"}
          </Text>
        </View>

        {/* Show scheduled date/time if accepted */}
        {item.status === "accepted" && item.scheduledDateTime && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              marginTop: 5,
            }}
          >
            <MaterialIcons name="event" size={20} color={"#3D83F5"} />
            <Text
              style={{ fontFamily: "Lato", color: "#3D83F5", fontSize: 14 }}
            >
              Scheduled:{" "}
              {item.scheduledDateTime?.toDate
                ? item.scheduledDateTime.toDate().toLocaleString()
                : "Date Not Available"}
            </Text>
          </View>
        )}

        {/* Show session end time if ended */}
        {sessionStatus === "ended" && item.sessionEndTime && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              marginTop: 5,
            }}
          >
            <MaterialIcons name="check-circle" size={20} color={"#8B5CF6"} />
            <Text
              style={{ fontFamily: "Lato", color: "#8B5CF6", fontSize: 14 }}
            >
              Completed:{" "}
              {item.sessionEndTime?.toDate
                ? item.sessionEndTime.toDate().toLocaleString()
                : "Date Not Available"}
            </Text>
          </View>
        )}

        {renderActionButtons()}
      </View>
    </View>
  );
};

const ConsultationRequest = () => {
  const router = useRouter();
  const { lecturer } = useLocalSearchParams();
  const [consultations, setConsultations] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);
  const [emailFocused, setEmailFocused] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const lecturerData = lecturer ? JSON.parse(lecturer) : null;

  useEffect(() => {
    if (!lecturerData?.lecturer_id) return;

    const q = query(
      collection(db, "lecturers"),
      where("lecturer_id", "==", lecturerData.lecturer_id)
    );

    const unsubscribe = onSnapshot(q, (lecturerSnapshot) => {
      if (!lecturerSnapshot.empty) {
        const lecturerDoc = lecturerSnapshot.docs[0];
        const lecturerDocId = lecturerDoc.id;

        const consultationsQuery = query(
          collection(db, "consultations"),
          where("lecturer_id", "==", lecturerDocId),
          orderBy("createdAt", "desc")
        );

        const unsubscribeConsultations = onSnapshot(
          consultationsQuery,
          async (consultationSnapshot) => {
            const consultationsData = consultationSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            const enrichedConsultations = await Promise.all(
              consultationsData.map(async (consultation) => {
                if (!consultation.student_id) return consultation;

                try {
                  const studentRef = doc(
                    db,
                    "students",
                    consultation.student_id
                  );
                  const studentSnap = await getDoc(studentRef);

                  if (studentSnap.exists()) {
                    const studentData = studentSnap.data();
                    return { ...consultation, studentDetails: studentData };
                  } else {
                    return consultation;
                  }
                } catch (error) {
                  console.warn("Failed to fetch student data:", error);
                  return consultation;
                }
              })
            );

            setConsultations(enrichedConsultations);
            setFilteredConsultations(enrichedConsultations);
          }
        );

        return () => unsubscribeConsultations();
      } else {
        console.warn("Lecturer not found");
      }
    });

    return () => unsubscribe();
  }, [lecturerData]);

  // Filter consultations based on status and search query
  useEffect(() => {
    let filtered = consultations;

    // Filter by status
    if (selectedFilter !== "all") {
      filtered = filtered.filter(
        (consultation) => consultation.status === selectedFilter
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (consultation) =>
          consultation.studentDetails?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          consultation.studentDetails?.institutional_id
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          consultation.topic?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredConsultations(filtered);
  }, [consultations, selectedFilter, searchQuery]);

  // Get count for each status
  const getStatusCount = (status) => {
    return consultations.filter(
      (consultation) => consultation.status === status
    ).length;
  };

  const filterOptions = [
    { key: "all", label: `All (${consultations.length})` },
    { key: "pending", label: `Pending (${getStatusCount("pending")})` },
    { key: "accepted", label: `Accepted (${getStatusCount("accepted")})` },
    { key: "started", label: `In Progress (${getStatusCount("started")})` },
    { key: "ended", label: `Completed (${getStatusCount("ended")})` },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen
        options={{
          title: " ",
          headerTitleStyle: { color: "#ffffff" },
          headerShadowVisible: false,
          headerBackTitle: " ",
        }}
      />
      <View style={[styles.container]}>
        {/* Header */}
        <View>
          {/* Title and subtitle */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text style={styles.title}>Consultation Requests</Text>
              <Text style={styles.subTitle}>
                Manage All Consultation Requests from Students
              </Text>
            </View>
          </View>

          <View style={CommonStyles.inputContainer}>
            <View
              style={[
                CommonStyles.searchInputWrapper,
                emailFocused && CommonStyles.focusedInput,
              ]}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={"#777777"}
              />
              <TextInput
                style={CommonStyles.textInput}
                placeholder="Search by student name, ID, or topic"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          <View>
            <ScrollView
              horizontal
              contentContainerStyle={{
                flexDirection: "row",
                gap: 8,
                marginTop: 10,
                alignItems: "center",
              }}
              showsHorizontalScrollIndicator={false}
            >
              {filterOptions.map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => setSelectedFilter(option.key)}
                  style={{
                    paddingVertical: 2,
                    paddingHorizontal: 24,
                    backgroundColor:
                      selectedFilter === option.key ? "#3D83F5" : "#ffffff",
                    borderRadius: 100,
                    borderWidth: 1,
                    borderColor:
                      selectedFilter === option.key ? "#3D83F5" : "#DADADA",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Lato",
                      fontSize: 13,
                      lineHeight: 28,
                      color:
                        selectedFilter === option.key ? "#ffffff" : "#707275",
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <FlatList
          data={filteredConsultations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConsultationReqCard item={item} lecturerData={lecturerData} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20, gap: 16, marginTop: 20 }}
          ListEmptyComponent={() => (
            <View style={{ alignItems: "center", marginTop: 50 }}>
              <MaterialIcons name="inbox" size={64} color={"#ccc"} />
              <Text
                style={{
                  fontFamily: "Lato",
                  fontSize: 16,
                  color: "#6D6D6E",
                  marginTop: 16,
                }}
              >
                No consultations found
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default ConsultationRequest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 16,
  },
  image: {
    width: 148,
    height: 65,
    alignSelf: "center",
    marginTop: 14,
  },
  profileImage: {
    width: 40,
    height: 40,
    alignSelf: "center",
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
  inputContainer: {
    marginTop: 8,
  },
  label: {
    fontFamily: "Lato",
    fontSize: 14,
    lineHeight: 20,
    color: "#505050",
  },
  emailInputWrapper: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#CFCFCF",
    borderRadius: 100,
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginTop: 10,
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
  authorImage: {
    width: 34,
    height: 34,
    borderRadius: 22,
  },
});
