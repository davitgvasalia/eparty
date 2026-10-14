import type { MetadataRoute } from "next";

// PWA manifest: lets users "install" the site on their phone like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "E-Party / ელექტრონული პარტია",
    short_name: "E-Party",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#4f46e5",
  };
}
