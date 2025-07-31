import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Lato: require("../assets/fonts/Lato-Regular.ttf"),
    LatoBold: require("../assets/fonts/Lato-Bold.ttf"),
    LatoItalic: require("../assets/fonts/Lato-Italic.ttf"),
    LatoBoldItalic: require("../assets/fonts/Lato-BoldItalic.ttf"),
    LatoLight: require("../assets/fonts/Lato-Light.ttf"),
    LatoLightItalic: require("../assets/fonts/Lato-LightItalic.ttf"),
    LatoBlack: require("../assets/fonts/Lato-Black.ttf"),
    LatoBlackItalic: require("../assets/fonts/Lato-BlackItalic.ttf"),
    LatoThin: require("../assets/fonts/Lato-Thin.ttf"),
    LatoThinItalic: require("../assets/fonts/Lato-ThinItalic.ttf"),

    Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
    PoppinsBold: require("../assets/fonts/Poppins-Bold.ttf"),
    PoppinsMedium: require("../assets/fonts/Poppins-Medium.ttf"),
  });

  if (!loaded) {
    return null;
  }
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
