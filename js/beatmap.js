// 谱面系统类
class BeatMap {
    constructor() {
        this.notes = [];
        this.currentIndex = 0;
        this.generateBeatMap();
    }

    // 生成谱面
    generateBeatMap() {
        // 创建一个简单的谱面模式
        // 格式: [节拍数, 轨道] - 例如 [0, 'left'] 表示第0拍在左轨道出现音符

        const patterns = [
            // 第一段：简单交替 (0-16拍)
            [0, 'left'], [1, 'right'], [2, 'left'], [3, 'right'],
            [4, 'left'], [5, 'right'], [6, 'left'], [7, 'right'],
            [8, 'left'], [9, 'right'], [10, 'left'], [11, 'right'],
            [12, 'left'], [13, 'right'], [14, 'left'], [15, 'right'],

            // 第二段：连续左右 (16-24拍)
            [16, 'left'], [16.5, 'left'], [17, 'right'], [17.5, 'right'],
            [18, 'left'], [18.5, 'left'], [19, 'right'], [19.5, 'right'],
            [20, 'left'], [21, 'right'], [22, 'left'], [23, 'right'],

            // 第三段：同时左右 (24-32拍)
            [24, 'left'], [24, 'right'],
            [26, 'left'], [26, 'right'],
            [28, 'left'], [28, 'right'],
            [30, 'left'], [30, 'right'],

            // 第四段：复杂模式 (32-48拍)
            [32, 'left'], [32.5, 'right'], [33, 'left'], [33.5, 'right'],
            [34, 'left'], [35, 'right'], [36, 'left'], [36, 'right'],
            [37, 'left'], [37.5, 'left'], [38, 'right'], [38.5, 'right'],
            [39, 'left'], [39, 'right'],
            [40, 'left'], [41, 'right'], [42, 'left'], [43, 'right'],
            [44, 'left'], [44.5, 'left'], [45, 'right'], [45.5, 'right'],
            [46, 'left'], [47, 'right'],

            // 第五段：重复第一段 (48-64拍)
            [48, 'left'], [49, 'right'], [50, 'left'], [51, 'right'],
            [52, 'left'], [53, 'right'], [54, 'left'], [55, 'right'],
            [56, 'left'], [57, 'right'], [58, 'left'], [59, 'right'],
            [60, 'left'], [61, 'right'], [62, 'left'], [63, 'right'],

            // 结尾高潮 (64-72拍)
            [64, 'left'], [64, 'right'],
            [64.5, 'left'], [64.5, 'right'],
            [65, 'left'], [65, 'right'],
            [65.5, 'left'], [65.5, 'right'],
            [66, 'left'], [67, 'right'],
            [68, 'left'], [68, 'right'],
            [69, 'left'], [69, 'right'],
            [70, 'left'], [71, 'right']
        ];

        // 转换为时间戳
        this.notes = patterns.map(([beat, lane]) => ({
            time: beat * BEAT_INTERVAL, // 转换为毫秒
            lane: lane
        }));

        // 按时间排序
        this.notes.sort((a, b) => a.time - b.time);
    }

    // 获取当前时间应该生成的音符
    getNotesToSpawn(currentTime) {
        const spawnTime = currentTime + NOTE_FALL_TIME; // 提前生成音符，让它有时间落下
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
    }

    // 重置谱面
    reset() {
        this.currentIndex = 0;
        this.notes.forEach(note => {
            note.spawned = false;
        });
    }

    // 检查是否完成
    isComplete() {
        return this.currentIndex >= this.notes.length;
    }

    // 获取总时长
    getTotalDuration() {
        if (this.notes.length === 0) return 0;
        return this.notes[this.notes.length - 1].time + 5000; // 最后一个音符时间 + 5秒
    }

    // 获取歌曲进度百分比
    getProgress(currentTime) {
        const total = this.getTotalDuration();
        return Math.min((currentTime / total) * 100, 100);
    }
}
