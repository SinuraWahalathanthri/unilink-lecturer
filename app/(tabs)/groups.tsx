import { Image } from "expo-image";
import {
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import {
  Feather,
  FontAwesome,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import React, { useEffect, useState, useCallback } from "react";
import AppHeader from "@/components/AppHeader";
import { router, useNavigation } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/services/FirebaseConfig";
import CommonStyles from "@/constants/CommonStyles";

const GroupCard = ({ item, onPress }) => (
  <Pressable style={styles.card} onPress={onPress}>
    <View style={styles.row}>
      <View style={styles.groupPlaceholder}>
        <FontAwesome name="graduation-cap" size={20} color="#4e4cafff" />
      </View>
      <View style={styles.dot2} />
      <View style={styles.content}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text numberOfLines={2} style={styles.metaTextLight}>
          {item.description}
        </Text>
        <View style={styles.row}>
          <Feather name="users" size={14} color="#777" />
          <Text style={styles.tag}>Group</Text>
        </View>
      </View>
    </View>
  </Pressable>
);

export default function GroupsScreen() {
  const [emailFocused, setEmailFocused] = useState(false);
  const [myGroups, setMyGroups] = useState([]);
  const { user } = useAuth();
  const navigation = useNavigation();

  const fetchMyGroups = useCallback(async () => {
    if (!user?.email) return;

    console.log("Fetching my groups for", user.email);

    try {
      const lecturerQuery = query(
        collection(db, "lecturers"),
        where("email", "==", user.email)
      );
      const lecturerSnapshot = await getDocs(lecturerQuery);
      if (lecturerSnapshot.empty) {
        console.log("No lecturer found for", user.email);
        return;
      }

      const lecturerId = lecturerSnapshot.docs[0].id;

      const cmSnapshot = await getDocs(collection(db, "community_members"));
      const myDocs = cmSnapshot.docs.filter((docSnap) => {
        const data = docSnap.data();
        return data.lecturers?.lecturer_id === lecturerId;
      });

      console.log("Found", myDocs.length, "groups for", user.email);

      const communityIds = myDocs.map(
        (docSnap) => docSnap.data().comm_unity_id
      );

      const communityData = await Promise.all(
        communityIds.map(async (cid) => {
          const ref = doc(db, "communities", cid);
          const snap = await getDoc(ref);
          return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        })
      );

      console.log(
        "Found",
        communityData.filter(Boolean).length,
        "communities for",
        user.email
      );

      setMyGroups(communityData.filter(Boolean));
    } catch (err) {
      console.error("Error loading groups:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchMyGroups();
  }, [fetchMyGroups]);

  const navigateToChat = (group) => {
    console.log("Navigating to chat for", group.name);
    navigation.navigate("screens/GroupDetails", {
      communityId: group.id,
      name: group.name,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <View
        style={[
          styles.container,
          { paddingTop: Platform.OS === "ios" ? 0 : 36 },
        ]}
      >
        <AppHeader />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Groups</Text>
            <Text style={styles.subTitle}>
              Connect with university communities
            </Text>
          </View>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/screens/RequestCommunity",
                params: { lecturer: JSON.stringify(user) },
              })
            }
          >
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 10,
                backgroundColor: "#3D83F5",
                borderRadius: 4,
              }}
            >
              <MaterialIcons name="add" color="#fff" size={24} />
            </View>
          </Pressable>
        </View>

        <View style={CommonStyles.inputContainer}>
          <View
            style={[
              CommonStyles.searchInputWrapper,
              emailFocused && CommonStyles.focusedInput,
            ]}
          >
            <MaterialCommunityIcons name="magnify" size={20} color="#777" />
            <TextInput
              style={CommonStyles.textInput}
              placeholder="Search groups..."
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>
        </View>

        <FlatList
          data={myGroups}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Platform.OS === "ios" ? 80 : 40,
          }}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: "#e5e5e5" }} />
          )}
          renderItem={({ item }) => (
            <GroupCard item={item} onPress={() => navigateToChat(item)} />
          )}
        />
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: "#16a34a",
    color: "#fafafa",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  container2: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#ffffffff",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  activeTabText: {
    color: "#3D83F5",
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#3d83f5",
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 2,
  },

  unreadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
  },
  cardTitle: {
    fontFamily: "LatoBold",
    fontSize: 16,
    lineHeight: 29,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  image: {
    width: 148,
    height: 65,
    alignSelf: "center",
    marginTop: 14,
  },
  content: {
    marginLeft: 12,
    flex: 1,
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 10,
    marginBottom: 5,
  },
  tag: {
    color: "#6B6B6B",
    fontFamily: "Lato",
    fontSize: 14,
    marginLeft: 6,
  },
  tagWhite: {
    color: "#fafafa",
    fontFamily: "LatoBold",
    fontSize: 14,
    marginLeft: 6,
  },
  metaText: {
    color: "#6B6B6B",
    fontFamily: "LatoBold",
    fontSize: 14,
  },
  metaTextLight: {
    color: "#6B6B6B",
    fontFamily: "Lato",
    fontSize: 14,
  },
  dot: {
    marginHorizontal: 6,
    color: "#6B6B6B",
    fontSize: 20,
  },
  groupPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#ece8f5ff",
    justifyContent: "center",
    alignItems: "center",
  },
  dot2: {
    width: 10,
    height: 10,
    marginHorizontal: 6,
    backgroundColor: "#48d562",
    borderRadius: 10,
    position: "absolute",
    top: 5,
    bottom: 2,
    right: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    alignItems: "center",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  author: {
    fontFamily: "LatoBold",
    color: "#3A3A3A",
    fontSize: 13,
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    alignSelf: "center",
    borderRadius: 100,
  },
});
