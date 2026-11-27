const SPECIAL_DURATION = 20;

export class PhysicsEngine {
    constructor(bounds, sfx, callbacks) {
        this.bounds = bounds;
        this.sfx = sfx;
        this.callbacks = callbacks;
    }

    shootAtGoal(player, ball, forceDirectGoal = false) {
        const { fieldLeft, fieldRight, roadTop, roadBottom, goalHeight } = this.bounds;
        const targetX = player.team === 'blue' ? fieldRight : fieldLeft;
        const midY = (roadTop + roadBottom) / 2;

        const isDirect = forceDirectGoal || player.hasDirectGoalShotReady();
        const guaranteedGoal = player.stats.guaranteedGoal === true;
        const cornerOffset = (Math.random() > 0.5 ? 1 : -1) * (goalHeight * 0.22);
        const errorSpread = isDirect || guaranteedGoal
            ? 0
            : (1 - player.stats.shotAccuracy) * 75 * (Math.random() - 0.5);
        const targetY = guaranteedGoal ? midY : midY + cornerOffset + errorSpread;

        const ang = Math.atan2(targetY - ball.y, targetX - ball.x);
        const power = player.stats.kickPower * (isDirect ? 1.28 : 1.0);

        ball.vx = Math.cos(ang) * power;
        ball.vy = Math.sin(ang) * power;
        ball.superShot = isDirect || guaranteedGoal;
        ball.guaranteedGoal = guaranteedGoal;

        player.registerTouch();
        this.callbacks.onBallTouch(player);
        this.sfx.kick();
        this.callbacks.onParticles(ball.x, ball.y, isDirect ? '#facc15' : '#ffffff', 12);
    }

    performPass(player, players, ball, forcePerfect = false) {
        if (!player || player.fallenTimer > 0) return;
        const distBall = Math.hypot(ball.x - player.x, ball.y - player.y);
        if (distBall > player.radius + ball.radius + 26) return;

        const mate = players.find((m) => m.team === player.team && m.id !== player.id);
        if (!mate) return;

        let ang = Math.atan2(mate.y - ball.y, mate.x - ball.x);
        if (!forcePerfect && player.name === 'Elias') {
            ang += (Math.random() - 0.5) * 1.15;
        } else {
            const err = (1 - player.stats.passAccuracy) * 0.6 * (Math.random() - 0.5);
            ang += err;
        }

        ball.vx = Math.cos(ang) * 11.5;
        ball.vy = Math.sin(ang) * 11.5;
        ball.superShot = forcePerfect;

        player.registerTouch();
        this.callbacks.onBallTouch(player);
        this.sfx.kick();
    }

    activateSpecial(player, players, ball) {
        if (!player || player.fallenTimer > 0) return;
        if (!player.canActivateSpecial()) return;

        player.specialActive = SPECIAL_DURATION;
        if (player.name === 'Helinho') {
            const mate = players.find((m) => m.team === player.team && m.id !== player.id);
            if (mate && Math.hypot(ball.x - player.x, ball.y - player.y) < 130) {
                const ang = Math.atan2(mate.y - ball.y, mate.x - ball.x);
                ball.vx = Math.cos(ang) * 14.5;
                ball.vy = Math.sin(ang) * 14.5;
                ball.superShot = true;
                this.callbacks.onBallTouch(player);
            }
        } else if (player.name === 'Sergio' || player.name === 'Elias') {
            player.dribbleTimer = 1.2;
            player.vx += player.facing * 5.5;
        } else if (player.name === 'Leo') {
            const distBall = Math.hypot(ball.x - player.x, ball.y - player.y);
            if (distBall < 140) {
                this.performPass(player, players, ball, true);
            }
        }

        const distBall = Math.hypot(ball.x - player.x, ball.y - player.y);
        if (distBall < 70) {
            this.shootAtGoal(player, ball, true);
        }

        this.sfx.special();
        this.callbacks.onParticles(player.x, player.y, '#facc15', 18);
    }

