// The LinkedIn marker contract lives in scripts/linkedin-block.mjs — outside site/, so the trusted deploy job can build the
// chat corpus with it without running code from site/ (hq pin v20, W1a critique 2026-10-22). Re-exported here for the
// site renderer (remark-strip-linkedin, rss.xml.ts) and its tests; one place, no duplicate.
export { LINKEDIN_MARKER_START, stripLinkedinBlock } from '../../../scripts/linkedin-block.mjs';
