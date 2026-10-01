/* Adapted for psicoZ from https://github.com/pyforgedev/flappy-bird/blob/29369e112225c35cd1da77e43cf02aa5ed1408a1/flappyBird.js
 * Original MIT license preserved in LICENSE. Integration, rendering and input changes documented in docs/game-sources-misc.json. */
var cvs = document.getElementById("canvas");
var ctx = cvs.getContext("2d");

// psicoZ replacement art; no original bird sprites or audio are redistributed.
function art(w,h,draw){var c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return c;}
var bird=art(34,24,function(c){c.fillStyle='#f51d36';c.beginPath();c.ellipse(17,12,16,10,0,0,Math.PI*2);c.fill();c.strokeStyle='#090909';c.lineWidth=3;c.stroke();c.fillStyle='#f2ece2';c.beginPath();c.arc(21,10,7,0,Math.PI*2);c.fill();c.fillStyle='#090909';c.beginPath();c.arc(22,10,3,0,Math.PI*2);c.fill();});
var bg=art(288,512,function(c,w,h){c.fillStyle='#f2ece2';c.fillRect(0,0,w,h);c.strokeStyle='#bfb3a8';for(var i=-h;i<w;i+=16){c.beginPath();c.moveTo(i,0);c.lineTo(i+h,h);c.stroke();}});
var fg=art(288,55,function(c,w,h){c.fillStyle='#090909';c.fillRect(0,0,w,h);c.fillStyle='#f51d36';c.fillRect(0,0,w,7);});
function gate(c,w,h){c.fillStyle='#090909';c.fillRect(0,0,w,h);c.strokeStyle='#f51d36';c.lineWidth=3;for(var i=-w;i<h;i+=14){c.beginPath();c.moveTo(0,i);c.lineTo(w,i+w);c.stroke();}c.fillStyle='#f51d36';c.fillRect(0,h-8,w,8);}
var pipeNorth=art(52,260,gate),pipeSouth=art(52,260,gate);
// some variables

var gap = 115;

var bX = 10;
var bY = 150;

var gravity = 1.5;
var speed = 60;
var lastTime = null;

var flapPower = 32;

var score = 0;
var bestScore = 0;
var gameOver = false;
var gameOverT = 0;
var GAME_OVER_DELAY = 1;
var loopPending = false;
var birdAngle = 0;
var state = "playing";
var countdownT = 3;
var welcomeT = 0;

var FONT = "'Press Start 2P', monospace";

function loadBest(){}
function saveBest(){}

// Audio and per-game storage omitted; album audio remains pending.
function silent(){return {play:function(){return Promise.resolve()},pause:function(){},currentTime:0}}var fly=silent(),scoreSound=silent(),bgm=silent(),gameOverSound=silent(),musicOn=false,sfxOn=false;function startBgm(){}function stopBgm(){}function setMusicOn(){}function setSfxOn(){}
// on key down

document.addEventListener("keydown", moveUp);
document.addEventListener("pointerdown", function(e){
    if(e.button !== 0) return;
    handleInput();
});

function handleInput(){
    if(settingsPanel.classList.contains("open")) return;
    if(gameOver){
        return;
        return;
    }
    if(state === "welcome"){
        state = "countdown";
        countdownT = 3;
        startBgm();
        return;
    }
    if(state === "playing"){
        flap();
    }
}

function flap(){
    bY -= flapPower;
    birdAngle = -0.4;
    if(sfxOn){
        fly.currentTime = 0;
        var p = fly.play();
        if(p && p.catch) p.catch(function(){});
    }
}

function moveUp(e){
    if(e.repeat) return;
    if(e.key !== " " && e.key !== "ArrowUp") return;
    handleInput();
}

// pipe coordinates

var pipe = [];

var pipeGapMin = 140;
var pipeGapMax = 250;
var nextGap = 163;
var holeDeltaMax = 120;

pipe[0] = {
    x : cvs.width,
    y : 0
};

function endGame(){
    if(gameOver) return;
    PsicoZ.report({phase:'lost',progress:score,total:8,label:'Grades atravessadas'});
    gameOver = true;
    gameOverT = 0;
    stopBgm();
    if(sfxOn){
        var p = gameOverSound.play();
        if(p && p.catch) p.catch(function(){});
    }
}

function restart(){
    pipe = [];
    pipe[0] = { x : cvs.width, y : 0 };
    nextGap = 163;
    bY = 150;
    birdAngle = 0;
    score = 0;
    gameOver = false;
    lastTime = null;
    state = "welcome";
    countdownT = 3;
    welcomeT = 0;
    if(!loopPending){
        draw();
    }
}

// draw helpers

function imagesReady(){
    return bird.width > 0 && bg.width > 0 && fg.width > 0 && pipeNorth.width > 0 && pipeSouth.width > 0;
}

function roundRect(x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
}