    stepPlayers(dt, players, ball, inputResolver) {
        const { width, fieldLeft, fieldRight, roadTop, roadBottom, goalHeight } = this.bounds;

        players.forEach((p) => {
            if (p.kickCooldown > 0) p.kickCooldown = Math.max(0, p.kickCooldown - dt);
            if (p.dribbleTimer > 0) p.dribbleTimer = Math.max(0, p.dribbleTimer - dt);
            if (p.specialActive > 0) p.specialActive = Math.max(0, p.specialActive - dt);

            if (p.fallenTimer > 0) {
                p.fallenTimer = Math.max(0, p.fallenTimer - dt);
                return;
            }

            if (p.energy < 100 && p.specialActive <= 0) {
                p.energy = Math.min(100, p.energy + dt * 9.5);
                p.evaluateSpecialUnlock();
            }

            let { mx, my, kick } = inputResolver(p);
            const mag = Math.hypot(mx, my);
            if (mag > 1) {
                mx /= mag;
                my /= mag;
            }
            if (mx !== 0) p.facing = mx > 0 ? 1 : -1;

            const turboMult = (p.name === 'Helinho' || p.name === 'Sergio') && p.specialActive > 0
                ? 1.55
                : 1.0;
            const accel = p.stats.accel * turboMult;
            const maxSpd = p.stats.maxSpeed * turboMult;

            p.vx = (p.vx + mx * accel) * 0.85;
            p.vy = (p.vy + my * accel) * 0.85;

            const curSpd = Math.hypot(p.vx, p.vy);
            if (curSpd > maxSpd) {
                p.vx = (p.vx / curSpd) * maxSpd;
                p.vy = (p.vy / curSpd) * maxSpd;
            }

            p.x += p.vx;
            p.y += p.vy;
            if (curSpd > 0.4) p.animFrame += dt * 10;

            p.x = Math.max(40, Math.min(width - 40, p.x));
            p.y = Math.max(roadTop + 12, Math.min(roadBottom - 10, p.y));

            if (kick && p.kickCooldown <= 0) {
                p.kickCooldown = 0.35;
                const distBall = Math.hypot(ball.x - p.x, ball.y - p.y);
                if (distBall <= p.radius + ball.radius + 20) {
                    this.shootAtGoal(p, ball, p.hasDirectGoalShotReady());
                } else if (mag > 0.1) {
                    if (p.stats.dribbleSkill > 0) {
                        p.dribbleTimer = 0.35;
                        p.vx += mx * 3.5 * p.stats.dribbleSkill;
                        p.vy += my * 3.5 * p.stats.dribbleSkill;
                    } else {
                        p.vx += mx * 3.8;
                        p.vy += my * 3.8;
                    }
                }
            }
        });

        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                const a = players[i];
                const b = players[j];
                if (a.fallenTimer > 0 || b.fallenTimer > 0) continue;
                if (a.dribbleTimer > 0 || b.dribbleTimer > 0) continue;

                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.hypot(dx, dy);
                const minD = a.radius + b.radius;

                if (dist < minD && dist > 0) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const overlap = (minD - dist) / 2;

                    a.x -= nx * overlap;
                    a.y -= ny * overlap;
                    b.x += nx * overlap;
                    b.y += ny * overlap;

                    if (a.team !== b.team && Math.hypot(a.vx, a.vy) > 2.2
                        && (a.name === 'Lucas' || (a.name === 'Sergio' && a.specialActive > 0))) {
                        const strength = a.name === 'Sergio' ? 1.75 : 1;
                        b.vx += nx * 6.5 * strength;
                        b.vy += ny * 6.5 * strength;
                        b.fallenTimer = 0.65 * strength;
                        this.callbacks.onParticles(b.x, b.y, '#84cc16', 8);
                    } else if (b.team !== a.team && Math.hypot(b.vx, b.vy) > 2.2
                        && (b.name === 'Lucas' || (b.name === 'Sergio' && b.specialActive > 0))) {
                        const strength = b.name === 'Sergio' ? 1.75 : 1;
                        a.vx -= nx * 6.5 * strength;
                        a.vy -= ny * 6.5 * strength;
                        a.fallenTimer = 0.65 * strength;
                        this.callbacks.onParticles(a.x, a.y, '#84cc16', 8);
                    }
                }
            }
        }

        ball.update(dt);

        players.forEach((p) => {
            if (p.fallenTimer > 0 || ball.guaranteedGoal) return;
            const dx = ball.x - p.x;
            const dy = ball.y - p.y;
            const dist = Math.hypot(dx, dy);
            const minD = p.radius + ball.radius;

            if (dist < minD && dist > 0) {
                const nx = dx / dist;
                const ny = dy / dist;
                ball.x += nx * (minD - dist);
                ball.y += ny * (minD - dist);

                const impact = (p.vx - ball.vx) * nx + (p.vy - ball.vy) * ny;
                if (impact > 0) {
                    const strength = p.stats.stealPower
                        * (p.name === 'Sergio' && p.specialActive > 0 ? 1.75 : 1);
                    ball.vx += nx * (impact * 1.2 * strength + 1.5 * strength);
                    ball.vy += ny * (impact * 1.2 * strength + 1.5 * strength);
                    p.registerTouch();
                    this.callbacks.onBallTouch(p);
                }
            }
        });

        if (ball.y - ball.radius < roadTop + 6) {
            ball.y = roadTop + 6 + ball.radius;
            ball.vy = Math.abs(ball.vy) * 0.8;
        } else if (ball.y + ball.radius > roadBottom - 6) {
            ball.y = roadBottom - 6 - ball.radius;
            ball.vy = -Math.abs(ball.vy) * 0.8;
        }

        const midY = (roadTop + roadBottom) / 2;
        const goalTop = midY - goalHeight / 2;
        const goalBot = midY + goalHeight / 2;

        const posts = [
            { x: fieldLeft, y: goalTop },
            { x: fieldLeft, y: goalBot },
            { x: fieldRight, y: goalTop },
            { x: fieldRight, y: goalBot }
        ];

        posts.forEach((pt) => {
            const dx = ball.x - pt.x;
            const dy = ball.y - pt.y;
            const d = Math.hypot(dx, dy);
            if (d < ball.radius + 7 && d > 0) {
                const nx = dx / d;
                const ny = dy / d;
                ball.x = pt.x + nx * (ball.radius + 7);
                ball.y = pt.y + ny * (ball.radius + 7);
                const dot = ball.vx * nx + ball.vy * ny;
                ball.vx = (ball.vx - 2 * dot * nx) * 0.85;
                ball.vy = (ball.vy - 2 * dot * ny) * 0.85;
                this.sfx.post();
            }
        });

        const inGoal = ball.y > goalTop && ball.y < goalBot;
        if (ball.x - ball.radius < fieldLeft) {
            if (inGoal) {
                if (ball.x < fieldLeft - 10) {
                    ball.stopAt(
                        fieldLeft - 18,
                        Math.max(goalTop + ball.radius, Math.min(goalBot - ball.radius, ball.y))
                    );
                    this.callbacks.onGoal('red');
                }
            } else {
                ball.x = fieldLeft + ball.radius;
                ball.vx = Math.abs(ball.vx) * 0.82;
            }
        }
        if (ball.x + ball.radius > fieldRight) {
            if (inGoal) {
                if (ball.x > fieldRight + 10) {
                    ball.stopAt(
                        fieldRight + 18,
                        Math.max(goalTop + ball.radius, Math.min(goalBot - ball.radius, ball.y))
                    );
                    this.callbacks.onGoal('blue');
                }
            } else {
                ball.x = fieldRight - ball.radius;
                ball.vx = -Math.abs(ball.vx) * 0.82;
            }
        }
    }
}