{
  description = "Monarchic public website";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
      pkgsFor = system: nixpkgs.legacyPackages.${system};
    in
    {
      packages = forAllSystems (system:
        let
          pkgs = pkgsFor system;
          packageJson = builtins.fromJSON (builtins.readFile ./package.json);
          pname = "monarchic-website";
          version = packageJson.version;
          pnpmDeps = pkgs.fetchPnpmDeps {
            inherit pname version;
            src = ./.;
            hash = "sha256-hOgMj2YoCf/kk7lgpesR83v/RfwWpGkSZpaBowXsNAQ=";
            fetcherVersion = 3;
          };
          website = pkgs.stdenvNoCC.mkDerivation {
            inherit pname version pnpmDeps;
            src = ./.;

            nativeBuildInputs = [
              pkgs.nodejs_22
              pkgs.pnpm
              pkgs.pnpmConfigHook
            ];

            npm_config_manage_package_manager_versions = "false";

            buildPhase = ''
              runHook preBuild
              export GOMAXPROCS="$NIX_BUILD_CORES"
              pnpm run build
              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall
              mkdir -p "$out"
              cp -R dist "$out/"
              runHook postInstall
            '';

            meta = {
              description = "Monarchic public website";
              homepage = "https://github.com/monarchic-meta/website";
            };
          };
        in
        {
          default = website;
          monarchic-website = website;
        });

      checks = forAllSystems (system:
        let
          pkgs = pkgsFor system;
          packageJson = builtins.fromJSON (builtins.readFile ./package.json);
          pname = "monarchic-website";
          version = packageJson.version;
          pnpmDeps = pkgs.fetchPnpmDeps {
            inherit pname version;
            src = ./.;
            hash = "sha256-hOgMj2YoCf/kk7lgpesR83v/RfwWpGkSZpaBowXsNAQ=";
            fetcherVersion = 3;
          };
          mkWebsiteCheck = name: command: pkgs.stdenvNoCC.mkDerivation {
            inherit pname version pnpmDeps;
            name = "${pname}-${name}-${version}";
            src = ./.;

            nativeBuildInputs = [
              pkgs.chromium
              pkgs.nodejs_22
              pkgs.pnpm
              pkgs.pnpmConfigHook
              pkgs.util-linux
            ];

            npm_config_manage_package_manager_versions = "false";
            PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";

            dontBuild = true;
            installPhase = ''
              runHook preInstall
              export TMPDIR="$(mktemp -d)"
              export XDG_CACHE_HOME="$(mktemp -d)"
              export XDG_CONFIG_HOME="$(mktemp -d)"
              export XDG_RUNTIME_DIR="$(mktemp -d)"
              ${command}
              mkdir -p "$out"
              touch "$out/passed"
              runHook postInstall
            '';
          };
        in
        {
          package = self.packages.${system}.monarchic-website;
          diagnostics = mkWebsiteCheck "diagnostics" ''
            pnpm run check
          '';
          framer-studies = mkWebsiteCheck "framer-studies" ''
            pnpm run check:framer-studies
          '';
          hero-recreations = (mkWebsiteCheck "hero-recreations" ''
            pnpm run check:hero-recreation-study
            pnpm run check:hero-study-integration
            pnpm run check:hero-recreation-browser
          '').overrideAttrs (_: {
            # Canvas surface writing needs fonts in the isolated browser check.
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          hero-mechanisms = (mkWebsiteCheck "hero-mechanisms" ''
            pnpm run check:hero-mechanism-study
            pnpm run check:hero-mechanism-integration
            pnpm run check:hero-mechanism-browser
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          original-heroes = mkWebsiteCheck "original-heroes" ''
            pnpm run check:original-hero-study
            pnpm run check:original-hero-integration
            pnpm run check:original-hero-browser
          '';
          type-face-sequence = (mkWebsiteCheck "type-face-sequence" ''
            export MONARCHIC_TYPE_FACE_EVIDENCE_DIR="$out/evidence"
            pnpm run check:type-face-sequence
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          native-hero-behaviors = mkWebsiteCheck "native-hero-behaviors" ''
            export MONARCHIC_NATIVE_BEHAVIOR_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-hero-native-behaviors
          '';
          source-bleibt-mark = mkWebsiteCheck "source-bleibt-mark" ''
            export MONARCHIC_BLEIBT_MARK_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-bleibt-mark
          '';
          source-vercel-light = (mkWebsiteCheck "source-vercel-light" ''
            export MONARCHIC_VERCEL_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-vercel-light-study
            pnpm run check:source-vercel-light-browser
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-type-proximity = (mkWebsiteCheck "source-type-proximity" ''
            export MONARCHIC_TYPE_PROXIMITY_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-type-proximity
            pnpm run check:source-type-proximity-browser
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-bleibt-project-field = mkWebsiteCheck "source-bleibt-project-field" ''
            export MONARCHIC_BLEIBT_FIELD_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-bleibt-project-field
          '';
          standalone-heroes = (mkWebsiteCheck "standalone-heroes" ''
            pnpm run check:source-hero-page-study
            pnpm run check:source-hero-page-browser
            pnpm run check:original-hero-round-two-study
            pnpm run check:original-hero-round-two-integration
            pnpm run check:original-hero-round-two-browser
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          contracts = mkWebsiteCheck "contracts" ''
            pnpm run check:webcomposer
            pnpm run check:webinfo-artifacts
            pnpm run check:catalog-artifact
            pnpm run check:shared-catalog
            pnpm run check:release-workflow
            pnpm run check:social-preview
          '';
          smoke = mkWebsiteCheck "smoke" ''
            flock --wait 600 /tmp/monarchic-frontend-browser-smoke.lock pnpm run smoke:local:static
          '';
        });

      devShells = forAllSystems (system:
        let
          pkgs = pkgsFor system;
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.chromium
              pkgs.jujutsu
              pkgs.nodejs_22
              pkgs.pnpm
              pkgs.util-linux
            ];

            PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
          };
        });

      apps = forAllSystems (system:
        let
          pkgs = pkgsFor system;
          mkSmokeApp = name: script: {
            type = "app";
            program = "${pkgs.writeShellApplication {
              inherit name;
              runtimeInputs = [
                pkgs.chromium
                pkgs.nodejs_22
                pkgs.pnpm
                pkgs.util-linux
              ];
              text = ''
                if [ ! -f package.json ]; then
                  echo "${name} must be run from the website repository root." >&2
                  exit 1
                fi

                export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="${pkgs.chromium}/bin/chromium"
                pnpm install --frozen-lockfile
                flock --wait 600 /tmp/monarchic-frontend-browser-smoke.lock pnpm run ${script}
              '';
            }}/bin/${name}";
          };
        in
        {
          prepare-framer-hero-mechanisms = {
            type = "app";
            program = "${pkgs.writeShellApplication {
              name = "prepare-framer-hero-mechanisms";
              runtimeInputs = [ pkgs.nodejs_22 pkgs.pnpm pkgs.ffmpeg ];
              text = ''
                if [ ! -f scripts/build-framer-hero-mechanisms.mjs ]; then
                  echo "Run this command from the website repository root." >&2
                  exit 1
                fi
                exec pnpm run build:framer-hero-mechanisms "$@"
              '';
            }}/bin/prepare-framer-hero-mechanisms";
          };
          smoke-development = mkSmokeApp "website-smoke-development" "smoke:development";
          smoke-production = mkSmokeApp "website-smoke-production" "smoke:production";
          smoke-staging = mkSmokeApp "website-smoke-staging" "smoke:staging";
        });
    };
}
