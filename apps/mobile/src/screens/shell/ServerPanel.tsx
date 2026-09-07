import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { useProfiles } from "@/app-shell";
import { describeError } from "@/lib/describe-error";
import { haptic } from "@/lib/haptics";
import { useTheme } from "@/theme";
import { Icon, Separator, Text, toast } from "@/ui";
import { workspaceInitials } from "./workspace-initials";

const PANEL_WIDTH = 300;
const HANDLE_HEIGHT = 52;
const ANIMATION_MS = 220;

export function ServerPanel() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { profiles, activeProfile, setActiveProfile } = useProfiles();
  const [open, setOpen] = useState(false);
  const progress = useDerivedValue(() =>
    withTiming(open ? 1 : 0, { duration: ANIMATION_MS }),
  );
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [-PANEL_WIDTH - 24, 0],
        ),
      },
    ],
  }));

  if (!activeProfile || profiles.length === 0) return null;

  const close = () => setOpen(false);

  const switchTo = (id: string) => {
    close();
    if (id === activeProfile.id) return;
    haptic("selection");
    setActiveProfile(id).catch((error: unknown) => {
      toast.error("Could not switch server", {
        description: describeError(error),
      });
    });
  };

  const openAddServer = () => {
    close();
    router.push("/settings/servers/add");
  };

  const openServerSettings = () => {
    close();
    router.push("/settings/servers");
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill} testID="server-panel-root">
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[StyleSheet.absoluteFill, scrimStyle]}
      >
        <Pressable
          accessibilityLabel="Close server panel"
          onPress={() => {
            haptic("impact-light");
            close();
          }}
          style={[StyleSheet.absoluteFill, { backgroundColor: tokens.surfaceScrim }]}
        />
      </Animated.View>
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[
          styles.panel,
          {
            backgroundColor: tokens.sidebar,
            borderRightColor: tokens.sidebarBorder,
            paddingLeft: insets.left,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 12,
          },
          panelStyle,
        ]}
      >
        <Text
          variant="caption"
          weight="semibold"
          style={[styles.sectionLabel, { color: tokens.mutedForeground }]}
        >
          Servers
        </Text>
        <View style={styles.rows}>
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfile.id;
            return (
              <Pressable
                key={profile.id}
                testID={`server-panel-server-${profile.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Server ${profile.label}`}
                accessibilityState={{ selected: isActive }}
                onPress={() => {
                  if (isActive) {
                    haptic("impact-light");
                    close();
                    return;
                  }
                  switchTo(profile.id);
                }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: pressed
                      ? tokens.sidebarAccent
                      : "transparent",
                  },
                ]}
              >
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isActive
                        ? tokens.primary
                        : tokens.sidebarAccent,
                    },
                  ]}
                >
                  <Text
                    variant="footnote"
                    weight="semibold"
                    style={{
                      color: isActive
                        ? tokens.primaryForeground
                        : tokens.sidebarAccentForeground,
                    }}
                  >
                    {workspaceInitials(profile.label)}
                  </Text>
                </View>
                <Text
                  variant="body"
                  numberOfLines={1}
                  style={[
                    styles.label,
                    {
                      color: isActive
                        ? tokens.sidebarForeground
                        : tokens.mutedForeground,
                    },
                  ]}
                >
                  {profile.label}
                </Text>
                {isActive ? (
                  <Icon name="Check" size={16} color={tokens.primary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <Separator />
        <Pressable
          testID="server-panel-add-server"
          accessibilityRole="button"
          accessibilityLabel="Add server"
          onPress={() => {
            haptic("impact-light");
            openAddServer();
          }}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: pressed
                ? tokens.sidebarAccent
                : "transparent",
            },
          ]}
        >
          <View style={[styles.badge, { backgroundColor: tokens.sidebarAccent }]}>
            <Icon
              name="Plus"
              size={14}
              color={tokens.sidebarAccentForeground}
            />
          </View>
          <Text
            variant="body"
            style={[styles.label, { color: tokens.sidebarForeground }]}
          >
            Add server
          </Text>
        </Pressable>
        <Pressable
          testID="server-panel-server-settings"
          accessibilityRole="button"
          accessibilityLabel="Server settings"
          onPress={() => {
            haptic("impact-light");
            openServerSettings();
          }}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: pressed
                ? tokens.sidebarAccent
                : "transparent",
            },
          ]}
        >
          <View style={[styles.badge, { backgroundColor: tokens.sidebarAccent }]}>
            <Icon
              name="Settings"
              size={14}
              color={tokens.sidebarAccentForeground}
            />
          </View>
          <Text
            variant="body"
            style={[styles.label, { color: tokens.sidebarForeground }]}
          >
            Server settings
          </Text>
        </Pressable>
      </Animated.View>
      {!open ? (
        <Pressable
          testID="server-panel-handle"
          accessibilityRole="button"
          accessibilityLabel="Open server panel"
          onPress={() => {
            haptic("impact-light");
            setOpen(true);
          }}
          style={({ pressed }) => [
            styles.handle,
            {
              backgroundColor: pressed
                ? tokens.surfaceRaised
                : tokens.surfaceRaisedSolid,
              borderColor: tokens.border,
            },
          ]}
        >
          <Icon
            name="PanelLeft"
            size={15}
            color={tokens.mutedForeground}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: PANEL_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    gap: 4,
  },
  sectionLabel: {
    paddingHorizontal: 10,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rows: { gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 12,
    borderRadius: 10,
    borderCurve: "continuous",
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flexShrink: 1 },
  handle: {
    position: "absolute",
    left: 0,
    top: "50%",
    marginTop: -HANDLE_HEIGHT / 2,
    height: HANDLE_HEIGHT,
    width: 26,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 0 },
    elevation: 4,
  },
});
