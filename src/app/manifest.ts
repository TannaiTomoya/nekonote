import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ネコのて — 途切れても、戻ればいい。",
    short_name: "ネコのて",
    description: "気持ち・お金・通院をひとつの場所に。",
    start_url: "/today",
    display: "standalone",
    background_color: "#f8f6f0",
    theme_color: "#f8f6f0",
    lang: "ja",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
