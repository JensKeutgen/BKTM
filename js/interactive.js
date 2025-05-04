// js/interactive.js

/**
 * Zeigt eine Feedback-Nachricht in einem bestimmten Element an.
 * @param {string} elementId ID des HTML-Elements für das Feedback.
 * @param {string} message Die anzuzeigende Nachricht.
 * @param {boolean} isSuccess Ob das Feedback positiv (grün), negativ (rot) oder neutral (grau/info) ist. Null für neutral.
 */
function displayFeedback(elementId, message, isSuccess) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = 'feedback-message'; // Reset class
        if (isSuccess === true) {
            element.classList.add('success');
        } else if (isSuccess === false) {
            element.classList.add('error');
        } else {
             element.classList.add('info'); // Für neutrale Nachrichten
        }
        element.style.display = 'block'; // Sicherstellen, dass es sichtbar ist
        // Optional: Zum Feedback scrollen
        // element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        console.warn(`Feedback-Element mit ID '${elementId}' nicht gefunden.`);
    }
}

/**
 * Initialisiert Tooltips für Elemente mit der Klasse 'tooltip'.
 * Benötigt Tippy.js (muss auf der Seite eingebunden sein).
 */
function initializeTooltips() {
     if (typeof tippy === 'function') {
        tippy('.tooltip', {
             content: (reference) => reference.getAttribute('data-tippy-content') || 'Keine Beschreibung',
             animation: 'scale-subtle',
             theme: 'custom-light',
             placement: 'top',
        });
        console.log("Tooltips initialisiert.");
     } else {
        console.warn("Tippy.js nicht gefunden. Tooltips werden nicht initialisiert.");
     }
}

// Globale Initialisierungen
document.addEventListener('DOMContentLoaded', () => {
    console.log("interactive.js: DOMContentLoaded.");
    initializeTooltips();
});

console.log("interactive.js geladen."); // Zum Debuggen