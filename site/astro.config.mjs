import { defineConfig, fontProviders } from "astro/config";

const domains = {
  settings: "https://claudesettings.com",
  plugins: "https://agentplugins.net",
};
const variant = process.env.SITE_VARIANT || "settings";

export default defineConfig({
  output: "static",
  site: process.env.PUBLIC_SITE_URL || domains[variant],
  fonts:
    variant === "settings"
      ? [
          {
            provider: fontProviders.fontsource(),
            name: "Geist",
            cssVariable: "--font-sans",
            weights: ["100 900"],
            styles: ["normal"],
          },
        ]
      : [],
});
