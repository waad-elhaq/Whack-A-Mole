const lobby = document.getElementById('lobby');
const startBtn = document.getElementById('start-btn');
const playArea = document.getElementById('playing-area');
const hsNumberElem = document.getElementById('highscore-number');
const hsNameElem = document.getElementById('highscore-name');
const highscoresBtn = document.getElementById('highscores-btn');
const highscoresPanel = document.getElementById('highscores-panel');
const highscoresList = document.getElementById('highscores-list');
const closeHighscoresBtn = document.getElementById('close-highscores');
const hammerHitImg = document.getElementById('hammer_hit_effect');
const resetBtn = document.getElementById('reset-highscore-btn');
const scoreDisplay = document.getElementById('score-display');
const countdownDisplay = document.getElementById('countdown-display');
const holes = document.querySelectorAll('.hole');
const lastScoreElem = document.getElementById('lastscore-number');
const lobbySoundBtn = document.getElementById('lobbySound');

//sound effects
const bgMusic = new Audio('lobby.wav');
let lobbySound = 0;
lobbySoundBtn.addEventListener("mousedown", () => {
    if (lobbySound == 0){
        lobbySoundBtn.classList.add("active");
        bgMusic.play();
        lobbySound = 1;
    }
    else{
        lobbySoundBtn.classList.remove("active");
        bgMusic.pause();
        lobbySound = 0;
    }
});

const hitGeneric = new Audio('hitGeneric.mp3');
const yapping_mario = new Audio('yapping-mario.mp3');
const bomb_explosion = new Audio('bomb-explosion.mp3');
const niahaha = new Audio('niahaha.mp3');
const countdownSound = new Audio('countdown.wav')
const minerSound = new Audio('miner.wav')

let score = 0;
let highScore = localStorage.getItem('wam_highscore') || 0;
let highScores = JSON.parse(localStorage.getItem('wam_highscores')) || [];
let highScoreName = localStorage.getItem('wam_highscore_name') || '---';
let lastScore = localStorage.getItem('wam_lastscore') || 0;

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
    fontSize = Math.min(fontSize, baseFontSize); // bech l esm fel high score yekbr w yosghr hasb len(ch)

    hsNameElem.style.fontSize = fontSize + 'rem';
    hsNameElem.innerText = highScoreName;
}
updateLobbyHighScore();

