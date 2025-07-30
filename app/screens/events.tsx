import {
  FlatList,
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
import { Image } from "expo-image";
import { formatDistanceToNow } from "date-fns";
import { Link, useNavigation } from "expo-router";
import CommonStyles from "@/constants/CommonStyles";

const eventData = [
  {
    id: "1",
    title: "Hacktivate 2000",
    organizer: "Hackathon Club",
    date: "2024-06-16", // Format: YYYY-MM-DD
    time: "1PM - 3PM",
    location: "Memorial Hall 2 - 4",
    image: require("../../assets/images/hackthonImage.png"), // Replace with your own images later
  },
  // Add more events...
];

const EventCard = ({ item }) => {
  const eventDate = new Date(item.date);
  const dayName = eventDate.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = eventDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  return (
    <View
      style={{
        padding: 12,
        borderWidth: 1,
        borderColor: "#D7D7D7",
        borderRadius: 20,
        marginTop: 13,
        backgroundColor: "#fff",
      }}
    >
      <View style={{ borderRadius: 12, overflow: "hidden", marginBottom: 10 }}>
        <Image
          source={item.image}
          style={{ width: "100%", height: 160 }}
          contentFit="cover"
        />
      </View>

      <View style={{ marginBottom: 8, gap: 4 }}>
        <Text
          style={{ fontFamily: "LatoBold", fontSize: 12, color: "#875F26" }}
        >
          MON, JUNE 16 @ 1PM - 3PM EDT
        </Text>
        <Text style={{ fontFamily: "LatoBold", fontSize: 16, color: "#000" }}>
          {item.title}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Text style={{ fontFamily: "Lato", fontSize: 14, color: "#6B6B6B" }}>
            by {item.organizer}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <MaterialIcons name="location-on" size={18} color="#6B6B6B" />
            <Text
              style={{
                fontFamily: "Lato",
                fontSize: 13,
                color: "#6B6B6B",
                marginLeft: 4,
              }}
            >
              {item.location}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          style={{
            flex: 1,
            paddingVertical: 12,
            backgroundColor: "#E6E5E7",
            borderRadius: 100,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <MaterialIcons name="star" size={20} color="#000000" />
          <Text style={{ fontFamily: "LatoBold", fontSize: 14 }}>
            Interested
          </Text>
        </Pressable>

        <Link href={"/eventsDetails"} asChild>
          <Pressable
            style={{
              flex: 1,
              paddingVertical: 12,
              backgroundColor: "#3D83F5",
              borderRadius: 100,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <MaterialIcons name="calendar-month" size={20} color="#ffffff" />
            <Text
              style={{ fontFamily: "LatoBold", fontSize: 14, color: "#fff" }}
            >
              Register
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
};

const Events = () => {
  const [emailFocused, setEmailFocused] = useState(false);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View
        style={[
          styles.container,
          { paddingTop: Platform.OS === "ios" ? 0 : 36 },
        ]}
      >
        {/* Header */}
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <Image
            source={require("../../assets/images/instituteLogo.png")}
            style={styles.image}
          />

          <View
            style={{
              flexDirection: "row",
              gap: 16,
              marginTop: 20,
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons name="magnify" size={24} />
            <MaterialCommunityIcons name="bell-outline" size={24} />

            <Image
              source={require("../../assets/images/profileImage.png")}
              style={styles.profileImage}
            />
          </View>
        </View>
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
              <Text style={styles.title}>Events</Text>
              <Text style={styles.subTitle}>
                Check out new event planned just for you.
              </Text>
            </View>
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 10,
                backgroundColor: "#3D83F5",
                borderRadius: 4,
              }}
            >
              <MaterialIcons name="add" color={"#ffffff"} size={24} />
            </View>
          </View>
          <View>
            <ScrollView
              horizontal
              contentContainerStyle={{
                flexDirection: "row",
                gap: 8,
                marginTop: 20,
                alignItems: "center",
              }}
              showsHorizontalScrollIndicator={false}
            >
              <View
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 24,
                  backgroundColor: "#3D83F5",
                  borderRadius: 100,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lato",
                    fontSize: 13,
                    lineHeight: 28,
                    color: "#ffffff",
                  }}
                >
                  My Groups
                </Text>
              </View>

              <View
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 24,
                  backgroundColor: "#ffffff",
                  borderRadius: 100,
                  borderWidth: 1,
                  borderColor: "#DADADA",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lato",
                    fontSize: 13,
                    lineHeight: 28,
                    color: "#707275",
                  }}
                >
                  My Groups
                </Text>
              </View>
            </ScrollView>
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
                placeholder="Search announcements"
                keyboardType="email-address"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <FlatList
            data={eventData}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: Platform.OS === "ios" ? 80 : 40,
            }}
            renderItem={({ item }) => <EventCard item={item} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Events;

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
});
