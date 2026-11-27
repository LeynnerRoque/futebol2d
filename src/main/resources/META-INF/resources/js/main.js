import { FRIENDS, CHARACTER_DB, WEATHER_MODES } from './config/Characters.js';
import { Player } from './config/entities/Player.js';
import { Ball } from './config/entities/Ball.js';
import { StreetNPC } from './config/entities/StreetNPC.js';
import { RetroAudio } from './config/systems/RetroAudio.js';
import { AIController } from './config/systems/AIController.js';
import { PhysicsEngine } from './config/systems/PhysicsEngine.js';
import { Renderer } from './config/systems/Renderer.js';
//import { SocketClient } from './network/SocketClient.js';

const BOUNDS = {
    width: 1200,
    height: 675,
    roadTop: 148,
    roadBottom: 595,
    fieldLeft: 85,
    fieldRight: 1115,
    goalHeight: 48
};

const canvas = document.getElementById('gameCanvas');
canvas.width = BOUNDS.width;
canvas.height = BOUNDS.height;

const sfx = new RetroAudio();
const aiController = new AIController(BOUNDS);
const renderer = new Renderer(canvas.getContext('2d'), BOUNDS);
//const socketClient = new SocketClient();

const state = {
    screen: 'LOBBY',
    timeLeft: 120,
    isGoldenGoal: false,
    scoreBlue: 0,
    scoreRed: 0,
    weather: WEATHER_MODES.sunny,
    lineup: { p1: 'Sergio', p2: 'Elias', p3: 'Lucas', p4: 'Helinho', bench: 'Leo' },
    lastTouch: null,
    concedingTeam: null,
    goalTimer: 0,
    celebration: null,
    particles: [],
    avocados: [],
    npcs: [],
    keys: {},
    touchVec: { x: 0, y: 0 }
};

let players = [];
const ball = new Ball(BOUNDS.width / 2, (BOUNDS.roadTop + BOUNDS.roadBottom) / 2);

const physicsEngine = new PhysicsEngine(BOUNDS, sfx, {
    onBallTouch: (player) => {
        state.lastTouch = player;
    },
    onParticles: (x, y, color, count) => {
        spawnParticles(x, y, color, count);
    },
    onGoal: (scoringTeam) => {
        handleGoal(scoringTeam);
    }
});

function spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 1.5 + Math.random() * 4;
        state.particles.push({
            x,
            y,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            life: 1,
            color,
            size: 4
        });
    }
}

function initNPCs() {
    state.npcs = [
        new StreetNPC({
            id: 'blonde1',
            type: 'woman',
            x: 190,
            y: 112,
            vx: 0.55,
            colors: { hair: '#facc15', dress: '#ec4899', skin: '#fbd5b5' }
        }),
        new StreetNPC({
            id: 'blonde2',
            type: 'woman',
            x: 780,
            y: 115,
            vx: -0.48,
            dir: -1,
            colors: { hair: '#fde047', dress: '#a855f7', skin: '#f8d9c0' }
        }),
        new StreetNPC({
            id: 'redhead',
            type: 'woman',
            x: 470,
            y: 625,
            vx: 0.62,
            colors: { hair: '#ea580c', dress: '#10b981', skin: '#ffe4c4' }
        }),
        new StreetNPC({
            id: 'bald_belly',
            type: 'bald_belly',
            x: 920,
            y: 622,
            vx: -0.38,
            dir: -1,
            colors: { shirt: '#f8fafc', shorts: '#475569', skin: '#e0ac69' }
        }),
        new StreetNPC({
            id: 'chair_guy',
            type: 'chair_guy',
            x: 565,
            y: 108,
            vx: 0,
            colors: { shirt: '#f97316', shorts: '#1e3a8a', skin: '#d2996c' }
        })
    ];
}

const selectIds = ['p1Select', 'p2Select', 'p3Select', 'p4Select'];

