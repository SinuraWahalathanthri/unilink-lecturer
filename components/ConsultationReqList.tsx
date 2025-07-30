import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

const ConsultationReqList = () => {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 16,
        borderRadius: 12,
        width: "100%",
        backgroundColor: "#ffff",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        <View style={{ flex: 1, }}>
          <View style={{ flexDirection: "row" }}>
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 10,
                backgroundColor: "#e2e6f5",
                borderRadius: 100,
              }}
            >
              <MaterialIcons name="person" color={"#0F4996"} size={24} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text
                style={{ fontFamily: "LatoBold", fontSize: 16, color: "#000" }}
              >
                Johm Smith
              </Text>
              <Text
                style={{
                  fontFamily: "Lato",
                  fontSize: 13,
                  color: "#6D6D6E",
                  marginTop: 5,
                }}
              >
                STU2024001 • CS201
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 10, flexWrap: "wrap", flex: 1 }}>
            <Text
              style={{
                fontFamily: "LatoBold",
                fontSize: 16,
                color: "#000",
                textOverflow: "ellipsis",
                overflow: "hidden",
                maxWidth: "90%",
                lineHeight: 20,
              }}
            >
              Database Systems - Lecture Series PDF
            </Text>
            <Text
              style={{
                fontFamily: "Lato",
                fontSize: 13,
                color: "#6D6D6E",
                marginTop: 5,
                textOverflow: "ellipsis",
                overflow: "hidden",
                maxWidth: "90%",
                lineHeight: 20,
              }}
            >
              Comprehensive introduction to database systems, covering basic
              concepts and terminology
            </Text>
          </View>
        </View>
        <View style={{ marginLeft: "auto", gap: 5, alignItems: "flex-end" }}>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#ef4444",
              padding: 3,
              borderRadius: 100,
              paddingHorizontal: 8,
              alignItems: "center",
              gap: 2,
            }}
          >
            <MaterialIcons name="info-outline" size={18} color={"#ffffff"} />
            <Text
              style={{
                fontFamily: "LatoBold",
                fontSize: 13,
                color: "#ffffff",
                textTransform: "uppercase",
              }}
            >
              High
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#f59e0b",
              padding: 6,
              borderRadius: 100,
              paddingHorizontal: 8,
              alignItems: "center",
              gap: 2,
            }}
          >
            <Text
              style={{
                fontFamily: "LatoBold",
                fontSize: 13,
                color: "#ffffff",
                textTransform: "uppercase",
              }}
            >
              Pending
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <MaterialIcons name="calendar-today" size={20} color={"#6D6D6E"} />
          <Text style={{ fontFamily: "Lato", color: "#6D6D6E", fontSize: 14 }}>
            Requested: Today, 2:00 PM
          </Text>
        </View>

        <View style={{ flexDirection: "row", marginTop:10 }}>
          <View
            style={{
              marginLeft: "auto",
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
              marginTop: "auto",
            }}
          >
            <Pressable
              style={{
                flexDirection: "row",
                gap: 4,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#ef4444",
                paddingVertical: 2,
                paddingHorizontal: 8,
                borderRadius: 100,
              }}
            >
              <MaterialIcons name="close" size={18} color={"#ef4444"} />
              <Text
                style={{
                  fontFamily: "LatoBold",
                  fontSize: 14,
                  lineHeight: 28,
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
                paddingVertical: 2,
                paddingHorizontal: 8,
                borderRadius: 100,
              }}
            >
              <MaterialIcons name="check" size={18} color={"#fff"} />
              <Text
                style={{
                  fontFamily: "LatoBold",
                  fontSize: 14,
                  lineHeight: 28,
                  color: "#fff",
                }}
              >
                Accept
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ConsultationReqList;

const styles = StyleSheet.create({
  authorImage: {
    width: 34,
    height: 34,
    borderRadius: 22,
  },
});