//reset
resetBtn.onclick = () => {
    if (confirm('Are you sure you want to reset all scores?')) {
        highScore = 0;
        highScoreName = '---';
        highScores = [];
        localStorage.setItem('wam_highscore', highScore);
        localStorage.setItem('wam_highscore_name', highScoreName);
        localStorage.setItem('wam_highscores', JSON.stringify(highScores));
        updateLobbyHighScore();
        updateHighScoresList();
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
    let delayTime = 2000;
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
        delayTime = Math.max(900, 2000 - (score/3));
        clearInterval(intervalId);
        intervalId = setInterval(generateHoles, delayTime);
    }

const MOLE_TYPES = ['generic', 'prank', 'bomb', 'miner'];
const MOLE_IMAGES = {
    generic: 'genericMole.png',
    prank: 'prankMole.png',
    bomb: 'bombMole.png',
    miner: 'minerMole.png',
};
let moleHistory = [];

function getNextMoleType(holeIndex, round) {
    //l algo hedha ybadel l mole b tarika smart
    const last = moleHistory[moleHistory.length - 1] || [];
    const prevType = last[holeIndex] || 'generic';
    const prev2 = moleHistory.length > 1 ? moleHistory[moleHistory.length - 2][holeIndex] : null;
    // moles chance
    let prankChance = Math.min(0.1 + score / 3000, 0.25);
    let bombChance = Math.min(0.05 + score / 5000, 0.15);
    let minerChance = Math.min(0.05 + score / 4000, 0.15);
    // Tactiques
    if (prevType === 'generic' && prev2 === 'generic' && Math.random() < 0.7) return 'prank';
    if (prevType === 'prank' && Math.random() < 0.3) return 'bomb';
    if (prevType === 'bomb' && Math.random() < 0.5) return 'miner';
    if (prevType === 'bomb') return 'generic'; // never two bombs in a row
    // Random chance l special moles
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
        // li aandha y akber tji mn kodem z index akber (more realistic)
        const holesWithY = [];
        let thisRoundTypes = [];
        
        playArea.refreshScheduled = false;
        
        for (let i = 0; i < holeCount; i++) {
            const pos = randomPosition(positions);
            positions.push(pos);
            
            // mole selection
            const moleType = getNextMoleType(i, moleHistory.length);
            thisRoundTypes[i] = moleType;
            
            const hole = holeTemplate.content.firstElementChild.cloneNode(true);
            hole.style.left = `${pos.x}px`;
            hole.style.top = `${pos.y}px`;
            hole.dataset.y = pos.y;
            
            // Mole animation
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
                }, 50);
            }
            
            hole.onclick = (e) => {
                if (moleType === 'miner'){
                    minerSound.currentTime = 0;
                    minerSound.play();
                    return;
                }
                
                let delta = 0;
                if (moleType === 'generic'){
                    delta = 100;
                    hitGeneric.currentTime = 0;
                    hitGeneric.play();
                }
                if (moleType === 'prank'){
                    delta = -50;
                    niahaha.currentTime = 0;
                    niahaha.play();
                }
                if (moleType === 'bomb'){
                    delta = -100;
                    bomb_explosion.currentTime = 0;
                    bomb_explosion.play();
                }
                
                score += delta;
                scoreDisplay.innerText = `Score: ${score}`;
                
                if (score < 0) {
                    scoreDisplay.style.color = '#ff2222';
                } else {
                    scoreDisplay.style.color = '#fff';
                }
                
                const mole = hole.querySelector('.mole');
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
                
                // Hammer hit effect animation
                if (moleType !== 'miner') {
                    const rect = playArea.getBoundingClientRect();
                    hammerHitImg.style.left = (rect.left + pos.x + 60) + 'px';
                    hammerHitImg.style.top = (rect.top + pos.y - 200) + 'px';
                    hammerHitImg.style.display = 'block';
                    hammerHitImg.style.transition = 'transform 0.25s cubic-bezier(.4,2,.6,1)';
                    hammerHitImg.style.transform = 'rotate(0deg)';
                    void hammerHitImg.offsetWidth;
                    hammerHitImg.style.transform = 'rotate(-60deg)';
                    
                    //taamel refresh ken ala awel hit
                    if (!playArea.refreshScheduled) {
                        playArea.refreshScheduled = true;
                        
                        setTimeout(() => {
                            if (mole) {
                                mole.style.backgroundImage = `url('${MOLE_IMAGES[moleType]}')`;
                            }
                            hammerHitImg.style.display = 'none';
                            hammerHitImg.style.transform = 'rotate(0deg)';
                            
                            generateHoles();
                            resetInterval();
                        }, 350);
                    } else {
                        setTimeout(() => {
                            if (mole) {
                                mole.style.backgroundImage = `url('${MOLE_IMAGES[moleType]}')`;
                            }
                        }, 350);
                    }
                }
            };
            
            holesWithY.push({hole, y: pos.y});
        }
        
        moleHistory.push(thisRoundTypes);
        if (moleHistory.length > 10) moleHistory.shift();
        
        holesWithY.sort((a, b) => a.y - b.y);
        holesWithY.forEach((obj, idx) => {
            obj.hole.style.zIndex = 10 + idx;
            playArea.appendChild(obj.hole);
        });
    }

    let currentTopScore = 0;

    function endGame() {
        clearInterval(intervalId);
        clearInterval(timerId);
        countdownDisplay.style.display = 'none';
        playArea.innerHTML = '';
        scoreDisplay.style.display = 'none';
        playArea.style.display = 'none';
        
        if (lastScoreElem) lastScoreElem.innerText = score;
        updateLastScore(score);
        
        if (score > 0) {
            // Check if score is in top 5
            let isTop5 = false;
            let minTop5Score = 0;
            
            if (highScores.length < 5) {
                isTop5 = true;
            } else {
                // Find the minimum score in top 5
                minTop5Score = highScores[highScores.length - 1].score;
                if (score > minTop5Score) {
                    isTop5 = true;
                }
            }
            
            if (isTop5) {
                currentTopScore = score;
                showHighScorePopup();
            } else {
                lobby.style.display = 'flex';
            }
        } else {
            lobby.style.display = 'flex';
        }
        
        updateLobbyHighScore();
        updateHighScoresList();
        highscoresPanel.style.display = 'none';
    }

    intervalId = setInterval(generateHoles, delayTime);
    generateHoles();

    timerId = setInterval(() => {
        timeLeft--;
        countdownDisplay.innerText = `Time: ${timeLeft}s`;
        if (timeLeft <= 5) {
            countdownDisplay.style.color = '#ff2222';
            countdownSound.play();
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
    updateLastScoreDisplay();
    updateHighScoresList();
};

function updateLastScoreDisplay() {
    if (lastScoreElem) lastScoreElem.innerText = lastScore;
}

function updateLastScore(newScore) {
    lastScore = newScore;
    localStorage.setItem('wam_lastscore', lastScore);
    updateLastScoreDisplay();
}

// stars effect
function createStars() {
    const container = document.getElementById('stars-container');
    container.innerHTML = '';
    for (let i = 0; i < 15; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = Math.random() * 20 + 10 + 'px';
        star.style.height = star.style.width;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(star);
    }
}

// show high score popup
function showHighScorePopup() {
    const overlay = document.getElementById('highscore-popup-overlay');
    overlay.classList.add('active');
    document.getElementById('highscore-name-input').value = '';
    document.getElementById('highscore-name-input').focus();
    createStars();
}

// Hide high score popup
function hideHighScorePopup() {
    const overlay = document.getElementById('highscore-popup-overlay');
    overlay.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', function() {
    // High score submission event listener
    const submitButton = document.getElementById('highscore-submit');
    if (submitButton) {
        submitButton.addEventListener('click', function() {
            const nameInput = document.getElementById('highscore-name-input');
            const name = nameInput.value.trim();
            const popup = document.querySelector('.highscore-popup');
            
            if (name !== "") {
                highScores.push({name: name, score: currentTopScore});
                
                highScores.sort((a, b) => b.score - a.score);
                
                // Keep only top 5
                if (highScores.length > 5) {
                    highScores = highScores.slice(0, 5);
                }

                if (currentTopScore > highScore) {
                    highScore = currentTopScore;
                    highScoreName = name;
                    localStorage.setItem('wam_highscore', highScore);
                    localStorage.setItem('wam_highscore_name', highScoreName);
                }
                
                localStorage.setItem('wam_highscores', JSON.stringify(highScores));
                
                hideHighScorePopup();
                lobby.style.display = 'flex';
                countdownSound.pause();
                updateLobbyHighScore();
                updateHighScoresList();
            } else {
                popup.classList.add('shake');
                yapping_mario.play();
                setTimeout(() => {
                    popup.classList.remove('shake');
                }, 500);
                nameInput.focus();
            }
        });
    }

    // Enter key event listener for high score input
    const nameInput = document.getElementById('highscore-name-input');
    if (nameInput) {
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const name = nameInput.value.trim();
                const popup = document.querySelector('.highscore-popup');
                
                if (name !== "") {
                    document.getElementById('highscore-submit').click();
                } else {
                    popup.classList.add('shake');
                    setTimeout(() => {
                        popup.classList.remove('shake');
                    }, 500);
                    nameInput.focus();
                }
            }
        });
    }
});

// Update high scores list display
function updateHighScoresList() {
    highscoresList.innerHTML = '';
    
    if (highScores.length === 0) {
        highscoresList.innerHTML += '<div style="text-align: center; padding: 10px; color: #2a7c88ff; font-size: 2rem;">No scores yet!</div>';
        return;
    }
    
    highScores.sort((a, b) => b.score - a.score);
    
    //top 5
    const displayScores = highScores.slice(0, 5);
    
    displayScores.forEach((item, index) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'highscore-item';
        scoreItem.innerHTML = `
            <span class="highscore-rank">${index + 1}.</span>
            <span class="highscore-name">${item.name}</span>
            <span class="highscore-value">${item.score}</span>
        `;
        highscoresList.appendChild(scoreItem);
    });
}

// Toggle high scores panel
highscoresBtn.addEventListener('click', () => {
    updateHighScoresList();
    highscoresPanel.style.display = 'block';
});

closeHighscoresBtn.addEventListener('click', () => {
    highscoresPanel.style.display = 'none';
});
