// Expo + pnpm 모노레포용 Metro 설정.
// 레포 루트까지 감시하고, 워크스페이스 공유 패키지(@booktalk/*)를 해석할 수 있게 한다.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1) 워크스페이스 전체를 감시(공유 패키지 변경 감지)
config.watchFolders = [workspaceRoot];

// 2) 루트/앱 node_modules 모두에서 모듈을 찾는다
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3) 상위 디렉터리 탐색 비활성화(중복 해석 방지)
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
