import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useState } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
  collection,
} from "firebase/firestore";
import { db } from "@/services/FirebaseConfig";

const ConsultationAccept = () => {
  const { consultation } = useLocalSearchParams();
  const router = useRouter();
  const consultationData = consultation ? JSON.parse(consultation) : null;

  const [meetingType, setMeetingType] = useState(consultationData?.mode || "");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const [locationFocused, setLocationFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (event, time) => {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    return time.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPreferredDates = (dates) => {
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return "Not specified";
    }
    return dates.join(", ");
  };

  const createNotificationForStudent = async (
    consultationId,
    studentId,
    lecturerName,
    scheduledDateTime
  ) => {
    try {
      const formattedDateTime = scheduledDateTime.toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const notificationData = {
        is_read: false,
        student_id: studentId, 
        lecturer_id: consultationData.lecturer_id,
        message_description: "Your consultation request has been accepted",
        message_text: `Your consultation request has been accepted by ${lecturerName}. Scheduled for ${formattedDateTime}`,
        receiver_type: "student",
        related_id: consultationId,
        related_type: "consultations",
        timestamp: serverTimestamp(),
        user_id: studentId,
      };

      await addDoc(collection(db, "notifications"), notificationData);
      console.log("Notification sent to student successfully");
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  const handleAcceptConsultation = async () => {
    if (!meetingType) {
      Alert.alert("Error", "Please select a meeting type");
      return;
    }

    if (meetingType === "in-person" && !location.trim()) {
      Alert.alert("Error", "Please enter a location for in-person meeting");
      return;
    }

    setLoading(true);

    try {
      const consultationRef = doc(db, "consultations", consultationData.id);

      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(selectedTime.getHours());
      scheduledDateTime.setMinutes(selectedTime.getMinutes());

      const updateData = {
        status: "accepted",
        mode: meetingType,
        scheduledDateTime: scheduledDateTime,
        lecturerNotes: notes,
        acceptedAt: serverTimestamp(),
      };

      if (meetingType === "in-person") {
        updateData.location = location;
      }

      await updateDoc(consultationRef, updateData);
      const lecturerName =
        consultationData.lecturerDetails?.name || "Your Lecturer";
      await createNotificationForStudent(
        consultationData.id,
        consultationData.student_id,
        lecturerName,
        scheduledDateTime
      );

      Alert.alert("Success", "Consultation accepted successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error accepting consultation:", error);
      Alert.alert("Error", "Failed to accept consultation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!consultationData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Consultation data not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <Stack.Screen
        options={{
          title: "Accept Consultation",
          headerTitleStyle: { color: "#ffffff" },
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Consultation Request Card */}
        <View style={styles.requestCard}>
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ flex: 1, alignItems: "flex-start" }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={styles.avatarContainer}>
                  <MaterialIcons name="person" color={"#0F4996"} size={24} />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.studentName}>
                    {consultationData.studentDetails?.name || "Unknown Student"}
                  </Text>
                  <Text style={styles.studentInfo}>
                    {consultationData.studentDetails?.institutional_id || "N/A"}{" "}
                    • {consultationData.studentDetails?.faculty || "N/A"}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.topicTitle}>
                  {consultationData.topic || "Topic Not Provided"}
                </Text>
                <Text style={styles.description}>
                  {consultationData.description ||
                    "No description provided for this consultation."}
                </Text>
              </View>

              {/* Show preferred dates */}
              {consultationData.preferredDate &&
                Array.isArray(consultationData.preferredDate) &&
                consultationData.preferredDate.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.preferredDatesLabel}>
                      Student's Preferred Times:
                    </Text>
                    <Text style={styles.preferredDatesText}>
                      {formatPreferredDates(consultationData.preferredDate)}
                    </Text>
                  </View>
                )}
            </View>

            <View style={styles.priorityContainer}>
              <View
                style={[
                  styles.priorityBadge,
                  {
                    backgroundColor:
                      consultationData.priority === "high"
                        ? "#ef4444"
                        : consultationData.priority === "medium"
                        ? "#f59e0b"
                        : "#10b981",
                  },
                ]}
              >
                <MaterialIcons name="info-outline" size={18} color={"#fff"} />
                <Text style={styles.priorityText}>
                  {consultationData.priority || "High"}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
            >
              <MaterialIcons
                name="calendar-today"
                size={20}
                color={"#6D6D6E"}
              />
              <Text style={styles.dateText}>
                Requested:{" "}
                {consultationData.createdAt?.toDate
                  ? consultationData.createdAt.toDate().toLocaleString()
                  : "Date Not Available"}
              </Text>
            </View>
          </View>
        </View>

        {/* Meeting Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Type</Text>
          <Text style={styles.sectionSubtitle}>
            Student requested: {consultationData.mode || "Not specified"}
          </Text>
          <View style={styles.meetingTypeContainer}>
            <Pressable
              style={[
                styles.meetingTypeOption,
                meetingType === "in-person" && styles.selectedOption,
              ]}
              onPress={() => setMeetingType("in-person")}
            >
              <MaterialIcons
                name="location-on"
                size={24}
                color={meetingType === "in-person" ? "#3D83F5" : "#6D6D6E"}
              />
              <Text
                style={[
                  styles.meetingTypeText,
                  meetingType === "in-person" && styles.selectedOptionText,
                ]}
              >
                In-Person Meeting
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.meetingTypeOption,
                meetingType === "online" && styles.selectedOption,
              ]}
              onPress={() => setMeetingType("online")}
            >
              <MaterialIcons
                name="videocam"
                size={24}
                color={meetingType === "online" ? "#3D83F5" : "#6D6D6E"}
              />
              <Text
                style={[
                  styles.meetingTypeText,
                  meetingType === "online" && styles.selectedOptionText,
                ]}
              >
                Online Meeting
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Date and Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>

          <View style={styles.dateTimeContainer}>
            <Pressable
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons
                name="calendar-today"
                size={20}
                color={"#3D83F5"}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>
                  {formatDate(selectedDate)}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={"#6D6D6E"} />
            </Pressable>

            <Pressable
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <MaterialIcons name="access-time" size={20} color={"#3D83F5"} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dateTimeLabel}>Time</Text>
                <Text style={styles.dateTimeValue}>
                  {formatTime(selectedTime)}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={"#6D6D6E"} />
            </Pressable>
          </View>
        </View>

        {/* Location (only for in-person meetings) */}
        {meetingType === "in-person" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View
              style={[
                styles.inputWrapper,
                locationFocused && styles.focusedInputWrapper,
              ]}
            >
              <MaterialIcons name="location-on" size={20} color={"#777777"} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter meeting location (e.g., Room 301, Main Building)"
                value={location}
                onChangeText={setLocation}
                onFocus={() => setLocationFocused(true)}
                onBlur={() => setLocationFocused(false)}
                multiline
              />
            </View>
          </View>
        )}

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <View
            style={[
              styles.inputWrapper,
              styles.notesInputWrapper,
              notesFocused && styles.focusedInputWrapper,
            ]}
          >
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              placeholder="Add any additional information or instructions for the student..."
              value={notes}
              onChangeText={setNotes}
              onFocus={() => setNotesFocused(true)}
              onBlur={() => setNotesFocused(false)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Accept Button */}
        <Pressable
          style={[styles.acceptButton, loading && styles.disabledButton]}
          onPress={handleAcceptConsultation}
          disabled={loading}
        >
          <MaterialIcons name="check" size={20} color={"#fff"} />
          <Text style={styles.acceptButtonText}>
            {loading ? "Accepting..." : "Accept Consultation"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "white",
  },
  requestCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 24,
  },
  avatarContainer: {
    padding: 10,
    backgroundColor: "#e2e6f5",
    borderRadius: 100,
  },
  studentName: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "#000",
  },
  studentInfo: {
    fontFamily: "Lato",
    fontSize: 13,
    color: "#6D6D6E",
    marginTop: 5,
  },
  topicTitle: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "#000",
  },
  description: {
    fontFamily: "Lato",
    fontSize: 13,
    color: "#6D6D6E",
    marginTop: 5,
  },
  preferredDatesLabel: {
    fontFamily: "LatoBold",
    fontSize: 14,
    color: "#3D83F5",
  },
  preferredDatesText: {
    fontFamily: "Lato",
    fontSize: 13,
    color: "#6D6D6E",
    marginTop: 2,
  },
  priorityContainer: {
    marginLeft: "auto",
    alignItems: "flex-end",
  },
  priorityBadge: {
    flexDirection: "row",
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    alignItems: "center",
    gap: 2,
  },
  priorityText: {
    fontFamily: "LatoBold",
    fontSize: 13,
    color: "#fff",
    textTransform: "uppercase",
  },
  dateText: {
    fontFamily: "Lato",
    color: "#6D6D6E",
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "LatoBold",
    fontSize: 18,
    color: "#000",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: "Lato",
    fontSize: 14,
    color: "#6D6D6E",
    marginBottom: 12,
  },
  meetingTypeContainer: {
    gap: 12,
  },
  meetingTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#fff",
    gap: 12,
  },
  selectedOption: {
    borderColor: "#3D83F5",
    backgroundColor: "#F0F4FF",
  },
  meetingTypeText: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "#6D6D6E",
  },
  selectedOptionText: {
    color: "#3D83F5",
    fontFamily: "LatoBold",
  },
  dateTimeContainer: {
    gap: 12,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#fff",
    gap: 12,
  },
  dateTimeLabel: {
    fontFamily: "Lato",
    fontSize: 13,
    color: "#6D6D6E",
  },
  dateTimeValue: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "#000",
    marginTop: 2,
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
  focusedInputWrapper: {
    borderColor: "#3D83F5",
  },
  notesInputWrapper: {
    alignItems: "flex-start",
    paddingVertical: 16,
  },
  textInput: {
    flex: 1,
    fontFamily: "Lato",
    fontSize: 16,
    color: "#000",
  },
  notesInput: {
    minHeight: 80,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 12,
    marginBottom: 32,
  },
  disabledButton: {
    opacity: 0.6,
  },
  acceptButtonText: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "#fff",
  },
});

export default ConsultationAccept;
