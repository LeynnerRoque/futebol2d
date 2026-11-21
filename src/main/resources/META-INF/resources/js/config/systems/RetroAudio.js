export class RetroAudio {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    tone(freq, dur, type = 'square', vol = 0.15, delay = 0) {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + delay + dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + dur);
    }

    kick() {
        this.tone(150, 0.12, 'triangle', 0.35);
    }

    post() {
        this.tone(480, 0.18, 'square', 0.22);
    }

    special() {
        this.tone(330, 0.1, 'square', 0.2, 0);
        this.tone(495, 0.1, 'square', 0.2, 0.08);
        this.tone(660, 0.22, 'square', 0.25, 0.16);
    }

    whistle(long = false) {
        this.tone(2600, long ? 0.55 : 0.22, 'square', 0.12);
    }

    goal() {
        const notes = [261.6, 329.6, 392.0, 523.2, 659.2];
        notes.forEach((n, i) => this.tone(n, 0.18, 'square', 0.18, i * 0.08));
    }

    suckWind() {
        if (this.muted) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(620, this.ctx.currentTime + 0.9);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.95);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.96);
    }
}