function initSelects() {
    const defaults = ['Sergio', 'Elias', 'Lucas', 'Helinho'];
    selectIds.forEach((id, idx) => {
        const sel = document.getElementById(id);
        sel.innerHTML = '';
        FRIENDS.forEach((friend) => {
            const opt = document.createElement('option');
            opt.value = friend;
            opt.textContent = friend;
            if (friend === defaults[idx]) opt.selected = true;
            sel.appendChild(opt);
        });

        sel.addEventListener('change', (e) => {
            const chosen = e.target.value;
            const vals = selectIds.map((sid) => document.getElementById(sid).value);
            const freeFriend = FRIENDS.find((f) => !vals.includes(f));
            selectIds.forEach((sid) => {
                if (sid !== id && document.getElementById(sid).value === chosen && freeFriend) {
                    document.getElementById(sid).value = freeFriend;
                }
            });
            syncLineup();
        });
    });

    document.getElementById('weatherSelect').addEventListener('change', (e) => {
        state.weather = WEATHER_MODES[e.target.value] || WEATHER_MODES.sunny;
        updateTimerHUD();
    });

    syncLineup();
}

function syncLineup() {
    state.lineup.p1 = document.getElementById('p1Select').value;
    state.lineup.p2 = document.getElementById('p2Select').value;
    state.lineup.p3 = document.getElementById('p3Select').value;
    state.lineup.p4 = document.getElementById('p4Select').value;
    const active = [state.lineup.p1, state.lineup.p2, state.lineup.p3, state.lineup.p4];
    state.lineup.bench = FRIENDS.find((f) => !active.includes(f)) || 'Leo';

    document.getElementById('lobbyBenchName').textContent = state.lineup.bench;
    document.getElementById('hudBenchName').textContent = state.lineup.bench;
    updateSpecialDetails(state.lineup.p1, CHARACTER_DB[state.lineup.p1]);
}

function syncDropdownsFromLineup() {
    document.getElementById('p1Select').value = state.lineup.p1;
    document.getElementById('p2Select').value = state.lineup.p2;
    document.getElementById('p3Select').value = state.lineup.p3;
    document.getElementById('p4Select').value = state.lineup.p4;
    document.getElementById('lobbyBenchName').textContent = state.lineup.bench;
    document.getElementById('hudBenchName').textContent = state.lineup.bench;
    updateSpecialDetails(state.lineup.p1, CHARACTER_DB[state.lineup.p1]);
}

function spawnPlayers() {
    const { p1, p2, p3, p4, bench } = state.lineup;
    document.getElementById('hudBlueNames').textContent = `${p1} & ${p2}`;
    document.getElementById('hudRedNames').textContent = `${p3} & ${p4}`;
    document.getElementById('hudBenchName').textContent = bench;

    const midY = (BOUNDS.roadTop + BOUNDS.roadBottom) / 2;
    const configs = [
        { name: p1, team: 'blue', isHuman: true, x: 360, y: midY - 60 },
        { name: p2, team: 'blue', isHuman: false, x: 260, y: midY + 75 },
        { name: p3, team: 'red', isHuman: false, x: 840, y: midY - 60 },
        { name: p4, team: 'red', isHuman: false, x: 940, y: midY + 75 }
    ];

    players = configs.map(
        (cfg, idx) =>
            new Player({
                id: idx + 1,
                name: cfg.name,
                stats: CHARACTER_DB[cfg.name],
                team: cfg.team,
                isHuman: cfg.isHuman,
                x: cfg.x,
                y: cfg.y
            })
    );

    updateSpecialHUD();
}

function resetPositions(concedingTeam = null) {
    const midY = (BOUNDS.roadTop + BOUNDS.roadBottom) / 2;
    ball.reset(BOUNDS.width / 2, midY);
    state.lastTouch = null;
    state.celebration = null;

    const spots = [
        { x: concedingTeam === 'blue' ? 520 : 370, y: midY - 40 },
        { x: 250, y: midY + 75 },
        { x: concedingTeam === 'red' ? 680 : 830, y: midY - 40 },
        { x: 950, y: midY + 75 }
    ];

    players.forEach((p, idx) => {
        p.x = spots[idx].x;
        p.y = spots[idx].y;
        p.vx = 0;
        p.vy = 0;
        p.fallenTimer = 0;
        p.specialActive = 0;
    });
}

function updateSpecialHUD() {
    const p1 = players[0];
    if (!p1) return;

    const progress = p1.getHudProgress();
    updateSpecialDetails(p1.name, p1.stats);

    const fill = document.getElementById('p1EnergyFill');
    const status = document.getElementById('p1SpecialStatus');
    fill.style.width = `${progress.pct}%`;
    status.textContent = progress.label;

    if (progress.ready) {
        fill.classList.add('ready');
        status.style.color = '#4ade80';
    } else {
        fill.classList.remove('ready');
        status.style.color = '#facc15';
    }
}

