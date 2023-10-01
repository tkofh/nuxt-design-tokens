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
            $value: { light: "grey", dark: "purple" },
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
    },
  },
});
