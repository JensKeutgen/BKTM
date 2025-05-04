// --- Globale Variablen und Konfiguration ---
const nMin = 0;
const nMax = 10; // Eingabegröße n bis 10
const nPoints = 50; // Anzahl Punkte für den Graphen

// Zielparameter (diese müssen die Schüler finden)
const targetParamsExp = { a: 0.5, b: 2, d: 1 };
const targetParamsLog = { a: 2, b: 2.5, c: 1, d: -1 }; // Beispielwerte, ggf. anpassen

// Aktuelle User-Parameter (Startwerte)
let userParamsExp = { a: 1, b: 2, d: 0 };
let userParamsLog = { a: 1, b: 2, c: 0, d: 0 }; // Start mit b=2, obwohl Slider bei 1.1 beginnt

// Status der Parameter-Freischaltung und Fragen
let stateExp = {
    currentParam: 'a', // Startet mit Parameter 'a'
    correctAnswers: 0,
    unlocked: { a: true, b: false, d: false } // Nur 'a' ist am Anfang aktiv
};
let stateLog = {
    currentParam: 'a',
    correctAnswers: 0,
    unlocked: { a: true, b: false, c: false, d: false }
};

// --- Fragenkatalog mit LaTeX ---
const questions = {
    exp: {
        a: [
            { q: "Was bewirkt eine Vergrößerung von $a$ (positiv)?", o: { A: "Streckung in $y$-Richtung", B: "Stauchung in $y$-Richtung", C: "Verschiebung nach oben", D: "Verschiebung nach rechts" }, correct: "A" },
            { q: "Was passiert, wenn $a$ negativ wird?", o: { A: "Spiegelung an $y$-Achse", B: "Spiegelung an $x$-Achse", C: "Funktion wird 0", D: "Verschiebung nach unten" }, correct: "B" }
        ],
        b: [
            { q: "Was passiert, wenn die Basis $b$ größer als 1 ist und zunimmt?", o: { A: "Graph fällt schneller", B: "Graph steigt langsamer", C: "Graph steigt schneller", D: "Graph wird flacher" }, correct: "C" },
            { q: "Was bedeutet $0 < b < 1$ für den Graphen $f(n) = b^n$?", o: { A: "Exponentielles Wachstum", B: "Linearer Abfall", C: "Exponentieller Zerfall", D: "Konstanter Wert" }, correct: "C" }
        ],
        d: [
            { q: "Welchen Einfluss hat der Parameter $d$ auf $f(n) = a \\cdot b^n + d$?", o: { A: "Horizontale Verschiebung", B: "Vertikale Verschiebung", C: "Steigung", D: "Krümmung" }, correct: "B" },
            { q: "Der Parameter $d$ verschiebt welche Eigenschaft des Graphen?", o: { A: "Nullstelle", B: "$y$-Achsenabschnitt", C: "Horizontale Asymptote ($y=d$)", D: "Steigung bei $n=0$" }, correct: "C" }
        ]
    },
    log: {
         a: [
            { q: "Was bewirkt eine Vergrößerung von $a$ (positiv) bei $g(n) = a \\cdot \\log_b(n-c)+d$?", o: { A: "Streckung in $y$-Richtung", B: "Stauchung in $y$-Richtung", C: "Verschiebung nach oben", D: "Verschiebung nach rechts" }, correct: "A" },
            { q: "Was passiert, wenn $a$ negativ wird?", o: { A: "Spiegelung an $y$-Achse", B: "Spiegelung an $x$-Achse", C: "Funktion wird 0", D: "Verschiebung nach unten" }, correct: "B" }
        ],
        b: [
             { q: "Was passiert, wenn die Basis $b$ ($b>1$) in $g(n)=\\log_b(n)$ größer wird?", o: { A: "Graph steigt schneller", B: "Graph steigt langsamer (flacher)", C: "Graph fällt", D: "Asymptote verschiebt sich" }, correct: "B" },
             { q: "Welchen Wert nähert sich $\\log_b(n)$ an, wenn $n \\to \\infty$ (für $b>1$)?", o: { A: "$0$", B: "$1$", C: "$\\infty$", D: "$-\\infty$" }, correct: "C" }
        ],
        c: [
             { q: "Welchen Einfluss hat der Parameter $c$ in $g(n) = \\log_b(n-c)$?", o: { A: "Vertikale Verschiebung", B: "Horizontale Verschiebung", C: "Steilheit", D: "Basenänderung" }, correct: "B" },
             { q: "Der Parameter $c$ definiert die Position welcher Eigenschaft?", o: { A: "Horizontale Asymptote", B: "Schnittpunkt mit $y$-Achse", C: "Vertikale Asymptote ($n=c$)", D: "Maximum" }, correct: "C" }
        ],
         d: [
             { q: "Welchen Einfluss hat der Parameter $d$ auf $g(n) = a \\cdot \\log_b(n-c) + d$?", o: { A: "Horizontale Verschiebung", B: "Vertikale Verschiebung", C: "Steigung", D: "Krümmung" }, correct: "B" },
             { q: "Ändert $d$ den Definitionsbereich $D_g = \\{ n \\in \\mathbb{R} | n > c \\}$ der Logarithmusfunktion?", o: { A: "Ja, immer", B: "Nur wenn $d$ negativ ist", C: "Nein", D: "Nur wenn $d=0$" }, correct: "C" }
        ]
    }
};


