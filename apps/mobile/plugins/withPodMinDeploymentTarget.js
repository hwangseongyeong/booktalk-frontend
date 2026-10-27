const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Xcode 26은 iOS 최소 배포 타깃 15.0 이상을 요구한다. 그런데 RN 0.74 등 일부 Pod는
// 자기 podspec에 13.4를 박아두어 expo-build-properties의 ios.deploymentTarget(Podfile 플랫폼)으로는
// 덮이지 않는다. 그래서 Podfile post_install에서 모든 Pod 타깃의 IPHONEOS_DEPLOYMENT_TARGET을
// 15.1 미만이면 15.1로 끌어올리는 루프를 주입해 전체 Pod를 Xcode 26 요구치에 맞춘다.
const DEPLOYMENT_TARGET = "15.1";

const POST_INSTALL_SNIPPET = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |bc|
        current = bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current.nil? || current.to_f < ${DEPLOYMENT_TARGET}
          bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${DEPLOYMENT_TARGET}'
        end
      end
    end`;

module.exports = function withPodMinDeploymentTarget(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfile = path.join(config.modRequest.platformProjectRoot, "Podfile");
      let contents = fs.readFileSync(podfile, "utf8");

      // 이미 주입돼 있으면 건너뛴다.
      if (!contents.includes(`IPHONEOS_DEPLOYMENT_TARGET'] = '${DEPLOYMENT_TARGET}'`)) {
        if (/post_install do \|installer\|/.test(contents)) {
          contents = contents.replace(
            /post_install do \|installer\|/,
            `post_install do |installer|${POST_INSTALL_SNIPPET}`
          );
        } else {
          // post_install 블록이 없으면 target 'text42' do ... end 밖(파일 끝)에 추가한다.
          contents += `\npost_install do |installer|${POST_INSTALL_SNIPPET}\nend\n`;
        }
        fs.writeFileSync(podfile, contents);
      }
      return config;
    },
  ]);
};
