import { LINKEDIN_MARKER_START } from './linkedin-block.mjs';

export default function remarkStripLinkedin() {
  return (tree) => {
    const idx = tree.children.findIndex(
      (node) =>
        node.type === 'html' &&
        typeof node.value === 'string' &&
        node.value.startsWith(LINKEDIN_MARKER_START)
    );
    if (idx !== -1) {
      tree.children.length = idx;
    }
  };
}