// --- Hilfsfunktionen ---

// Berechnet y-Werte für Exponentialfunktion
function calculateExp(n, params) {
    const base = Math.max(params.b, 0.001);
    if (base === 1) return params.a + params.d;
    return params.a * Math.pow(base, n) + params.d;
}

// Berechnet y-Werte für Logarithmusfunktion
function calculateLog(n, params) {
    const argument = n - params.c;
    if (argument <= 0 || params.b <= 0 || params.b === 1) {
        return NaN; // Undefined
    }
    // log_b(x) = ln(x) / ln(b)
    return params.a * (Math.log(argument) / Math.log(params.b)) + params.d;
}

// Generiert Datenpunkte für Plotly
function generatePlotData(func, params, nMinCalc, nMaxCalc, numPoints) {
    const xValues = [];
    const yValues = [];
    const step = (nMaxCalc - nMinCalc) / (numPoints - 1);
    for (let i = 0; i < numPoints; i++) {
        const n = nMinCalc + i * step;
        const y = func(n, params);
        if (!isNaN(y) && isFinite(y)) {
             xValues.push(n);
             yValues.push(y);
        } else {
             xValues.push(n);
             yValues.push(null); // Fügt Lücke im Graphen hinzu
        }
    }
    return { x: xValues, y: yValues };
}

// --- Plotly Graphen Setup ---
// Gemeinsames Layout-Template
const baseLayout = {
    xaxis: { title: '$n$ (Eingabegröße)', range: [nMin, nMax] }, // LaTeX Titel
    yaxis: { title: 'Laufzeit / Schritte', autorange: true },
    margin: { l: 60, r: 30, b: 50, t: 40 },
    showlegend: true,
    legend: { x: 0.05, y: 0.95, bgcolor: 'rgba(255,255,255,0.7)' } // Legende anzeigen
};

// Initiales Zeichnen der Graphen
function initializeGraphs() {
    // --- Exponential Graph ---
    const targetTraceExp = {
        ...generatePlotData(calculateExp, targetParamsExp, nMin, nMax, nPoints),
        mode: 'lines', name: 'Ziel: $f_{ziel}(n)$', line: { color: 'blue', width: 3 } };
    const userTraceExp = {
        ...generatePlotData(calculateExp, userParamsExp, nMin, nMax, nPoints),
        mode: 'lines', name: 'Deine: $f_{user}(n)$', line: { color: 'red', width: 2, dash: 'dash' } };

    const layoutExp = JSON.parse(JSON.stringify(baseLayout));
    layoutExp.yaxis.title = '$f(n)$';
    layoutExp.yaxis.range = [-10, 50]; // Initiale y-Range

    Plotly.newPlot('graphExp', [targetTraceExp, userTraceExp], layoutExp);

    // --- Logarithmischer Graph ---
    const nMinLogTarget = targetParamsLog.c + 0.01;
    const nMinLogUser = userParamsLog.c + 0.01; // Basiert auf Startwert von userParamsLog.c
    const nMaxLog = nMax + Math.abs(targetParamsLog.c) + Math.abs(userParamsLog.c) + 5;

    const targetTraceLog = {
        ...generatePlotData(calculateLog, targetParamsLog, nMinLogTarget, nMaxLog, nPoints*2),
        mode: 'lines', name: 'Ziel: $g_{ziel}(n)$', line: { color: 'blue', width: 3 } };
    const userTraceLog = {
        ...generatePlotData(calculateLog, userParamsLog, nMinLogUser, nMaxLog, nPoints*2),
        mode: 'lines', name: 'Deine: $g_{user}(n)$', line: { color: 'red', width: 2, dash: 'dash' } };

    const layoutLog = JSON.parse(JSON.stringify(baseLayout));
    layoutLog.yaxis.title = '$g(n)$';
    layoutLog.xaxis.range = [Math.min(targetParamsLog.c, userParamsLog.c) - 1 , nMaxLog]; // x-Range anpassen
    layoutLog.yaxis.range = [-5, 10]; // Initiale y-Range

    Plotly.newPlot('graphLog', [targetTraceLog, userTraceLog], layoutLog);

    // --- Vergleichsgraph (initial leer) ---
    const layoutCompare = JSON.parse(JSON.stringify(baseLayout));
    layoutCompare.xaxis.title = '$n$ (Eingabe) / $y$ (Zeit)';
    layoutCompare.yaxis.title = '$y$ (Zeit) / $n$ (Eingabe)';
    layoutCompare.title = 'Vergleich: Exponential, Logarithmus & $y=n$'; // LaTeX Titel
    Plotly.newPlot('graphCompare', [], layoutCompare);
}


