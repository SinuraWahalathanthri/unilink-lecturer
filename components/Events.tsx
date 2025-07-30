import { db } from "@/services/FirebaseConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  View,
  StyleSheet,
  Alert,
} from "react-native";

type EventItem = {
  id: string;
  date: string;
  title: string;
  imageUrl: any;
};

function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation<any>();

  //   const addEvent = async () => {
  //   try {
  //     await addDoc(collection(db, "events"), {
  //       createdAt: Timestamp.fromDate(new Date()),
  //       created_by: "353q957587q395",
  //       date: Timestamp.fromDate(new Date()),
  //       description:
  //         "An intensive workshop on Artificial Intelligence. This Bootcamp will give students to connect with professionals in the Ai Industry and help them refurnish there skills in Machine Learning and Artificial Intelligence.",
  //       hostedBy: "Department of Computing",
  //       imageUrl:
  //         "https://www.zriadventures.com/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fdjhua1jv9%2Fimage%2Fupload%2Fv1707574917%2FIMG_20230901_125113_bc7ec07ead.webp&w=3840&q=75",
  //       location: "Auditorium A",
  //       status: "Active",
  //       time: "10:00 AM",
  //       title: "Nagrak Expedition Hike'25",
  //     });

  //     console.log("Event added successfully!");
  //   } catch (error) {
  //     console.error("Error adding event:", error);
  //   }
  // };

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, "events")
        // orderBy("createdAt", "desc")
      ),
      (snapshot) => {
        const eventList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EventItem[];

        setEvents(eventList);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const navigateToEventDetails = (item: EventItem) => {
    navigation.navigate("Events/EventDetails", {
      eventId: item.id,
    });
  };

  const EventCard = ({ item }: { item: EventItem }) => {
    const isNew = (createdAt: string) => {
      const now = new Date();
      const createdDate = new Date(createdAt);
      const diffInMs = now.getTime() - createdDate.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      return diffInDays <= 3;
    };

    const showNewBadge = item.createdAt && isNew(item.createdAt);

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigateToEventDetails(item)}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.upcomingImage} />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.gradientOverlay}
        >
          {showNewBadge && (
            <View style={[styles.badge, { backgroundColor: "red" }]}>
              <Text style={styles.badgeText}>New</Text>
            </View>
          )}
          <View style={styles.textContainer}>
            <Text style={styles.dateText}>{item.title}</Text>
            <Text numberOfLines={2} style={styles.titleText}>
              {new Date(item.startDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    );
  };

  return (
    <>
      <View style={{ marginTop: 10 }}>
        <FlatList
          data={events}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard item={item} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 1 }}
          ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Event Card Styles

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    position: "absolute",
    top: 10,
    right: 10,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "LatoBold",
    fontWeight: "bold",
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 20,
    borderRadius: 16,
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
    backgroundColor: "#00000050",
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
    fontFamily: "LatoBold",
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 19,
  },
  titleText: {
    fontFamily: "Lato",
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 19,
    marginTop: 5,
  },

  // Lecuture Card Styles

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
});

export default Events;
