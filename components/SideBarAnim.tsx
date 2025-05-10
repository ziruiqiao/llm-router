import React, { useEffect, useState } from "react";
import { View, Pressable, Dimensions, Platform } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useColorScheme } from '@/hooks/useColorScheme';
import { lightTheme, darkTheme } from '@/constants/theme';
import tw from "twrnc";

const { width } = Dimensions.get("window");

interface SidebarProps {
  sidebarExpanded: boolean;
  closeSidebar: () => void;
  slideFrom?: "left" | "right"; // New prop to control slide direction
  children: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarExpanded, closeSidebar, slideFrom = "left", children }) => {
  const initialPosition = slideFrom === "left" ? -width : width; // Start position based on direction
  const translateX = useSharedValue(sidebarExpanded ? 0 : initialPosition);
  const colorScheme = useColorScheme();
  const [dark, setDark] = useState(colorScheme === 'dark');

  useEffect(() => {
    translateX.value = withSpring(sidebarExpanded ? 0 : initialPosition, { damping: 25, stiffness: 180 });
  }, [sidebarExpanded, slideFrom]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View 
      style={tw`absolute inset-0 ${sidebarExpanded ? "z-50" : "z-50"} ${Platform.OS === 'ios' ? 'mb-13' : 'mt-5'}`}
      pointerEvents={sidebarExpanded ? "auto" : "none"} // Allow clicks when open, ignore when closed
    >
      {/* Overlay (click outside to close) */}
      {sidebarExpanded && (
        <Pressable style={tw`absolute inset-0 bg-black/50`} onPress={closeSidebar} />
      )}
      
      {/* Sidebar */}
      <Animated.View style={[
        tw`absolute top-0 left-0 h-full w-full shadow-lg bg-[${dark?darkTheme.background0 : lightTheme.background0}]`,
        slideFrom === "left" ? tw`left-0` : tw`right-0`, // Position dynamically
        animatedStyle
      ]}>
        {children}
      </Animated.View>
    </View>
  );
};

export default Sidebar;
