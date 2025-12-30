// 图片加载器
class ImageLoader {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalCount = 0;
        this.onAllLoaded = null;
        this.onProgress = null;
    }

    // 加载所有图片
    loadImages(imageConfig, callback, onProgress) {
        this.totalCount = Object.keys(imageConfig).length;
        this.onAllLoaded = callback;
        this.onProgress = onProgress;

        if (this.totalCount === 0) {
            if (callback) callback();
            return;
        }

        for (let key in imageConfig) {
            const img = new Image();
            img.onload = () => {
                this.loadedCount++;
                console.log(`图片加载成功: ${key} (${this.loadedCount}/${this.totalCount})`);
                this.updateProgress();
                if (this.loadedCount === this.totalCount && this.onAllLoaded) {
                    this.onAllLoaded();
                }
            };
            img.onerror = () => {
                console.error(`图片加载失败: ${key} - ${imageConfig[key]}`);
                this.loadedCount++;
                this.updateProgress();
                if (this.loadedCount === this.totalCount && this.onAllLoaded) {
                    this.onAllLoaded();
                }
            };
            img.src = imageConfig[key];
            this.images[key] = img;
        }
    }

    updateProgress() {
        if (this.onProgress) {
            const progress = Math.floor((this.loadedCount / this.totalCount) * 100);
            this.onProgress(progress, this.loadedCount, this.totalCount);
        }
    }

    // 获取图片
    getImage(key) {
        return this.images[key];
    }

    // 检查是否全部加载完成
    isAllLoaded() {
        return this.loadedCount === this.totalCount;
    }
}

// 全局图片加载器实例
const imageLoader = new ImageLoader();

// 配置需要加载的图片
const IMAGE_CONFIG = {
    noteLeft: 'zhijin.png',           // 左侧音符 - 纸巾
    noteRight: 'huluobo.png',         // 右侧音符 - 胡萝卜
    scoreCoin: 'hebang.png',          // 分数图标 - 河蚌
    hebangFly: 'hebang.png',          // 飞行的河蚌图标（复用）
    catDefault: 'cat-static-default.png',      // 猫咪默认状态
    catHuluobo: 'cat-static-huluobo.png',      // 猫咪吃胡萝卜
    catZhijin: 'cat-static-zhijin.png'         // 猫咪叼纸巾
};
