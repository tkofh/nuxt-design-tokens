import {
  defineNuxtModule,
  createResolver,
  addTemplate,
  addTypeTemplate,
  updateTemplates,
  useLogger,
} from "@nuxt/kit";
import createJITI from "jiti";
import outdent from "outdent";
import { joinURL } from "ufo";
import { glob } from "glob";
import { minimatch } from "minimatch";
import { DesignToken, DesignTokensInput } from "@token-alchemy/types";
import { createDictionary } from "@token-alchemy/core";
import { formatReferences } from "@token-alchemy/format";
import defu from "defu";
import { debounce } from "perfect-debounce";

export interface ModuleOptions {
  screens: Record<string, string | null>;
  colorModeClassname: string | false;
  outputReferences: boolean;
  attributes: Record<string, string>;
  groupAttributes: Record<string, string>;
  patterns: string[];
}

type ExtendsObject<T> = T extends object ? T : never;
type ObjectValues = ExtendsObject<DesignToken["$value"]>;
type MediaKey = keyof Exclude<
  ObjectValues,
  Extract<ObjectValues, { light: string | number; dark: string | number }>
>;

function propertyFormatter(indent: number) {
  const prefix = " ".repeat(indent);

  return function ([key, value]: [string, string]) {
    return `${prefix}${key}: ${value};`;
  };
}

function performanceTimer() {
  const start = performance.now();

  return function () {
    return Math.round(performance.now() - start);
  };
}

