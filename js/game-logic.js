// js/game-logic.js

// --- Globale Variablen für Zustände (einfacher Ansatz) ---
// Besser wäre Kapselung in Klassen oder Objekten, aber für den Anfang okay.
let _flashcardData = [];
let _currentCardIndex = 0;
let _flashcardElements = {}; // Zum Speichern der DOM-Element-Referenzen

let _memoryItems = [];
let _memoryCards = [];
let _revealedCards = [];
let _matchedPairs = 0;
let _moves = 0;
let _memoryBoardElement = null;
let _memoryStatusElement = null;
let _memoryFeedbackElement = null;


// === Richtig/Falsch Logik ===
/**
 * Prüft eine Richtig/Falsch Frage und gibt Ergebnis zurück.
 * @param {string} radioGroupName Name der Radio-Button-Gruppe.
 * @param {boolean} correctAnswer Die korrekte Antwort (true/false).
 * @returns {{isCorrect: boolean, message: string}} Ergebnisobjekt.
 */
function checkTrueFalseLogic(radioGroupName, correctAnswer) {
    const selectedInput = document.querySelector(`input[name="${radioGroupName}"]:checked`);
    let message = '';
    let isSuccess = false;

    if (selectedInput) {
        const selectedValue = (selectedInput.value === 'true'); // Konvertiere zu Boolean
        if (selectedValue === correctAnswer) {
            message = "Richtig!";
            isSuccess = true;
        } else {
            message = `Leider falsch. Die richtige Antwort wäre gewesen: ${correctAnswer ? 'Richtig' : 'Falsch'}.`;
        }
    } else {
        message = "Bitte wähle eine Antwort aus.";
        isSuccess = false; // Keine Antwort ist nicht erfolgreich
    }
    return { isCorrect: isSuccess, message: message };
}

// === Lückentext Logik ===
/**
 * Prüft einen Lückentext.
 * @param {Array<string>} inputIds Array der IDs der Input-Felder.
 * @param {Array<string>} correctAnswers Array der korrekten Antworten (in gleicher Reihenfolge).
 * @returns {{allCorrect: boolean, feedbackMessages: Array<string>, message: string}} Ergebnisobjekt.
 */
function checkFillBlankLogic(inputIds, correctAnswers) {
    let allCorrect = true;
    let feedbackMessages = [];

    inputIds.forEach((id, index) => {
        const inputElement = document.getElementById(id);
        if (!inputElement) {
            console.error(`Lückentext-Input mit ID ${id} nicht gefunden.`);
            feedbackMessages.push(`Fehler: Input ${id} nicht gefunden.`);
            allCorrect = false;
            return; // Nächste Iteration
        }
        const userAnswer = inputElement.value.trim().toLowerCase(); // Standardisieren
        const correctAnswer = correctAnswers[index].toLowerCase();
        if (userAnswer === correctAnswer) {
            inputElement.style.border = '2px solid green';
            // feedbackMessages.push(`Lücke ${index + 1}: Richtig!`); // Optionales Einzel-Feedback
        } else {
            inputElement.style.border = '2px solid red';
            allCorrect = false;
            feedbackMessages.push(`Lücke "${correctAnswers[index]}" war erwartet.`); // Hinweis auf richtige Antwort
        }
    });

    const overallMessage = allCorrect ? "Alle Lücken korrekt ausgefüllt!" : "Einige Antworten sind noch falsch.";
    return { allCorrect: allCorrect, feedbackMessages: feedbackMessages, message: overallMessage };
}

// === Zuordnungsaufgabe Logik ===
/**
 * Prüft eine Zuordnungsaufgabe (Dropdowns).
 * @param {object} correctMappings Objekt mit { selectId: 'correctValue', ... }.
 * @returns {{correctCount: number, totalItems: number, allCorrect: boolean, message: string}} Ergebnisobjekt.
 */
