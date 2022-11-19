#!/bin/bash
set -eo pipefail

yarn tsc --build --clean .
rm -rf ./lib