function updateSpecialDetails(playerName, stats) {
    document.getElementById('p1HudTitle').textContent = `⚡ ${playerName.toUpperCase()}:`;
    document.getElementById('p1SpecialName').textContent = stats.specialName;
    document.getElementById('p1SpecialDesc').textContent = stats.specialDesc;
}

function handleGoal(scoringTeam) {
    if (state.screen === 'GOAL_CELEBRATION') return;
    state.screen = 'GOAL_CELEBRATION';
    state.goalTimer = 3.2;
    state.concedingTeam = scoringTeam === 'blue' ? 'red' : 'blue';

    if (scoringTeam === 'blue') {
        state.scoreBlue += 1;
        document.getElementById('scoreBlue').textContent = state.scoreBlue;
    } else {
        state.scoreRed += 1;
        document.getElementById('scoreRed').textContent = state.scoreRed;
    }

    let scorer = state.lastTouch;
    if (!scorer || scorer.team !== scoringTeam) {
        scorer = players.find((p) => p.team === scoringTeam);
    }
    if (scorer) {
        scorer.registerGoal();
    }

    const celebrationType = scorer ? scorer.stats.celebration : 'spin_punch';
    state.celebration = {
        player: scorer,
        type: celebrationType,
        timer: 3.2
    };

    if (celebrationType === 'avocado_rain') {
        for (let i = 0; i < 14; i++) {
            state.avocados.push({
                x: 240 + (Math.random() - 0.5) * 180,
                y: 65 - Math.random() * 40,
                vx: (Math.random() - 0.5) * 3,
                vy: 1 + Math.random() * 2,
                groundY: BOUNDS.roadTop + 20 + Math.random() * 140,
                life: 3.5
            });
        }
    } else if (celebrationType === 'vacuum_suck') {
        sfx.suckWind();
        players.forEach((pl) => {
            if (pl.id !== scorer?.id) {
                pl.fallenTimer = 3.2;
            }
        });
    }

    let label = `⚽ Gol de ${scorer?.name || 'da Banca'}!`;
    if (scorer && scorer.specialUnlocked && scorer.stats.unlockType === 'goals') {
        label += ' (ESPECIAL LIBERADO!)';
    }
    document.getElementById('goalScorerLabel').textContent = label;
    document.getElementById('goalBanner').classList.remove('hidden');

    sfx.whistle(false);
    sfx.goal();
    state.npcs.forEach((npc) => npc.triggerCheer(3.2));
    spawnParticles(ball.x, ball.y, '#facc15', 30);
    updateSpecialHUD();

}

function stepCelebration(dt) {
    if (!state.celebration) return;
    state.celebration.timer = Math.max(0, state.celebration.timer - dt);
    const p = state.celebration.player;
    if (!p) return;

    p.animFrame += dt * 14;
    if (state.celebration.type === 'spin_punch') {
        p.facing = Math.floor(p.animFrame) % 2 === 0 ? 1 : -1;
        p.y -= Math.sin(p.animFrame * 0.8) * 1.5;
    } else if (state.celebration.type === 'run_air_kick') {
        p.x = Math.max(120, Math.min(BOUNDS.width - 120, p.x + p.facing * 2.2));
    } else if (state.celebration.type === 'slow_pushups' && state.celebration.timer > 2.1) {
        p.x = Math.max(120, Math.min(BOUNDS.width - 120, p.x + p.facing * 1.1));
    } else if (state.celebration.type === 'vacuum_suck') {
        players.forEach((other) => {
            if (other.id !== p.id) {
                other.x += (p.x - other.x) * dt * 1.4;
                other.y += (p.y - other.y) * dt * 1.4;
            }
        });
    }
}

