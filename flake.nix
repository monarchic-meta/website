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
          # Fixed originals are comparison-only test inputs, never site assets.
          sourceFormatPosterMaterials = pkgs.linkFarm "monarchic-format-poster-stack-test-inputs" [
            {
              name = "assets/poster-BewnwD3v.webp";
              path = pkgs.fetchurl {
                url = "https://format.obys.agency/assets/poster-BewnwD3v.webp";
                hash = "sha256-g8pDNGVWWvfKC4Ca1jxlN/icpjD2DMA/5w/sFOwG7I4=";
              };
            }
            {
              name = "kid-assets/poster-shot.webp";
              path = pkgs.fetchurl {
                url = "https://format.obys.agency/kid/poster-shot.webp";
                hash = "sha256-yZoXSzxLfW1sbvghjw2yhnLwReIyNHC6AwYznsI4ttE=";
              };
            }
            {
              name = "source-font/ObysSans-Regular.woff2";
              path = pkgs.fetchurl {
                url = "https://format.obys.agency/fonts/ObysSans-Regular.woff2";
                hash = "sha256-LW4a8wdeqKNXfaxcIQqAiHO/bAbiPfLhHUqKz8ehKS4=";
              };
            }
          ];
          # Fixed originals are comparison-only test inputs, never site assets.
          sourceCantorComparisonFonts = pkgs.linkFarm "monarchic-cantor-opening-test-inputs" [
            {
              name = "PPNeueMontreal-regular.woff2";
              path = pkgs.fetchurl {
                url = "https://cdn.prod.website-files.com/697b3b78220c15e1a8ecaeb2/69e8b85d4a1e818463de692b_PPNeueMontreal-Regular.woff2";
                hash = "sha256-GgIKDMwrKa0JG3E4ZLE12ff7bTEU5pYg9tVu65q++8w=";
              };
            }
            {
              name = "PPNeueMontreal-medium.woff2";
              path = pkgs.fetchurl {
                url = "https://cdn.prod.website-files.com/697b3b78220c15e1a8ecaeb2/69e8b85dd59e1682e8287e73_PPNeueMontreal-Medium.woff2";
                hash = "sha256-EaGyJ6T0Mr3FWHpSnTSkarvtcGe24fuRPbDEiccXWCg=";
              };
            }
          ];
          # Exact originals are fixed comparison inputs, not site/runtime fonts.
          sourceMechaContactComparisonFonts = pkgs.linkFarm "monarchic-mecha-contact-test-inputs" [
            {
              name = "NeueHaasGroteskText-55Roman-Web.woff2";
              path = pkgs.fetchurl {
                url = "https://cdn.prod.website-files.com/6a180066e6ba27b81a7ef915/6a180066e6ba27b81a7ef926_NeueHaasGroteskText-55Roman-Web.woff2";
                hash = "sha256-NzjWIAdjfdaMv4E/RByUaUGXvdk4pvlTsXjoezXsCPQ=";
              };
            }
            {
              name = "FlechaM-Regular.woff2";
              path = pkgs.fetchurl {
                url = "https://cdn.prod.website-files.com/6a180066e6ba27b81a7ef915/6a180066e6ba27b81a7ef932_FlechaM-Regular.woff2";
                hash = "sha256-4/IrUAoqUHIZfQ4BhPeCFGHzDK4L1lrzuS+OQNYPUc4=";
              };
            }
          ];
          # Fixed original materials are comparison-only test inputs.
          sourceFormatDaughterMaterials = pkgs.linkFarm "monarchic-format-daughter-test-inputs"
            (map (asset: {
              name = asset.relativePath;
              path = pkgs.fetchurl {
                url = asset.sourceURL;
                sha256 = asset.sha256;
              };
            }) (builtins.fromJSON (builtins.readFile ./scripts/fixtures/source-format-daughter-materials.json)).assets);
          # Fixed original materials are comparison-only test inputs.
          sourceFormatClockMaterials = pkgs.linkFarm "monarchic-format-intro-clock-test-inputs" [
            {
              name = "kid-assets/clock.webp";
              path = pkgs.fetchurl {
                url = "https://format.obys.agency/kid/clock.webp";
                hash = "sha256-rFZWQy7JbDdx26w3+qcbG8Vp9cyYdabr05uTVj5nxe0=";
              };
            }
            {
              name = "source-font/ObysSans-Regular.woff2";
              path = pkgs.fetchurl {
                url = "https://format.obys.agency/fonts/ObysSans-Regular.woff2";
                hash = "sha256-LW4a8wdeqKNXfaxcIQqAiHO/bAbiPfLhHUqKz8ehKS4=";
              };
            }
          ];
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
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
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
          source-bleibt-opening = mkWebsiteCheck "source-bleibt-opening" ''
            export MONARCHIC_BLEIBT_OPENING_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-bleibt-opening
          '';
          source-ajedrez-two-track-extension = (mkWebsiteCheck "source-ajedrez-two-track-extension" ''
            export MONARCHIC_AJEDREZ_WORD_EXTENSION_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-ajedrez-two-track-extension
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-ajedrez-measured-word-fits = (mkWebsiteCheck "source-ajedrez-measured-word-fits" ''
            export MONARCHIC_AJEDREZ_WORD_FITS_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-ajedrez-measured-word-fits
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-ajedrez = (mkWebsiteCheck "source-ajedrez" ''
            export MONARCHIC_AJEDREZ_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-ajedrez-sequence
            pnpm run check:source-ajedrez-browser
            export MONARCHIC_AJEDREZ_COMPOSITION_EVIDENCE_DIR="$out/evidence/photographic-composition"
            pnpm run check:source-ajedrez-photo-composition
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-cantor-instrument = (mkWebsiteCheck "source-cantor-instrument" ''
            export MONARCHIC_CANTOR_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-cantor-instrument
            pnpm run check:source-cantor-instrument-browser
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-cantor-opening = (mkWebsiteCheck "source-cantor-opening" ''
            export MONARCHIC_CANTOR_OPENING_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-cantor-opening
          '').overrideAttrs (_: {
            MONARCHIC_CANTOR_SOURCE_FONT_DIR = sourceCantorComparisonFonts;
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-cantor-opening-rolling = (mkWebsiteCheck "source-cantor-opening-rolling" ''
            export MONARCHIC_CANTOR_ROLLING_EVIDENCE_DIR="$out/evidence/rolling"
            pnpm run check:source-cantor-opening-rolling
            export MONARCHIC_CANTOR_OPENING_EVIDENCE_DIR="$out/evidence/opening"
            pnpm run check:source-cantor-opening-rolling-retained
          '').overrideAttrs (_: {
            MONARCHIC_CANTOR_SOURCE_FONT_DIR = sourceCantorComparisonFonts;
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-cantor-rolling-text = (mkWebsiteCheck "source-cantor-rolling-text" ''
            export MONARCHIC_CANTOR_ROLLING_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-cantor-rolling-text
          '').overrideAttrs (_: {
            MONARCHIC_CANTOR_SOURCE_FONT_DIR = sourceCantorComparisonFonts;
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-cantor-native-behaviors = mkWebsiteCheck "source-cantor-native-behaviors" ''
            export MONARCHIC_CANTOR_NATIVE_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-cantor-native-behaviors
          '';
          source-gthe-motion = mkWebsiteCheck "source-gthe-motion" ''
            export MONARCHIC_GTHE_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-gthe-motion
          '';
          source-vercel-agentic = (mkWebsiteCheck "source-vercel-agentic" ''
            export MONARCHIC_VERCEL_AGENTIC_EVIDENCE_DIR="$out/evidence"
            export MONARCHIC_VERCEL_CUSTOMERS_EVIDENCE_DIR="$out/evidence/customers"
            pnpm run check:source-vercel-agentic
            pnpm run check:source-vercel-customers
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-current-originals = (mkWebsiteCheck "source-current-originals" ''
            export MONARCHIC_CURRENT_ORIGINALS_EVIDENCE_DIR="$out/evidence"
            pnpm run check:current-originals-browser
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-mezmo-configuration = (mkWebsiteCheck "source-mezmo-configuration" ''
            export MONARCHIC_CURRENT_ORIGINALS_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-mezmo-configuration
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-mezmo-header-navigation = (mkWebsiteCheck "source-mezmo-header-navigation" ''
            export MONARCHIC_MEZMO_HEADER_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-mezmo-header-navigation
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-native-video-visibility = mkWebsiteCheck "source-native-video-visibility" ''
            export MONARCHIC_NATIVE_VIDEO_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-native-video-visibility
          '';
          source-mecha-tomorrow-detail = (mkWebsiteCheck "source-mecha-tomorrow-detail" ''
            export MONARCHIC_MECHA_DETAIL_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-mecha-tomorrow-detail
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          mecha-contact-mark = (mkWebsiteCheck "mecha-contact-mark" ''
            export MONARCHIC_MECHA_CONTACT_EVIDENCE_DIR="$out/evidence"
            pnpm run check:mecha-contact-mark
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-format-back-navigation = (mkWebsiteCheck "source-format-back-navigation" ''
            export MONARCHIC_FORMAT_BACK_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-format-back-navigation
          '').overrideAttrs (_: {
            MONARCHIC_FORMAT_BACK_FONT_PATH = "${sourceFormatClockMaterials}/source-font/ObysSans-Regular.woff2";
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-mecha-tomorrow-contact = (mkWebsiteCheck "source-mecha-tomorrow-contact" ''
            export MONARCHIC_MECHA_CONTACT_EVIDENCE_DIR="$out/evidence/contact"
            pnpm run check:source-mecha-tomorrow-contact
            export MONARCHIC_MECHA_DETAIL_EVIDENCE_DIR="$out/evidence/tomorrow"
            pnpm run check:source-mecha-tomorrow-contact-retained
          '').overrideAttrs (_: {
            MONARCHIC_MECHA_CONTACT_SOURCE_FONT_DIR = sourceMechaContactComparisonFonts;
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-mecha-contact = (mkWebsiteCheck "source-mecha-contact" ''
            export MONARCHIC_MECHA_CONTACT_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-mecha-contact
          '').overrideAttrs (_: {
            MONARCHIC_MECHA_CONTACT_SOURCE_FONT_DIR = sourceMechaContactComparisonFonts;
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-macmoss = mkWebsiteCheck "source-macmoss" ''
            export MONARCHIC_MACMOSS_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-macmoss-portfolio
            pnpm run check:source-macmoss-browser
          '';
          source-puente-behaviors = mkWebsiteCheck "source-puente-behaviors" ''
            export MONARCHIC_PUENTE_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-puente-behaviors
            pnpm run check:source-puente-browser
          '';
          source-native-tap = mkWebsiteCheck "source-native-tap" ''
            export MONARCHIC_NATIVE_TAP_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-native-tap
          '';
          source-montreal-behaviors = (mkWebsiteCheck "source-montreal-behaviors" ''
            export MONARCHIC_MONTREAL_BEHAVIORS_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-montreal-behaviors
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-montreal-glyph-flow = (mkWebsiteCheck "source-montreal-glyph-flow" ''
            export MONARCHIC_MONTREAL_GLYPH_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-montreal-glyph-flow
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-portfolio-film = (mkWebsiteCheck "source-portfolio-film" ''
            export MONARCHIC_PORTFOLIO_EVIDENCE_DIR="$out/evidence/playback"
            export MONARCHIC_PORTFOLIO_NATIVE_EVIDENCE_DIR="$out/evidence/native-input"
            export MONARCHIC_PORTFOLIO_RESOURCE_EVIDENCE_DIR="$out/evidence/resources"
            export MONARCHIC_PORTFOLIO_CAROUSEL_EVIDENCE_DIR="$out/evidence/carousel"
            export MONARCHIC_PORTFOLIO_HMR_EVIDENCE_DIR="$out/evidence/carousel-hmr"
            pnpm run check:source-portfolio-carousel
            pnpm run check:source-portfolio-carousel-hmr
            pnpm run check:source-portfolio-film-study
            pnpm run check:source-portfolio-film-browser
            pnpm run check:source-portfolio-native-input
            pnpm run check:source-portfolio-film-resources
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-portfolio-effects = (mkWebsiteCheck "source-portfolio-effects" ''
            export MONARCHIC_PORTFOLIO_EFFECTS_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-portfolio-effects
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-polar-guide = (mkWebsiteCheck "source-polar-guide" ''
            export MONARCHIC_POLAR_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-polar-guide-controls
            pnpm run check:source-polar-guide-browser
            pnpm run check:source-polar-guide-toc
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-kaspar-native = (mkWebsiteCheck "source-kaspar-native" ''
            export MONARCHIC_KASPAR_NATIVE_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-kaspar-native
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-origin-native = (mkWebsiteCheck "source-origin-native" ''
            export MONARCHIC_ORIGIN_NATIVE_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-origin-native-strict
            pnpm run check:source-origin-native-browser
            pnpm run check:source-origin-native-motion
            pnpm run check:source-origin-native-responsive
            pnpm run check:source-origin-journey-browser
            pnpm run check:source-origin-journey-provider
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf pkgs.inter ];
            };
          });
          source-origin-native-mixed = (mkWebsiteCheck "source-origin-native-mixed" ''
            export MONARCHIC_ORIGIN_NATIVE_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-origin-native-mixed
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-origin-journey-resources = (mkWebsiteCheck "source-origin-journey-resources" ''
            export MONARCHIC_ORIGIN_NATIVE_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-origin-journey-resources
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-current-journey = (mkWebsiteCheck "source-current-journey" ''
            export MONARCHIC_JOURNEY_EVIDENCE_DIR="$out/evidence/journey"
            pnpm run check:source-hero-journey-study
            pnpm run check:source-hero-journey-browser
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          hero-behavior = (mkWebsiteCheck "hero-behavior" ''
            export MONARCHIC_JOURNEY_EVIDENCE_DIR="$out/evidence/journey"
            export MONARCHIC_MECHA_EVIDENCE_DIR="$out/evidence/mecha"
            export MONARCHIC_KASPAR_EVIDENCE_DIR="$out/evidence/kaspar"
            pnpm run check:source-hero-journey-study
            pnpm run check:source-hero-journey-browser
            pnpm run check:mecha-scroll-mark
            pnpm run check:mecha-scroll-mark-browser
            pnpm run check:source-kaspar-ascii-study
            pnpm run check:source-kaspar-ascii-browser
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          hero-behavior-integration = (mkWebsiteCheck "hero-behavior-integration" ''
            export MONARCHIC_BEHAVIOR_INTEGRATION_DIR="$out/evidence"
            pnpm run check:hero-behavior-integration
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-format-details = (mkWebsiteCheck "source-format-details" ''
            export MONARCHIC_FORMAT_DETAIL_EVIDENCE_DIR="$out/evidence"
            export MONARCHIC_FORMAT_CLOSING_EVIDENCE_DIR="$out/evidence/closing"
            pnpm run check:source-format-details
            pnpm run check:source-format-details-browser
            pnpm run check:source-format-closing-browser
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-format-mobile = (mkWebsiteCheck "source-format-mobile" ''
            export MONARCHIC_FORMAT_MOBILE_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-format-details
            pnpm run check:source-format-mobile-browser
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-format-photo-parallax = (mkWebsiteCheck "source-format-photo-parallax" ''
            export MONARCHIC_FORMAT_PHOTO_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-format-photo-parallax
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-format-field-entry = (mkWebsiteCheck "source-format-field-entry" ''
            export MONARCHIC_FORMAT_ENTRY_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-format-details
            pnpm run check:source-format-field-entry
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-format-early-pip = (mkWebsiteCheck "source-format-early-pip" ''
            export MONARCHIC_FORMAT_EARLY_PIP_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-format-details
            pnpm run check:source-format-early-pip
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-format-intro-clock = (mkWebsiteCheck "source-format-intro-clock" ''
            export MONARCHIC_FORMAT_INTRO_CLOCK_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-format-details
            pnpm run check:source-format-intro-clock
          '').overrideAttrs (_: {
            MONARCHIC_FORMAT_CACHED_MEDIA_ROOT = sourceFormatClockMaterials;
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-format-notes = (mkWebsiteCheck "source-format-notes" ''
            export MONARCHIC_FORMAT_DETAIL_EVIDENCE_DIR="$out/evidence/strict"
            export MONARCHIC_FORMAT_NOTES_EVIDENCE_DIR="$out/evidence/notes"
            pnpm run check:source-format-details
            pnpm run check:source-format-notes
          '').overrideAttrs (_: {
            MONARCHIC_FORMAT_CACHED_MEDIA_ROOT = sourceFormatClockMaterials;
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-format-daughter-effects = (mkWebsiteCheck "source-format-daughter-effects" ''
            export MONARCHIC_FORMAT_DAUGHTER_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-format-daughter-effects
          '').overrideAttrs (_: {
            MONARCHIC_FORMAT_CACHED_MEDIA_ROOT = sourceFormatDaughterMaterials;
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-format-daughter-sparks = (mkWebsiteCheck "source-format-daughter-sparks" ''
            export MONARCHIC_FORMAT_SPARK_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-format-daughter-sparks
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-format-poster-stack = (mkWebsiteCheck "source-format-poster-stack" ''
            export MONARCHIC_FORMAT_POSTER_STACK_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-format-poster-stack
          '').overrideAttrs (_: {
            MONARCHIC_FORMAT_CACHED_MEDIA_ROOT = sourceFormatPosterMaterials;
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts pkgs.liberation_ttf ];
            };
          });
          source-format-wide-flow = (mkWebsiteCheck "source-format-wide-flow" ''
            export MONARCHIC_FORMAT_WIDE_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-format-details
            pnpm run check:source-format-wide-flow
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-format-pool = (mkWebsiteCheck "source-format-pool" ''
            export MONARCHIC_FORMAT_POOL_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-format-pool
            pnpm run check:source-format-pool-browser
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-montreal-motion = (mkWebsiteCheck "source-montreal-motion" ''
            export MONARCHIC_MONTREAL_MOTION_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-montreal-motion
            pnpm run check:source-montreal-motion-browser
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-portfolio-utility-ink = (mkWebsiteCheck "source-portfolio-utility-ink" ''
            export MONARCHIC_PORTFOLIO_INK_EVIDENCE_DIR="$out/evidence"
            pnpm run check:source-portfolio-utility-ink
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
          source-montreal-accents = (mkWebsiteCheck "source-montreal-accents" ''
            export MONARCHIC_MONTREAL_ACCENTS_EVIDENCE_DIR="$out/evidence"
            export MONARCHIC_MONTREAL_TICKERS_EVIDENCE_DIR="$out/evidence/tickers"
            pnpm run check:source-montreal-accents
            pnpm run check:source-montreal-accents-browser
            pnpm run check:source-montreal-tickers-browser
          '').overrideAttrs (_: {
            FONTCONFIG_FILE = pkgs.makeFontsConf {
              fontDirectories = [ pkgs.dejavu_fonts ];
            };
          });
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
