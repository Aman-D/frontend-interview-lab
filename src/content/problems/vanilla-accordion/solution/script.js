/**
 * Accessible accordion (WAI-ARIA APG accordion pattern).
 *
 * - Each header is a <button> inside a heading; aria-expanded tells assistive
 *   technology whether its panel is open, aria-controls points to the panel.
 * - Collapsed panels get the `hidden` attribute, which removes them from the
 *   accessibility tree and from the tab order.
 * - One click listener and one keydown listener per accordion (event delegation),
 *   so headers added later work without extra wiring.
 */

const TRIGGER_SELECTOR = '.accordion-trigger[aria-controls]';

/** Header buttons that belong to THIS accordion (not to a nested one). */
function getTriggers(accordion) {
  return Array.from(accordion.querySelectorAll(TRIGGER_SELECTOR)).filter(
    (trigger) => trigger.closest('[data-accordion]') === accordion,
  );
}

function getPanel(trigger) {
  return document.getElementById(trigger.getAttribute('aria-controls'));
}

function setExpanded(trigger, expanded) {
  trigger.setAttribute('aria-expanded', String(expanded));
  const panel = getPanel(trigger);
  if (panel) panel.hidden = !expanded;
}

function initAccordion(accordion) {
  const allowMultiple = accordion.hasAttribute('data-allow-multiple');

  // Make the DOM consistent with aria-expanded in case the markup disagrees.
  for (const trigger of getTriggers(accordion)) {
    setExpanded(trigger, trigger.getAttribute('aria-expanded') === 'true');
  }

  accordion.addEventListener('click', (event) => {
    // closest() handles clicks on children of the button (title/icon spans).
    const trigger = event.target.closest(TRIGGER_SELECTOR);
    if (!trigger || trigger.closest('[data-accordion]') !== accordion) return;

    const willExpand = trigger.getAttribute('aria-expanded') !== 'true';
    if (willExpand && !allowMultiple) {
      for (const other of getTriggers(accordion)) {
        if (other !== trigger) setExpanded(other, false);
      }
    }
    setExpanded(trigger, willExpand);
  });

  accordion.addEventListener('keydown', (event) => {
    const trigger = event.target.closest(TRIGGER_SELECTOR);
    if (!trigger || trigger.closest('[data-accordion]') !== accordion) return;

    const triggers = getTriggers(accordion);
    const index = triggers.indexOf(trigger);
    let next = null;
    switch (event.key) {
      case 'ArrowDown':
        next = triggers[(index + 1) % triggers.length];
        break;
      case 'ArrowUp':
        next = triggers[(index - 1 + triggers.length) % triggers.length];
        break;
      case 'Home':
        next = triggers[0];
        break;
      case 'End':
        next = triggers[triggers.length - 1];
        break;
      default:
        return; // Enter and Space are handled natively by <button>.
    }
    event.preventDefault(); // stop the page from scrolling
    next.focus();
  });
}

document.querySelectorAll('[data-accordion]').forEach(initAccordion);
