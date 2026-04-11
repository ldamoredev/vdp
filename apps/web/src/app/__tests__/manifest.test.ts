import { describe, expect, it } from "vitest";
import { metadata, viewport } from "../layout";
import manifest from "../manifest";

describe("app installability metadata", () => {
  it("publishes standalone PWA metadata for the /home experience", () => {
    const appManifest = manifest();

    expect(appManifest.name).toBe("VDP — Life Operating System");
    expect(appManifest.short_name).toBe("VDP");
    expect(appManifest.start_url).toBe("/home");
    expect(appManifest.display).toBe("standalone");
    expect(appManifest.background_color).toBe("#020617");
    expect(appManifest.theme_color).toBe("#020617");
    expect(appManifest.icons).toEqual([
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

  it("adds mobile-friendly viewport and apple web app metadata", () => {
    expect(viewport).toEqual({
      width: "device-width",
      initialScale: 1,
      themeColor: "#020617",
    });

    expect(metadata.appleWebApp).toMatchObject({
      capable: true,
      statusBarStyle: "black-translucent",
      title: "VDP",
    });
    expect(metadata.formatDetection).toEqual({
      telephone: false,
    });
    expect(metadata.icons).toMatchObject({
      apple: "/apple-icon.png",
    });
  });
});