function finishMatch() {
    state.screen = 'GAMEOVER';
    sfx.whistle(true);

    const { p1, p2, p3, p4, bench } = state.lineup;
    const blueWon = state.scoreBlue > state.scoreRed;

    document.getElementById('endScoreText').textContent =
        `${p1} & ${p2}  ${state.scoreBlue} x ${state.scoreRed}  ${p3} & ${p4}`;

    const msgEl = document.getElementById('swapMessage');
    const loseBtns = document.getElementById('loseButtons');
    const nextBtn = document.getElementById('nextMatchBtn');

    if (blueWon) {
        document.getElementById('endTitle').textContent = '🏆 SUA DUPLA VENCEU!';
        loseBtns.classList.add('hidden');
        nextBtn.classList.remove('hidden');

        const slotOut = Math.random() < 0.5 ? 'p3' : 'p4';
        const outName = state.lineup[slotOut];
        state.lineup[slotOut] = bench;
        state.lineup.bench = outName;
        syncDropdownsFromLineup();

        msgEl.innerHTML = `Vitória! <strong>${state.lineup[slotOut]}</strong> entrou aleatoriamente no lugar de <span style="color:#f87171;">${outName}</span>.`;
    } else {
        document.getElementById('endTitle').textContent = '💀 SUA DUPLA PERDEU!';
        loseBtns.classList.remove('hidden');
        nextBtn.classList.add('hidden');

        msgEl.innerHTML = `Escolha quem sai da sua dupla para <strong>${bench}</strong> entrar no lugar:`;
        const b1 = document.getElementById('btnRemoveP1');
        const b2 = document.getElementById('btnRemoveP2');
        b1.textContent = `Tirar ${p1}`;
        b2.textContent = `Tirar ${p2}`;

        b1.onclick = () => {
            state.lineup.p1 = state.lineup.p2;
            state.lineup.p2 = bench;
            state.lineup.bench = p1;
            completeLossSwap(p1);
        };
        b2.onclick = () => {
            state.lineup.p2 = bench;
            state.lineup.bench = p2;
            completeLossSwap(p2);
        };
    }

    document.getElementById('gameOverOverlay').classList.remove('hidden');
}

function completeLossSwap(removedName) {
    syncDropdownsFromLineup();
    document.getElementById('loseButtons').classList.add('hidden');
    document.getElementById('swapMessage').innerHTML =
        `✅ <strong>${removedName}</strong> foi para a calçada e <strong>${state.lineup.p2}</strong> entrou na sua dupla (${state.lineup.p1} & ${state.lineup.p2})!`;
    document.getElementById('nextMatchBtn').classList.remove('hidden');
}

function updateTimerHUD() {
    const el = document.getElementById('matchTimer');
    const sub = document.getElementById('timerSubLabel');
    if (state.isGoldenGoal) {
        el.textContent = 'GOL DE OURO';
        el.classList.add('golden');
        sub.textContent = 'QUEM FIZER GANHA!';
        return;
    }
    el.classList.remove('golden');
    const m = Math.floor(state.timeLeft / 60);
    const s = Math.floor(state.timeLeft % 60);
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    sub.textContent = state.weather.label;
}

function resolvePlayerInput(player) {
    if (!player.isHuman) {
        return aiController.computeMove(player, ball, players, (aiPlayer) => {
            physicsEngine.activateSpecial(aiPlayer, players, ball);
        });
    }

    let mx = 0;
    let my = 0;
    if (state.keys['KeyW'] || state.keys['ArrowUp']) my -= 1;
    if (state.keys['KeyS'] || state.keys['ArrowDown']) my += 1;
    if (state.keys['KeyA'] || state.keys['ArrowLeft']) mx -= 1;
    if (state.keys['KeyD'] || state.keys['ArrowRight']) mx += 1;

    if (Math.hypot(state.touchVec.x, state.touchVec.y) > 0.1) {
        mx = state.touchVec.x;
        my = state.touchVec.y;
    }

    return { mx, my, kick: Boolean(state.keys['Space']) };
}

function update(dt) {
    state.npcs.forEach((npc) => npc.update(dt, 120, BOUNDS.width - 120));
    renderer.updateRain(dt, state.weather.isRaining);

    for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= dt * 1.7;
        if (pt.life <= 0) state.particles.splice(i, 1);
    }

    for (let i = state.avocados.length - 1; i >= 0; i--) {
        const av = state.avocados[i];
        av.vy += 0.35;
        av.y += av.vy;
        av.x += av.vx;
        if (av.y > av.groundY) {
            av.y = av.groundY;
            av.vy = -av.vy * 0.45;
            av.vx *= 0.7;
        }
        av.life -= dt;
        if (av.life <= 0) state.avocados.splice(i, 1);
    }

    if (state.screen === 'GOAL_CELEBRATION') {
        state.goalTimer -= dt;
        ball.update(dt);
        stepCelebration(dt);
        if (state.goalTimer <= 0) {
            document.getElementById('goalBanner').classList.add('hidden');
            if (state.isGoldenGoal) {
                finishMatch();
            } else {
                resetPositions(state.concedingTeam);
                state.concedingTeam = null;
                state.screen = 'PLAYING';
                sfx.whistle(false);
            }
        }
        return;
    }

    if (state.screen !== 'PLAYING') return;

    if (!state.isGoldenGoal) {
        state.timeLeft -= dt;
        if (state.timeLeft <= 0) {
            state.timeLeft = 0;
            if (state.scoreBlue === state.scoreRed) {
                state.isGoldenGoal = true;
                sfx.whistle(false);
            } else {
                finishMatch();
                return;
            }
        }
        updateTimerHUD();
    }

    physicsEngine.stepPlayers(dt, players, ball, resolvePlayerInput);
    updateSpecialHUD();
}

