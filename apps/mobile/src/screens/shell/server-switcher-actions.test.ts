import { describe, expect, it, vi } from "vitest";
import type { ServerProfile } from "@/lib/profiles";
import { buildServerSwitcherActions } from "./server-switcher-actions";

const connect: ServerProfile = {
  id: "a",
  mode: "connect",
  label: "Work laptop",
  serverUrl: "https://work.getbb.app",
  handle: "work",
  credential: "bbcm_x",
  createdAt: 1,
};

const direct: ServerProfile = {
  id: "b",
  mode: "direct",
  label: "Studio",
  serverUrl: "http://192.168.1.5:38886",
  createdAt: 2,
};

describe("buildServerSwitcherActions", () => {
  it("marks the active profile checked and disabled and makes others switchable", () => {
    const onSelect = vi.fn();
    const onAddServer = vi.fn();

    const actions = buildServerSwitcherActions([connect, direct], "a", {
      onSelect,
      onAddServer,
    });

    expect(actions).toHaveLength(3);
    expect(actions.map((action) => action.key)).toEqual(["a", "b", "add-server"]);

    const active = actions.find((action) => action.key === "a");
    const other = actions.find((action) => action.key === "b");
    const add = actions.find((action) => action.key === "add-server");

    expect(active).toMatchObject({
      label: "Work laptop",
      icon: "Globe",
      checked: true,
      disabled: true,
    });
    expect(other).toMatchObject({
      label: "Studio",
      icon: "Laptop",
      checked: false,
      disabled: false,
    });

    other?.onPress();
    expect(onSelect).toHaveBeenCalledWith("b");
    expect(onSelect).toHaveBeenCalledTimes(1);

    expect(add).toMatchObject({ label: "Add server", icon: "Plus" });
    add?.onPress();
    expect(onAddServer).toHaveBeenCalledTimes(1);
  });

  it("checks nothing when no profile is active", () => {
    const actions = buildServerSwitcherActions([connect, direct], null, {
      onSelect: vi.fn(),
      onAddServer: vi.fn(),
    });

    expect(actions.filter((action) => action.checked)).toHaveLength(0);
    expect(actions.filter((action) => action.disabled)).toHaveLength(0);
  });
});
