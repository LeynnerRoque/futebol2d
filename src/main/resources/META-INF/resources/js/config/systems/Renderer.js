export class Renderer {
    constructor(ctx, bounds) {
        this.ctx = ctx;
        this.bounds = bounds;
        this.rainDrops = Array.from({ length: 85 }, () => ({
            x: Math.random() * bounds.width,
            y: Math.random() * bounds.height,
            speed: 8 + Math.random() * 6,
            len: 10 + Math.random() * 8
        }));
    }

    updateRain(dt, isRaining) {
        if (!isRaining) return;
        const { width, height } = this.bounds;
        this.rainDrops.forEach((drop) => {
            drop.x -= drop.speed * 0.35 * (dt * 60);
            drop.y += drop.speed * (dt * 60);
            if (drop.y > height || drop.x < 0) {
                drop.x = Math.random() * (width + 120);
                drop.y = -15;
            }
        });
    }

    render(sceneState) {
        const { ctx, bounds } = this;
        ctx.clearRect(0, 0, bounds.width, bounds.height);

        this.drawStreet(sceneState.weather);
        this.drawNPCs(sceneState.npcs);
        this.drawParticles(sceneState.particles);
        this.drawPlayers(sceneState.players, sceneState.celebration);
        this.drawBallAndAvocados(sceneState.ball, sceneState.avocados);

        if (sceneState.weather.isRaining) {
            this.drawRain();
        }

        if (sceneState.weather.isNight) {
            ctx.fillStyle = 'rgba(10, 18, 45, 0.38)';
            ctx.fillRect(0, 0, bounds.width, bounds.height);
        }
    }

    drawStreet(weather) {
        const { ctx, bounds } = this;
        const { width: w, height: h, roadTop, roadBottom, fieldLeft, fieldRight, goalHeight } = bounds;

        ctx.fillStyle = weather.isNight ? '#0f172a' : weather.isRaining ? '#64748b' : '#38bdf8';
        ctx.fillRect(0, 0, w, 95);

        if (weather.isNight) {
            ctx.fillStyle = '#f8fafc';
            [[140, 22], [480, 14], [730, 26], [1020, 16]].forEach(([sx, sy]) => {
                ctx.fillRect(sx, sy, 3, 3);
            });
        }

        const houses = [
            { x: 20, w: 195, wall: '#fef08a', roof: '#b91c1c', door: '#78350f' },
            { x: 295, w: 220, wall: '#fed7aa', roof: '#9a3412', door: '#451a03' },
            { x: 540, w: 210, wall: '#bbf7d0', roof: '#15803d', door: '#713f12' },
            { x: 775, w: 200, wall: '#e0e7ff', roof: '#1d4ed8', door: '#1e293b' },
            { x: 995, w: 190, wall: '#fbcfe8', roof: '#be185d', door: '#4c0519' }
        ];

        houses.forEach((house) => {
            ctx.fillStyle = weather.isNight ? '#334155' : house.wall;
            ctx.fillRect(house.x, 28, house.w, 68);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 3;
            ctx.strokeRect(house.x, 28, house.w, 68);

            ctx.fillStyle = house.roof;
            ctx.beginPath();
            ctx.moveTo(house.x - 8, 28);
            ctx.lineTo(house.x + house.w / 2, 4);
            ctx.lineTo(house.x + house.w + 8, 28);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = house.door;
            ctx.fillRect(house.x + 24, 52, 26, 44);

            ctx.fillStyle = weather.isNight ? '#fde047' : '#bae6fd';
            ctx.fillRect(house.x + 72, 46, 34, 26);
            ctx.strokeRect(house.x + 72, 46, 34, 26);
            if (house.w > 200) {
                ctx.fillRect(house.x + 125, 46, 34, 26);
                ctx.strokeRect(house.x + 125, 46, 34, 26);
            }
        });

        // Poste de energia
        ctx.fillStyle = '#64748b';
        ctx.fillRect(236, 6, 14, 136);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(236, 6, 14, 136);
        ctx.fillStyle = '#334155';
        ctx.fillRect(210, 18, 66, 8);
        ctx.fillRect(222, 32, 22, 28);

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 14);
        ctx.quadraticCurveTo(120, 28, 215, 20);
        ctx.quadraticCurveTo(650, 42, w, 16);
        ctx.stroke();

        // Calçadas e asfalto
        ctx.fillStyle = weather.isRaining ? '#94a3b8' : '#cbd5e1';
        ctx.fillRect(0, 96, w, roadTop - 96);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, roadTop - 8, w, 8);

        ctx.fillStyle = weather.isRaining ? '#1e293b' : '#334155';
        ctx.fillRect(0, roadTop, w, roadBottom - roadTop);

        const midY = (roadTop + roadBottom) / 2;
        ctx.fillStyle = '#facc15';
        for (let x = 20; x < w; x += 70) {
            ctx.fillRect(x, midY - 3, 38, 6);
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(w / 2, roadTop + 6);
        ctx.lineTo(w / 2, roadBottom - 6);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(w / 2, midY, 64, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, roadBottom, w, 8);
        ctx.fillStyle = weather.isRaining ? '#94a3b8' : '#cbd5e1';
        ctx.fillRect(0, roadBottom + 8, w, h - (roadBottom + 8));

        const goalTop = midY - goalHeight / 2;
        const goalBot = midY + goalHeight / 2;
        this.drawGoalPosts(fieldLeft, goalTop, goalBot);
        this.drawGoalPosts(fieldRight, goalTop, goalBot);
    }

    drawGoalPosts(x, topY, botY) {
        const { ctx } = this;
        const depth = 26;
        const direction = x < this.bounds.width / 2 ? -1 : 1;
        const backX = x + direction * depth;

        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
        ctx.fillRect(Math.min(x, backX), topY, depth, botY - topY);
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.48)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let y = topY + 8; y < botY; y += 8) {
            ctx.moveTo(x, y);
            ctx.lineTo(backX, y);
        }
        for (let netX = x + direction * 7; direction > 0 ? netX < backX : netX > backX; netX += direction * 7) {
            ctx.moveTo(netX, topY);
            ctx.lineTo(netX, botY);
        }
        ctx.stroke();

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 7;
        ctx.lineCap = 'square';
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(backX, topY);
        ctx.moveTo(x, botY);
        ctx.lineTo(backX, botY);
        ctx.moveTo(backX, topY);
        ctx.lineTo(backX, botY);
        ctx.stroke();

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(backX, topY);
        ctx.moveTo(x, botY);
        ctx.lineTo(backX, botY);
        ctx.moveTo(backX, topY);
        ctx.lineTo(backX, botY);
        ctx.stroke();
        ctx.restore();
    }

    drawNPCs(npcs) {
        const { ctx } = this;
        npcs.forEach((npc) => {
            ctx.save();
            const jump = npc.cheerTimer > 0 ? Math.abs(Math.sin(npc.cheerTimer * 12)) * 10 : 0;
            const x = Math.round(npc.x);
            const y = Math.round(npc.y - jump);

            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(x - 12, npc.y + 14, 24, 6);

            if (npc.type === 'chair_guy') {
                ctx.fillStyle = '#0284c7';
                ctx.fillRect(x - 14, y - 6, 28, 20);
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = 3;
                ctx.strokeRect(x - 14, y - 6, 28, 20);

                ctx.fillStyle = npc.colors.shorts;
                ctx.fillRect(x - 10, y + 4, 22, 10);
                ctx.fillStyle = npc.colors.shirt;
                ctx.fillRect(x - 10, y - 14, 20, 18);
                ctx.fillStyle = npc.colors.skin;
                ctx.fillRect(x - 8, y - 28, 16, 14);
                if (npc.cheerTimer > 0) {
                    ctx.fillStyle = npc.colors.skin;
                    ctx.fillRect(x - 15, y - 28, 5, 16);
                    ctx.fillRect(x + 10, y - 28, 5, 16);
                }
            } else if (npc.type === 'bald_belly') {
                const step = Math.sin(npc.walkPhase) * 3;
                ctx.fillStyle = npc.colors.skin;
                ctx.fillRect(x - 8, y + 8, 6, 10 + step);
                ctx.fillRect(x + 2, y + 8, 6, 10 - step);
                ctx.fillStyle = npc.colors.shorts;
                ctx.fillRect(x - 11, y, 22, 10);
                ctx.fillStyle = npc.colors.shirt;
                ctx.fillRect(x - 14, y - 18, 28, 20);
                ctx.fillStyle = npc.colors.skin;
                ctx.fillRect(x - 9, y - 33, 18, 15);
                ctx.fillStyle = '#fff';
                ctx.fillRect(x - 4, y - 31, 4, 3);
            } else {
                const step = Math.sin(npc.walkPhase) * 3;
                ctx.fillStyle = npc.colors.skin;
                ctx.fillRect(x - 6, y + 8, 5, 10 + step);
                ctx.fillRect(x + 1, y + 8, 5, 10 - step);
                ctx.fillStyle = npc.colors.dress;
                ctx.fillRect(x - 10, y - 14, 20, 23);
                ctx.fillStyle = npc.colors.skin;
                ctx.fillRect(x - 8, y - 28, 16, 14);
                ctx.fillStyle = npc.colors.hair;
                ctx.fillRect(x - 10, y - 31, 20, 7);
                ctx.fillRect(x - 11, y - 26, 5, 16);
                ctx.fillRect(x + 6, y - 26, 5, 16);
            }

            if (npc.cheerTimer > 0) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(x - 16, y - 50, 32, 16);
                ctx.fillStyle = '#dc2626';
                ctx.font = 'bold 10px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('GOL!', x, y - 38);
            }
            ctx.restore();
        });
    }

    drawPlayers(players, celebration) {
        const { ctx } = this;
        players.forEach((p) => {
            ctx.save();
            const x = Math.round(p.x);
            const y = Math.round(p.y);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
            ctx.fillRect(x - 14, y + 16, 28, 7);

            if (p.fallenTimer > 0) {
                ctx.translate(x, y + 10);
                ctx.rotate(Math.PI / 2);
                this.drawSpriteBody(p, 0, 0, true, celebration);
                ctx.restore();
                this.drawPlayerTag(p, x, y - 22);
                return;
            }

            if (celebration?.player?.id === p.id && celebration.type === 'slow_pushups' && celebration.timer <= 2.1) {
                const pushOffset = Math.sin(p.animFrame * 1.3) * 4;
                ctx.fillStyle = p.stats.skin;
                ctx.fillRect(x - 18, y + 8 + pushOffset, 34, 9);
                ctx.fillStyle = p.stats.shortsColor;
                ctx.fillRect(x - 20, y + 7 + pushOffset, 14, 10);
                ctx.fillStyle = p.stats.hairColor;
                ctx.fillRect(x + 12, y + 3 + pushOffset, 10, 10);
                ctx.restore();
                this.drawPlayerTag(p, x, y - 16);
                return;
            }

            let jumpY = 0;
            if (celebration?.player?.id === p.id && (celebration.type === 'run_air_kick' || celebration.type === 'spin_punch')) {
                jumpY = -Math.abs(Math.sin(p.animFrame * 0.9)) * 16;
            }

            this.drawSpriteBody(p, x, y + jumpY, false, celebration);
            ctx.restore();
            this.drawPlayerTag(p, x, y + jumpY - 38);
        });
    }

    drawSpriteBody(p, x, y, isFallen, celebration) {
        const { ctx } = this;
        const st = p.stats;
        const step = isFallen ? 0 : Math.sin(p.animFrame) * 4;

        ctx.fillStyle = st.skin;
        ctx.fillRect(x - 9, y + 6, 7, 11 + step);
        ctx.fillRect(x + 2, y + 6, 7, 11 - step);
        ctx.fillRect(x - 10, y + 15 + step, 9, 3);
        ctx.fillRect(x + 1, y + 15 - step, 9, 3);

        ctx.fillStyle = st.shortsColor;
        ctx.fillRect(x - 11, y - 2, 22, 10);
        if (st.shortsPattern === 'floral') {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(x - 8, y, 4, 4);
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(x + 3, y + 2, 4, 4);
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(x - 2, y + 4, 4, 3);
        }

        if (st.shirtColor) {
            ctx.fillStyle = st.shirtColor;
            ctx.fillRect(x - 12, y - 19, 24, 18);
            if (st.longSleeve) {
                ctx.fillRect(x - 16, y - 18, 4, 15);
                ctx.fillRect(x + 12, y - 18, 4, 15);
                ctx.fillStyle = st.skin;
                ctx.fillRect(x - 16, y - 3, 4, 4);
                ctx.fillRect(x + 12, y - 3, 4, 4);
            } else {
                ctx.fillRect(x - 16, y - 18, 4, 7);
                ctx.fillRect(x + 12, y - 18, 4, 7);
                ctx.fillStyle = st.skin;
                ctx.fillRect(x - 16, y - 11, 4, 10);
                ctx.fillRect(x + 12, y - 11, 4, 10);
            }
            if (st.shirtNumber) {
                ctx.fillStyle = '#facc15';
                ctx.font = 'bold 8px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText(st.shirtNumber, x, y - 7);
            }
        } else {
            ctx.fillStyle = st.skin;
            ctx.fillRect(x - 12, y - 19, 24, 18);
            ctx.fillRect(x - 16, y - 18, 4, 15);
            ctx.fillRect(x + 12, y - 18, 4, 15);
            ctx.fillStyle = p.team === 'blue' ? '#3b82f6' : '#ef4444';
            ctx.fillRect(x - 16, y - 14, 4, 4);
            ctx.fillRect(x + 12, y - 14, 4, 4);
        }

        if (celebration?.player?.id === p.id && celebration.type === 'spin_punch') {
            ctx.fillStyle = st.skin;
            ctx.fillRect(x + 12, y - 32, 5, 16);
        }

        ctx.fillStyle = st.skin;
        ctx.fillRect(x - 9, y - 33, 18, 14);

        ctx.fillStyle = '#09090b';
        const eyeX = p.facing > 0 ? x + 2 : x - 7;
        ctx.fillRect(eyeX, y - 28, 3, 3);
        ctx.fillRect(eyeX + 5, y - 28, 3, 3);

        if (st.hatColor) {
            ctx.fillStyle = st.hatColor;
            ctx.fillRect(x - 10, y - 36, 20, 6);
            const visorX = p.facing > 0 ? x - 16 : x + 9;
            ctx.fillRect(visorX, y - 33, 7, 3);
        } else if (st.curlyHair) {
            ctx.fillStyle = st.hairColor;
            ctx.fillRect(x - 11, y - 37, 22, 6);
            ctx.fillRect(x - 11, y - 34, 4, 6);
            ctx.fillRect(x + 7, y - 34, 4, 6);
        } else {
            ctx.fillStyle = st.hairColor;
            ctx.fillRect(x - 10, y - 36, 20, 6);
            ctx.fillRect(x - 10, y - 33, 3, 5);
            ctx.fillRect(x + 7, y - 33, 3, 5);
        }
    }

    drawPlayerTag(p, x, y) {
        const { ctx } = this;
        const teamColor = p.team === 'blue' ? '#3b82f6' : '#ef4444';
        ctx.font = 'bold 12px "Chakra Petch", sans-serif';
        const w = ctx.measureText(p.name).width + 12;

        ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
        ctx.fillRect(x - w / 2, y - 10, w, 16);
        ctx.strokeStyle = teamColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - w / 2, y - 10, w, 16);

        ctx.fillStyle = p.isHuman ? '#facc15' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, x, y + 2);
    }

    drawBallAndAvocados(ball, avocados) {
        const { ctx } = this;
        avocados.forEach((av) => {
            ctx.fillStyle = '#365314';
            ctx.beginPath();
            ctx.ellipse(av.x, av.y, 7, 9, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#a3e635';
            ctx.beginPath();
            ctx.ellipse(av.x, av.y, 4, 6, 0.3, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(ball.x - 10, ball.y + 9, 20, 5);

        if (ball.superShot) {
            ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
            ctx.beginPath();
            ctx.arc(ball.x - ball.vx * 1.2, ball.y - ball.vy * 1.2, ball.radius + 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(ball.x, ball.y);
        ctx.rotate(ball.spin);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-10, -10, 20, 20);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-4, -4, 8, 8);
        ctx.fillRect(-10, -10, 5, 5);
        ctx.fillRect(5, 5, 5, 5);
        ctx.restore();
    }

    drawParticles(particles) {
        const { ctx } = this;
        particles.forEach((pt) => {
            ctx.globalAlpha = Math.max(0, pt.life);
            ctx.fillStyle = pt.color;
            ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        });
        ctx.globalAlpha = 1;
    }

    drawRain() {
        const { ctx } = this;
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.rainDrops.forEach((drop) => {
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x - drop.len * 0.35, drop.y + drop.len);
        });
        ctx.stroke();
    }
}