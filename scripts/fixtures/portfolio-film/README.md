These four short movies and their first-frame PNGs are owned deterministic test patterns. They exercise real browser decoding, responsive crop, native input, error recovery and the shared media budget. They are never used as portfolio artwork or source-fidelity evidence.

Regenerate with the repository's Nix-provided FFmpeg 8.0.1:

```sh
nix shell --inputs-from . nixpkgs#ffmpeg nixpkgs#nodejs_22 -c node scripts/build-portfolio-film-fixtures.mjs
```

The builder records each file's bytes and SHA-256 in [manifest.json](manifest.json). It uses three seconds of FFmpeg `testsrc2`, 12 fps, deterministic hue rotation and single-threaded VP9; PNGs are decoded from each movie's first frame. The source-faithfulness runner instead requires the separately retained thirteen actual source MP4s and their upload ledger outside Git.
