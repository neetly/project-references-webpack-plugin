import type { ResolveContext, Resolver } from "enhanced-resolve";
import * as jsonc from "jsonc-parser";

import type { TSConfig } from "./types/TSConfig";

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
          if (path === false || descriptionFileRoot === undefined) {
            callback();
            return;
          }

          resolveSymlink(descriptionFileRoot, (error, result) => {
            if (error !== null || result === undefined) {
              callback();
              return;
            }

            if (/[/\\]node_modules[/\\]/.test(result)) {
              callback();
              return;
            }

            readTSConfig(
              resolver.join(descriptionFileRoot, "tsconfig.json"),
              resolveContext,
              (error, tsconfig) => {
                if (error !== null || !tsconfig?.compilerOptions) {
                  callback();
                  return;
                }

                let { rootDir, outDir } = tsconfig.compilerOptions;
                if (rootDir === undefined || outDir === undefined) {
                  callback();
                  return;
                }

                rootDir = resolver.join(descriptionFileRoot, rootDir);
                outDir = resolver.join(descriptionFileRoot, outDir);

                if (rootDir === outDir || !path.startsWith(outDir)) {
                  callback();
                  return;
                }

                const newRequest = path.replace(outDir, rootDir);
                resolver.doResolve(
                  resolver.getHook(this.target),
                  {
                    ...request,
                    path: descriptionFileRoot,
                    request: newRequest,
                  },
                  `source redirected from "${path}" to "${newRequest}"`,
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
      callback: (error: Error | null, result: string | undefined) => void,
    ) => {
      fs.readlink(path, (error, result) => {
        if (error) {
          if (error.code === "EINVAL") {
            callback(null, path);
          } else {
            callback(error, undefined);
          }
          return;
        }

        if (result === undefined) {
          callback(null, undefined);
          return;
        }

        callback(
          null,
          resolver.join(resolver.join(path, ".."), result.toString()),
        );
      });
    };

    const readTSConfig = (
      path: string,
      resolveContext: ResolveContext,
      callback: (error: Error | null, tsconfig: TSConfig | null) => void,
    ) => {
      fs.readFile(path, (error, result) => {
        if (error) {
          if (error.code === "ENOENT") {
            resolveContext.missingDependencies?.add(path);
          }

          callback(error, null);
          return;
        }

        if (result === undefined) {
          callback(null, null);
          return;
        }

        resolveContext.fileDependencies?.add(path);

        const tsconfig = jsonc.parse(result.toString()) as TSConfig;
        callback(null, tsconfig);
      });
    };
  }
}

export { ProjectReferencesPlugin };