function drawScorePill(){
    ctx.font = "16px " + FONT;
    var text = String(score);
    var w = ctx.measureText(text).width + 30;
    var x = (cvs.width - w) / 2;
    ctx.fillStyle = "rgba(8, 14, 12, 0.55)";
    roundRect(x, 14, w, 36, 18);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillText(text, cvs.width / 2 + 1, 41);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, cvs.width / 2, 40);
    ctx.textAlign = "left";
}

function drawStartHint(){
    ctx.font = "10px " + FONT;
    ctx.textAlign = "center";
    ctx.fillStyle = "#090909";
    ctx.fillText("TOQUE / ESPAÇO PARA VOAR", cvs.width / 2, 320);
    ctx.textAlign = "left";
}

function drawWelcome(){
    ctx.fillStyle = "rgba(8, 12, 16, 0.6)";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    var cw = 240;
    var ch = 160;
    var cx = (cvs.width - cw) / 2;
    var cy = 146;

    ctx.fillStyle = "rgba(248, 201, 72, 0.85)";
    roundRect(cx - 4, cy - 4, cw + 8, ch + 8, 20);
    ctx.fillStyle = "rgba(22, 30, 28, 0.97)";
    roundRect(cx, cy, cw, ch, 16);

    ctx.textAlign = "center";
    ctx.font = "18px " + FONT;
    ctx.fillStyle = "#f8c948";
    ctx.fillText("FLAPPY BIRD", cvs.width / 2, cy + 52);

    ctx.font = "10px " + FONT;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("PRESS SPACE / ↑", cvs.width / 2, cy + 100);
    ctx.fillStyle = "#93a89d";
    ctx.fillText("OR TAP TO START", cvs.width / 2, cy + 124);

    ctx.font = "8px " + FONT;
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.fillText("DODGE THE PIPES", cvs.width / 2, cy + ch - 22);

    ctx.textAlign = "left";
}

function drawCountdown(){
    ctx.font = "48px " + FONT;
    var n = Math.ceil(countdownT);
    var w = ctx.measureText(String(n)).width + 48;
    ctx.fillStyle = "rgba(8, 14, 12, 0.55)";
    roundRect((cvs.width - w) / 2, 96, w, 64, 32);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillText(String(n), cvs.width / 2 + 2, 148);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(n), cvs.width / 2, 146);
    ctx.textAlign = "left";
}

function drawGameOver(){
    ctx.fillStyle = "rgba(8, 12, 16, 0.6)";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    var cw = 240;
    var ch = 176;
    var cx = (cvs.width - cw) / 2;
    var cy = 138;

    ctx.fillStyle = "rgba(248, 201, 72, 0.85)";
    roundRect(cx - 4, cy - 4, cw + 8, ch + 8, 20);
    ctx.fillStyle = "rgba(22, 30, 28, 0.97)";
    roundRect(cx, cy, cw, ch, 16);

    ctx.textAlign = "center";
    ctx.font = "18px " + FONT;
    ctx.fillStyle = "#ff5f52";
    ctx.fillText("GAME OVER", cvs.width / 2, cy + 46);

    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.fillRect(cx + 26, cy + 64, cw - 52, 2);

    ctx.font = "10px " + FONT;
    ctx.fillStyle = "#93a89d";
    ctx.textAlign = "left";
    ctx.fillText("SCORE", cx + 26, cy + 100);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(score), cx + cw - 26, cy + 100);

    ctx.fillStyle = "#93a89d";
    ctx.textAlign = "left";
    ctx.fillText("BEST", cx + 26, cy + 128);
    ctx.textAlign = "right";
    ctx.fillStyle = "#f8c948";
    ctx.fillText(String(bestScore), cx + cw - 26, cy + 128);

    ctx.textAlign = "center";
    ctx.fillStyle = gameOverT >= GAME_OVER_DELAY ? "rgba(255, 255, 255, 0.75)" : "rgba(255, 255, 255, 0.25)";
    ctx.fillText("TAP OR PRESS SPACE / ↑", cvs.width / 2, cy + ch - 22);
    ctx.textAlign = "left";
}

// draw

