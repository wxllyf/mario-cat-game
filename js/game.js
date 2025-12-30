// 游戏主类
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        this.lanes = {
            left: new Lane('left'),
            right: new Lane('right')
        };

        // 音频和谱面系统
        this.audioSystem = new AudioSystem();
        this.beatMap = new BeatMap();
        this.audioAnalyzer = new AudioAnalyzer();
        this.customAudioSource = null;
        this.useCustomAudio = false;

        this.notes = [];
        this.gameState = 'start';

        this.score = 0;
        this.lastScore = 0; // 用于追踪分数变化
        this.combo = 0;
        this.maxCombo = 0;

        this.perfectCount = 0;
        this.goodCount = 0;
        this.missCount = 0;

        this.gameStartTime = 0;

        // 猫咪状态管理
        this.catState = 'default'; // 'default', 'huluobo', 'zhijin'
        this.catTimer = null;

        // 飞行河蚌动画
        this.flyingCoins = [];

        // 当前帧击中的音符追踪
        this.currentFrameHits = new Set();
        this.frameHitTimer = null;

        this.setupUI();
        this.setupEventListeners();
    }

    setupUI() {
        this.scoreEl = document.getElementById('score');
        this.scoreIconEl = document.getElementById('score-icon');
        this.comboEl = document.getElementById('combo');
        this.accuracyEl = document.getElementById('accuracy');
        this.judgmentEl = document.getElementById('judgment');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();

            if (this.gameState === 'playing') {
                if (key === KEY_LEFT) {
                    this.handleKeyPress('left');
                    e.preventDefault();
                } else if (key === KEY_RIGHT) {
                    this.handleKeyPress('right');
                    e.preventDefault();
                }
            } else if (this.gameState === 'start' || this.gameState === 'gameOver') {
                if (e.code === 'Space' || key === 'r') {
                    this.startGame();
                    e.preventDefault();
                }
            }

            // M键切换静音
            if (key === 'm') {
                this.audioSystem.toggleMute();
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === KEY_LEFT) {
                this.lanes.left.release();
            } else if (key === KEY_RIGHT) {
                this.lanes.right.release();
            }
        });

        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.startGame());

        // 音频模式切换
        const modeRadios = document.getElementsByName('music-mode');
        modeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const fileUploadArea = document.getElementById('file-upload-area');
                if (e.target.value === 'upload') {
                    fileUploadArea.classList.remove('hidden');
                } else {
                    fileUploadArea.classList.add('hidden');
                }
            });
        });

        // 文件上传
        const audioFileInput = document.getElementById('audio-file');
        audioFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('analyze-btn').disabled = false;
                document.getElementById('manual-controls').classList.remove('hidden');
            }
        });

        // 手动BPM滑块
        document.getElementById('manual-bpm').addEventListener('input', (e) => {
            document.getElementById('manual-bpm-value').textContent = e.target.value;
        });

        // 灵敏度滑块
        document.getElementById('sensitivity').addEventListener('input', (e) => {
            document.getElementById('sensitivity-value').textContent = e.target.value;
        });

        // 分析音频
        document.getElementById('analyze-btn').addEventListener('click', async () => {
            await this.analyzeAudio();
        });

        // 预览节拍点
        document.getElementById('preview-btn').addEventListener('click', () => {
            this.visualizeBeats();
        });

        // 播放预览
        document.getElementById('play-preview-btn').addEventListener('click', async () => {
            await this.playBeatPreview();
        });

        // 重新生成
        document.getElementById('regenerate-btn').addEventListener('click', async () => {
            await this.analyzeAudio();
        });
    }

    async analyzeAudio() {
        const file = document.getElementById('audio-file').files[0];
        if (!file) return;

        const statusEl = document.getElementById('analysis-status');
        statusEl.classList.remove('hidden', 'success', 'error');
        statusEl.textContent = '正在分析音频...';

        try {
            // 加载音频
            const loaded = await this.audioAnalyzer.loadAudioFile(file);
            if (!loaded) {
                throw new Error('音频加载失败');
            }

            // 检查是否使用手动BPM
            const useManualBPM = document.getElementById('use-manual-bpm').checked;
            if (useManualBPM) {
                const manualBPM = parseInt(document.getElementById('manual-bpm').value);
                this.audioAnalyzer.bpm = manualBPM;
                console.log('使用手动BPM:', manualBPM);
            }

            // 获取灵敏度设置
            const sensitivity = parseFloat(document.getElementById('sensitivity').value);
            this.audioAnalyzer.sensitivity = sensitivity;

            // 分析生成谱面
            const result = await this.audioAnalyzer.analyzeBeatmap();

            // 保存结果供预览使用
            this.analysisResult = result;

            // 创建自定义谱面
            this.createCustomBeatmap(result);

            statusEl.classList.add('success');
            statusEl.innerHTML = `
                ✅ 分析完成！<br>
                检测到BPM: ${result.bpm}<br>
                节拍数: ${result.beats.length}<br>
                音频时长: ${Math.floor(result.duration)}秒<br>
                <strong>点击"预览节拍点"查看效果，或直接"开始游戏"！</strong>
            `;

            // 显示预览按钮
            document.getElementById('preview-btn').classList.remove('hidden');

            this.useCustomAudio = true;
        } catch (error) {
            statusEl.classList.add('error');
            statusEl.textContent = '分析失败: ' + error.message;
            console.error(error);
        }
    }

    visualizeBeats() {
        if (!this.analysisResult) return;

        const canvas = document.getElementById('beat-canvas');
        const ctx = canvas.getContext('2d');
        const beats = this.analysisResult.beats;
        const duration = this.analysisResult.duration * 1000;

        // 清空画布
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制波形（简化版）
        ctx.strokeStyle = '#4facfe';
        ctx.lineWidth = 1;
        ctx.beginPath();

        const sampleRate = this.audioAnalyzer.audioBuffer.sampleRate;
        const channelData = this.audioAnalyzer.audioBuffer.getChannelData(0);
        const step = Math.floor(channelData.length / canvas.width);

        for (let x = 0; x < canvas.width; x++) {
            const index = x * step;
            const value = channelData[index] || 0;
            const y = (value + 1) * canvas.height / 2;

            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // 绘制节拍线
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;

        beats.forEach(beatTime => {
            const x = (beatTime / duration) * canvas.width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        });

        // 绘制BPM网格
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        const beatInterval = (60 / this.analysisResult.bpm) * 1000;
        for (let time = 0; time < duration; time += beatInterval) {
            const x = (time / duration) * canvas.width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // 显示预览区域
        document.getElementById('beat-preview').classList.remove('hidden');
    }

    async playBeatPreview() {
        if (!this.audioAnalyzer.audioBuffer) return;

        // 停止之前的预览
        if (this.previewSource) {
            this.previewSource.stop();
        }

        // 播放音频
        this.previewSource = await this.audioAnalyzer.playAudio();

        // 在节拍点播放哔声
        const audioContext = this.audioAnalyzer.audioContext;
        this.analysisResult.beats.forEach(beatTime => {
            const time = audioContext.currentTime + beatTime / 1000;

            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.frequency.value = 800;
            osc.type = 'sine';

            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.start(time);
            osc.stop(time + 0.1);
        });
    }

    createCustomBeatmap(analysisResult) {
        this.beatMap = {
            notes: analysisResult.beatmap,
            currentIndex: 0,

            getNotesToSpawn: function(currentTime) {
                const spawnTime = currentTime + NOTE_FALL_TIME;
                const notesToSpawn = [];

                while (this.currentIndex < this.notes.length) {
                    const note = this.notes[this.currentIndex];

                    if (note.time <= spawnTime && !note.spawned) {
                        notesToSpawn.push(note);
                        note.spawned = true;
                        this.currentIndex++;
                    } else {
                        break;
                    }
                }

                return notesToSpawn;
            },

            reset: function() {
                this.currentIndex = 0;
                this.notes.forEach(note => {
                    note.spawned = false;
                });
            },

            isComplete: function() {
                return this.currentIndex >= this.notes.length;
            },

            getTotalDuration: function() {
                if (this.notes.length === 0) return 0;
                return this.notes[this.notes.length - 1].time + 5000;
            },

            getProgress: function(currentTime) {
                const total = this.getTotalDuration();
                return Math.min((currentTime / total) * 100, 100);
            }
        };
    }

    async startGame() {
        // 初始化音频系统（需要用户交互）
        this.audioSystem.init();

        // 确保自定义音效已加载
        console.log('检查自定义音效加载状态...');
        const allLoaded = Object.values(this.audioSystem.customSounds).every(sound => sound !== null);
        if (!allLoaded) {
            console.log('自定义音效未加载，正在加载...');
            await this.audioSystem.loadCustomSounds();
            console.log('自定义音效加载完成');
        } else {
            console.log('自定义音效已就绪');
        }

        this.gameState = 'playing';
        this.notes = [];
        this.score = 0;
        this.lastScore = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectCount = 0;
        this.goodCount = 0;
        this.missCount = 0;

        // 重置猫咪状态
        this.catState = 'default';
        if (this.catTimer) {
            clearTimeout(this.catTimer);
            this.catTimer = null;
        }

        // 重置飞行河蚌和击中追踪
        this.flyingCoins = [];
        this.currentFrameHits.clear();
        if (this.frameHitTimer) {
            clearTimeout(this.frameHitTimer);
            this.frameHitTimer = null;
        }

        // 重置谱面
        this.beatMap.reset();

        // 根据模式播放音乐
        if (this.useCustomAudio && this.audioAnalyzer.audioBuffer) {
            // 播放用户上传的音频
            console.log('播放用户上传的音乐');
            this.customAudioSource = await this.audioAnalyzer.playAudio();
            if (!this.customAudioSource) {
                alert('音频播放失败，将使用内置音乐');
                this.audioSystem.playBackgroundMusic();
            }
        } else {
            // 播放内置背景音乐
            console.log('播放内置音乐');
            this.audioSystem.playBackgroundMusic();
        }

        this.gameStartTime = Date.now();

        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');

        this.gameLoop();
    }

    handleKeyPress(lane) {
        this.lanes[lane].press();
        // 已移除默认按键音效，使用自定义音效
        // this.audioSystem.playKeySound();

        let foundNote = false;

        for (let i = 0; i < this.notes.length; i++) {
            const note = this.notes[i];

            if (note.lane === lane && !note.isHit && !note.isMissed) {
                const judgment = note.checkHit();

                if (judgment) {
                    foundNote = true;
                    note.hit(judgment);
                    this.handleJudgment(judgment, lane);
                    // 已移除默认击打音效，使用自定义音效
                    // this.audioSystem.playHitSound(judgment);
                    break;
                }
            }
        }

        if (!foundNote) {
            const nearestNote = this.findNearestNote(lane);
            if (nearestNote && Math.abs(nearestNote.y + nearestNote.size / 2 - JUDGMENT_LINE_Y) <= MISS_WINDOW) {
                this.handleJudgment(JUDGMENT.MISS);
                // 已移除默认miss音效
                // this.audioSystem.playHitSound(JUDGMENT.MISS);
            }
        }
    }

    checkCombo() {
        // 检查是否同时击中了左右两个音符
        if (this.currentFrameHits.has('left') && this.currentFrameHits.has('right')) {
            console.log('连击！同时击中左右音符');
            // 播放真棒音效
            this.audioSystem.playCustomSound('zhenbang');
            // 创建飞行河蚌
            this.createFlyingCoin();
            // 清空当前帧击中记录
            this.currentFrameHits.clear();
            return true;
        }
        return false;
    }

    createFlyingCoin() {
        // 获取分数图标的位置
        const scoreIconRect = this.scoreIconEl.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();

        // 计算目标位置（相对于canvas）
        const targetX = scoreIconRect.left - canvasRect.left + scoreIconRect.width / 2;
        const targetY = scoreIconRect.top - canvasRect.top + scoreIconRect.height / 2;

        const coin = {
            x: CANVAS_WIDTH / 2,  // 从屏幕中央开始
            y: CANVAS_HEIGHT / 2,
            targetX: targetX,
            targetY: targetY,
            size: 160,  // 初始大小（放大一倍）
            progress: 0,  // 0到1的进度
            speed: 0.05,  // 每帧增加的进度
            waitTime: 500,  // 停留时间（毫秒）
            waitTimer: 0,   // 当前已等待时间
            isWaiting: true // 是否在等待中
        };

        this.flyingCoins.push(coin);
    }

    updateFlyingCoins() {
        const deltaTime = 16.67; // 假设60fps，约16.67ms每帧

        for (let i = this.flyingCoins.length - 1; i >= 0; i--) {
            const coin = this.flyingCoins[i];

            if (coin.isWaiting) {
                // 停留期间
                coin.waitTimer += deltaTime;
                if (coin.waitTimer >= coin.waitTime) {
                    // 停留时间结束，开始飞行
                    coin.isWaiting = false;
                }
                // 停留期间保持在中央，大小保持160px
                coin.size = 160;
                continue;
            }

            // 飞行阶段
            coin.progress += coin.speed;

            // 使用缓动函数计算当前位置
            const easeProgress = this.easeOutCubic(coin.progress);
            coin.x = CANVAS_WIDTH / 2 + (coin.targetX - CANVAS_WIDTH / 2) * easeProgress;
            coin.y = CANVAS_HEIGHT / 2 + (coin.targetY - CANVAS_HEIGHT / 2) * easeProgress;

            // 逐渐缩小
            coin.size = 160 * (1 - easeProgress);

            // 到达目标或完全缩小后移除
            if (coin.progress >= 1) {
                this.flyingCoins.splice(i, 1);
            }
        }
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    drawFlyingCoins() {
        this.flyingCoins.forEach(coin => {
            const hebangImage = imageLoader.getImage('hebangFly');

            if (hebangImage && hebangImage.complete && hebangImage.naturalWidth > 0) {
                this.ctx.save();

                // 停留期间保持完全不透明，飞行时逐渐透明
                const alpha = coin.isWaiting ? 1 : (1 - coin.progress);
                this.ctx.globalAlpha = alpha;

                this.ctx.drawImage(
                    hebangImage,
                    coin.x - coin.size / 2,
                    coin.y - coin.size / 2,
                    coin.size,
                    coin.size
                );
                this.ctx.restore();
            }
        });
    }

    findNearestNote(lane) {
        let nearest = null;
        let minDistance = Infinity;

        for (let note of this.notes) {
            if (note.lane === lane && !note.isHit && !note.isMissed) {
                const distance = Math.abs(note.y + note.size / 2 - JUDGMENT_LINE_Y);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = note;
                }
            }
        }

        return nearest;
    }

    handleJudgment(judgment, lane = null) {
        this.showJudgment(judgment);

        switch (judgment) {
            case JUDGMENT.PERFECT:
                this.perfectCount++;
                this.combo++;
                this.score += SCORE_PERFECT + (this.combo * COMBO_BONUS);
                // 切换猫咪状态
                if (lane) {
                    this.switchCatState(lane);
                    // 记录当前帧击中的音符
                    this.currentFrameHits.add(lane);
                    // 设置定时器检查连击（50ms内的击中算同时）
                    if (this.frameHitTimer) {
                        clearTimeout(this.frameHitTimer);
                    }
                    this.frameHitTimer = setTimeout(() => {
                        if (!this.checkCombo()) {
                            // 单独击中，播放对应音效
                            if (lane === 'left') {
                                this.audioSystem.playCustomSound('zhijin');
                            } else if (lane === 'right') {
                                this.audioSystem.playCustomSound('huluobo');
                            }
                        }
                        this.currentFrameHits.clear();
                    }, 50);
                }
                break;
            case JUDGMENT.GOOD:
                this.goodCount++;
                this.combo++;
                this.score += SCORE_GOOD + (this.combo * COMBO_BONUS);
                // 切换猫咪状态
                if (lane) {
                    this.switchCatState(lane);
                    // 记录当前帧击中的音符
                    this.currentFrameHits.add(lane);
                    // 设置定时器检查连击（50ms内的击中算同时）
                    if (this.frameHitTimer) {
                        clearTimeout(this.frameHitTimer);
                    }
                    this.frameHitTimer = setTimeout(() => {
                        if (!this.checkCombo()) {
                            // 单独击中，播放对应音效
                            if (lane === 'left') {
                                this.audioSystem.playCustomSound('zhijin');
                            } else if (lane === 'right') {
                                this.audioSystem.playCustomSound('huluobo');
                            }
                        }
                        this.currentFrameHits.clear();
                    }, 50);
                }
                break;
            case JUDGMENT.MISS:
                this.missCount++;
                this.combo = 0;
                break;
        }

        this.maxCombo = Math.max(this.maxCombo, this.combo);
    }

    switchCatState(lane) {
        // 清除之前的定时器
        if (this.catTimer) {
            clearTimeout(this.catTimer);
        }

        // 根据轨道切换猫咪状态
        if (lane === 'left') {
            this.catState = 'zhijin'; // 左侧是纸巾
        } else if (lane === 'right') {
            this.catState = 'huluobo'; // 右侧是胡萝卜
        }

        // 100ms后恢复默认状态
        this.catTimer = setTimeout(() => {
            this.catState = 'default';
            this.catTimer = null;
        }, 100);
    }

    showJudgment(judgment) {
        this.judgmentEl.textContent = judgment.toUpperCase();
        this.judgmentEl.className = judgment;
        this.judgmentEl.classList.remove('hidden');

        setTimeout(() => {
            this.judgmentEl.classList.add('hidden');
        }, 500);
    }

    update() {
        if (this.gameState !== 'playing') return;

        const currentTime = Date.now() - this.gameStartTime;

        // 根据谱面生成音符
        const notesToSpawn = this.beatMap.getNotesToSpawn(currentTime);
        notesToSpawn.forEach(noteData => {
            this.notes.push(new Note(noteData.lane));
        });

        // 更新轨道
        this.lanes.left.update();
        this.lanes.right.update();

        // 更新音符
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            note.update();

            if (note.isMissed && !note.isHit) {
                this.handleJudgment(JUDGMENT.MISS);
                // 已移除默认miss音效
                // this.audioSystem.playHitSound(JUDGMENT.MISS);
                note.isHit = true;
            }

            if (note.shouldRemove()) {
                this.notes.splice(i, 1);
            }
        }

        // 更新飞行河蚌
        this.updateFlyingCoins();

        // 检查游戏是否结束
        if (this.beatMap.isComplete() && this.notes.length === 0) {
            setTimeout(() => this.endGame(), 2000);
        }

        this.updateUI();
    }

    updateUI() {
        // 检查分数是否增加
        if (this.score > this.lastScore) {
            // 触发分数图标动画
            this.scoreIconEl.classList.remove('score-pop');
            // 强制重绘以重新触发动画
            void this.scoreIconEl.offsetWidth;
            this.scoreIconEl.classList.add('score-pop');

            this.lastScore = this.score;
        }

        this.scoreEl.textContent = this.score;
        this.comboEl.textContent = this.combo;

        const accuracy = calculateAccuracy(this.perfectCount, this.goodCount, this.missCount);
        this.accuracyEl.textContent = accuracy + '%';
    }

    draw() {
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 背景渐变
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 绘制轨道
        this.lanes.left.draw(this.ctx);
        this.lanes.right.draw(this.ctx);

        // 绘制中央猫咪
        this.drawCat();

        // 绘制音符
        this.notes.forEach(note => note.draw(this.ctx));

        // 绘制飞行河蚌
        this.drawFlyingCoins();

        // 绘制连击显示
        this.drawComboDisplay();

        // 绘制进度条
        if (this.gameState === 'playing') {
            this.drawProgressBar();
        }
    }

    drawCat() {
        // 根据状态选择对应的猫咪图片
        let imageName;
        switch (this.catState) {
            case 'huluobo':
                imageName = 'catHuluobo';
                break;
            case 'zhijin':
                imageName = 'catZhijin';
                break;
            default:
                imageName = 'catDefault';
                break;
        }

        const catImage = imageLoader.getImage(imageName);

        if (catImage && catImage.complete && catImage.naturalWidth > 0) {
            const x = CAT_CENTER_X - CAT_SIZE / 2;
            const y = CAT_CENTER_Y - CAT_SIZE / 2;

            this.ctx.save();
            this.ctx.drawImage(catImage, x, y, CAT_SIZE, CAT_SIZE);
            this.ctx.restore();
        } else {
            // 后备方案：绘制一个圆形占位符
            this.ctx.save();
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('CAT', CAT_CENTER_X, CAT_CENTER_Y);
            this.ctx.restore();
        }
    }

    drawComboDisplay() {
        if (this.combo > 0) {
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';

            const text = this.combo + 'x';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 4;
            this.ctx.strokeText(text, CANVAS_WIDTH / 2, 20);
            this.ctx.fillText(text, CANVAS_WIDTH / 2, 20);

            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('COMBO', CANVAS_WIDTH / 2, 75);
        }
    }

    drawProgressBar() {
        const currentTime = Date.now() - this.gameStartTime;
        const progress = this.beatMap.getProgress(currentTime);

        const barWidth = CANVAS_WIDTH - 40;
        const barHeight = 6;
        const barX = 20;
        const barY = CANVAS_HEIGHT - 20;

        // 背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        drawRoundRect(this.ctx, barX, barY, barWidth, barHeight, 3, 'rgba(255, 255, 255, 0.2)');

        // 进度
        this.ctx.fillStyle = '#ffd700';
        const progressWidth = (barWidth * progress) / 100;
        drawRoundRect(this.ctx, barX, barY, progressWidth, barHeight, 3, '#ffd700');
    }

    gameLoop() {
        if (this.gameState === 'playing') {
            this.update();
        }

        this.draw();

        if (this.gameState === 'playing') {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    endGame() {
        this.gameState = 'gameOver';
        this.audioSystem.stopBackgroundMusic();

        // 停止自定义音频
        if (this.customAudioSource) {
            this.customAudioSource.stop();
            this.customAudioSource = null;
        }

        // 清理猫咪定时器
        if (this.catTimer) {
            clearTimeout(this.catTimer);
            this.catTimer = null;
        }

        // 清理击中追踪定时器
        if (this.frameHitTimer) {
            clearTimeout(this.frameHitTimer);
            this.frameHitTimer = null;
        }

        this.gameOverScreen.classList.remove('hidden');

        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-combo').textContent = this.maxCombo;

        const accuracy = calculateAccuracy(this.perfectCount, this.goodCount, this.missCount);
        document.getElementById('final-accuracy').textContent = accuracy;
        document.getElementById('final-perfect').textContent = this.perfectCount;
        document.getElementById('final-good').textContent = this.goodCount;
        document.getElementById('final-miss').textContent = this.missCount;
    }
}

window.addEventListener('load', () => {
    // 先加载图片资源，然后创建游戏实例
    imageLoader.loadImages(IMAGE_CONFIG, () => {
        console.log('所有图片加载完成，开始游戏');
        new Game();
    });
});
