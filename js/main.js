// js/main.js - Lädt Skripte basierend auf Kategorien und macht sie umschaltbar

document.addEventListener('DOMContentLoaded', () => {
    const scriptListContainer = document.getElementById('script-list');
    const loadingPlaceholder = scriptListContainer ? scriptListContainer.querySelector('.loading-placeholder') : null;

    if (!scriptListContainer) {
        console.error("Container '#script-list' nicht gefunden.");
        return;
    }

    // Prüfen, ob die Variable 'scriptCategories' aus scripts.js existiert
    if (typeof scriptCategories !== 'undefined' && Array.isArray(scriptCategories)) {
        scriptListContainer.innerHTML = ''; // Container leeren

        let categoriesFound = false;
        let firstCategoryContentId = null; // Zum Merken des ersten Inhaltsbereichs

        scriptCategories.forEach((category, index) => {
            // Nur Kategorien mit Skripten verarbeiten
            if (category.scripts && category.scripts.length > 0) {
                categoriesFound = true;
                // Eindeutige ID für den Inhalts-Container dieser Kategorie
                const categoryContentId = `category-content-${index}`;

                 // 1. Kategorie-Überschrift erstellen und klickbar machen
                const categoryHeading = document.createElement('h2'); // Oder h3
                categoryHeading.textContent = category.categoryTitle;
                // Klassen für Styling und um sie als interaktiv zu markieren
                categoryHeading.className = 'category-heading interactive';
                // Benutzerdefiniertes Attribut, um die Überschrift mit ihrem Inhalt zu verknüpfen
                categoryHeading.setAttribute('data-target-id', categoryContentId);
                // Funktion zuweisen, die bei Klick ausgeführt wird
                categoryHeading.onclick = handleCategoryClick;
                scriptListContainer.appendChild(categoryHeading);

                // 2. Container für die Skript-Kacheln erstellen (dieser wird ein-/ausgeblendet)
                const categoryScriptGrid = document.createElement('div');
                // Klassen für Grid-Layout und zum gezielten Ansprechen (Ausblenden)
                categoryScriptGrid.className = 'category-script-grid category-content';
                categoryScriptGrid.id = categoryContentId; // ID für die Verknüpfung
                // Standardmäßig ist dieser Bereich nicht sichtbar (wird über CSS gesteuert)
                scriptListContainer.appendChild(categoryScriptGrid);

                // ID des ersten Inhalts speichern, um ihn ggf. standardmäßig anzuzeigen
                if (firstCategoryContentId === null) {
                    firstCategoryContentId = categoryContentId;
                     // Erste Überschrift als "aktiv" markieren
                     categoryHeading.classList.add('active');
                }

                // 3. Skript-Kacheln in den (jetzt noch verborgenen) Grid-Container füllen
                category.scripts.forEach(script => {
                    const listItem = document.createElement('div');
                    listItem.className = 'script-item'; // Bestehendes Styling

                    const link = document.createElement('a');
                    link.href = `scripts/${script.folder}/index.html`;
                    link.textContent = script.title;

                    if (script.description) {
                        const description = document.createElement('p');
                        description.textContent = script.description;
                        description.style.fontSize = '0.9em';
                        description.style.color = 'var(--secondary-color)';
                        description.style.marginTop = '5px';
                        link.appendChild(description);
                    }

                    listItem.appendChild(link);
                    categoryScriptGrid.appendChild(listItem);
                });
            }
        });

        // Optional: Den Inhalt der ersten Kategorie standardmäßig sichtbar machen
        if (firstCategoryContentId) {
            const firstContent = document.getElementById(firstCategoryContentId);
            if (firstContent) {
                firstContent.classList.add('visible'); // CSS-Klasse hinzufügen, um anzuzeigen
            }
        }


        if (!categoriesFound) {
             scriptListContainer.innerHTML = '<p style="text-align: center; color: var(--secondary-color);">Derzeit keine Module verfügbar.</p>';
        }

    } else {
         // Fehlerbehandlung
         if (loadingPlaceholder) {
            loadingPlaceholder.textContent = 'Fehler beim Laden der Modul-Kategorien.';
            loadingPlaceholder.style.color = 'red';
        } else {
             scriptListContainer.innerHTML = '<p style="text-align: center; color: red;">Fehler beim Laden der Modul-Kategorien.</p>';
        }
        console.error("Skript-Kategorien 'scriptCategories' nicht gefunden oder nicht im korrekten Format in js/scripts.js.");
    }
});

/**
 * Funktion, die beim Klick auf eine Kategorie-Überschrift aufgerufen wird.
 * Blendet alle Inhaltsbereiche aus und zeigt nur den zur Überschrift gehörenden an.
 * @param {MouseEvent} event Das Klick-Ereignis
 */
function handleCategoryClick(event) {
    const clickedHeading = event.currentTarget; // Das geklickte H2/H3-Element
    const targetId = clickedHeading.getAttribute('data-target-id'); // Die ID des anzuzeigenden Inhalts
    const targetContent = document.getElementById(targetId);

    if (!targetContent) {
        console.warn(`Kein Inhaltselement mit ID ${targetId} gefunden.`);
        return;
    }

    // 1. Alle Inhaltsbereiche finden und die 'visible'-Klasse entfernen (ausblenden)
    const allContentDivs = document.querySelectorAll('.category-content');
    allContentDivs.forEach(div => {
        div.classList.remove('visible');
    });

    // 2. Alle Überschriften finden und die 'active'-Klasse entfernen
    const allHeadings = document.querySelectorAll('.category-heading.interactive');
    allHeadings.forEach(h => {
        h.classList.remove('active');
    });

    // 3. Den Ziel-Inhaltsbereich sichtbar machen, indem die 'visible'-Klasse hinzugefügt wird
    targetContent.classList.add('visible');

    // 4. Die geklickte Überschrift als 'active' markieren (für CSS-Styling)
    clickedHeading.classList.add('active');
}