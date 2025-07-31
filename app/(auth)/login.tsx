import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/services/FirebaseConfig";
import { router, useNavigation } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const { setUser } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter email and password/OTP.");
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, "lecturer"), where("email", "==", email));
      const snapshot = await getDocs(q);

      let lecturer = null;

      if (snapshot.empty) {
        const q2 = query(
          collection(db, "lecturers"),
          where("email", "==", email)
        );
        const snapshot2 = await getDocs(q2);
        if (!snapshot2.empty) {
          lecturer = snapshot2.docs[0].data();
        }
      } else {
        lecturer = snapshot.docs[0].data();
      }

      if (!lecturer) {
        Alert.alert("Login Failed", "Lecturer not found.");
        return;
      }

      if (lecturer.status === "Deactive") {
        Alert.alert("Account Deactivated", "Please contact administration.");
        return;
      }

      if (lecturer.password) {
        if (lecturer.password === password) {
          Alert.alert("Login Successful", `Welcome ${lecturer.name}`);
          setUser(lecturer);
          router.replace("/(tabs)");
        } else {
          Alert.alert("Incorrect Password", "Please try again.");
        }
      } else {
        const otpExpiry = lecturer.otpExpiry?.toDate();
        const now = new Date();
        if (password === lecturer.nic && otpExpiry && now < otpExpiry) {
          Alert.alert("OTP Login Successful", `Welcome ${lecturer.name}`);
          setUser(lecturer);
          router.replace("/(tabs)");
        } else {
          Alert.alert("Invalid OTP", "OTP is incorrect or expired.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Something went wrong during login.");
    } finally {
      setLoading(false); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>
            Login to <Text style={{ color: "#3D83F5" }}>UniLink</Text>
          </Text>
          <Text style={styles.subTitle}>
            Sign in to your university account
          </Text>

          <Image
            source={require("../../assets/images/loginLectureImage.png")}
            style={styles.image}
          />

          <View style={styles.inputContainer}>
            <Text style={styles.label}>University Email or Student ID</Text>
            <View
              style={[
                styles.emailInputWrapper,
                emailFocused && styles.focusedInput,
              ]}
            >
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={"#777"}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email or ID"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.passwordContainer}>
            <Text style={styles.label}>Password or OTP</Text>
            <View
              style={[
                styles.passwordInputWrapper,
                passwordFocused && styles.focusedInput,
              ]}
            >
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={"#777"}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Enter password or OTP"
                secureTextEntry
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Login */}
          <View style={styles.loginSection}>
            <Pressable
              style={[styles.loginButton, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by XZORA Devlabs</Text>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 16,
  },
  title: {
    marginTop: 40,
    fontFamily: "LatoBlack",
    fontSize: 24,
    lineHeight: 29,
  },
  subTitle: {
    marginTop: 6,
    fontFamily: "Lato",
    fontSize: 16,
    lineHeight: 19,
    color: "#1C1E24",
  },
  image: {
    width: 300,
    height: 300,
    alignSelf: "center",
    marginTop: 50,
  },
  inputContainer: {
    marginTop: 24,
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
  passwordContainer: {
    marginTop: 15,
  },
  passwordInputWrapper: {
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
  loginSection: {
    marginTop: 30,
    marginBottom:10
  },
  loginButton: {
    backgroundColor: "#3D83F5",
    paddingVertical: 12,
    borderRadius: 100,
    alignItems: "center",
  },
  loginButtonText: {
    fontFamily: "Lato",
    fontSize: 16,
    lineHeight: 19,
    color: "white",
  },
  forgotText: {
    fontFamily: "LatoBold",
    fontSize: 14,
    lineHeight: 20,
    color: "#3D83F5",
    textAlign: "center",
    marginTop: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontFamily: "LatoBold",
    fontSize: 14,
    lineHeight: 20,
    color: "#D0D0D0",
    textAlign: "center",
    marginBottom: 18,
  },
  focusedInput: {
    borderColor: "#3D83F5",
    borderWidth: 2,
  },
});