function draw(time){
    time = time || 0;
    var dt = 0;
    if(lastTime !== null){
        dt = Math.min((time - lastTime) / 1000, 0.05);
    }
    lastTime = time;
    loopPending = false;

    if(!imagesReady()){
        ctx.fillStyle = "#0c1915";
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.font = "10px " + FONT;
        ctx.textAlign = "center";
        ctx.fillStyle = "#f8c948";
        ctx.fillText("LOADING", cvs.width / 2, cvs.height / 2);
        ctx.textAlign = "left";
        loopPending = true;
        requestAnimationFrame(draw);
        return;
    }

    ctx.drawImage(bg,0,0);

    for(var i = 0; i < pipe.length; i++){

        var constant = pipeNorth.height + gap;
        ctx.drawImage(pipeNorth,pipe[i].x,pipe[i].y);
        ctx.drawImage(pipeSouth,pipe[i].x,pipe[i].y + constant);

        if(gameOver || state !== "playing") continue;

        pipe[i].x -= speed * dt;

        if(pipe[i].x <= cvs.width - nextGap && !pipe[i].spawned){
            pipe[i].spawned = true;
            nextGap = pipeGapMin + Math.random() * (pipeGapMax - pipeGapMin);

            var holeMin = 30;
            var holeMax = Math.max(holeMin, Math.min(pipeNorth.height, cvs.height - fg.height - gap - 30));
            var prevHole = pipe[i].y + pipeNorth.height;
            var holeTop = prevHole + (Math.random() * 2 - 1) * holeDeltaMax;
            holeTop = Math.max(holeMin, Math.min(holeMax, holeTop));

            pipe.push({
                x : cvs.width,
                y : holeTop - pipeNorth.height
            });
        }

        if(!pipe[i].scored && pipe[i].x + pipeNorth.width <= bX){
            pipe[i].scored = true;
            score++;
            if(score > bestScore){
                bestScore = score;
                saveBest();
            }
            if(sfxOn){
                var p = scoreSound.play();
                if(p && p.catch) p.catch(function(){});
            }
        }

        if(pipe[i].x + pipeNorth.width < 0){
            pipe.splice(i,1);
            i--;
            continue;
        }

        if(bX + bird.width >= pipe[i].x && bX <= pipe[i].x + pipeNorth.width &&
           (bY <= pipe[i].y + pipeNorth.height || bY + bird.height >= pipe[i].y + constant)){
            endGame();
        }
    }

    ctx.drawImage(fg,0,cvs.height - fg.height);

    ctx.save();
    ctx.translate(bX + bird.width / 2, bY + bird.height / 2);
    ctx.rotate(birdAngle);
    ctx.drawImage(bird, -bird.width / 2, -bird.height / 2);
    ctx.restore();

    if(gameOver){
        gameOverT += dt;
        if(bY + bird.height < cvs.height - fg.height){
            bY += gravity * 60 * dt;
            birdAngle += (1.3 - birdAngle) * Math.min(1, dt * 8);
        }
        drawGameOver();
        loopPending = true;
        requestAnimationFrame(draw);
        return;
    }

    if(state === "countdown"){
        countdownT -= dt;
        if(countdownT <= 0){
            state = "playing";
            bY = 150;
            birdAngle = 0;
        }
    }

    if(state === "welcome" || state === "countdown"){
        welcomeT += dt;
        bY = 150 + Math.round(Math.sin(welcomeT * 3) * 6);
        birdAngle += (0 - birdAngle) * Math.min(1, dt * 6);
    }else{
        bY += gravity * 60 * dt;
        birdAngle += (1.3 - birdAngle) * Math.min(1, dt * 8);
        if(bY < 0) bY = 0;
        if(bY + bird.height >= cvs.height - fg.height){
            endGame();
        }
    }

    if(state === "welcome"){
        drawWelcome();
    }else if(state === "countdown"){
        drawCountdown();
    }else if(score === 0){
        drawStartHint();
    }
    drawScorePill();

    loopPending = true;
    requestAnimationFrame(draw);
}

draw();

// settings UI

var settingsBtn = document.getElementById("settingsBtn");
var settingsClose = document.getElementById("settingsClose");
var settingsPanel = document.getElementById("settingsPanel");
var musicToggle = document.getElementById("musicToggle");
var sfxToggle = document.getElementById("sfxToggle");

musicToggle.checked = musicOn;
sfxToggle.checked = sfxOn;

function closeSettings(){
    settingsPanel.classList.remove("open");
    settingsPanel.setAttribute("aria-hidden", "true");
    settingsBtn.setAttribute("aria-expanded", "false");
    settingsBtn.focus();
}

settingsBtn.addEventListener("click", function(e){
    e.stopPropagation();
    var open = settingsPanel.classList.toggle("open");
    settingsPanel.setAttribute("aria-hidden", open ? "false" : "true");
    settingsBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if(open) settingsClose.focus();
});

settingsBtn.addEventListener("pointerdown", function(e){ e.stopPropagation(); });
settingsPanel.addEventListener("pointerdown", function(e){ e.stopPropagation(); });
settingsClose.addEventListener("click", function(e){
    e.stopPropagation();
    closeSettings();
});
settingsClose.addEventListener("pointerdown", function(e){ e.stopPropagation(); });

musicToggle.addEventListener("change", function(){
    setMusicOn(musicToggle.checked);
});

sfxToggle.addEventListener("change", function(){
    setSfxOn(sfxToggle.checked);
});

document.addEventListener("keydown", function(e){
    if(e.key === "Escape") closeSettings();
});
