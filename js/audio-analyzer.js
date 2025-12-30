// 音频分析器 - 自动生成谱面
class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.detectedBeats = [];
        this.bpm = 120;
        this.sensitivity = 1.5; // 默认灵敏度
    }

    // 加载音频文件
    async loadAudioFile(file) {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            console.log('音频加载成功:', {
                duration: this.audioBuffer.duration,
                sampleRate: this.audioBuffer.sampleRate,
                channels: this.audioBuffer.numberOfChannels
            });

            return true;
        } catch (error) {
            console.error('音频加载失败:', error);
            return false;
        }
    }

    // 分析音频并生成谱面
    async analyzeBeatmap() {
        if (!this.audioBuffer) {
            throw new Error('请先加载音频文件');
        }

        console.log('开始分析音频...');

        // 1. 检测BPM
        this.bpm = await this.detectBPM();
        console.log('检测到BPM:', this.bpm);

        // 2. 检测节拍点
        this.detectedBeats = await this.detectBeats();
        console.log('检测到节拍数:', this.detectedBeats.length);

        // 3. 生成谱面
        const beatmap = this.generateBeatmapFromBeats();
        console.log('生成谱面:', beatmap);

        return {
            bpm: this.bpm,
            beats: this.detectedBeats,
            beatmap: beatmap,
            duration: this.audioBuffer.duration
        };
    }

    // 检测BPM（简化版）
    async detectBPM() {
        const sampleRate = this.audioBuffer.sampleRate;
        const channelData = this.audioBuffer.getChannelData(0);

        // 分析前30秒
        const analyzeLength = Math.min(30 * sampleRate, channelData.length);

        // 计算能量
        const windowSize = Math.floor(sampleRate * 0.05); // 50ms窗口
        const energies = [];

        for (let i = 0; i < analyzeLength; i += windowSize) {
            let energy = 0;
            for (let j = 0; j < windowSize && i + j < analyzeLength; j++) {
                energy += Math.abs(channelData[i + j]);
            }
            energies.push(energy / windowSize);
        }

        // 找出峰值
        const peaks = this.findPeaks(energies);

        if (peaks.length < 2) {
            return 120; // 默认BPM
        }

        // 计算间隔
        const intervals = [];
        for (let i = 1; i < Math.min(peaks.length, 50); i++) {
            const interval = (peaks[i] - peaks[i - 1]) * windowSize / sampleRate;
            if (interval > 0.3 && interval < 2) { // 过滤不合理的间隔
                intervals.push(interval);
            }
        }

        if (intervals.length === 0) {
            return 120;
        }

        // 计算平均间隔
        const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        const bpm = Math.round(60 / avgInterval);

        // 限制在合理范围
        return Math.max(60, Math.min(200, bpm));
    }

    // 改进的节拍检测
    async detectBeats() {
        const sampleRate = this.audioBuffer.sampleRate;
        const channelData = this.audioBuffer.getChannelData(0);

        // 使用更小的窗口以获得更好的时间分辨率
        const windowSize = Math.floor(sampleRate * 0.02); // 20ms窗口
        const hopSize = Math.floor(windowSize / 2); // 50%重叠

        const energies = [];
        const timestamps = [];

        // 计算低频能量（主要是kick和bass）
        for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
            let energy = 0;

            // 使用汉宁窗减少边缘效应
            for (let j = 0; j < windowSize; j++) {
                const windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * j / windowSize));
                const sample = channelData[i + j];
                energy += (sample * sample * windowValue);
            }

            energies.push(Math.sqrt(energy / windowSize));
            timestamps.push(i / sampleRate);
        }

        // 对能量进行平滑处理
        const smoothedEnergies = this.smoothEnergies(energies, 3);

        // 自适应阈值检测
        const localAvgWindow = 40; // 约800ms的窗口
        const beats = [];
        const minInterval = 60000 / 200; // 最快200 BPM
        const maxInterval = 60000 / 60;  // 最慢60 BPM

        for (let i = localAvgWindow; i < smoothedEnergies.length - localAvgWindow; i++) {
            // 计算局部平均和标准差
            const localWindow = smoothedEnergies.slice(i - localAvgWindow, i + localAvgWindow);
            const localMean = localWindow.reduce((a, b) => a + b) / localWindow.length;
            const localStd = Math.sqrt(
                localWindow.reduce((sum, val) => sum + Math.pow(val - localMean, 2), 0) / localWindow.length
            );

            // 动态阈值（使用可调灵敏度）
            const threshold = localMean + this.sensitivity * localStd;

            // 检测峰值
            if (smoothedEnergies[i] > threshold &&
                smoothedEnergies[i] > smoothedEnergies[i - 1] &&
                smoothedEnergies[i] > smoothedEnergies[i + 1]) {

                const time = timestamps[i] * 1000;

                // 避免重复检测
                if (beats.length === 0) {
                    beats.push(time);
                } else {
                    const lastBeat = beats[beats.length - 1];
                    const interval = time - lastBeat;

                    if (interval >= minInterval && interval <= maxInterval) {
                        beats.push(time);
                    }
                }
            }
        }

        console.log('检测到原始节拍数:', beats.length);

        // 使用BPM进行节拍对齐和补充
        const alignedBeats = this.alignBeatsWithBPM(beats);

        return alignedBeats;
    }

    // 平滑能量曲线
    smoothEnergies(energies, windowSize) {
        const smoothed = [];
        for (let i = 0; i < energies.length; i++) {
            let sum = 0;
            let count = 0;
            for (let j = -windowSize; j <= windowSize; j++) {
                if (i + j >= 0 && i + j < energies.length) {
                    sum += energies[i + j];
                    count++;
                }
            }
            smoothed.push(sum / count);
        }
        return smoothed;
    }

    // 使用BPM对齐节拍
    alignBeatsWithBPM(detectedBeats) {
        if (detectedBeats.length < 4) return detectedBeats;

        const beatInterval = (60 / this.bpm) * 1000;
        const alignedBeats = [detectedBeats[0]];

        // 从第一个节拍开始，按BPM生成规律节拍
        const duration = this.audioBuffer.duration * 1000;

        for (let expectedTime = detectedBeats[0]; expectedTime < duration; expectedTime += beatInterval) {
            // 在期望时间附近寻找实际检测到的节拍
            const tolerance = beatInterval * 0.3; // 30%容差
            const nearbyBeat = detectedBeats.find(beat =>
                Math.abs(beat - expectedTime) < tolerance &&
                beat > alignedBeats[alignedBeats.length - 1]
            );

            if (nearbyBeat) {
                alignedBeats.push(nearbyBeat);
            } else {
                // 如果没有检测到，就按BPM添加
                alignedBeats.push(expectedTime);
            }
        }

        console.log('对齐后节拍数:', alignedBeats.length);
        return alignedBeats;
    }

    // 找出峰值
    findPeaks(data) {
        const peaks = [];
        const threshold = data.reduce((a, b) => a + b) / data.length * 1.5;

        for (let i = 1; i < data.length - 1; i++) {
            if (data[i] > threshold &&
                data[i] > data[i - 1] &&
                data[i] > data[i + 1]) {
                peaks.push(i);
            }
        }

        return peaks;
    }

    // 从检测到的节拍生成谱面
    generateBeatmapFromBeats() {
        const beatmap = [];

        this.detectedBeats.forEach((time, index) => {
            // 随机分配到左右轨道，但尽量交替
            const lane = index % 2 === 0 ? 'left' : 'right';

            // 有时候两个轨道同时出现（增加难度）
            const isBothLanes = Math.random() < 0.1; // 10%概率

            beatmap.push({
                time: time,
                lane: lane
            });

            if (isBothLanes) {
                beatmap.push({
                    time: time,
                    lane: lane === 'left' ? 'right' : 'left'
                });
            }
        });

        // 按时间排序
        beatmap.sort((a, b) => a.time - b.time);

        return beatmap;
    }

    // 播放加载的音频
    async playAudio() {
        if (!this.audioBuffer || !this.audioContext) {
            console.error('音频未加载或AudioContext未初始化');
            return null;
        }

        // 确保AudioContext处于运行状态
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = this.audioBuffer;
        gainNode.gain.value = 0.8; // 设置音量

        // 连接音频图
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(0);

        console.log('开始播放上传的音频，时长:', this.audioBuffer.duration, '秒');

        return source;
    }
}
