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
    }

    reset(x = this.startX, y = this.startY) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.spin = 0;
        this.superShot = false;
    }

    update(dt) {
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