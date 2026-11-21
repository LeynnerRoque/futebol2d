export class StreetNPC {
    constructor({ id, type, x, y, vx = 0, dir = 1, colors }) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.dir = dir;
        this.colors = colors;
        this.cheerTimer = 0;
        this.walkPhase = Math.random() * 4;
    }

    triggerCheer(duration = 3.2) {
        this.cheerTimer = duration;
    }

    update(dt, minX, maxX) {
        if (this.cheerTimer > 0) {
            this.cheerTimer = Math.max(0, this.cheerTimer - dt);
        }

        if (this.type !== 'chair_guy') {
            const speedMult = this.cheerTimer > 0 ? 0.25 : 1;
            this.x += this.vx * speedMult * (dt * 60);
            this.walkPhase += dt * 7;

            if (this.x < minX) {
                this.x = minX;
                this.vx = Math.abs(this.vx);
                this.dir = 1;
            } else if (this.x > maxX) {
                this.x = maxX;
                this.vx = -Math.abs(this.vx);
                this.dir = -1;
            }
        }
    }
}