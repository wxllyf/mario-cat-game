// 游戏常量
const CANVAS_WIDTH = 760;
const CANVAS_HEIGHT = 600;

// 判定线位置
const JUDGMENT_LINE_Y = CANVAS_HEIGHT - 100;

// 音符轨道
const LANE_COUNT = 2;
const LANE_WIDTH = 120;
const LANE_SPACING = 400; // 增加间距，为中央猫咪留出空间
const LANE_LEFT_X = CANVAS_WIDTH / 2 - LANE_SPACING / 2 - LANE_WIDTH / 2;
const LANE_RIGHT_X = CANVAS_WIDTH / 2 + LANE_SPACING / 2 - LANE_WIDTH / 2;

// 中央猫咪位置
const CAT_CENTER_X = CANVAS_WIDTH / 2;
const CAT_CENTER_Y = JUDGMENT_LINE_Y;
const CAT_SIZE = 200; // 猫咪图片大小

// 音符设置
const NOTE_SIZE = 80;
const NOTE_SPEED = 4;

// 判定窗口（像素）
const PERFECT_WINDOW = 30;
const GOOD_WINDOW = 60;
const MISS_WINDOW = 100;

// 分数
const SCORE_PERFECT = 100;
const SCORE_GOOD = 50;
const SCORE_MISS = 0;
const COMBO_BONUS = 10;

// 音符生成
const NOTE_SPAWN_Y = -NOTE_SIZE;

// 音乐设置
const BPM = 120; // 每分钟节拍数
const BEAT_INTERVAL = (60 / BPM) * 1000; // 一拍的毫秒数
const NOTE_FALL_TIME = 2000; // 音符从顶部落到判定线的时间（毫秒）

// 按键绑定
const KEY_LEFT = 'd';
const KEY_RIGHT = 'k';

// 颜色主题
const COLORS = {
    LANE_LEFT: '#f093fb',
    LANE_RIGHT: '#4facfe',
    NOTE_LEFT: '#f5576c',
    NOTE_RIGHT: '#00f2fe',
    JUDGMENT_LINE: '#ffd700',
    PERFECT: '#ffd700',
    GOOD: '#2ecc71',
    MISS: '#e74c3c',
    BACKGROUND: '#1a1a2e',
    GLOW: 'rgba(255, 215, 0, 0.3)'
};

// 判定等级
const JUDGMENT = {
    PERFECT: 'perfect',
    GOOD: 'good',
    MISS: 'miss'
};
