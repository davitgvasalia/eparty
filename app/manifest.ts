import type { MetadataRoute } from "next";

// PWA manifest: lets users "install" the site on their phone like an app.
// The Android app (Trusted Web Activity) is built from this manifest too.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "E-Party / ელექტრონული პარტია",
    short_name: "E-Party",
    description: "ელექტრონული პარტია: ხმის მიცემა Solana ვოლეტით",
    lang: "ka",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8fafc",
    theme_color: "#4f46e5",
    categories: ["politics", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
