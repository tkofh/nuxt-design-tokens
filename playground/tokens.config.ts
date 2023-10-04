import { defineTokens } from "#design-tokens/define";

export default defineTokens({
  color: {
    $tier: "category",

    neutral: {
      $tier: "variant",

      "1": {
        $tier: "scale",
        $value: { light: "#fcfcfc", dark: "#111111" },
      },
      "2": {
        $tier: "scale",
        $value: { light: "#f9f9f9", dark: "#191919" },
      },
      "3": {
        $tier: "scale",
        $value: { light: "#f0f0f0", dark: "#222222" },
      },
      "4": {
        $tier: "scale",
        $value: { light: "#e8e8e8", dark: "#2a2a2a" },
      },
      "5": {
        $tier: "scale",
        $value: { light: "#e0e0e0", dark: "#313131" },
      },
      "6": {
        $tier: "scale",
        $value: { light: "#d9d9d9", dark: "#3a3a3a" },
      },
      "7": {
        $tier: "scale",
        $value: { light: "#cecece", dark: "#484848" },
      },
      "8": {
        $tier: "scale",
        $value: { light: "#bbbbbb", dark: "#606060" },
      },
      "9": {
        $tier: "scale",
        $value: { light: "#8d8d8d", dark: "#6e6e6e" },
      },
      "10": {
        $tier: "scale",
        $value: { light: "#838383", dark: "#7b7b7b" },
      },
      "11": {
        $tier: "scale",
        $value: { light: "#646464", dark: "#b4b4b4" },
      },
      "12": {
        $tier: "scale",
        $value: { light: "#202020", dark: "#eeeeee" },
      },
    },

    brand: {
      $tier: "variant",

      "1": {
        $tier: "scale",
        $value: { light: "#fbfefc", dark: "#0e1512" },
      },
      "2": {
        $tier: "scale",
        $value: { light: "#f4fbf6", dark: "#121b17" },
      },
      "3": {
        $tier: "scale",
        $value: { light: "#e6f6eb", dark: "#132d21" },
      },
      "4": {
        $tier: "scale",
        $value: { light: "#d6f1df", dark: "#113b29" },
      },
      "5": {
        $tier: "scale",
        $value: { light: "#c4e8d1", dark: "#174933" },
      },
      "6": {
        $tier: "scale",
        $value: { light: "#adddc0", dark: "#20573e" },
      },
      "7": {
        $tier: "scale",
        $value: { light: "#8eceaa", dark: "#28684a" },
      },
      "8": {
        $tier: "scale",
        $value: { light: "#5bb98b", dark: "#2f7c57" },
      },
      "9": {
        $tier: "scale",
        $value: { light: "#30a46c", dark: "#30a46c" },
      },
      "10": {
        $tier: "scale",
        $value: { light: "#2b9a66", dark: "#33b074" },
      },
      "11": {
        $tier: "scale",
        $value: { light: "#218358", dark: "#3dd68c" },
      },
      "12": {
        $tier: "scale",
        $value: { light: "#193b2d", dark: "#b1f1cb" },
      },
    },

    background: {
      $tier: "property",
      $value: "{color.neutral.1}",
    },

    text: {
      $tier: "property",
      $value: "{color.neutral.12}",
    },

    border: {
      $tier: "property",
      $value: "{color.neutral.5}",
    },
  },
});
