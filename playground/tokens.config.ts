import { defineTokens } from "@token-alchemy/core";
export default defineTokens({
  ds: {
    $tier: "system",
    button: {
      $tier: "component",
      color: {
        $tier: "category",
        background: {
          $tier: "property",
          $type: "color",
          $value: "blue",
          hover: {
            $tier: "state",
            $type: "color",
            $value: { light: "{ds.button.color.background}", dark: "magenta" },
          },
          active: {
            $tier: "state",
            $type: "color",
            $value: "{ds.button.color.background}",
          },
        },
      },
      font: {
        $tier: "category",
        size: {
          $tier: "property",
          $type: "size",
          $value: {
            mobile: "16px",
            laptop: "20px",
          },
        },
      },

      shadow: {
        $tier: "concept",
        $type: "color",
        $value: "0px 0px {ds.size.small} {ds.button.color.background}",
      },
    },

    size: {
      $tier: "category",

      small: {
        $tier: "variant",
        $value: "10px",
        $type: "size",
      },
    },
  },
});
