export class Player {
    constructor({ id, name, stats, team, isHuman, x, y }) {
        this.id = id;
        this.name = name;
        this.stats = stats;
        this.team = team;
        this.isHuman = isHuman;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.facing = team === 'blue' ? 1 : -1;
        this.radius = 20;

        this.energy = 50;
        this.touches = 0;
        this.goals = 0;
        this.specialUnlocked = false;
        this.specialActive = 0;
        this.dribbleTimer = 0;
        this.kickCooldown = 0;
        this.fallenTimer = 0;
        this.animFrame = 0;
    }

    registerTouch() {
        this.touches += 1;
        this.energy = Math.min(100, this.energy + 10);
        this.evaluateSpecialUnlock();
    }

    registerGoal() {
        this.goals += 1;
        this.evaluateSpecialUnlock();
    }

    evaluateSpecialUnlock() {
        if (this.stats.unlockType === 'touches' && this.touches >= this.stats.unlockTarget) {
            this.specialUnlocked = true;
        } else if (this.stats.unlockType === 'goals' && this.goals >= this.stats.unlockTarget) {
            this.specialUnlocked = true;
        } else if (this.stats.unlockType === 'energy' && this.energy >= this.stats.unlockTarget) {
            this.specialUnlocked = true;
        }
    }

    hasDirectGoalShotReady() {
        return this.specialUnlocked || this.specialActive > 0;
    }

    getHudProgress() {
        if (this.stats.unlockType === 'touches') {
            const pct = Math.min(100, (this.touches / this.stats.unlockTarget) * 100);
            return {
                pct,
                label: this.specialUnlocked ? 'LIBERADO! CHUTE DIRETO' : `${this.touches}/${this.stats.unlockTarget} toques`,
                ready: this.specialUnlocked || this.specialActive > 0
            };
        }

        if (this.stats.unlockType === 'goals') {
            const pct = this.specialUnlocked ? 100 : 0;
            return {
                pct,
                label: this.specialUnlocked ? 'LIBERADO! CHUTE DIRETO' : '0/1 gol p/ liberar',
                ready: this.specialUnlocked || this.specialActive > 0
            };
        }

        const ready = this.energy >= 100 || this.specialActive > 0;
        return {
            pct: Math.min(100, this.energy),
            label: this.specialActive > 0
                ? `TURBO (${this.specialActive.toFixed(1)}s)`
                : ready ? 'PRONTO [E]' : `${Math.floor(this.energy)}%`,
            ready
        };
    }
}