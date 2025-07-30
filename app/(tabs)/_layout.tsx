import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            backgroundColor: "#fdfdfd",
            position: "absolute",
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            shadowOffset: { height: 0, width: 0 },
            shadowRadius: 0,
          },
          default: {
            backgroundColor: "#fdfdfd",
            borderTopWidth: 0,
            elevation: 30,
            shadowOpacity: 0,
            shadowOffset: { height: 0, width: 0 },
            shadowRadius: 0,
          },
        }),
        tabBarActiveTintColor: "#007aff",
        tabBarInactiveTintColor: "gray",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home-filled" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: "News",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="newspaper" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="chat" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-group"
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="bell-outline"
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profie",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="face-man" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
