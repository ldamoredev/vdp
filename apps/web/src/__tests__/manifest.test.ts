import { readFileSync } from "node:fs";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

const APP_THEME_COLOR = "#07040D";

function readPublicFile(name: string): string {
  return readFileSync(path.resolve(process.cwd(), name), "utf-8");
}

describe("app installability metadata", () => {
  it("publishes standalone PWA metadata for the /home experience", () => {
    const manifest = JSON.parse(readPublicFile("public/manifest.webmanifest"));

    expect(manifest.name).toBe("VDP — Life Operating System");
    expect(manifest.short_name).toBe("VDP");
    expect(manifest.start_url).toBe("/home");
    expect(manifest.display).toBe("standalone");
    expect(manifest.background_color).toBe(APP_THEME_COLOR);
    expect(manifest.theme_color).toBe(APP_THEME_COLOR);
    expect(manifest.icons).toEqual([
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
    ]);
  });

  it("ships the icons referenced by the manifest", () => {
    for (const icon of ["icon-192.png", "icon-512.png", "apple-icon.png"]) {
      expect(readFileSync(path.resolve(process.cwd(), "public", icon)).length).toBeGreaterThan(0);
    }
  });

  it("keeps the PWA chrome metadata in index.html", () => {
    const indexHtml = readPublicFile("index.html");

    expect(indexHtml).toContain(`<meta name="theme-color" content="${APP_THEME_COLOR}" />`);
    expect(indexHtml).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(indexHtml).toContain('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />');
    expect(indexHtml).toContain('<meta name="apple-mobile-web-app-title" content="VDP" />');
    expect(indexHtml).toContain('<meta name="format-detection" content="telephone=no" />');
    expect(indexHtml).toContain('<link rel="apple-touch-icon" href="/apple-icon.png" />');
  });
});
