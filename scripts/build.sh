#!/bin/bash
set -eo pipefail

yarn tsc --build .
yarn babel \
  --presets @neetly/babel-preset \
  --extensions .js,.mjs,.cjs,.ts,.tsx,.mts,.cts \
  --ignore "**/*.d.ts","**/*.d.mts","**/*.d.cts" \
  --source-maps true \
  --copy-files \
  ./src --out-dir ./lib