function formatPropertyMap(
  properties: Map<string, string>,
  indent: number,
  trimStart = true
) {
  const formatter = propertyFormatter(indent);
  return Array.from(properties.entries())
    .map(formatter)
    .join("\n")
    .slice(trimStart ? indent : 0);
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "@tkofh/nuxt-design-tokens",
    configKey: "designTokens",
  },
  defaults: {
    screens: {
      mobile: null,
      tablet: "screen and (min-width: 768px)",
      laptop: "screen and (min-width: 1024px)",
      desktop: "screen and (min-width: 1280px)",
    },
    colorModeClassname: "{theme}-mode",
    outputReferences: true,
    attributes: {},
    groupAttributes: {
      tier: [
        "system",
        "group",
        "component",
        "element",
        "category",
        "concept",
        "property",
        "variant",
        "scale",
        "state",
      ]
        .map((term) => `"${term}"`)
        .join(" | "),
    },
    patterns: ["/tokens.config.ts", "/**/tokens/**/*.ts", "/**/*.tokens.ts"],
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const logger = useLogger("design-tokens");

    const measureSetupTime = performanceTimer();
    if (
      options.colorModeClassname !== false &&
      !options.colorModeClassname.includes("{theme}")
    ) {
      options.colorModeClassname = false;
    }

    nuxt.options.alias["#design-tokens/define"] =
      resolver.resolve("./runtime/helpers");

    addTypeTemplate({
      write: true,
      filename: "design-tokens/shim.d.ts",
      getContents: () => {
        return outdent`
          declare module "@token-alchemy/types" {
            export interface DesignTokenAttributes {
              ${Object.entries(options.attributes)
                .filter(
                  ([property]) =>
                    property.toLowerCase() !== "value" &&
                    property.toLowerCase() !== "$value"
                )
                .map(([property, type]) => `${property}: ${type}`)
                .join("\n")}

              $value: string | number | { light: string | number; dark: string | number } | { ${Object.entries(
                options.screens
              )
                .map(
                  ([key, value]) =>
                    `${key}${value === null ? "" : "?"}: string | number`
                )
                .join("; ")} }
            }
            export interface DesignTokenGroupAttributes {
              ${Object.entries(options.groupAttributes)
                .map(([property, type]) => `${property}: ${type}`)
                .join("\n")}
            }
          }
          export {}
        `;
      },
    });

    const patterns = options.patterns.flatMap((stub) =>
      nuxt.options._layers.map(({ cwd }) => joinURL(cwd, stub))
    );

    function isTokenSource(path: string) {
      return patterns.some((pattern) => minimatch(path, pattern));
    }

    const jiti = createJITI(import.meta.url, {
      alias: nuxt.options.alias,
      cache: false,
      requireCache: false,
    });

    function importTokenSource(source: string) {
      try {
        const imported = jiti(source);
        tokenSources.set(source, imported.default ?? imported);
      } catch (e) {
        tokenSources.set(source, {});
      }
    }

    const tokenSources = new Map<string, DesignTokensInput>();
    for (const source of await glob(patterns)) {
      importTokenSource(source);
    }

    function buildDictionary() {
      const dictionary = createDictionary(defu({}, ...tokenSources.values()));
      return dictionary;
    }

    let dictionary = buildDictionary();

    const baseResponsiveKeys = new Set<MediaKey>();
    const conditionalResponsiveKeys = new Set<MediaKey>();
    for (const [key, value] of Object.entries(options.screens) as [
      MediaKey,
      string | number
    ][]) {
      if (value === null) {
        baseResponsiveKeys.add(key);
      } else {
        conditionalResponsiveKeys.add(key);
      }
    }

    const themeCss = addTemplate({
      write: true,
      filename: "design-tokens/theme.css",
      getContents: () => {
        const baseProperties = new Map<string, string>();
        const responsiveProperties = new Map<MediaKey, Map<string, string>>();
        const lightProperties = new Map<string, string>();
        const darkProperties = new Map<string, string>();
        for (const key of conditionalResponsiveKeys) {
          responsiveProperties.set(key, new Map<string, string>());
        }

        for (const token of dictionary.all()) {
          const tokenKey = `--${token.key}`;

          const tokenValue = formatReferences(token, (reference) =>
            options.outputReferences
              ? `var(--${reference.key})`
              : String(reference.value)
          );

          if (typeof tokenValue === "object") {
            if ("light" in tokenValue && "dark" in tokenValue) {
              lightProperties.set(tokenKey, String(tokenValue.light));
              darkProperties.set(tokenKey, String(tokenValue.dark));
            } else {
              for (const key of baseResponsiveKeys) {
                baseProperties.set(tokenKey, String(tokenValue[key]));
              }
              for (const key of conditionalResponsiveKeys) {
                if (tokenValue[key] != null) {
                  responsiveProperties
                    .get(key)!
                    .set(tokenKey, String(tokenValue[key]));
                }
              }
            }
          } else {
            baseProperties.set(tokenKey, String(tokenValue));
          }
        }
        const stanzas: string[] = [];

        if (baseProperties.size > 0) {
          stanzas.push(outdent`
            :root {
              ${formatPropertyMap(baseProperties, 2)}
            }
          `);
        }
        if (lightProperties.size > 0) {
          const prefix =
            options.colorModeClassname !== false
              ? `.${options.colorModeClassname.replace("{theme}", "light")}`
              : `@media (prefers-color-scheme: light) {\n  :root {`;
          const suffix = options.colorModeClassname !== false ? "}" : "  }\n}";
          stanzas.push(
            [
              prefix,
              formatPropertyMap(
                lightProperties,
                options.colorModeClassname !== false ? 2 : 4,
                false
              ),
              suffix,
            ].join("\n")
          );
        }
        if (darkProperties.size > 0) {
          const prefix =
            options.colorModeClassname !== false
              ? `.${options.colorModeClassname.replace("{theme}", "dark")}`
              : `@media (prefers-color-scheme: dark) {\n  :root {`;
          const suffix = options.colorModeClassname !== false ? "}" : "  }\n}";
          stanzas.push(
            [
              prefix,
              formatPropertyMap(
                darkProperties,
                options.colorModeClassname !== false ? 2 : 4,
                false
              ),
              suffix,
            ].join("\n")
          );
        }
        for (const key of conditionalResponsiveKeys) {
          const properties = responsiveProperties.get(key)!;
          if (properties.size > 0) {
            stanzas.push(outdent`
              @media ${options.screens[key]} {
                ${formatPropertyMap(properties, 4)}
              }
            `);
          }
        }

        return stanzas.join("\n\n");
      },
    });

    nuxt.options.css.push(themeCss.dst);

    if (nuxt.options.dev) {
      const updateTemplateDsts = new Set([themeCss.dst]);

      nuxt.hook("vite:serverCreated", (vite) => {
        async function updateTokens(measureUpdateTimer: () => number) {
          dictionary = buildDictionary();
          await updateTemplates({
            filter: (template) => updateTemplateDsts.has(template.dst),
          });

          await Promise.all(
            Array.from(updateTemplateDsts).flatMap((dst) => {
              const modules =
                vite.moduleGraph.fileToModulesMap.get(dst) ?? new Set();
              return Array.from(modules).map((module) => {
                return vite.reloadModule(module);
              });
            })
          );

          logger.success(
            `Updated ${
              Array.from(dictionary.all()).length
            } Design Tokens (took ${measureUpdateTimer()} ms)`
          );
        }
        if (vite.config.define?.["process.client"] === true) {
          const triggerUpdateTokens = debounce(
            (measureUpdateTimer: () => number) => {
              updateTokens(measureUpdateTimer);
            }
          );

          nuxt.hook("builder:watch", async (event, path) => {
            const fullPath = joinURL(nuxt.options.rootDir, path);
            if (isTokenSource(fullPath)) {
              const measureUpdateTimer = performanceTimer();

              let changed = false;
              if (event === "add" || event === "change") {
                importTokenSource(fullPath);
                changed = true;
              } else if (event === "unlink") {
                tokenSources.delete(fullPath);
                changed = true;
              }

              if (changed) {
                triggerUpdateTokens(measureUpdateTimer);
              }
            }
          });
        }
      });
    }

    logger.success(
      `Transformed ${
        Array.from(dictionary.all()).length
      } Design Tokens (took ${measureSetupTime()} ms)`
    );
  },
});
