const lobby = document.getElementById('lobby');
const startBtn = document.getElementById('start-btn');
const playArea = document.getElementById('playing-area');
const hsNumberElem = document.getElementById('highscore-number');
const hsNameElem = document.getElementById('highscore-name');
const hammerHitImg = document.getElementById('hammer_hit_effect');
const resetBtn = document.getElementById('reset-highscore-btn');
const scoreDisplay = document.getElementById('score-display');
const countdownDisplay = document.getElementById('countdown-display');
const holes = document.querySelectorAll('.hole');
const lastScoreElem = document.getElementById('lastscore-number');

let score = 0;
let highScore = localStorage.getItem('wam_highscore') || 0;
let highScoreName = localStorage.getItem('wam_highscore_name') || '---';

let oldInfo = document.getElementById('highscore-info');
if (oldInfo) oldInfo.remove();

// mise a jour high score
function updateLobbyHighScore() {
    hsNumberElem.innerText = highScore;

    //font size dynamique
    let baseFontSize = 4;
    let minFontSize = 1;
    let maxChars = 10;
    let nameLength = highScoreName.length || 1;
    let fontSize = Math.max(minFontSize, baseFontSize * (maxChars / nameLength));
    fontSize = Math.min(fontSize, baseFontSize); // Don't go above base size

    hsNameElem.style.fontSize = fontSize + 'rem';
    hsNameElem.innerText = highScoreName;
}
updateLobbyHighScore();

//reset
resetBtn.onclick = () => {
    if (confirm('Are you sure you want to reset the high score?')) {
        highScore = 0;
        highScoreName = '---';
        localStorage.setItem('wam_highscore', highScore);
        localStorage.setItem('wam_highscore_name', highScoreName);
        updateLobbyHighScore();
    }
};

