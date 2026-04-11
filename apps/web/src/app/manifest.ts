import type { MetadataRoute } from "next";

const APP_THEME_COLOR = "#020617";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VDP — Life Operating System",
    short_name: "VDP",
    start_url: "/home",
    display: "standalone",
    background_color: APP_THEME_COLOR,
    theme_color: APP_THEME_COLOR,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
