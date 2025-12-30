// 音符类
class Note {
    constructor(lane) {
        this.lane = lane;
        this.x = lane === 'left' ? LANE_LEFT_X : LANE_RIGHT_X;
        this.y = NOTE_SPAWN_Y;
        this.size = NOTE_SIZE;
        this.speed = NOTE_SPEED;
        this.isHit = false;
        this.isMissed = false;
        this.hitEffect = 0;
    }

    update() {
        if (!this.isHit) {
            this.y += this.speed;
        }

        // 检查是否超出判定范围
        if (!this.isHit && this.y > JUDGMENT_LINE_Y + MISS_WINDOW) {
            this.isMissed = true;
        }

        // 更新击中特效
        if (this.hitEffect > 0) {
            this.hitEffect -= 0.05;
        }
    }

    // 判定按键时机
    checkHit() {
        const distance = Math.abs(this.y + this.size / 2 - JUDGMENT_LINE_Y);

        if (distance <= PERFECT_WINDOW) {
            return JUDGMENT.PERFECT;
        } else if (distance <= GOOD_WINDOW) {
            return JUDGMENT.GOOD;
        } else if (distance <= MISS_WINDOW) {
            return JUDGMENT.MISS;
        }

        return null;
    }

    hit(judgment) {
        this.isHit = true;
        this.hitEffect = 1.0;
    }

    draw(ctx) {
        if (this.isHit && this.hitEffect <= 0) return;

        const centerX = this.x + this.size / 2;
        const centerY = this.y + this.size / 2;

        // 绘制发光效果
        if (this.hitEffect > 0) {
            const glowSize = 100 * this.hitEffect;
            const color = this.lane === 'left' ? COLORS.NOTE_LEFT : COLORS.NOTE_RIGHT;
            drawGlow(ctx, centerX, centerY, glowSize, color + '80');
        }

        const opacity = this.hitEffect > 0 ? this.hitEffect : 1;

        ctx.save();
        ctx.globalAlpha = opacity;

        // 获取对应的图片
        const imageName = this.lane === 'left' ? 'noteLeft' : 'noteRight';
        const image = imageLoader.getImage(imageName);

        if (image && image.complete && image.naturalWidth > 0) {
            // 使用图片绘制音符
            const imageSize = this.size * 1.2; // 稍微放大图片
            const imageX = centerX - imageSize / 2;
            const imageY = centerY - imageSize / 2;

            // 绘制图片
            ctx.drawImage(image, imageX, imageY, imageSize, imageSize);

            // 添加发光边框
            if (!this.isHit) {
                ctx.strokeStyle = this.lane === 'left' ? COLORS.NOTE_LEFT : COLORS.NOTE_RIGHT;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.lane === 'left' ? COLORS.NOTE_LEFT : COLORS.NOTE_RIGHT;
                ctx.beginPath();
                ctx.arc(centerX, centerY, imageSize / 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        } else {
            // 如果图片未加载，使用原来的绘制方式（后备方案）
            const color = this.lane === 'left' ? COLORS.NOTE_LEFT : COLORS.NOTE_RIGHT;

            // 绘制外圈
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.size / 2, 0, Math.PI * 2);
            ctx.stroke();

            // 绘制内圈（渐变）
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, this.size / 2
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, color + 'CC');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.size / 2 - 4, 0, Math.PI * 2);
            ctx.fill();

            // 绘制中心图标
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.lane === 'left' ? 'D' : 'K', centerX, centerY);
        }

        ctx.restore();

        // 绘制下落轨迹线
        if (!this.isHit) {
            const color = this.lane === 'left' ? COLORS.NOTE_LEFT : COLORS.NOTE_RIGHT;
            ctx.strokeStyle = color + '40';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX, JUDGMENT_LINE_Y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    shouldRemove() {
        return (this.isHit && this.hitEffect <= 0) || this.isMissed;
    }
}

// 轨道类
class Lane {
    constructor(type) {
        this.type = type;
        this.x = type === 'left' ? LANE_LEFT_X : LANE_RIGHT_X;
        this.width = LANE_WIDTH;
        this.height = CANVAS_HEIGHT;
        this.isPressed = false;
        this.pressEffect = 0;
    }

    press() {
        this.isPressed = true;
        this.pressEffect = 1.0;
    }

    release() {
        this.isPressed = false;
    }

    update() {
        if (this.pressEffect > 0) {
            this.pressEffect -= 0.1;
        }
    }

    draw(ctx) {
        const color = this.type === 'left' ? COLORS.LANE_LEFT : COLORS.LANE_RIGHT;

        // 绘制轨道背景
        ctx.fillStyle = color + '20';
        ctx.fillRect(this.x, 0, this.width, this.height);

        // 绘制轨道边框
        ctx.strokeStyle = color + '80';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, 0, this.width, this.height);

        // 绘制按压效果
        if (this.pressEffect > 0) {
            ctx.fillStyle = color + Math.floor(this.pressEffect * 100).toString(16).padStart(2, '0');
            ctx.fillRect(this.x, 0, this.width, this.height);
        }

        // 绘制判定线（仅在轨道内）
        ctx.strokeStyle = COLORS.JUDGMENT_LINE;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x, JUDGMENT_LINE_Y);
        ctx.lineTo(this.x + this.width, JUDGMENT_LINE_Y);
        ctx.stroke();

        // 绘制判定区域指示
        ctx.fillStyle = COLORS.JUDGMENT_LINE + '30';
        ctx.fillRect(this.x, JUDGMENT_LINE_Y - GOOD_WINDOW, this.width, GOOD_WINDOW * 2);

        ctx.fillStyle = COLORS.JUDGMENT_LINE + '50';
        ctx.fillRect(this.x, JUDGMENT_LINE_Y - PERFECT_WINDOW, this.width, PERFECT_WINDOW * 2);

        // 绘制按键提示
        const keyText = this.type === 'left' ? 'D' : 'K';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(keyText, this.x + this.width / 2, JUDGMENT_LINE_Y);
    }
}
