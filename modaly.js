/**
 * Modaly.js - A lightweight and flexible HTML-driven modal library
 * @author Essam Barghsh
 * @version 1.0.0
 * @license MIT
 */

(function (root, factory) {
  "use strict";

  // Create a unique namespace for the library
  const NAMESPACE = "modaly";

  // Prevent multiple initializations
  if (root[NAMESPACE]) {
    console.warn(`${NAMESPACE} is already defined. Skipping initialization.`);
    return;
  }

  // Initialize the library
  root[NAMESPACE] = factory();
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  // Library constants
  const PREFIX = "modaly";
  const SELECTORS = {
    modal: `[data-${PREFIX}]`,
    trigger: `[data-${PREFIX}-trigger]`,
    close: `[data-${PREFIX}-close]`,
    header: `[data-${PREFIX}-header]`,
    description: `[data-${PREFIX}-description]`,
    autofocus: `[data-${PREFIX}-autofocus]`,
  };
  const CLASSES = {
    base: PREFIX,
    open: `${PREFIX}-open`,
    close: `${PREFIX}-close`,
    fadeIn: `${PREFIX}-fade-in`,
    fadeOut: `${PREFIX}-fade-out`,
    slideIn: `${PREFIX}-slide-in`,
    slideOut: `${PREFIX}-slide-out`,
    scaleIn: `${PREFIX}-scale-in`,
    scaleOut: `${PREFIX}-scale-out`,
  };
  const EVENTS = {
    open: `${PREFIX}:open`,
    close: `${PREFIX}:close`,
  };

  class Modal {
    /**
     * Initialize all modals on the page
     * @static
     */
    static init() {
      // Check if already initialized
      if (document.body.hasAttribute(`data-${PREFIX}-initialized`)) {
        return;
      }

      // Find all modal elements
      const modals = document.querySelectorAll(SELECTORS.modal);

      // Initialize each modal
      modals.forEach((modalElement) => {
        new Modal(modalElement);
      });

      // Handle URL state on page load
      Modal.checkUrlState();

      // Mark as initialized
      document.body.setAttribute(`data-${PREFIX}-initialized`, "true");
    }

    /**
     * Check URL state for modal persistence
     * @private
     * @static
     */
    static checkUrlState() {
      const url = new URL(window.location);
      const modalId = url.searchParams.get(PREFIX);
      if (modalId) {
        const modal = document.querySelector(`[data-${PREFIX}="${modalId}"]`);
        if (modal && modal[`_${PREFIX}Instance`]) {
          modal[`_${PREFIX}Instance`].open();
        }
      }
    }

    /**
     * Creates a new Modal instance
     * @param {HTMLElement} element - The modal element
     */
    constructor(element) {
      this.modal = element;
      this.modalId = this.modal.dataset[PREFIX];

      // Get options from data attributes
      this.options = {
        persist: this.modal.dataset[`${PREFIX}Persist`] === "true",
        closeOnEscape: this.modal.dataset[`${PREFIX}CloseOnEscape`] !== "false",
        closeOnOutsideClick:
          this.modal.dataset[`${PREFIX}CloseOnOutside`] !== "false",
        openClass: this.modal.dataset[`${PREFIX}OpenClass`] || CLASSES.open,
        closeClass: this.modal.dataset[`${PREFIX}CloseClass`] || CLASSES.close,
      };

      // Store instance reference on the element with unique namespace
      this.modal[`_${PREFIX}Instance`] = this;

      // Initialize
      this.init();
    }

    /**
     * Initialize the modal
     * @private
     */
    init() {
      // Add base class
      this.modal.classList.add(CLASSES.base);

      // Set up trigger buttons
      this.setupTriggers();

      // Set up close buttons
      this.setupCloseButtons();

      // Set up outside click handling
      if (this.options.closeOnOutsideClick) {
        this.modal.addEventListener("click", (e) => {
          if (e.target === this.modal) {
            this.close();
          }
        });
      }

      // Set up keyboard handling
      if (this.options.closeOnEscape) {
        this.handleEscKey = (e) => {
          if (e.key === "Escape" && this.isOpen()) {
            this.close();
          }
        };
        document.addEventListener("keydown", this.handleEscKey);
      }

      // Initialize ARIA attributes
      this.setupAccessibility();
    }

    /**
     * Set up trigger buttons
     * @private
     */
    setupTriggers() {
      const triggers = document.querySelectorAll(
        `[data-${PREFIX}-trigger="${this.modalId}"]`
      );
      triggers.forEach((trigger) => {
        trigger.addEventListener("click", () => this.open());
      });
    }

    /**
     * Set up close buttons
     * @private
     */
    setupCloseButtons() {
      const closeButtons = this.modal.querySelectorAll(SELECTORS.close);
      closeButtons.forEach((button) => {
        button.addEventListener("click", () => this.close());
      });
    }

    /**
     * Set up accessibility attributes
     * @private
     */
    setupAccessibility() {
      this.modal.setAttribute("role", "dialog");
      this.modal.setAttribute("aria-modal", "true");
      this.modal.setAttribute("aria-hidden", "true");

      // If there's a header, use it for aria-labelledby
      const header = this.modal.querySelector(SELECTORS.header);
      if (header) {
        const headerId = header.id || `${PREFIX}-header-${this.modalId}`;
        header.id = headerId;
        this.modal.setAttribute("aria-labelledby", headerId);
      }

      // If there's a description, use it for aria-describedby
      const description = this.modal.querySelector(SELECTORS.description);
      if (description) {
        const descriptionId =
          description.id || `${PREFIX}-desc-${this.modalId}`;
        description.id = descriptionId;
        this.modal.setAttribute("aria-describedby", descriptionId);
      }
    }

    /**
     * Open the modal
     */
    open() {
      // Remove close class if present
      this.modal.classList.remove(this.options.closeClass);

      // Add open class
      this.modal.classList.add(this.options.openClass);

      // Update ARIA attributes
      this.modal.setAttribute("aria-hidden", "false");

      // Handle focus management
      this.previousActiveElement = document.activeElement;
      const focusableElement =
        this.modal.querySelector(SELECTORS.autofocus) ||
        this.modal.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
      if (focusableElement) {
        focusableElement.focus();
      }

      // Update URL if persistence is enabled
      if (this.options.persist) {
        this.updateUrl(true);
      }

      // Dispatch custom event
      this.modal.dispatchEvent(
        new CustomEvent(EVENTS.open, {
          detail: { modalId: this.modalId },
        })
      );
    }

    /**
     * Close the modal
     */
    close() {
      // Add close class
      this.modal.classList.add(this.options.closeClass);

      // Remove open class
      this.modal.classList.remove(this.options.openClass);

      // Update ARIA attributes
      this.modal.setAttribute("aria-hidden", "true");

      // Restore focus
      if (this.previousActiveElement) {
        this.previousActiveElement.focus();
      }

      // Update URL if persistence is enabled
      if (this.options.persist) {
        this.updateUrl(false);
      }

      // Dispatch custom event
      this.modal.dispatchEvent(
        new CustomEvent(EVENTS.close, {
          detail: { modalId: this.modalId },
        })
      );
    }

    /**
     * Toggle the modal state
     */
    toggle() {
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    }

    /**
     * Check if the modal is open
     * @returns {boolean}
     */
    isOpen() {
      return this.modal.classList.contains(this.options.openClass);
    }

    /**
     * Update the URL state
     * @private
     * @param {boolean} isOpen - Whether the modal is open
     */
    updateUrl(isOpen) {
      const url = new URL(window.location);
      if (isOpen) {
        url.searchParams.set(PREFIX, this.modalId);
      } else {
        url.searchParams.delete(PREFIX);
      }
      window.history.replaceState({}, "", url);
    }

    /**
     * Destroy the modal instance and cleanup
     */
    destroy() {
      // Remove event listeners
      if (this.options.closeOnEscape) {
        document.removeEventListener("keydown", this.handleEscKey);
      }

      // Remove instance reference
      delete this.modal[`_${PREFIX}Instance`];

      // Remove classes
      this.modal.classList.remove(CLASSES.base);
      this.modal.classList.remove(this.options.openClass);
      this.modal.classList.remove(this.options.closeClass);

      // Remove ARIA attributes
      this.modal.removeAttribute("role");
      this.modal.removeAttribute("aria-modal");
      this.modal.removeAttribute("aria-hidden");
      this.modal.removeAttribute("aria-labelledby");
      this.modal.removeAttribute("aria-describedby");
    }
  }

  // Initialize modals when DOM is loaded
  document.addEventListener("DOMContentLoaded", () => {
    Modal.init();
  });

  return Modal;
});