startBtn.onclick = () => {
    lobby.style.display = 'none';
    playArea.style.display = 'block';
    score = 0;
    scoreDisplay.innerText = `Score: ${score}`;
    scoreDisplay.style.display = 'block';

    let timeLeft = 45;
    countdownDisplay.innerText = `Time: ${timeLeft}s`;
    countdownDisplay.style.display = 'block';

    let holeCount = 3;
    const minDistanceX = 190;
    const minDistanceY = 120;
    const delayTime = 2000;
    let intervalId;
    let timerId;

    function randomPosition(existing) {
        const areaWidth = playArea.offsetWidth;
        const areaHeight = playArea.offsetHeight;
        let x, y, valid;
        let attempts = 0;
        do {
            x = Math.random() * (areaWidth - minDistanceX);
            y = Math.random() * (areaHeight - minDistanceY);
            valid = true;
            for (const pos of existing) {
                const dx = Math.abs(pos.x - x);
                const dy = Math.abs(pos.y - y);
                if (dx < minDistanceX && dy < minDistanceY) {
                    valid = false;
                    break;
                }
            }
            attempts++;
            if (attempts > 400) {
                valid = true;
                break;
            }
        } while (!valid);
        return {x, y};
    }

    function resetInterval() {
        clearInterval(intervalId);
        intervalId = setInterval(generateHoles, delayTime);
    }

    // Mole type logic
const MOLE_TYPES = ['generic', 'prank', 'bomb', 'miner'];
const MOLE_IMAGES = {
    generic: 'genericMole.png',
    prank: 'prankMole.png',
    bomb: 'bombMole.png',
    miner: 'minerMole.png',
};
let moleHistory = [];

function getNextMoleType(holeIndex, round) {
    // Example tactics:
    // - Mostly generic moles
    // - Sometimes repeat generic in same hole, then prank
    // - Sometimes bomb after a streak
    // - Sometimes miner after a bomb
    // - Never two bombs in a row
    // - Prank after two generics in same hole
    // - More special moles as score increases
    const last = moleHistory[moleHistory.length - 1] || [];
    const prevType = last[holeIndex] || 'generic';
    const prev2 = moleHistory.length > 1 ? moleHistory[moleHistory.length - 2][holeIndex] : null;
    // Increase special mole chance as score increases
    let prankChance = Math.min(0.1 + score / 3000, 0.25);
    let bombChance = Math.min(0.05 + score / 5000, 0.15);
    let minerChance = Math.min(0.05 + score / 4000, 0.15);
    // Tactics
    if (prevType === 'generic' && prev2 === 'generic' && Math.random() < 0.7) return 'prank';
    if (prevType === 'prank' && Math.random() < 0.3) return 'bomb';
    if (prevType === 'bomb' && Math.random() < 0.5) return 'miner';
    if (prevType === 'bomb') return 'generic'; // never two bombs in a row
    // Random chance for special moles
    let r = Math.random();
    if (r < bombChance) return 'bomb';
    if (r < bombChance + prankChance) return 'prank';
    if (r < bombChance + prankChance + minerChance) return 'miner';
    return 'generic';
}

    function generateHoles() {
        holeCount = Math.min(3 + Math.floor(score/501), 5);
        playArea.innerHTML = '';
        const positions = [];
        const holeTemplate = document.getElementById('hole-template');
        // Store holes with their y for sorting
        const holesWithY = [];
        let thisRoundTypes = [];
        for (let i = 0; i < holeCount; i++) {
            const pos = randomPosition(positions);
            positions.push(pos);
            // Decide mole type for this hole
            const moleType = getNextMoleType(i, moleHistory.length);
            thisRoundTypes[i] = moleType;
            // Clone the template for the hole
            const hole = holeTemplate.content.firstElementChild.cloneNode(true);
            hole.style.left = `${pos.x}px`;
            hole.style.top = `${pos.y}px`;
            hole.dataset.y = pos.y;
            // Animate the mole pop
            const mole = hole.querySelector('.mole');
            if (mole) {
                mole.style.backgroundImage = `url('${MOLE_IMAGES[moleType]}')`;
                if (moleType === 'prank') {
                    mole.classList.add('prank-mole');
                } else {
                    mole.classList.remove('prank-mole');
                }
                setTimeout(() => {
                    mole.classList.add('pop');
                }, 50); // slight delay for transition
            }
            hole.onclick = (e) => {
                // Special mole logic
                if (moleType === 'miner') return; // miner can't be hit
                let delta = 0;
                if (moleType === 'generic') delta = 100;
                if (moleType === 'prank') delta = -50;
                if (moleType === 'bomb') delta = -100;
                score += delta;
                scoreDisplay.innerText = `Score: ${score}`;
                if (score < 0) {
                    scoreDisplay.style.color = '#ff2222';
                } else {
                    scoreDisplay.style.color = '#fff';
                }
                // Change mole image based on type
                const mole = hole.querySelector('.mole');
                // Remove all explosion classes first
                if (mole) {
                    mole.classList.remove('bomb-explosion', 'prank-explosion');
                }
                if (moleType === 'generic' && mole) {
                    mole.style.backgroundImage = "url('xeyedMole.png')";
                } else if (moleType === 'bomb' && mole) {
                    mole.style.backgroundImage = "url('bombExplosion.gif')";
                    mole.classList.add('bomb-explosion');
                } else if (moleType === 'prank' && mole) {
                    mole.style.backgroundImage = "url('prankExplosion.gif')";
                    mole.classList.add('prank-explosion');
                }
                // hammer hit effect with animation (not for miner)
                if (moleType !== 'miner') {
                    const rect = playArea.getBoundingClientRect();
                    hammerHitImg.style.left = (rect.left + pos.x + 60) + 'px';
                    hammerHitImg.style.top = (rect.top + pos.y - 200) + 'px';
                    hammerHitImg.style.display = 'block';
                    hammerHitImg.style.transition = 'transform 0.25s cubic-bezier(.4,2,.6,1)';
                    hammerHitImg.style.transform = 'rotate(0deg)';
                    void hammerHitImg.offsetWidth;
                    hammerHitImg.style.transform = 'rotate(-60deg)';
                }
                setTimeout(() => {
                    if (mole) {
                        mole.style.backgroundImage = `url('${MOLE_IMAGES[moleType]}')`;
                    }
                    if (moleType !== 'miner') {
                        hammerHitImg.style.display = 'none';
                        hammerHitImg.style.transform = 'rotate(0deg)';
                        generateHoles();
                        resetInterval();
                    }
                }, 350);
            };
            holesWithY.push({hole, y: pos.y});
        }
        moleHistory.push(thisRoundTypes);
        if (moleHistory.length > 10) moleHistory.shift(); // keep history short
        // Sort holes by y ascending, then append with increasing z-index
        holesWithY.sort((a, b) => a.y - b.y);
        holesWithY.forEach((obj, idx) => {
            obj.hole.style.zIndex = 10 + idx; // ensure zIndex increases with y
            playArea.appendChild(obj.hole);
        });
    }

    function endGame() {
        clearInterval(intervalId);
        clearInterval(timerId);
        countdownDisplay.style.display = 'none';
        playArea.innerHTML = '';
        scoreDisplay.style.display = 'none';
        playArea.style.display = 'none';
        lobby.style.display = 'flex';
        if (lastScoreElem) lastScoreElem.innerText = score;
        if (score > highScore) {
            let name = prompt("Congratulations! New High Score!\nEnter your name:");
            if (name && name.trim() !== "") {
                highScore = score;
                highScoreName = name.trim();
                localStorage.setItem('wam_highscore', highScore);
                localStorage.setItem('wam_highscore_name', highScoreName);
            }
        }
        updateLobbyHighScore();
    }

    intervalId = setInterval(generateHoles, delayTime);
    generateHoles();

    timerId = setInterval(() => {
        timeLeft--;
        countdownDisplay.innerText = `Time: ${timeLeft}s`;
        if (timeLeft <= 5) {
            countdownDisplay.style.color = '#ff2222';
        } else {
            countdownDisplay.style.color = '#fff';
            countdownDisplay.style.textShadow = '1px 1px 4px #222';
        }
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
};


window.onload = () => {
    updateLobbyHighScore();
    scoreDisplay.style.display = 'none';
    countdownDisplay.style.display = 'none';
    if (lastScoreElem) lastScoreElem.innerText = 0;
};