// --- Update Funktionen ---

// Aktualisiert den User-Graphen (Exponential - Spur 1)
function updateGraphExp() {
    const trace = generatePlotData(calculateExp, userParamsExp, nMin, nMax, nPoints);
    Plotly.restyle('graphExp', { x: [trace.x], y: [trace.y] }, [1]); // Nur Spur mit Index 1 (User)
    updateEquationDisplayExp(); // Gleichung auch aktualisieren
}

// Aktualisiert den User-Graphen (Logarithmisch - Spur 1)
function updateGraphLog() {
    const nMinLogUser = userParamsLog.c + 0.01;
    const nMaxLog = nMax + Math.abs(targetParamsLog.c) + Math.abs(userParamsLog.c) + 5;
    const trace = generatePlotData(calculateLog, userParamsLog, nMinLogUser, nMaxLog, nPoints * 2);

    Plotly.restyle('graphLog', { x: [trace.x], y: [trace.y] }, [1]); // Nur Spur mit Index 1 (User)

    const layoutUpdate = {
         'xaxis.range': [Math.min(targetParamsLog.c, userParamsLog.c) - 1 , nMaxLog]
    };
    Plotly.relayout('graphLog', layoutUpdate); // Passe x-Achse an wg. c
    updateEquationDisplayLog(); // Gleichung auch aktualisieren
}

// Aktualisiert die Anzeige der Exponentialgleichung
function updateEquationDisplayExp() {
    const eqElement = document.getElementById('equationExpDisplay');
    if (!eqElement) return; // Sicherstellen, dass Element existiert
    const p = userParamsExp;
    const aStr = p.a.toFixed(1);
    const bStr = p.b.toFixed(1);
    const dStr = p.d === 0 ? '' : (p.d > 0 ? ` + ${p.d.toFixed(1)}` : ` - ${Math.abs(p.d).toFixed(1)}`);

    eqElement.innerHTML = `$f(n) = ${aStr} \\cdot ${bStr}^n${dStr}$`;
    if (window.MathJax) { // Prüfen ob MathJax geladen ist
        MathJax.typesetPromise([eqElement]).catch(err => console.error('MathJax typesetting error:', err));
    }
}

// Aktualisiert die Anzeige der Logarithmusgleichung
function updateEquationDisplayLog() {
    const eqElement = document.getElementById('equationLogDisplay');
     if (!eqElement) return; // Sicherstellen, dass Element existiert
    const p = userParamsLog;
    const aStr = p.a.toFixed(1);
    const bStr = p.b.toFixed(1);
    const cStr = p.c === 0 ? 'n' : (p.c > 0 ? `(n - ${p.c.toFixed(1)})` : `(n + ${Math.abs(p.c).toFixed(1)})`);
    const dStr = p.d === 0 ? '' : (p.d > 0 ? ` + ${p.d.toFixed(1)}` : ` - ${Math.abs(p.d).toFixed(1)}`);

    eqElement.innerHTML = `$g(n) = ${aStr} \\cdot \\log_{${bStr}}${cStr}${dStr}$`;
    if (window.MathJax) { // Prüfen ob MathJax geladen ist
         MathJax.typesetPromise([eqElement]).catch(err => console.error('MathJax typesetting error:', err));
    }
}


