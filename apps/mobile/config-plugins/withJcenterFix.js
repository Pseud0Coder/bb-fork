const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Some legacy React Native native modules still call jcenter() in their
// android/build.gradle. The Gradle version used by Expo SDK 57 removed
// jcenter(), so evaluating those projects fails with:
//   Could not find method jcenter() ...
// Rewrite jcenter() to mavenCentral() during prebuild (which EAS runs before
// the Gradle build) so those projects evaluate. mavenCentral() serves the same
// artifacts these old modules resolved from jcenter.
const MODULES = ["@react-native-cookies/cookies"];

module.exports = function withJcenterFix(config) {
  return withDangerousMod(config, [
    "android",
    (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      for (const mod of MODULES) {
        let pkgJsonPath;
        try {
          pkgJsonPath = require.resolve(`${mod}/package.json`, {
            paths: [projectRoot],
          });
        } catch {
          continue;
        }
        const gradlePath = path.join(
          path.dirname(pkgJsonPath),
          "android",
          "build.gradle",
        );
        if (!fs.existsSync(gradlePath)) continue;
        const source = fs.readFileSync(gradlePath, "utf8");
        if (source.includes("jcenter()")) {
          fs.writeFileSync(
            gradlePath,
            source.replace(/jcenter\(\)/g, "mavenCentral()"),
          );
        }
      }
      return cfg;
    },
  ]);
};
