import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface LoadingComponentProps {
  message?: string;
  size?: "small" | "large";
  color?: string;
  showIcon?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
  overlay?: boolean;
  style?: any;
}

export const LoadingComponent: React.FC<LoadingComponentProps> = ({
  message = "Loading...",
  size = "large",
  color = "#1E88E5",
  showIcon = true,
  iconName = "cloud-upload-outline",
  backgroundColor = "rgba(255, 255, 255, 0.95)",
  overlay = true,
  style,
}) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseAnimation.start();
    rotateAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, [pulseAnim, rotateAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const containerStyle = overlay
    ? [styles.overlayContainer, { backgroundColor }, style]
    : [styles.inlineContainer, style];

  return (
    <View style={containerStyle}>
      <View style={styles.loadingContent}>
        <Animated.View
          style={[
            styles.outerRing,
            {
              transform: [{ rotate: rotateInterpolate }],
              borderColor: color,
            },
          ]}
        />

        {/* Main content container */}
        <View style={styles.centerContent}>
          {showIcon && (
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons name={iconName} size={32} color={color} />
            </Animated.View>
          )}

          <ActivityIndicator size={size} color={color} style={styles.spinner} />
        </View>

        {/* Loading dots animation */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <LoadingDot key={index} delay={index * 200} color={color} />
          ))}
        </View>

        <Text style={[styles.loadingText, { color: color }]}>{message}</Text>
      </View>
    </View>
  );
};

const LoadingDot: React.FC<{ delay: number; color: string }> = ({
  delay,
  color,
}) => {
  const dotAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const dotAnimation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    dotAnimation.start();

    return () => dotAnimation.stop();
  }, [dotAnim, delay]);

  const dotScale = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.2],
  });

  const dotOpacity = dotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: color,
          transform: [{ scale: dotScale }],
          opacity: dotOpacity,
        },
      ]}
    />
  );
};

export const MinimalLoader: React.FC<{
  color?: string;
  size?: number;
  message?: string;
}> = ({ color = "#1E88E5", size = 24, message }) => {
  return (
    <View style={styles.minimalContainer}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={[styles.minimalText, { color }]}>{message}</Text>
      )}
    </View>
  );
};

export const ChatMessageSkeleton: React.FC = () => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonMessage}>
          <Animated.View
            style={[
              styles.skeletonLine,
              { opacity: shimmerOpacity, width: `${Math.random() * 40 + 60}%` },
            ]}
          />
          <Animated.View
            style={[
              styles.skeletonLine,
              {
                opacity: shimmerOpacity,
                width: `${Math.random() * 30 + 40}%`,
                marginTop: 8,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  inlineContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  outerRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderStyle: "dashed",
    opacity: 0.3,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
  },
  iconContainer: {
    position: "absolute",
    top: 8,
  },
  spinner: {
    position: "absolute",
    bottom: 8,
  },
  dotsContainer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
    fontFamily: "Lato",
  },
  minimalContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  minimalText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: "Lato",
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonMessage: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
  },
});

export default LoadingComponent;