// Aktualisiert die Anzeige der Parameterwerte (Slider-Werte)
function updateValueDisplays() {
    document.getElementById('valueExpA').textContent = userParamsExp.a.toFixed(1);
    document.getElementById('valueExpB').textContent = userParamsExp.b.toFixed(1);
    document.getElementById('valueExpD').textContent = userParamsExp.d.toFixed(1);

    // Stelle sicher, dass Log-Elemente existieren (wichtig beim ersten Laden)
    if(document.getElementById('valueLogA')) {
      document.getElementById('valueLogA').textContent = userParamsLog.a.toFixed(1);
      document.getElementById('valueLogB').textContent = userParamsLog.b.toFixed(1);
      document.getElementById('valueLogC').textContent = userParamsLog.c.toFixed(1);
      document.getElementById('valueLogD').textContent = userParamsLog.d.toFixed(1);
    }
}

// --- Event Listener Setup ---
function setupEventListeners() {
    // Exponential Sliders
    document.getElementById('sliderExpA').addEventListener('input', (e) => {
        if (!stateExp.unlocked.a) return;
        userParamsExp.a = parseFloat(e.target.value);
        updateValueDisplays();
        updateGraphExp();
    });
    document.getElementById('sliderExpB').addEventListener('input', (e) => {
        if (!stateExp.unlocked.b) return;
        let b_val = parseFloat(e.target.value);
        if (Math.abs(b_val - 1) < 0.05) {
            b_val = b_val < 1 ? 0.9 : 1.1;
            e.target.value = b_val;
        }
        userParamsExp.b = b_val;
        updateValueDisplays();
        updateGraphExp();
    });
     document.getElementById('sliderExpD').addEventListener('input', (e) => {
        if (!stateExp.unlocked.d) return;
        userParamsExp.d = parseFloat(e.target.value);
        updateValueDisplays();
        updateGraphExp();
    });

     // Logarithmisch Sliders
    document.getElementById('sliderLogA').addEventListener('input', (e) => {
        if (!stateLog.unlocked.a) return;
        userParamsLog.a = parseFloat(e.target.value);
        updateValueDisplays();
        updateGraphLog();
    });
    document.getElementById('sliderLogB').addEventListener('input', (e) => {
        if (!stateLog.unlocked.b) return;
        userParamsLog.b = parseFloat(e.target.value); // Min ist 1.1, also > 0 und != 1 sichergestellt
        updateValueDisplays();
        updateGraphLog();
    });
    document.getElementById('sliderLogC').addEventListener('input', (e) => {
        if (!stateLog.unlocked.c) return;
        userParamsLog.c = parseFloat(e.target.value);
        updateValueDisplays();
        updateGraphLog();
    });
     document.getElementById('sliderLogD').addEventListener('input', (e) => {
        if (!stateLog.unlocked.d) return;
        userParamsLog.d = parseFloat(e.target.value);
        updateValueDisplays();
        updateGraphLog();
    });
}

// --- Fragenlogik ---

