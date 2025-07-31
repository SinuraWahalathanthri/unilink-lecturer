import {
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useState, useEffect } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/FirebaseConfig";
import * as ImagePicker from "expo-image-picker";

const OfficeHourItem = ({
  hour,
  index,
  updateOfficeHour,
  removeOfficeHour,
}) => {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const modes = ["Physical", "Online", "Both"];

  return (
    <View style={styles.officeHourItem}>
      <View style={styles.officeHourRow}>
        <View style={styles.daySelector}>
          <Text style={styles.inputLabel}>Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.dayOptions}>
              {days.map((day) => (
                <Pressable
                  key={day}
                  style={[
                    styles.dayOption,
                    hour.day === day && styles.selectedDayOption,
                  ]}
                  onPress={() => updateOfficeHour(index, "day", day)}
                >
                  <Text
                    style={[
                      styles.dayOptionText,
                      hour.day === day && styles.selectedDayOptionText,
                    ]}
                  >
                    {day.slice(0, 3)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.officeHourRow}>
        <View style={styles.timeInput}>
          <Text style={styles.inputLabel}>From</Text>
          <TextInput
            style={styles.timeTextInput}
            value={hour.from}
            onChangeText={(text) => updateOfficeHour(index, "from", text)}
            placeholder="09:00"
          />
        </View>
        <View style={styles.timeInput}>
          <Text style={styles.inputLabel}>To</Text>
          <TextInput
            style={styles.timeTextInput}
            value={hour.to}
            onChangeText={(text) => updateOfficeHour(index, "to", text)}
            placeholder="17:00"
          />
        </View>
      </View>

      <View style={styles.officeHourRow}>
        <View style={styles.modeSelector}>
          <Text style={styles.inputLabel}>Mode</Text>
          <View style={styles.modeOptions}>
            {modes.map((mode) => (
              <Pressable
                key={mode}
                style={[
                  styles.modeOption,
                  hour.mode === mode && styles.selectedModeOption,
                ]}
                onPress={() => updateOfficeHour(index, "mode", mode)}
              >
                <Text
                  style={[
                    styles.modeOptionText,
                    hour.mode === mode && styles.selectedModeOptionText,
                  ]}
                >
                  {mode}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Pressable
          style={styles.removeButton}
          onPress={() => removeOfficeHour(index)}
        >
          <MaterialIcons name="delete" size={20} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );
};

const LecturerProfileEdit = () => {
  const { lecturer } = useLocalSearchParams();
  const router = useRouter();
  const lecturerData = lecturer ? JSON.parse(lecturer) : null;

  const [formData, setFormData] = useState({
    name: "",
    nic: "",
    office_location: "",
    google_meet_link: "",
    office_hours: [],
    profileImg: "",
  });

  const [loading, setLoading] = useState(false);
  const [focusedFields, setFocusedFields] = useState({});

  useEffect(() => {
    if (lecturerData) {
      setFormData({
        name: lecturerData.name || "",
        nic: lecturerData.nic || "",
        office_location: lecturerData.office_location || "",
        google_meet_link: lecturerData.google_meet_link || "",
        office_hours: lecturerData.office_hours || [],
        profileImg: lecturerData.profileImg || "",
      });
    }
  }, []); 

  const handleFocus = (field) => {
    setFocusedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setFocusedFields((prev) => ({ ...prev, [field]: false }));
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission denied",
        "You need to enable permissions to access the photo library."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setFormData((prev) => ({ ...prev, profileImg: result.assets[0].uri }));
    }
  };

  const addOfficeHour = () => {
    const newHour = {
      day: "Monday",
      from: "",
      to: "",
      mode: "Physical",
    };
    setFormData((prev) => ({
      ...prev,
      office_hours: [...prev.office_hours, newHour],
    }));
  };

  const updateOfficeHour = (index, field, value) => {
    const updatedHours = [...formData.office_hours];
    updatedHours[index] = { ...updatedHours[index], [field]: value };
    setFormData((prev) => ({ ...prev, office_hours: updatedHours }));
  };

  const removeOfficeHour = (index) => {
    const updatedHours = formData.office_hours.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, office_hours: updatedHours }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Name is required");
      return false;
    }
    if (!formData.nic.trim()) {
      Alert.alert("Validation Error", "NIC is required");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const lecturerRef = doc(db, "lecturers", lecturerData.id);
      await updateDoc(lecturerRef, {
        name: formData.name.trim(),
        nic: formData.nic.trim(),
        office_location: formData.office_location.trim(),
        google_meet_link: formData.google_meet_link.trim(),
        office_hours: formData.office_hours,
        profileImg: formData.profileImg,
      });

      Alert.alert("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
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
          title: "Edit Profile",
          headerTitleStyle: { color: "#000000" },
          headerShadowVisible: false,
          headerBackVisible:true
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri:
                  formData.profileImg ||
                  "https://static.vecteezy.com/system/resources/previews/006/606/249/large_2x/nice-stylish-girl-portrait-for-social-networks-user-avatar-vector.jpg",
              }}
              style={styles.profileImage}
            />
            <Pressable style={styles.imageEditButton} onPress={pickImage}>
              <MaterialIcons name="camera-alt" size={20} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.imageHint}>
            Tap the camera icon to change your photo
          </Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedFields.name && styles.focusedInput,
              ]}
            >
              <MaterialIcons name="person" size={20} color="#777777" />
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                onFocus={() => handleFocus("name")}
                onBlur={() => handleBlur("name")}
                placeholder="Enter your full name"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>NIC Number *</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedFields.nic && styles.focusedInput,
              ]}
            >
              <MaterialIcons name="badge" size={20} color="#777777" />
              <TextInput
                style={styles.textInput}
                value={formData.nic}
                onChangeText={(text) => handleInputChange("nic", text)}
                onFocus={() => handleFocus("nic")}
                onBlur={() => handleBlur("nic")}
                placeholder="Enter your NIC number"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Office Location</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedFields.office_location && styles.focusedInput,
              ]}
            >
              <MaterialIcons name="location-on" size={20} color="#777777" />
              <TextInput
                style={styles.textInput}
                value={formData.office_location}
                onChangeText={(text) =>
                  handleInputChange("office_location", text)
                }
                onFocus={() => handleFocus("office_location")}
                onBlur={() => handleBlur("office_location")}
                placeholder="Enter your office location"
              />
            </View>
          </View>
        </View>

        {/* Meeting Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Google Meet Link</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedFields.google_meet_link && styles.focusedInput,
              ]}
            >
              <MaterialIcons name="videocam" size={20} color="#777777" />
              <TextInput
                style={styles.textInput}
                value={formData.google_meet_link}
                onChangeText={(text) =>
                  handleInputChange("google_meet_link", text)
                }
                onFocus={() => handleFocus("google_meet_link")}
                onBlur={() => handleBlur("google_meet_link")}
                placeholder="https://meet.google.com/your-meeting-link"
                keyboardType="url"
              />
            </View>
          </View>
        </View>

        {/* Office Hours */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Office Hours</Text>
            <Pressable style={styles.addButton} onPress={addOfficeHour}>
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          {formData.office_hours.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="schedule" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No office hours set</Text>
              <Text style={styles.emptyStateSubtext}>
                Add your available hours for student consultations
              </Text>
            </View>
          ) : (
            formData.office_hours.map((hour, index) => (
              <OfficeHourItem
                key={index}
                hour={hour}
                index={index}
                updateOfficeHour={updateOfficeHour}
                removeOfficeHour={removeOfficeHour}
              />
            ))
          )}
        </View>

        {/* Save Button */}
        <Pressable
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
        >
          <MaterialIcons name="save" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {loading ? "Saving..." : "Save Changes"}
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
  imageSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  imageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  imageEditButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#3D83F5",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  imageHint: {
    fontFamily: "Lato",
    fontSize: 14,
    color: "#6D6D6E",
    textAlign: "center",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "LatoBold",
    fontSize: 18,
    color: "#000",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3D83F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    fontFamily: "LatoBold",
    fontSize: 14,
    color: "#fff",
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
  focusedInput: {
    borderColor: "#3D83F5",
  },
  textInput: {
    flex: 1,
    fontFamily: "Lato",
    fontSize: 16,
    color: "#000",
  },
  officeHourItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  officeHourRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  daySelector: {
    flex: 1,
  },
  dayOptions: {
    flexDirection: "row",
    gap: 8,
  },
  dayOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  selectedDayOption: {
    backgroundColor: "#3D83F5",
    borderColor: "#3D83F5",
  },
  dayOptionText: {
    fontFamily: "Lato",
    fontSize: 12,
    color: "#6D6D6E",
  },
  selectedDayOptionText: {
    color: "#fff",
    fontFamily: "LatoBold",
  },
  timeInput: {
    flex: 1,
  },
  timeTextInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: "Lato",
    fontSize: 14,
    backgroundColor: "#fff",
  },
  modeSelector: {
    flex: 1,
  },
  modeOptions: {
    flexDirection: "row",
    gap: 6,
  },
  modeOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  selectedModeOption: {
    backgroundColor: "#3D83F5",
    borderColor: "#3D83F5",
  },
  modeOptionText: {
    fontFamily: "Lato",
    fontSize: 12,
    color: "#6D6D6E",
  },
  selectedModeOptionText: {
    color: "#fff",
    fontFamily: "LatoBold",
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyStateText: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "#6D6D6E",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontFamily: "Lato",
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 12,
    margin: 16,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "#fff",
  },
});

export default LecturerProfileEdit;
