// Minesweeper — Game Logic
(function () {
    const gridEl = document.getElementById('grid');
    const mineCountEl = document.getElementById('mine-count');
    const timerEl = document.getElementById('timer');
    const newGameBtn = document.getElementById('new-game-btn');
    const diffBtns = document.querySelectorAll('#difficulty-selector .gb-btn');

    let rows = 9, cols = 9, totalMines = 10;
    let board, revealed, flagged, gameOver, firstClick, timerInterval, seconds;

    diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            diffBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            rows = parseInt(btn.dataset.rows, 10);
            cols = parseInt(btn.dataset.cols, 10);
            totalMines = parseInt(btn.dataset.mines, 10);
            init();
        });
    });

    function playTone(freq, dur) {
        try {
            const ac = new (window.AudioContext || window.webkitAudioContext)();
            const o = ac.createOscillator();
            const g = ac.createGain();
            o.connect(g); g.connect(ac.destination);
            o.frequency.value = freq; g.gain.value = 0.08;
            o.start(); o.stop(ac.currentTime + dur);
        } catch (e) {}
    }

    function init() {
        clearInterval(timerInterval);
        seconds = 0;
        timerEl.textContent = '0';
        gameOver = false;
        firstClick = true;
        board = Array.from({ length: rows }, () => Array(cols).fill(0));
        revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
        flagged = Array.from({ length: rows }, () => Array(cols).fill(false));
        mineCountEl.textContent = totalMines;
        render();
    }

    function placeMines(safeR, safeC) {
        let placed = 0;
        while (placed < totalMines) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            if (board[r][c] === -1) continue;
            if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
            board[r][c] = -1;
            placed++;
        }
        // Calculate numbers
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c] === -1) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === -1) count++;
                    }
                }
                board[r][c] = count;
            }
        }
    }

    function reveal(r, c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols) return;
        if (revealed[r][c] || flagged[r][c]) return;
        revealed[r][c] = true;
        if (board[r][c] === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    reveal(r + dr, c + dc);
                }
            }
        }
    }

    function checkWin() {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c] !== -1 && !revealed[r][c]) return false;
            }
        }
        return true;
    }

    function handleClick(r, c) {
        if (gameOver || revealed[r][c] || flagged[r][c]) return;

        if (firstClick) {
            firstClick = false;
            placeMines(r, c);
            timerInterval = setInterval(() => { seconds++; timerEl.textContent = seconds; }, 1000);
        }

        if (board[r][c] === -1) {
            // Hit a mine
            gameOver = true;
            clearInterval(timerInterval);
            playTone(200, 0.3);
            // Reveal all mines
            for (let rr = 0; rr < rows; rr++) {
                for (let cc = 0; cc < cols; cc++) {
                    if (board[rr][cc] === -1) revealed[rr][cc] = true;
                }
            }
            render();
            return;
        }

        reveal(r, c);
        playTone(500, 0.05);

        if (checkWin()) {
            gameOver = true;
            clearInterval(timerInterval);
            playTone(800, 0.2);
            mineCountEl.textContent = '0 — You win!';
        }

        render();
    }

    function handleRightClick(e, r, c) {
        e.preventDefault();
        if (gameOver || revealed[r][c]) return;
        flagged[r][c] = !flagged[r][c];
        const flagCount = flagged.flat().filter(Boolean).length;
        mineCountEl.textContent = totalMines - flagCount;
        render();
    }

    function render() {
        gridEl.innerHTML = '';
        gridEl.style.gridTemplateColumns = 'repeat(' + cols + ', auto)';
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('button');
                cell.className = 'ms-cell';

                if (revealed[r][c]) {
                    cell.classList.add('revealed');
                    if (board[r][c] === -1) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (board[r][c] > 0) {
                        cell.textContent = board[r][c];
                        cell.classList.add('n' + board[r][c]);
                    }
                } else if (flagged[r][c]) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                }

                cell.addEventListener('click', () => handleClick(r, c));
                cell.addEventListener('contextmenu', (e) => handleRightClick(e, r, c));
                gridEl.appendChild(cell);
            }
        }
    }

    newGameBtn.addEventListener('click', init);
    init();
})();
