export const LINKEDIN_MARKER_START = '<!-- linkedin:start -->';

export function stripLinkedinBlock(markdown) {
  const idx = markdown.indexOf(LINKEDIN_MARKER_START);
  return idx === -1 ? markdown : markdown.slice(0, idx);
}