function checkMatchingLogic(correctMappings) {
    let correctCount = 0;
    const totalItems = Object.keys(correctMappings).length;

    for (const selectId in correctMappings) {
        const selectElement = document.getElementById(selectId);
         if (!selectElement) {
            console.error(`Zuordnungs-Select mit ID ${selectId} nicht gefunden.`);
            continue; // Nächste Iteration
        }
        const selectedValue = selectElement.value;
        const correctAnswer = correctMappings[selectId];

        if (selectedValue === correctAnswer) {
            selectElement.style.border = '2px solid green';
            correctCount++;
        } else {
            selectElement.style.border = '2px solid red';
        }
    }
    const allCorrect = (correctCount === totalItems);
    const message = `Du hast ${correctCount} von ${totalItems} richtig zugeordnet.`;
    return { correctCount: correctCount, totalItems: totalItems, allCorrect: allCorrect, message: message };
}


// === Flashcard Logik ===
/**
 * Initialisiert das Flashcard-Modul.
 * @param {string} containerSelector CSS-Selector für den Karten-Container (das div.flashcard).
 * @param {Array<object>} cardData Array mit {term: string, definition: string} Objekten.
 * @param {string} counterId ID des Zähler-Elements.
 * @param {string} prevBtnId ID des "Vorherige"-Buttons.
 * @param {string} nextBtnId ID des "Nächste"-Buttons.
 */
function setupFlashcards(containerSelector, cardData, counterId, prevBtnId, nextBtnId) {
    _flashcardData = cardData;
    _currentCardIndex = 0;

    const cardElement = document.querySelector(containerSelector);
    if (!cardElement || _flashcardData.length === 0) {
        console.error("Flashcard-Container nicht gefunden oder keine Kartendaten vorhanden.");
        const container = document.querySelector(containerSelector)?.parentElement || document.body;
        container.innerHTML = "<p>Fehler beim Laden der Karteikarten.</p>";
        return;
    }

    _flashcardElements = {
        card: cardElement,
        front: cardElement.querySelector('.flashcard-front'),
        back: cardElement.querySelector('.flashcard-back'),
        counter: document.getElementById(counterId),
        prevBtn: document.getElementById(prevBtnId),
        nextBtn: document.getElementById(nextBtnId)
    };

    // Event Listener für Buttons setzen
    _flashcardElements.prevBtn.onclick = prevFlashcard;
    _flashcardElements.nextBtn.onclick = nextFlashcard;
    _flashcardElements.card.onclick = () => flipFlashcard(); // Klick auf Karte zum Umdrehen

    loadFlashcard(_currentCardIndex); // Erste Karte laden
    console.log(`Flashcards initialisiert für ${containerSelector}`);
}

function loadFlashcard(index) {
    if (!_flashcardElements.card || index < 0 || index >= _flashcardData.length) return;

    const card = _flashcardData[index];
    _flashcardElements.front.textContent = card.term;
    _flashcardElements.back.textContent = card.definition;
    _flashcardElements.card.classList.remove('flipped'); // Sicherstellen, dass Vorderseite sichtbar

    _flashcardElements.counter.textContent = `Karte ${index + 1} / ${_flashcardData.length}`;
    _flashcardElements.prevBtn.disabled = (index === 0);
    _flashcardElements.nextBtn.disabled = (index === _flashcardData.length - 1);
        // MathJax anweisen, den aktualisierten Inhalt der Vorder- und Rückseite zu rendern.
        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            // MathJax.typesetPromise() erwartet ein Array von DOM-Elementen.
            // Wir übergeben die Vorder- und Rückseite der aktuellen Karte.
            MathJax.typesetPromise([_flashcardElements.front, _flashcardElements.back])
                .catch((err) => console.error('MathJax typesetting error on flashcard:', err));
        }
    
}

function flipFlashcard() {
    if (_flashcardElements.card) {
        _flashcardElements.card.classList.toggle('flipped');
    }
}

function nextFlashcard() {
    if (_currentCardIndex < _flashcardData.length - 1) {
        _currentCardIndex++;
        loadFlashcard(_currentCardIndex);
    }
}

function prevFlashcard() {
    if (_currentCardIndex > 0) {
        _currentCardIndex--;
        loadFlashcard(_currentCardIndex);
    }
}


// === Memory Spiel Logik ===
/**
 * Initialisiert das Memory-Spiel.
 * @param {string} boardId ID des Spielbrett-Elements.
 * @param {string} statusId ID des Status-Anzeige-Elements.
 * @param {string} feedbackId ID des Feedback-Elements.
 * @param {Array<string>} items Array der eindeutigen Items für die Paare.
 */
