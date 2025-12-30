// 音频系统类
class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.isInitialized = false;
        this.isMuted = false;

        // 背景音乐相关
        this.bgmOscillator = null;
        this.bgmStartTime = 0;

        // 自定义音效
        this.customSounds = {
            huluobo: null,
            zhijin: null,
            combo: null,
            zhenbang: null
        };
    }

    // 初始化音频上下文（需要用户交互）
    init() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 创建主音量控制
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);

            // 创建背景音乐音量控制
            this.bgmGain = this.audioContext.createGain();
            this.bgmGain.gain.value = 0.3;
            this.bgmGain.connect(this.masterGain);

            // 创建音效音量控制
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = 0.5;
            this.sfxGain.connect(this.masterGain);

            this.isInitialized = true;
        } catch (error) {
            console.error('音频初始化失败:', error);
        }
    }

    // 播放背景音乐（简单的电子音乐）
    playBackgroundMusic() {
        if (!this.isInitialized) return;

        this.stopBackgroundMusic();

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        this.bgmStartTime = now;

        // 创建一个简单的旋律循环
        this.createMelodyLoop(now);

        // 创建节拍
        this.createBeatLoop(now);
    }

    createMelodyLoop(startTime) {
        const ctx = this.audioContext;
        const beatDuration = 60 / BPM;

        // 简单的旋律音符序列 (MIDI音符)
        const melody = [60, 64, 67, 72, 67, 64, 60, 62]; // C大调音阶

        melody.forEach((note, index) => {
            const time = startTime + index * beatDuration;
            this.playMelodyNote(note, time, beatDuration * 0.8);
        });

        // 循环播放
        const loopDuration = melody.length * beatDuration;
        setTimeout(() => {
            if (this.bgmOscillator) {
                this.createMelodyLoop(ctx.currentTime);
            }
        }, loopDuration * 1000);
    }

    createBeatLoop(startTime) {
        const ctx = this.audioContext;
        const beatDuration = 60 / BPM;

        // 创建更强的电子音乐节奏
        for (let i = 0; i < 8; i++) {
            const time = startTime + i * beatDuration;

            // 四四拍的kick鼓 (每拍)
            this.playKick(time);

            // Snare鼓 (2和4拍)
            if (i % 4 === 1 || i % 4 === 3) {
                this.playSnare(time);
            }

            // Hi-hat (每半拍)
            this.playHiHat(time);
            this.playHiHat(time + beatDuration / 2);
        }

        // 循环播放
        const loopDuration = 8 * beatDuration;
        setTimeout(() => {
            if (this.bgmOscillator) {
                this.createBeatLoop(ctx.currentTime);
            }
        }, loopDuration * 1000);
    }

    playMelodyNote(midiNote, time, duration) {
        const ctx = this.audioContext;
        const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.value = frequency;

        gain.gain.value = 0;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(time);
        osc.stop(time + duration);
    }

    // Kick鼓 - 重低音，每拍响一次
    playKick(time) {
        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.5);

        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    // Snare鼓 - 清脆的军鼓声
    playSnare(time) {
        const ctx = this.audioContext;

        // 使用白噪音模拟snare
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.bgmGain);

        noise.start(time);
        noise.stop(time + 0.2);

        // 添加音调成分
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = 200;

        oscGain.gain.setValueAtTime(0.2, time);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

        osc.connect(oscGain);
        oscGain.connect(this.bgmGain);

        osc.start(time);
        osc.stop(time + 0.1);
    }

    // Hi-hat - 高频的镲片声
    playHiHat(time) {
        const ctx = this.audioContext;

        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        noise.start(time);
        noise.stop(time + 0.05);
    }

    stopBackgroundMusic() {
        if (this.bgmOscillator) {
            this.bgmOscillator = null;
        }
    }

    // 播放击打音效
    playHitSound(judgment) {
        if (!this.isInitialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        let frequency, duration;

        switch (judgment) {
            case JUDGMENT.PERFECT:
                frequency = 1200;
                duration = 0.15;
                break;
            case JUDGMENT.GOOD:
                frequency = 800;
                duration = 0.12;
                break;
            case JUDGMENT.MISS:
                frequency = 200;
                duration = 0.08;
                break;
        }

        // 创建音效
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = judgment === JUDGMENT.MISS ? 'sawtooth' : 'sine';
        osc.frequency.value = frequency;

        gain.gain.value = 0;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + duration);
    }

    // 播放按键音效
    playKeySound() {
        if (!this.isInitialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 600;

        gain.gain.value = 0;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // 获取当前音乐时间（毫秒）
    getCurrentMusicTime() {
        if (!this.isInitialized || !this.bgmStartTime) return 0;
        return (this.audioContext.currentTime - this.bgmStartTime) * 1000;
    }

    // 切换静音
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.masterGain.gain.value = this.isMuted ? 0 : 1;
        return this.isMuted;
    }

    // 加载自定义音效文件
    async loadCustomSounds() {
        if (!this.isInitialized) {
            console.log('初始化音频系统以加载自定义音效');
            this.init();
        }

        const soundFiles = {
            huluobo: 'huluobo.MP3',
            zhijin: 'zhijin.MP3',
            combo: 'zhijin.MP3', // 连击也使用zhijin音效
            zhenbang: 'zhenbang.MP3' // 真棒音效
        };

        console.log('开始加载自定义音效文件...');

        for (let key in soundFiles) {
            try {
                console.log(`正在加载: ${key} (${soundFiles[key]})`);
                const response = await fetch(soundFiles[key]);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                console.log(`${key} 文件下载完成，正在解码...`);

                this.customSounds[key] = await this.audioContext.decodeAudioData(arrayBuffer);
                console.log(`✅ 自定义音效加载成功: ${key} (时长: ${this.customSounds[key].duration.toFixed(2)}秒)`);
            } catch (error) {
                console.error(`❌ 自定义音效加载失败: ${key} (${soundFiles[key]})`, error);
                this.customSounds[key] = null;
            }
        }

        console.log('自定义音效加载完成，状态:', this.customSounds);
    }

    // 播放自定义音效
    playCustomSound(soundName) {
        if (!this.isInitialized) {
            console.warn('音频系统未初始化，无法播放:', soundName);
            return;
        }

        if (!this.customSounds[soundName]) {
            console.warn('自定义音效未加载:', soundName);
            return;
        }

        console.log('播放自定义音效:', soundName);

        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = this.customSounds[soundName];

            const gain = this.audioContext.createGain();
            gain.gain.value = 0.6;

            source.connect(gain);
            gain.connect(this.sfxGain);

            source.start(0);
            console.log('音效播放成功:', soundName);
        } catch (error) {
            console.error('播放音效失败:', soundName, error);
        }
    }
}
