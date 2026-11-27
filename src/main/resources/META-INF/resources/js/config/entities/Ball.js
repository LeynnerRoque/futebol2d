export class Ball {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 12;
        this.spin = 0;
        this.superShot = false;
        this.guaranteedGoal = false;
        this.isFrozen = false;
    }

    reset(x = this.startX, y = this.startY) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.spin = 0;
        this.superShot = false;
        this.guaranteedGoal = false;
        this.isFrozen = false;
    }

    stopAt(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.isFrozen = true;
    }

    update(dt) {
        if (this.isFrozen) return;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.982;
        this.vy *= 0.982;
        this.spin += Math.hypot(this.vx, this.vy) * 0.05 * (dt * 60);
        if (Math.hypot(this.vx, this.vy) < 4) {
            this.superShot = false;
        }
    }
}