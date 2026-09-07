import type { ServerProfile } from "@/lib/profiles";
import type { ActionSheetAction } from "@/ui";

export interface ServerSwitcherActionHandlers {
  onSelect: (id: string) => void;
  onAddServer: () => void;
}

export function buildServerSwitcherActions(
  profiles: readonly ServerProfile[],
  activeProfileId: string | null,
  handlers: ServerSwitcherActionHandlers,
): ActionSheetAction[] {
  const actions: ActionSheetAction[] = profiles.map((profile) => {
    const isActive = profile.id === activeProfileId;
    return {
      key: profile.id,
      label: profile.label,
      icon: profile.mode === "connect" ? "Globe" : "Laptop",
      checked: isActive,
      disabled: isActive,
      onPress: () => handlers.onSelect(profile.id),
    };
  });
  actions.push({
    key: "add-server",
    label: "Add server",
    icon: "Plus",
    onPress: handlers.onAddServer,
  });
  return actions;
}
