export default defineNuxtConfig({
  modules: ["../src/module"],
  // devtools: { enabled: true },

  designTokens: {
    screens: {
      mobile: null,
      tablet: "screen and (min-width: 768px)",
      laptop: "screen and (min-width: 1024px)",
      desktop: "screen and (min-width: 1280px)",
    },
    colorModeClassname: false, // "{theme}-mode",
    outputReferences: true,
  },
});