function startMatch() {
    state.timeLeft = 120;
    state.isGoldenGoal = false;
    state.scoreBlue = 0;
    state.scoreRed = 0;
    state.avocados = [];
    state.weather = WEATHER_MODES[document.getElementById('weatherSelect').value] || WEATHER_MODES.sunny;

    document.getElementById('scoreBlue').textContent = '0';
    document.getElementById('scoreRed').textContent = '0';

    spawnPlayers();
    resetPositions();
    updateTimerHUD();

    document.getElementById('lobbyOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('goalBanner').classList.add('hidden');

    state.screen = 'PLAYING';
    sfx.whistle(true);
}

window.addEventListener('keydown', (e) => {
    state.keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && state.screen === 'PLAYING') {
        e.preventDefault();
    }
    if (state.screen === 'PLAYING' && players[0]) {
        if (e.code === 'KeyE' || e.code === 'ShiftLeft') physicsEngine.activateSpecial(players[0], players, ball);
        if (e.code === 'KeyC') physicsEngine.performPass(players[0], players, ball);
    }
});

window.addEventListener('keyup', (e) => {
    state.keys[e.code] = false;
});

const joyBase = document.getElementById('joyBase');
const joyStick = document.getElementById('joyStick');
joyBase.addEventListener(
    'touchmove',
    (e) => {
        e.preventDefault();
        const t = e.touches[0];
        const r = joyBase.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const max = r.width / 2 - 18;
        let dx = t.clientX - cx;
        let dy = t.clientY - cy;
        const d = Math.hypot(dx, dy);
        if (d > max) {
            dx = (dx / d) * max;
            dy = (dy / d) * max;
        }
        joyStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        state.touchVec = { x: dx / max, y: dy / max };
    },
    { passive: false }
);

joyBase.addEventListener('touchend', () => {
    joyStick.style.transform = 'translate(-50%, -50%)';
    state.touchVec = { x: 0, y: 0 };
});

document.getElementById('mKickBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    state.keys['Space'] = true;
});
document.getElementById('mKickBtn').addEventListener('touchend', () => {
    state.keys['Space'] = false;
});
document.getElementById('mPassBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    physicsEngine.performPass(players[0], players, ball);
});
document.getElementById('mSpecBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    physicsEngine.activateSpecial(players[0], players, ball);
});

document.getElementById('startBtn').addEventListener('click', startMatch);
document.getElementById('nextMatchBtn').addEventListener('click', startMatch);

document.getElementById('lobbyBtn').addEventListener('click', () => {
    state.screen = 'LOBBY';
    syncDropdownsFromLineup();
    document.getElementById('lobbyOverlay').classList.remove('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
});

document.getElementById('backLobbyBtn').addEventListener('click', () => {
    state.screen = 'LOBBY';
    syncDropdownsFromLineup();
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('lobbyOverlay').classList.remove('hidden');
});

document.getElementById('ballDropBtn').addEventListener('click', () => {
    if (state.screen === 'PLAYING') {
        ball.reset(BOUNDS.width / 2, (BOUNDS.roadTop + BOUNDS.roadBottom) / 2);
        sfx.whistle(false);
    }
});

document.getElementById('soundBtn').addEventListener('click', (e) => {
    sfx.muted = !sfx.muted;
    e.target.textContent = sfx.muted ? '🔇 SOM: OFF' : '🔊 SOM: ON';
});

let lastTs = 0;
function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.05) || 0.016;
    lastTs = ts;

    update(dt);
    renderer.render({
        weather: state.weather,
        npcs: state.npcs,
        particles: state.particles,
        players,
        celebration: state.celebration,
        ball,
        avocados: state.avocados
    });

    requestAnimationFrame(loop);
}

window.onload = () => {
    initSelects();
    initNPCs();
    spawnPlayers();
    requestAnimationFrame(loop);
};