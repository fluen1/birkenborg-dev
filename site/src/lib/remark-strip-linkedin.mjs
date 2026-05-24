import { LINKEDIN_MARKER_START } from './linkedin-block.mjs';

// Truncates the document at the first top-level html node that is exactly
// the LinkedIn-start marker. Exact match avoids silently dropping content
// if some future node happens to begin with the marker string.
export default function remarkStripLinkedin() {
  return (tree) => {
    const idx = tree.children.findIndex(
      (node) =>
        node.type === 'html' &&
        typeof node.value === 'string' &&
        node.value.trim() === LINKEDIN_MARKER_START
    );
    if (idx !== -1) {
      tree.children.splice(idx);
    }
  };
}
