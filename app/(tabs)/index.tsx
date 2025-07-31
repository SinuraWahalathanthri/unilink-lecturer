import { Image } from "expo-image";
import {
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  query,
  collection,
  getDocs,
  orderBy,
  limit,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/services/FirebaseConfig";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/context/AuthContext";
import Events from "@/components/Events";

const EventCard = ({ item }) => (
  <Pressable style={styles.card}>
    <Image source={{ uri: item.imageUrl }} style={styles.upcomingImage} />
    <View style={styles.textContainer}>
      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={styles.dateText}>
        {item.formattedDate} | {item.time}
      </Text>
      <Text style={styles.locationText}>{item.location}</Text>
      <Text style={styles.hostText}>{item.hostedBy}</Text>
    </View>
  </Pressable>
);

const HomeScreen = () => {
  const { user } = useAuth();

  const [lecturerData, setLecturerData] = useState(null);
  const [events, setEvents] = useState([]);
  const [consultations, setConsultations] = useState([]);

  const formatDate = (dateObj) => {
    const options = { weekday: "short", month: "long", day: "numeric" };
    return dateObj.toLocaleDateString("en-US", options);
  };

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        if (!user?.lecturer_id) {
          console.warn("No lecturer_id in user context.");
          return;
        }

        console.log(
          "Fetching consultations for lecturer_id:",
          user.lecturer_id
        );

        const lecturerQuery = query(
          collection(db, "lecturers"),
          where("lecturer_id", "==", user.lecturer_id)
        );
        const lecturerSnap = await getDocs(lecturerQuery);

        if (lecturerSnap.empty) {
          console.warn("Lecturer not found in Firestore.");
          return;
        }

        const lecturerDocId = lecturerSnap.docs[0].id;
        console.log("Lecturer Firestore doc ID:", lecturerDocId);

        const consultationsQuery = query(
          collection(db, "consultations"),
          where("lecturer_id", "==", lecturerDocId),
          orderBy("createdAt", "desc"),
          limit(3)
        );

        const consultationsSnap = await getDocs(consultationsQuery);

        const consultationList = await Promise.all(
          consultationsSnap.docs.map(async (docSnap) => {
            const consultation = { id: docSnap.id, ...docSnap.data() };

            if (consultation.student_id) {
              try {
                const studentRef = doc(db, "students", consultation.student_id);
                const studentSnap = await getDoc(studentRef);
                if (studentSnap.exists()) {
                  consultation.studentDetails = studentSnap.data();
                }
              } catch (e) {
                console.warn(
                  "Could not fetch student details for:",
                  consultation.student_id
                );
              }
            }

            return consultation;
          })
        );

        setConsultations(consultationList);
      } catch (error) {
        console.error("Error loading consultations:", error);
      }
    };

    fetchConsultations();
  }, [user]);

  function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
      { label: "second", seconds: 1 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count > 0) {
        return `${count} ${interval.label}${count !== 1 ? "s" : ""}`;
      }
    }
    return "just now";
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Blue Header Section */}
      <View style={styles.blueHeaderSection}>
        <View
          style={[
            styles.headerContainer,
            { paddingTop: Platform.OS === "ios" ? 0 : 36 },
          ]}
        >
          <AppHeader type="lecture" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {user?.name ? `Good Evening, ${user.name}` : "Good Evening!"}
            </Text>
            <Text style={styles.headerSubTitle}>
              Every day is a new beginning.
            </Text>
          </View>
        </View>
      </View>

      {/* White Content Section */}
      <View style={styles.whiteContentSection}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Upcoming Events */}
          {/* <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <Text style={styles.viewAllText}>View All</Text>
          </View>
          <View style={styles.eventsContainer}>
            <Events />
          </View> */}

          {/* Recent Consultation Requests */}
          <View style={styles.consultationHeader}>
            <Text style={styles.consultationTitle}>
              Recent Consultation Requests
            </Text>
            <Pressable
              onPress={() => {
                router.push({
                  pathname: "/screens/ConsultationRequest",
                  params: { lecturer: JSON.stringify(user) }, 
                });
              }}
            >
              <Text style={styles.viewAllText}>View all</Text>
            </Pressable>
          </View>
          <View style={styles.consultationContainer}>
            {consultations.length === 0 ? (
              <Text style={{ color: "#6b7280" }}>
                No recent consultations found.
              </Text>
            ) : (
              consultations.map((item) => (
                <View key={item.id} style={styles.consultationCard}>
                  <View style={styles.consultationTop}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <MaterialIcons
                        name="info-outline"
                        size={20}
                        color="#f59e0b"
                      />
                      <View>
                        <Text style={styles.consultationName}>
                          {item.studentDetails?.name ||
                            item.student_id ||
                            "Student not found"}
                        </Text>
                        <Text style={styles.consultationTopic}>
                          (
                          {item.studentDetails?.institutional_id ||
                            item.student_id ||
                            "Id not found"}
                          )
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.consultationTime}>
                      {timeSince(item.createdAt?.toDate?.() || new Date())} ago
                    </Text>
                  </View>
                  <Text style={styles.consultationTitleText}>
                    {item.topic || "Untitled"}
                  </Text>
                  <Text style={styles.consultationDesc}>
                    {item.description || "No description provided."}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F4996",
  },

  blueHeaderSection: {
    backgroundColor: "#0F4996",
    paddingBottom: 24,
  },
  headerContainer: {
    paddingHorizontal: 16,
  },
  headerTextContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: "LatoBold",
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerSubTitle: {
    marginTop: 6,
    fontFamily: "Lato",
    fontSize: 16,
    lineHeight: 19,
    color: "#B3C6E7",
  },

  whiteContentSection: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -12, 
    paddingTop: 24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 80 : 40,
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
    lineHeight: 20,
    color: "#000000",
  },
  viewAllText: {
    fontFamily: "Lato",
    fontSize: 15,
    lineHeight: 19,
    color: "#1A3C7C",
  },

  eventsContainer: {
    marginBottom: 8,
  },

  quickAccessContainer: {
    marginTop: 8,
  },
  quickAccessRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  quickAccessCard: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#CFCFCF",
  },
  quickAccessTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconContainer: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    marginTop: 10,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 100,
    backgroundColor: "#EF4444",
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    fontFamily: "Lato",
    fontSize: 12,
    lineHeight: 15,
    color: "white",
  },
  quickAccessText: {
    fontFamily: "Lato",
    fontSize: 14,
    lineHeight: 19,
    color: "#000000",
    marginTop: 5,
  },

  consultationContainer: {
    marginTop: 16,
    gap: 10,
  },
  card: {
    width: 200,
    height: 246,
    borderRadius: 16,
    overflow: "hidden",
  },
  upcomingImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
    borderRadius: 16,
  },
  heart: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 25,
    height: 25,
    backgroundColor: "#FFFFFF70",
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    position: "absolute",
    bottom: 20,
    left: 12,
  },
  dateText: {
    fontFamily: "Lato",
    color: "#C9C9C9",
    fontSize: 14,
    lineHeight: 19,
  },
  titleText: {
    fontFamily: "Lato",
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 19,
    marginTop: 5,
  },
  locationText: {
    fontSize: 12,
    color: "#ffffff",
    marginTop: 4,
    fontFamily: "Lato",
  },
  hostText: {
    fontSize: 12,
    color: "#fff",
    fontStyle: "italic",
    marginTop: 2,
    fontFamily: "Lato",
  },

  lectureCard: {
    width: 195,
    height: 198,
    borderRadius: 16,
    overflow: "hidden",
  },
  lectureImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  lectureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000050",
    borderRadius: 16,
  },
  lectureTextContainer: {
    position: "absolute",
    bottom: 20,
    left: 12,
  },
  lectureNameText: {
    fontFamily: "Lato",
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 19,
  },
  lectureTitleText: {
    fontFamily: "Lato",
    color: "#EFEFEF",
    fontSize: 14,
    lineHeight: 19,
    marginTop: 5,
  },

  consultationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  consultationTitle: {
    fontFamily: "LatoBold",
    fontSize: 18,
    color: "#000000",
  },
  consultationCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D7D7D7",
    borderRadius: 12,
  },
  consultationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  consultationName: {
    marginLeft: 8,
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "#000000",
  },
  consultationTopic: {
    marginLeft: 8,
    fontFamily: "LatoBold",
    fontSize: 14,
    color: "#1A1C87",
  },
  consultationTime: {
    fontFamily: "Lato",
    fontSize: 14,
    color: "#1A1C87",
  },
  consultationTitleText: {
    fontFamily: "LatoBold",
    fontSize: 16,
    color: "#1e40af",
    marginTop: 5,
  },
  consultationDesc: {
    fontFamily: "Lato",
    color: "#475569",
    marginTop: 2,
  },
});
