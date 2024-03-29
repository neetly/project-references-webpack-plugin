# Project References Webpack Plugin

[![CI](https://github.com/neetly/project-references-webpack-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/neetly/project-references-webpack-plugin/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/project-references-webpack-plugin)](https://www.npmjs.com/package/project-references-webpack-plugin)

```sh
yarn add --dev project-references-webpack-plugin
```

```ts
// webpack.config.ts
import { ProjectReferencesPlugin } from "project-references-webpack-plugin";
import type { Configuration } from "webpack";

const config: Configuration = {
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    },
    plugins: [new ProjectReferencesPlugin()],
  },
};

export default config;
```

## Example

```ts
import "library"; // => packages/library/src/index.ts
```

```jsonc
// packages/library/package.json
{
  "name": "library",
  "main": "./lib/index.js",
}
```

```jsonc
// packages/library/tsconfig.json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./lib",
  },
}
```

## Credit

This project was inspired by
[webpack-project-references-alias](https://github.com/microsoft/webpack-project-references-alias).
