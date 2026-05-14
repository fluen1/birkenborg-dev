import { visit } from "unist-util-visit";

/**
 * Rehype-plugin der:
 * 1. Tilfojer loading="lazy" + decoding="async" til alle <img>-tags fra markdown
 * 2. Console.warn hvis et img mangler alt-attribut
 */
export default function rehypeImgAttrs() {
  return (tree, file) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "img") return;
      node.properties = node.properties ?? {};
      if (node.properties.loading === undefined) {
        node.properties.loading = "lazy";
      }
      if (node.properties.decoding === undefined) {
        node.properties.decoding = "async";
      }
      if (!node.properties.alt) {
        const src = node.properties.src ?? "(unknown)";
        const path = file.history?.[0] ?? "(unknown file)";
        console.warn(`[rehype-img-attrs] Missing alt-text on img src="${src}" in ${path}`);
      }
    });
  };
}
