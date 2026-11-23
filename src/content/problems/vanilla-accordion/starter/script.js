/**
 * Accessible accordion (WAI-ARIA APG accordion pattern).
 *
 * The markup in index.html is already correct. Your job is the behaviour:
 *  - clicking a header button toggles its panel (aria-expanded + hidden)
 *  - in an accordion WITHOUT data-allow-multiple, opening one panel closes the others
 *  - ArrowDown / ArrowUp / Home / End move focus between the header buttons
 *  - use ONE click listener (and one keydown listener) per accordion container
 */

function initAccordion(accordion) {
  // TODO: implement
}

document.querySelectorAll('[data-accordion]').forEach(initAccordion);
