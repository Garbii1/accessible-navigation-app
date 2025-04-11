/**
 * General utility functions.
 */

/**
 * Formats a Date object or timestamp string into a more readable date string.
 * @param {Date | string | number} dateInput - The date to format.
 * @param {object} options - Intl.DateTimeFormat options.
 * @returns {string} - Formatted date string or 'Invalid Date'.
 */
export function formatDate(dateInput, options = {}) {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        // hour: '2-digit',
        // minute: '2-digit',
        ...options, // Allow overriding defaults
      };
      return new Intl.DateTimeFormat(undefined, defaultOptions).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  }
  
  /**
   * Strips HTML tags from a string.
   * Consider using a more robust library like 'sanitize-html' if security is critical
   * or if complex HTML needs handling.
   * @param {string | null | undefined} htmlString - The string containing HTML.
   * @returns {string} - The text content without HTML tags.
   */
  export function stripHtml(htmlString) {
     if (!htmlString) return "";
     try {
         // Use DOMParser for safer stripping than regex
         const doc = new DOMParser().parseFromString(htmlString, 'text/html');
         return doc.body.textContent || "";
     } catch (e) {
         console.error("Error stripping HTML:", e);
         return htmlString; // Fallback to original string on error
     }
  }
  
  /**
   * Debounces a function call.
   * Creates a debounced version of a function that delays invoking func until
   * after wait milliseconds have elapsed since the last time the debounced function was invoked.
   * @param {Function} func - The function to debounce.
   * @param {number} wait - The number of milliseconds to delay.
   * @returns {Function} - The new debounced function.
   */
  export function debounce(func, wait) {
    let timeoutId = null;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeoutId);
        func.apply(this, args);
      };
      clearTimeout(timeoutId);
      timeoutId = setTimeout(later, wait);
    };
  }
  
  
  // Add other common helper functions as needed...