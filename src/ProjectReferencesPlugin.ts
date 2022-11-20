import type { ResolveContext, Resolver } from "enhanced-resolve";
import * as jsonc from "jsonc-parser";

import type { Tsconfig } from "./Tsconfig";

class ProjectReferencesPlugin {
  private readonly source = "file";
  private readonly target = "internal-resolve";

  apply(resolver: Resolver) {
    const fs = resolver.fileSystem;

    resolver
      .getHook(this.source)
      .tapAsync(
        "ProjectReferencesPlugin",
        (request, resolveContext, callback) => {
          const { path, descriptionFileRoot } = request;
          if (!path || !descriptionFileRoot) {
            return callback();
          }

          resolveSymlink(descriptionFileRoot, (error, result) => {
            if (error || !result) {
              return callback();
            }

            if (/[/\\]node_modules[/\\]/.test(result)) {
              return callback();
            }

            readTsconfig(
              resolver.join(descriptionFileRoot, "tsconfig.json"),
              resolveContext,
              (error, tsconfig) => {
                if (error || !tsconfig?.compilerOptions) {
                  return callback();
                }

                let { rootDir, outDir } = tsconfig.compilerOptions;
                if (!rootDir || !outDir) {
                  return callback();
                }

                rootDir = resolver.join(descriptionFileRoot, rootDir);
                outDir = resolver.join(descriptionFileRoot, outDir);

                if (!path.startsWith(outDir)) {
                  return callback();
                }

                const newPath = path.replace(outDir, rootDir);
                resolver.doResolve(
                  resolver.getHook(this.target),
                  { ...request, request: newPath },
                  `source redirected from "${path}" to "${newPath}"`,
                  resolveContext,
                  callback,
                );
              },
            );
          });
        },
      );

    const resolveSymlink = (
      path: string,
      callback: (error: unknown, result: string | null) => void,
    ) => {
      fs.readlink(path, (error, result) => {
        if (error?.code === "EINVAL") {
          return callback(null, path);
        }

        if (error || !result) {
          return callback(error, null);
        }

        callback(
          null,
          resolver.join(resolver.join(path, ".."), result.toString()),
        );
      });
    };

    const readTsconfig = (
      path: string,
      resolveContext: ResolveContext,
      callback: (error: unknown, tsconfig: Tsconfig | null) => void,
    ) => {
      fs.readFile(path, (error, result) => {
        if (error?.code === "ENOENT") {
          resolveContext.missingDependencies?.add(path);
        }

        if (error || !result) {
          return callback(error, null);
        }

        resolveContext.fileDependencies?.add(path);

        const tsconfig = jsonc.parse(result.toString()) as unknown;
        if (!tsconfig) {
          return callback(null, null);
        }

        return callback(null, tsconfig as Tsconfig);
      });
    };
  }
}

export { ProjectReferencesPlugin };
