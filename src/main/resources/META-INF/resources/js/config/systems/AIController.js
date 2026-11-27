export class AIController {
    constructor(bounds) {
        this.bounds = bounds;
    }

    computeMove(player, ball, teammates, onActivateSpecial) {
        const { fieldLeft, fieldRight, roadTop, roadBottom, width } = this.bounds;
        const midY = (roadTop + roadBottom) / 2;
        const isBlue = player.team === 'blue';
        const oppGoalX = isBlue ? fieldRight : fieldLeft;
        const ownGoalX = isBlue ? fieldLeft : fieldRight;

        const distBall = Math.hypot(ball.x - player.x, ball.y - player.y);
        if (player.canActivateSpecial() && distBall < 150) {
            onActivateSpecial(player);
        }

        const mate = teammates.find((m) => m.team === player.team && m.id !== player.id);
        const distMate = mate ? Math.hypot(ball.x - mate.x, ball.y - mate.y) : 9999;

        let tx = ball.x;
        let ty = ball.y;
        let kick = false;

        if (distBall <= distMate + 12) {
            const angToGoal = Math.atan2(midY - ball.y, oppGoalX - ball.x);
            tx = ball.x - Math.cos(angToGoal) * 16;
            ty = ball.y - Math.sin(angToGoal) * 16;
            if (distBall < player.radius + ball.radius + 16) {
                kick = true;
            }
        } else {
            const inOwnHalf = isBlue ? ball.x < width / 2 : ball.x > width / 2;
            if (inOwnHalf) {
                tx = ownGoalX + (ball.x - ownGoalX) * 0.4;
                ty = midY + (ball.y - midY) * 0.55;
            } else {
                tx = isBlue ? Math.min(width * 0.76, ball.x + 55) : Math.max(width * 0.24, ball.x - 55);
                ty = ball.y > midY ? roadTop + 65 : roadBottom - 65;
            }
        }

        const dx = tx - player.x;
        const dy = ty - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) {
            return { mx: 0, my: 0, kick };
        }

        return {
            mx: (dx / dist) * 0.88,
            my: (dy / dist) * 0.88,
            kick
        };
    }
}