// Zeigt Fragen für den aktuellen Parameter an
function displayQuestions(type) {
    const state = (type === 'exp') ? stateExp : stateLog;
    const typePrefix = type.charAt(0).toUpperCase() + type.slice(1); // 'Exp' or 'Log'
    const questionsContainer = document.getElementById(`questions${typePrefix}`);
    const feedbackContainer = document.getElementById(`feedback${typePrefix}`);

    if (!questionsContainer || !feedbackContainer) return; // Element nicht gefunden

    questionsContainer.innerHTML = ''; // Alte Fragen löschen
    feedbackContainer.innerHTML = ''; // Altes Feedback löschen

    const param = state.currentParam;
    if (!param || !questions[type][param]) {
        // Alle Parameter freigeschaltet oder Fehler
        questionsContainer.innerHTML = '<p>Alle Parameter für diesen Teil sind freigeschaltet!</p>';
        if (window.MathJax) {
            MathJax.typesetPromise([questionsContainer]).catch(err => console.error('MathJax typesetting error:', err));
        }

        if (type === 'exp') {
            const logSim = document.getElementById('logSimulation');
            if (logSim) logSim.style.display = 'block';
            initializeParameterState('log');
            updateEquationDisplayLog(); // Initiale Log-Gleichung anzeigen
        } else {
            const conclusion = document.getElementById('conclusion');
             if(conclusion) conclusion.style.display = 'block';
            drawComparisonGraph();
        }
        return;
    }

     // Füge die Fragen hinzu
     const paramQuestions = questions[type][param];
     let questionsHTML = '';
     paramQuestions.forEach((qData, index) => {
         questionsHTML += `<div class="question-block">`;
         questionsHTML += `<p>Frage ${index + 1}: ${qData.q}</p>`; // Frage mit LaTeX

        for (const key in qData.o) {
            questionsHTML += `
                <label>
                    <input type="radio" name="q_${type}_${param}_${index}" value="${key}">
                    ${key}) ${qData.o[key]} </label>`;
        }
        questionsHTML += `</div>`;
     });

    questionsContainer.innerHTML = questionsHTML;

    // Button zum Absenden hinzufügen
     const submitButton = document.createElement('button');
     submitButton.textContent = 'Antworten überprüfen';
     submitButton.classList.add('submit-answer-btn');
     submitButton.onclick = () => checkAnswers(type);
     questionsContainer.appendChild(submitButton);

    // MathJax anweisen, den neuen Inhalt zu rendern
     if (window.MathJax) {
        MathJax.typesetPromise([questionsContainer]).catch(err => console.error('MathJax typesetting error:', err));
     }
}

// Überprüft die gegebenen Antworten
function checkAnswers(type) {
    const state = (type === 'exp') ? stateExp : stateLog;
    const typePrefix = type.charAt(0).toUpperCase() + type.slice(1);
    const param = state.currentParam;
    const paramQuestions = questions[type][param];
    const feedbackContainer = document.getElementById(`feedback${typePrefix}`);
    let correctCount = 0;
    let allAnswered = true;

    if (!param || !paramQuestions || !feedbackContainer) return; // Abbruch, wenn etwas fehlt

    paramQuestions.forEach((qData, index) => {
        const radios = document.querySelectorAll(`input[name="q_${type}_${param}_${index}"]`);
        let selectedValue = null;
        radios.forEach(radio => {
            if (radio.checked) {
                selectedValue = radio.value;
            }
        });

        if (selectedValue === null) {
            allAnswered = false;
            return;
        }

        if (selectedValue === qData.correct) {
            correctCount++;
        }
    });

    const feedbackElement = document.createElement('p');
    feedbackContainer.innerHTML = ''; // Altes Feedback löschen

    if (!allAnswered) {
         feedbackElement.innerHTML = 'Bitte beantworte beide Fragen.';
         feedbackContainer.className = 'feedback-section feedback-incorrect';
         feedbackContainer.appendChild(feedbackElement);
    } else if (correctCount === paramQuestions.length) {
         feedbackElement.innerHTML = `Korrekt! Parameter $${param}$ erfolgreich analysiert. Der nächste Parameter wird vorbereitet.`;
         feedbackContainer.className = 'feedback-section feedback-correct';
         feedbackContainer.appendChild(feedbackElement);
         state.correctAnswers = 2;
         unlockNextParameter(type); // Nur bei Erfolg freischalten
    } else {
        feedbackElement.innerHTML = `Leider nicht ganz richtig (${correctCount} von ${paramQuestions.length}). Versuche es erneut!`;
        feedbackContainer.className = 'feedback-section feedback-incorrect';
        feedbackContainer.appendChild(feedbackElement);
    }

    // MathJax für das Feedback aufrufen (falls LaTeX verwendet wird)
    if (window.MathJax) {
       MathJax.typesetPromise([feedbackContainer]).catch(err => console.error('MathJax typesetting error:', err));
    }
}

