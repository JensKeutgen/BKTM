document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elemente ---
    const setupArea = document.getElementById('setupArea');
    const gameArea = document.getElementById('gameArea');
    const gameOverArea = document.getElementById('gameOverArea');
    const pairCountInput = document.getElementById('pairCount');
    const startGameBtn = document.getElementById('startGameBtn');
    const scoreboard = document.getElementById('scoreboard');
    const player1ScoreDisplay = document.getElementById('player1Score');
    const player2ScoreDisplay = document.getElementById('player2Score');
    const activePlayerDisplay = document.getElementById('activePlayerDisplay');
    const gameBoard = document.getElementById('gameBoard');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const newGameBtn = document.getElementById('newGameBtn');
    const enlargedViewArea = document.getElementById('enlargedViewArea');
    const enlargedSlot1Div = document.getElementById('enlargedSlot1');
    const enlargedSlot2Div = document.getElementById('enlargedSlot2');
    const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
    const openPlayCheckbox = document.getElementById('openPlayCheckbox');
    const matchedPairsArea = document.getElementById('matchedPairsArea');
    const matchedPairsListDiv = document.getElementById('matchedPairsList');

    // --- Spielzustand Variablen ---
    let player1Score = 0; let player2Score = 0; let activePlayer = 1;
    let flippedCards = []; let matchedPairs = 0; let totalPairs = 0;
    let gameActive = false; let currentDifficulty = 'easy';
    let isOpenPlay = false;

    // --- Plotly Layouts ---
    const cardLayout = { margin: { l: 5, r: 5, t: 5, b: 5 }, xaxis: { showgrid: false, zeroline: true, showline: true, showticklabels: false, title: '' }, yaxis: { showgrid: false, zeroline: true, showline: true, showticklabels: false, title: '' }, showlegend: false, width: 126, height: 126, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' };
    const enlargedGraphLayout = { margin: { l: 40, r: 20, t: 30, b: 40 }, xaxis: { title: 'x', showgrid: true, zeroline: true, showline: true, showticklabels: true }, yaxis: { title: 'f(x) / g(x)', showgrid: true, zeroline: true, showline: true, showticklabels: true }, showlegend: false, autosize: true };
    const matchedPairLayout = { margin: { l: 25, r: 15, t: 20, b: 25 }, xaxis: { showgrid: true, zeroline: true, showline: true, showticklabels: true, tickfont: {size: 8} }, yaxis: { showgrid: true, zeroline: true, showline: true, showticklabels: true, tickfont: {size: 8} }, showlegend: false, autosize: true };

    // --- Event Listener ---
    startGameBtn.addEventListener('click', startGame);
    newGameBtn.addEventListener('click', () => {
        setupArea.style.display = 'block'; gameArea.style.display = 'none';
        gameOverArea.style.display = 'none'; clearAndHideEnlargedSlots();
        clearMatchedPairsArea(); matchedPairsArea.style.display = 'none';
    });

    // --- Spiel-Logik ---

    function startGame() {
        totalPairs = parseInt(pairCountInput.value);
        if (isNaN(totalPairs) || totalPairs < 5 || totalPairs > 20) { alert("Bitte eine Paaranzahl zwischen 5 und 20 eingeben."); return; }
        currentDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
        isOpenPlay = openPlayCheckbox.checked;

        player1Score = 0; player2Score = 0; activePlayer = 1;
        matchedPairs = 0; flippedCards = []; gameActive = true;

        setupArea.style.display = 'none'; gameOverArea.style.display = 'none';
        gameArea.style.display = 'block'; clearAndHideEnlargedSlots();
        clearMatchedPairsArea(); matchedPairsArea.style.display = 'none';
        updateScoreboard();

        if (isOpenPlay) { gameBoard.classList.add('open-play'); }
        else { gameBoard.classList.remove('open-play'); }

        const initialCardData = generateInitialCardData(totalPairs, currentDifficulty);
        if (!initialCardData || initialCardData.length === 0) { console.error("Failed to generate card data!"); return; }
        const shuffledData = shuffleArray([...initialCardData]);
        createBoard(shuffledData);

        if (isOpenPlay) {
            revealAllCards();
        }
    }

    function generateInitialCardData(numPairs, difficulty) {
        const data = [];
        const expParamKeys = ['a', 'b', 'd'];
        const logParamKeys = ['a', 'b', 'c', 'd'];
        const baseExpParams = { a: 1.0, b: 2.0, d: 0.0 };
        const baseLogParams = { a: 1.0, b: 2.0, c: 0.0, d: 0.0 };
        let numToVary;
        switch (difficulty) { case 'medium': numToVary = 2; break; case 'hard': numToVary = 3; break; case 'easy': default: numToVary = 1; break; }

        for (let i = 0; i < numPairs; i++) {
            const pairId = `pair-${i}`; const isExponential = Math.random() < 0.5;
            let currentBaseParams, availableKeys; let finalParams = {};
            let equationContent, graphContentData;

            if (isExponential) {
                currentBaseParams = { ...baseExpParams }; availableKeys = [...expParamKeys]; finalParams = { ...currentBaseParams };
                shuffleArray(availableKeys);
                for (let j = 0; j < Math.min(numToVary, availableKeys.length); j++) { const keyToVary = availableKeys[j]; finalParams[keyToVary] = generateRandomValueForKey(keyToVary, 'exp', currentBaseParams[keyToVary]); }
                if (Math.abs(finalParams.b - 1) < 0.01) finalParams.b = finalParams.b < 1 ? 0.9 : 1.1;
                equationContent = formatEquation(finalParams, 'exp');
                graphContentData = generatePlotDataObj((x) => finalParams.a * Math.pow(finalParams.b, x) + finalParams.d, -5, 5);
            } else {
                currentBaseParams = { ...baseLogParams }; availableKeys = [...logParamKeys]; finalParams = { ...currentBaseParams };
                shuffleArray(availableKeys);
                for (let j = 0; j < Math.min(numToVary, availableKeys.length); j++) { const keyToVary = availableKeys[j]; finalParams[keyToVary] = generateRandomValueForKey(keyToVary, 'log', currentBaseParams[keyToVary]); }
                if (finalParams.b <= 1) finalParams.b = parseFloat((1.5 + Math.random()).toFixed(1));

                // ***** KORREKTUR HIER: Variablen definieren *****
                const logNMin = finalParams.c + 0.05;
                const logNMax = finalParams.c + 8;
                // ***** ENDE KORREKTUR *****

                equationContent = formatEquation(finalParams, 'log');
                // Verwende die oben definierten Variablen
                graphContentData = generatePlotDataObj((x) => {
                    const arg = x - finalParams.c;
                    if (arg <= 0) return null;
                    return finalParams.a * (Math.log(arg) / Math.log(finalParams.b)) + finalParams.d;
                }, logNMin, logNMax); // Variablen hier übergeben
            }
            if (Math.random() < 0.5) { data.push({ type: 'equation', content: equationContent, pairId: pairId, id: `card-${2 * i}` }); data.push({ type: 'graph', content: graphContentData, pairId: pairId, id: `card-${2 * i + 1}` }); }
            else { data.push({ type: 'graph', content: graphContentData, pairId: pairId, id: `card-${2 * i}` }); data.push({ type: 'equation', content: equationContent, pairId: pairId, id: `card-${2 * i + 1}` }); }
        } return data;
    }

    function generateRandomValueForKey(key, type, baseValue) {
        let attempts = 0; let newValue; const MAX_ATTEMPTS = 5; const MIN_DIFFERENCE = 0.15;
        do { newValue = baseValue; try { switch (key) { case 'a': let candidateA = parseFloat((Math.random() * 2 + 0.5).toFixed(1)); if (Math.random() < 0.5) candidateA *= -1; newValue = candidateA; break; case 'b': if (type === 'exp') { let candidateBExp = parseFloat((Math.random() < 0.5 ? Math.random() * 0.4 + 0.5 : Math.random() * 1.0 + 1.1).toFixed(1)); if (Math.abs(candidateBExp - 1) < 0.01) candidateBExp = candidateBExp < 1 ? 0.9 : 1.1; newValue = candidateBExp; } else { let candidateBLog = parseFloat((Math.random() * 3 + 1.5).toFixed(1)); newValue = candidateBLog; } break; case 'c': newValue = parseFloat((Math.random() * 4 - 2).toFixed(1)); break; case 'd': newValue = parseFloat((Math.random() * 4 - 2).toFixed(1)); break; } if(isNaN(newValue)) throw new Error("Generated NaN"); } catch(e) { console.error("Error generating random value candidate for key", key, e); newValue = baseValue; break; } attempts++; } while (Math.abs(newValue - baseValue) < MIN_DIFFERENCE && attempts < MAX_ATTEMPTS);
        if (attempts === MAX_ATTEMPTS && Math.abs(newValue - baseValue) < MIN_DIFFERENCE) { console.warn(`Could not generate significantly different value for key ${key} (Base: ${baseValue}). Forcing simple change.`); switch(key) { case 'a': newValue = baseValue * -1.5; break; case 'b': newValue = (type === 'exp') ? (baseValue < 1 ? 1.7 : 0.7) : baseValue + 1.2; break; case 'c': newValue = baseValue + (baseValue > 0 ? -1.0 : 1.0); break; case 'd': newValue = baseValue + (baseValue > 0 ? -1.0 : 1.0); break; } newValue = parseFloat(newValue.toFixed(1)); if (key === 'b' && type === 'exp' && Math.abs(newValue - 1) < 0.01) newValue = newValue < 1 ? 0.9 : 1.1; if (key === 'b' && type === 'log' && newValue <= 1) newValue = 1.5; }
        return isNaN(newValue) ? baseValue : newValue;
    }

    function formatEquation(params, type) { if (type === 'exp') { const aStr = params.a.toFixed(1); const bStr = params.b.toFixed(1); const dStr = params.d === 0 ? '' : (params.d > 0 ? ` + ${params.d.toFixed(1)}` : ` - ${Math.abs(params.d).toFixed(1)}`); return `$f(x) = ${aStr} \\cdot ${bStr}^x${dStr}$`; } else { const aStr = params.a.toFixed(1); const bStr = params.b.toFixed(1); const cStr = params.c === 0 ? 'x' : (params.c > 0 ? `(x - ${params.c.toFixed(1)})` : `(x + ${Math.abs(params.c).toFixed(1)})`); const dStr = params.d === 0 ? '' : (params.d > 0 ? ` + ${params.d.toFixed(1)}` : ` - ${Math.abs(params.d).toFixed(1)}`); return `$g(x) = ${aStr} \\cdot \\log_{${bStr}}${cStr}${dStr}$`; } }
    function generatePlotDataObj(func, xMin, xMax) { const xVals = []; const yVals = []; const numPoints = 30; const step = (xMax - xMin) / (numPoints - 1); for (let i = 0; i < numPoints; i++) { const x = xMin + i * step; const y = func(x); if (y !== null && !isNaN(y) && isFinite(y)) { xVals.push(x); yVals.push(y); } else { xVals.push(x); yVals.push(null); } } return { trace: { x: xVals, y: yVals, type: 'scatter', mode: 'lines', line: { width: 2, color: '#0056b3' } }, layout: cardLayout }; }
    function shuffleArray(array) { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } return array; }
    function createBoard(shuffledInitialData) { gameBoard.innerHTML = ''; const columns = Math.ceil(Math.sqrt(shuffledInitialData.length * 1.5)); gameBoard.style.gridTemplateColumns = `repeat(${columns}, auto)`; if (!shuffledInitialData || shuffledInitialData.length === 0) { console.error("Cannot create board: No data provided."); return; } shuffledInitialData.forEach(data => { const card = document.createElement('div'); card.classList.add('card'); card.dataset.id = data.id; card.dataset.pairId = data.pairId; card.dataset.type = data.type; card.dataset.content = JSON.stringify(data.content); const cardInner = document.createElement('div'); cardInner.classList.add('card-inner'); const cardFront = document.createElement('div'); cardFront.classList.add('card-front'); const cardBack = document.createElement('div'); cardBack.classList.add('card-back'); cardBack.classList.add(data.type); cardBack.innerHTML = ''; cardInner.appendChild(cardFront); cardInner.appendChild(cardBack); card.appendChild(cardInner); card.addEventListener('click', handleCardClick); try { gameBoard.appendChild(card); } catch (error) { console.error("Error appending card to gameBoard:", error, "Card data:", data); } }); }

    async function revealAllCards() {
        console.log("Revealing all cards for open play...");
        const cards = gameBoard.querySelectorAll('.card');
        gameActive = false;
        const mathJaxPromises = []; // Sammele MathJax Renderings

        for (const card of cards) {
            const cardBack = card.querySelector('.card-back');
            if (cardBack.innerHTML === '') {
                const type = card.dataset.type;
                const contentData = JSON.parse(card.dataset.content);
                if (type === 'equation') {
                    cardBack.innerHTML = contentData;
                    if (window.MathJax) mathJaxPromises.push(MathJax.typesetPromise([cardBack])); // Füge Promise hinzu
                } else if (type === 'graph') {
                    const graphDiv = document.createElement('div');
                    graphDiv.style.width = '100%'; graphDiv.style.height = '100%';
                    cardBack.appendChild(graphDiv);
                    try {
                         // Hier await, damit Plots sequenziell (oder zumindest nicht alle gleichzeitig) starten
                         await Plotly.newPlot(graphDiv, [contentData.trace], contentData.layout, {displayModeBar: false, staticPlot: true});
                         // Optional: Kurze Pause
                         // await new Promise(resolve => setTimeout(resolve, 5));
                    } catch(err) { console.error("Plotly error during reveal:", err); }
                }
            }
        }
         // Warte auf alle MathJax Renderings gesammelt
         try {
             await Promise.all(mathJaxPromises);
         } catch(err) { console.error("MathJax error during final reveal typesetting:", err); }

        console.log("Card reveal finished.");
        gameActive = true;
    }

    function handleCardClick(event) {
        const clickedCard = event.currentTarget;
        if (!gameActive || clickedCard.classList.contains('matched') || flippedCards.length === 2) return;
        if (isOpenPlay && flippedCards.length === 1 && flippedCards[0] === clickedCard) return; // Verhindert Doppelklick im offenen Modus

        if (isOpenPlay) {
            if (clickedCard.classList.contains('selected')) return;
            clickedCard.classList.add('selected');
            flippedCards.push(clickedCard);
            if (flippedCards.length === 1) { clearAndHideEnlargedSlots(false); displayInSlot('enlargedSlot1', clickedCard); enlargedViewArea.style.display = 'block'; }
            else if (flippedCards.length === 2) { gameActive = false; displayInSlot('enlargedSlot2', clickedCard); setTimeout(checkForMatch, 800); }
        } else {
            if (clickedCard.classList.contains('flipped')) return;
            flipCard(clickedCard);
            flippedCards.push(clickedCard);
            if (flippedCards.length === 1) { clearAndHideEnlargedSlots(false); displayInSlot('enlargedSlot1', clickedCard); enlargedViewArea.style.display = 'block'; }
            else if (flippedCards.length === 2) { gameActive = false; displayInSlot('enlargedSlot2', clickedCard); setTimeout(checkForMatch, 1200); }
        }
    }

    function flipCard(cardElement) {
        if (isOpenPlay) return;
        cardElement.classList.add('flipped'); const cardBack = cardElement.querySelector('.card-back');
        if (cardBack.innerHTML === '') {
            const type = cardElement.dataset.type; const contentData = JSON.parse(cardElement.dataset.content);
            if (type === 'equation') { cardBack.innerHTML = contentData; if (window.MathJax) MathJax.typesetPromise([cardBack]).catch(err => console.error("MathJax error", err)); }
            else if (type === 'graph') { const graphDiv = document.createElement('div'); graphDiv.style.width = '100%'; graphDiv.style.height = '100%'; cardBack.appendChild(graphDiv); setTimeout(() => { Plotly.newPlot(graphDiv, [contentData.trace], contentData.layout, {displayModeBar: false, staticPlot: true}).catch(err => console.error("Plotly error", err)); }, 50); }
        }
    }

    function displayInSlot(slotId, cardElement) {
        const slotDiv = document.getElementById(slotId); if (!slotDiv) return;
        const type = cardElement.dataset.type; const contentData = JSON.parse(cardElement.dataset.content);
        slotDiv.className = 'enlarged-slot'; slotDiv.innerHTML = '';
        if (type === 'equation') { slotDiv.classList.add('contains-equation'); slotDiv.innerHTML = contentData; if (window.MathJax) MathJax.typesetPromise([slotDiv]).catch(err => console.error("MathJax error", err)); }
        else if (type === 'graph') { slotDiv.classList.add('contains-graph'); Plotly.newPlot(slotDiv, [contentData.trace], enlargedGraphLayout, {displayModeBar: true}).catch(err => console.error("Plotly error", err)); }
    }

    function clearAndHideEnlargedSlots(hideArea = true) {
        const slots = [enlargedSlot1Div, enlargedSlot2Div]; slots.forEach(slot => { if (slot) { if (slot.classList.contains('contains-graph')) { try { Plotly.purge(slot); } catch(e) {} } slot.innerHTML = ''; slot.className = 'enlarged-slot'; } }); if (hideArea && enlargedViewArea) enlargedViewArea.style.display = 'none';
    }

    function checkForMatch() {
        const [card1, card2] = flippedCards; const pairId1 = card1.dataset.pairId; const pairId2 = card2.dataset.pairId;
        if (pairId1 === pairId2) { card1.classList.add('matched'); card2.classList.add('matched'); card1.classList.remove('selected'); card2.classList.remove('selected'); card1.removeEventListener('click', handleCardClick); card2.removeEventListener('click', handleCardClick); if (activePlayer === 1) player1Score++; else player2Score++; matchedPairs++; updateScoreboard(); displayMatchedPair(card1, card2); flippedCards = []; if (matchedPairs === totalPairs) { clearAndHideEnlargedSlots(); endGame(); } else { gameActive = true; } }
        else { setTimeout(() => { if (isOpenPlay) { card1.classList.remove('selected'); card2.classList.remove('selected'); } else { card1.classList.remove('flipped'); card2.classList.remove('flipped'); } flippedCards = []; switchPlayer(); clearAndHideEnlargedSlots(); gameActive = true; }, isOpenPlay ? 800 : 1500); }
    }

    function displayMatchedPair(cardA, cardB) {
        if (!matchedPairsArea || !matchedPairsListDiv) return;
        let graphCard = (cardA.dataset.type === 'graph') ? cardA : cardB; let equationCard = (cardA.dataset.type === 'equation') ? cardA : cardB;
        const graphContent = JSON.parse(graphCard.dataset.content); const equationContent = JSON.parse(equationCard.dataset.content);
        const pairItem = document.createElement('div'); pairItem.classList.add('matched-pair-item');
        const graphDiv = document.createElement('div'); graphDiv.classList.add('matched-pair-graph');
        const equationDiv = document.createElement('div'); equationDiv.classList.add('matched-pair-equation'); equationDiv.innerHTML = equationContent;
        pairItem.appendChild(graphDiv); pairItem.appendChild(equationDiv); matchedPairsListDiv.appendChild(pairItem);
        Plotly.newPlot(graphDiv, [graphContent.trace], matchedPairLayout, {displayModeBar: false, staticPlot: true}).catch(err => console.error("Plotly error in matched pair", err));
        if (window.MathJax) { MathJax.typesetPromise([equationDiv]).catch(err => console.error("MathJax error in matched pair", err)); }
        matchedPairsArea.style.display = 'block';
    }

    function clearMatchedPairsArea() {
        if (!matchedPairsListDiv) return; const items = matchedPairsListDiv.querySelectorAll('.matched-pair-item'); items.forEach(item => { const graphDiv = item.querySelector('.matched-pair-graph'); if (graphDiv) { try { Plotly.purge(graphDiv); } catch(e) {} } }); matchedPairsListDiv.innerHTML = '';
    }

    function switchPlayer() { activePlayer = activePlayer === 1 ? 2 : 1; updateScoreboard(); }
    function updateScoreboard() { player1ScoreDisplay.textContent = `Spieler 1: ${player1Score}`; player2ScoreDisplay.textContent = `Spieler 2: ${player2Score}`; activePlayerDisplay.textContent = `Aktiver Spieler: ${activePlayer}`; if (activePlayer === 1) { player1ScoreDisplay.classList.add('active'); player2ScoreDisplay.classList.remove('active'); } else { player1ScoreDisplay.classList.remove('active'); player2ScoreDisplay.classList.add('active'); } }
    function endGame() { gameActive = false; let winnerMessage = ""; if (player1Score > player2Score) winnerMessage = `Spieler 1 gewinnt mit ${player1Score} zu ${player2Score} Paaren!`; else if (player2Score > player1Score) winnerMessage = `Spieler 2 gewinnt mit ${player2Score} zu ${player1Score} Paaren!`; else winnerMessage = `Unentschieden! Beide Spieler haben ${player1Score} Paare gefunden.`; gameOverMessage.textContent = winnerMessage; gameArea.style.display = 'none'; gameOverArea.style.display = 'block'; }

}); // Ende DOMContentLoaded