import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfiles } from "@/app-shell";
import { describeError } from "@/lib/describe-error";
import { haptic } from "@/lib/haptics";
import { useTheme } from "@/theme";
import { ActionSheet, Icon, Text, toast, useSheet } from "@/ui";
import { buildServerSwitcherActions } from "./server-switcher-actions";
import { workspaceInitials } from "./workspace-initials";

const TOP_GAP = 6;

export function ServerSwitcher() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { profiles, activeProfile, setActiveProfile } = useProfiles();
  const menu = useSheet();

  if (!activeProfile || profiles.length < 2) return null;

  const switchTo = (id: string) => {
    if (id === activeProfile.id) return;
    haptic("selection");
    setActiveProfile(id).catch((error: unknown) => {
      toast.error("Could not switch server", {
        description: describeError(error),
      });
    });
  };

  const actions = buildServerSwitcherActions(profiles, activeProfile.id, {
    onSelect: switchTo,
    onAddServer: () => router.push("/settings/servers/add"),
  });

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[styles.overlay, { top: insets.top + TOP_GAP }]}
      >
        <Pressable
          testID="server-switcher"
          accessibilityRole="button"
          accessibilityLabel={`Server ${activeProfile.label}. Switch server.`}
          onPress={() => {
            haptic("impact-light");
            menu.present();
          }}
          style={({ pressed }) => [
            styles.pill,
            {
              backgroundColor: tokens.surfaceRaisedSolid,
              borderColor: tokens.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={[styles.badge, { backgroundColor: tokens.primary }]}>
            <Text
              variant="footnote"
              weight="semibold"
              style={{ color: tokens.primaryForeground }}
            >
              {workspaceInitials(activeProfile.label)}
            </Text>
          </View>
          <Text
            variant="footnote"
            weight="semibold"
            numberOfLines={1}
            style={[styles.label, { color: tokens.foreground }]}
          >
            {activeProfile.label}
          </Text>
          <Icon
            name="ChevronDown"
            size={16}
            weight="semibold"
            color={tokens.mutedForeground}
          />
        </Pressable>
      </View>
      <ActionSheet controller={menu} title="Switch server" actions={actions} />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: 260,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { flexShrink: 1 },
});