// Schaltet den nächsten Parameter frei
function unlockNextParameter(type) {
    const state = (type === 'exp') ? stateExp : stateLog;
    const paramsOrder = (type === 'exp') ? ['a', 'b', 'd'] : ['a', 'b', 'c', 'd'];
    const currentParamIndex = paramsOrder.indexOf(state.currentParam);
    const typePrefix = type.charAt(0).toUpperCase() + type.slice(1);

    if (state.currentParam === null) return; // Bereits fertig

    // Aktuellen Slider nun *sicher* freischalten
    const currentSliderId = `slider${typePrefix}${state.currentParam.toUpperCase()}`;
    const currentSlider = document.getElementById(currentSliderId);
     if(currentSlider) currentSlider.disabled = false;

    if (currentParamIndex < paramsOrder.length - 1) {
        const nextParam = paramsOrder[currentParamIndex + 1];
        state.unlocked[nextParam] = true; // Logisch freischalten
        state.currentParam = nextParam;
        state.correctAnswers = 0;

        // Slider für nächsten Parameter bleibt disabled (wird erst nach korrekter Antwort auf dessen Fragen enabled)
        const nextSliderId = `slider${typePrefix}${nextParam.toUpperCase()}`;
        const nextSlider = document.getElementById(nextSliderId);
        if(nextSlider) nextSlider.disabled = true;

        // Kurze Verzögerung, bevor neue Fragen kommen
        setTimeout(() => {
            displayQuestions(type);
        }, 1500); // 1.5 Sekunden

    } else {
        // Letzter Parameter wurde freigeschaltet
        state.currentParam = null; // Kein Parameter mehr aktiv für Fragen
        setTimeout(() => {
            displayQuestions(type); // Zeigt Abschlussnachricht für diesen Teil
        }, 1500);
    }
}

// Initialisiert den Zustand für einen Typ (exp oder log)
function initializeParameterState(type) {
    const state = (type === 'exp') ? stateExp : stateLog;
    const paramsOrder = (type === 'exp') ? ['a', 'b', 'd'] : ['a', 'b', 'c', 'd'];
    const typePrefix = type.charAt(0).toUpperCase() + type.slice(1);

    paramsOrder.forEach((param, index) => {
        const sliderId = `slider${typePrefix}${param.toUpperCase()}`;
        const sliderElement = document.getElementById(sliderId);
        if (sliderElement) {
             sliderElement.disabled = (index !== 0); // Nur der erste ist enabled
        }
        state.unlocked[param] = (index === 0);
    });

     state.currentParam = paramsOrder[0];
     state.correctAnswers = 0;
     displayQuestions(type); // Zeige Fragen für den ersten Parameter an
}

// Zeichnet den abschließenden Vergleichsgraphen
function drawComparisonGraph() {
     const finalExpParams = { ...userParamsExp };
     const finalLogParams = { ...userParamsLog };
     const graphCompareDiv = document.getElementById('graphCompare');

     if (!graphCompareDiv) return; // Element nicht gefunden

     // Vereinfachte Funktionen für den Vergleich
     const traceExpCompare = {
        ...generatePlotData((n, p) => Math.pow(p.b, n), { b: finalExpParams.b }, 0, 5, 50),
        mode: 'lines', name: `$f(n) = ${finalExpParams.b.toFixed(1)}^n$` , line: { color: 'red' }
     };

     const nMinLogComp = 0.01;
     const traceLogCompare = {
        ...generatePlotData((n, p) => Math.log(n) / Math.log(p.b), { b: finalLogParams.b }, nMinLogComp, 20, 100),
        mode: 'lines', name: `$g(n) = \\log_{${finalLogParams.b.toFixed(1)}}(n)$`, line: { color: 'green' }
     };

     const traceIdentity = {
        x: [0, 20], y: [0, 20], mode: 'lines', name: '$y = n$', line: { color: 'grey', dash: 'dash' }
     };

    const layoutCompare = {
         xaxis: { title: '$n$', range: [0, 15] },
         yaxis: { title: '$y$', range: [0, 15] },
         title: 'Vergleich: Exponential ($f$), Logarithmus ($g$) & $y=n$',
         showlegend: true,
         legend: { x: 0.05, y: 0.95 }
    };

    Plotly.newPlot(graphCompareDiv, [traceExpCompare, traceLogCompare, traceIdentity], layoutCompare);
}


// --- Initialisierung beim Laden der Seite ---
document.addEventListener('DOMContentLoaded', () => {
    initializeGraphs();
    updateValueDisplays();
    updateEquationDisplayExp(); // Initiale Exp-Gleichung rendern
    // Log-Gleichung wird erst initialisiert, wenn der Teil sichtbar wird
    setupEventListeners();
    initializeParameterState('exp'); // Starte mit Exponentialfunktion
});