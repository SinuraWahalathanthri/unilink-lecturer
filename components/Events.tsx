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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, "events")
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