function setupMemoryGame(boardId, statusId, feedbackId, items) {
    _memoryBoardElement = document.getElementById(boardId);
    _memoryStatusElement = document.getElementById(statusId);
    _memoryFeedbackElement = document.getElementById(feedbackId);
    _memoryItems = items;

    if (!_memoryBoardElement || !_memoryStatusElement || !_memoryFeedbackElement || _memoryItems.length === 0) {
        console.error("Memory-Elemente nicht gefunden oder keine Items vorhanden.");
        if (_memoryBoardElement) _memoryBoardElement.innerHTML = "<p>Fehler beim Initialisieren des Memory-Spiels.</p>";
        return;
    }

    startNewMemoryGame(); // Startet das erste Spiel
     console.log(`Memory initialisiert für ${boardId}`);
}

function shuffleMemory(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createMemoryBoard() {
    _memoryBoardElement.innerHTML = ''; // Altes Brett leeren
    _memoryCards = shuffleMemory([..._memoryItems, ..._memoryItems]); // Paare erstellen und mischen
    _revealedCards = [];
    _matchedPairs = 0;
    _moves = 0;
    updateMemoryStatus();
    if (_memoryFeedbackElement) _memoryFeedbackElement.style.display = 'none';

    _memoryCards.forEach((value, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('memory-card', 'hidden');
        cardElement.dataset.index = index;
        cardElement.dataset.value = value;
        cardElement.addEventListener('click', handleMemoryCardClick);
        _memoryBoardElement.appendChild(cardElement);
    });
}

function handleMemoryCardClick(event) {
    const clickedCard = event.target;

    if (clickedCard.classList.contains('revealed') || _revealedCards.length >= 2) {
        return; // Ignorieren, wenn schon offen, gematcht oder 2 offen sind
    }

    clickedCard.classList.remove('hidden');
    clickedCard.classList.add('revealed');
    clickedCard.textContent = clickedCard.dataset.value;
    _revealedCards.push(clickedCard);

    if (_revealedCards.length === 2) {
        _moves++;
        updateMemoryStatus();
        // Kurze Verzögerung, damit man die zweite Karte sieht, dann prüfen
        setTimeout(checkMemoryMatch, 700);
    }
}

function checkMemoryMatch() {
    if (_revealedCards.length < 2) return; // Sollte nicht passieren, aber sicher ist sicher

    const [card1, card2] = _revealedCards;
    if (card1.dataset.value === card2.dataset.value) {
        // Match!
        card1.classList.add('matched');
        card2.classList.add('matched');
        card1.removeEventListener('click', handleMemoryCardClick);
        card2.removeEventListener('click', handleMemoryCardClick);
        _matchedPairs++;
        updateMemoryStatus();
        if (_matchedPairs === _memoryItems.length) {
            // Spiel gewonnen! Feedback anzeigen (nutzt globale Funktion)
            if (typeof displayFeedback === 'function') {
                 displayFeedback(_memoryFeedbackElement.id, `Glückwunsch! Alle Paare in ${_moves} Zügen gefunden!`, true);
            } else {
                 _memoryFeedbackElement.textContent = `Glückwunsch! Alle Paare in ${_moves} Zügen gefunden!`;
                 _memoryFeedbackElement.style.color = 'green';
                 _memoryFeedbackElement.style.display = 'block';
            }
        }
    } else {
        // No match
        card1.classList.add('hidden');
        card1.classList.remove('revealed');
        card1.textContent = '';
        card2.classList.add('hidden');
        card2.classList.remove('revealed');
        card2.textContent = '';
    }
    _revealedCards = []; // Aufgedeckte Karten zurücksetzen
}

function updateMemoryStatus() {
    if (_memoryStatusElement) {
        _memoryStatusElement.textContent = `Züge: ${_moves} | Gefunden: ${_matchedPairs} / ${_memoryItems.length}`;
    }
}

function startNewMemoryGame() {
    createMemoryBoard();
}

console.log("game-logic.js geladen."); // Zum Debuggen