import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useRef, useState } from "react";
import { FlatList, Pressable } from "react-native";
import { DotIndicator } from "../components/onboarding/DotIndicator";
import { OnboardingSlide } from "../components/onboarding/OnboardingSlide";
import { ThemedText, ThemedView, useToken } from "../components/themed";
import { hapticLight, hapticSuccess } from "../utils/haptics";

const SLIDES = [
  { title: "Welcome", body: "Your all-in-one companion for a better experience.", emoji: "👋" },
  {
    title: "Powerful Features",
    body: "Chat, manage your profile, and more — all in one place.",
    emoji: "⚡",
  },
  { title: "Get Started", body: "You're ready to go. Let's dive in!", emoji: "🚀" },
] as const;

const ONBOARDING_KEY = "onboarding_seen";

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const primary = useToken("primary");
  const listRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      const idx = viewableItems[0]?.index;
      if (idx != null) {
        setActiveIndex(idx);
        hapticLight();
      }
    },
    [],
  );

  const handleGetStarted = async () => {
    await hapticSuccess();
    await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
    router.replace("/(tabs)/");
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <OnboardingSlide title={item.title} body={item.body} emoji={item.emoji} />
        )}
      />
      <ThemedView
        style={{ paddingBottom: 48, paddingHorizontal: 24, gap: 24, alignItems: "center" }}
      >
        <DotIndicator labels={SLIDES.map((s) => s.title)} activeIndex={activeIndex} />
        {activeIndex === SLIDES.length - 1 && (
          <Pressable
            style={{
              backgroundColor: primary,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 40,
            }}
            onPress={handleGetStarted}
          >
            <ThemedText variant="body" style={{ fontWeight: "700", color: "#fff" }}>
              Get Started
            </ThemedText>
          </Pressable>
        )}
      </ThemedView>
    </ThemedView>
  );
}
