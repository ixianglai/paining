// 像素绘画板应用
class PixelArtApp {
    constructor() {
        this.canvasSize = 16;
        this.pixelSize = 25;
        this.currentColor = '#FF0000';
        this.currentTool = 'pencil';
        this.brushSize = 2; // 1=小(1x1), 2=中(3x3), 3=大(5x5)
        this.isDrawing = false;
        this.pixelCount = 0;
        this.savedWorks = [];
        
        this.init();
    }
    
    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.loadSavedWorks();
        this.updateDisplay();
        this.setInitialColor();
    }
    
    createCanvas() {
        const canvas = document.getElementById('pixelCanvas');
        canvas.innerHTML = '';
        
        // 设置网格
        canvas.style.gridTemplateColumns = `repeat(${this.canvasSize}, 1fr)`;
        
        // 根据画布大小调整像素大小
        if (this.canvasSize === 8) {
            this.pixelSize = 40;
        } else if (this.canvasSize === 16) {
            this.pixelSize = 25;
        } else if (this.canvasSize === 24) {
            this.pixelSize = 18;
        }
        
        // 创建像素
        for (let i = 0; i < this.canvasSize * this.canvasSize; i++) {
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            pixel.dataset.index = i;
            pixel.dataset.x = i % this.canvasSize;
            pixel.dataset.y = Math.floor(i / this.canvasSize);
            pixel.style.width = `${this.pixelSize}px`;
            pixel.style.height = `${this.pixelSize}px`;
            
            // 点击绘制
            pixel.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.isDrawing = true;
                this.drawWithBrush(pixel, e);
            });
            
            // 鼠标移动绘制
            pixel.addEventListener('mouseover', (e) => {
                if (this.isDrawing) {
                    this.drawWithBrush(pixel, e);
                }
                this.showBrushPreview(pixel);
            });
            
            pixel.addEventListener('mouseout', () => {
                this.hideBrushPreview();
            });
            
            // 右键擦除
            pixel.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.eraseWithBrush(pixel);
                return false;
            });
            
            canvas.appendChild(pixel);
        }
        
        // 停止绘制
        document.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });
    }
    
    // 使用画笔绘制
    drawWithBrush(centerPixel, event) {
        if (this.currentTool === 'eraser') {
            this.eraseWithBrush(centerPixel);
            return;
        }
        
        if (this.currentTool === 'fill') {
            this.fillCanvas();
            return;
        }
        
        const centerX = parseInt(centerPixel.dataset.x);
        const centerY = parseInt(centerPixel.dataset.y);
        
        // 根据画笔大小获取要绘制的像素
        const pixelsToPaint = this.getBrushPixels(centerX, centerY);
        
        // 绘制所有像素
        pixelsToPaint.forEach(({x, y}) => {
            const pixelIndex = y * this.canvasSize + x;
            const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
            
            if (pixel) {
                this.paintSinglePixel(pixel);
            }
        });
    }
    
    // 使用画笔擦除
    eraseWithBrush(centerPixel) {
        const centerX = parseInt(centerPixel.dataset.x);
        const centerY = parseInt(centerPixel.dataset.y);
        
        // 根据画笔大小获取要擦除的像素
        const pixelsToErase = this.getBrushPixels(centerX, centerY);
        
        // 擦除所有像素
        pixelsToErase.forEach(({x, y}) => {
            const pixelIndex = y * this.canvasSize + x;
            const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
            
            if (pixel) {
                this.eraseSinglePixel(pixel);
            }
        });
    }
    
    // 获取画笔覆盖的像素
    getBrushPixels(centerX, centerY) {
        const pixels = [];
        const radius = this.brushSize; // 1, 2, 3
        
        if (radius === 1) {
            // 单个像素
            pixels.push({x: centerX, y: centerY});
        } else if (radius === 2) {
            // 中号画笔 (3×3)
            for (let y = centerY - 1; y <= centerY + 1; y++) {
                for (let x = centerX - 1; x <= centerX + 1; x++) {
                    if (x >= 0 && x < this.canvasSize && y >= 0 && y < this.canvasSize) {
                        pixels.push({x, y});
                    }
                }
            }
        } else if (radius === 3) {
            // 大号画笔 (5×5)
            for (let y = centerY - 2; y <= centerY + 2; y++) {
                for (let x = centerX - 2; x <= centerX + 2; x++) {
                    if (x >= 0 && x < this.canvasSize && y >= 0 && y < this.canvasSize) {
                        pixels.push({x, y});
                    }
                }
            }
        }
        
        return pixels;
    }
    
    // 绘制单个像素
    paintSinglePixel(pixel) {
        // 设置颜色
        pixel.style.backgroundColor = this.currentColor;
        
        // 添加绘制效果
        pixel.style.transform = 'scale(1.05)';
        pixel.style.boxShadow = `0 0 5px ${this.currentColor}`;
        setTimeout(() => {
            pixel.style.transform = 'scale(1)';
            pixel.style.boxShadow = 'none';
        }, 100);
        
        // 更新计数
        if (!pixel.dataset.painted || pixel.dataset.painted === 'false') {
            pixel.dataset.painted = 'true';
            this.pixelCount++;
            this.updatePixelCount();
        }
    }
    
    // 擦除单个像素
    eraseSinglePixel(pixel) {
        pixel.style.backgroundColor = '';
        pixel.dataset.painted = 'false';
        this.pixelCount--;
        this.updatePixelCount();
    }
    
    // 显示画笔预览
    showBrushPreview(centerPixel) {
        // 移除之前的预览
        this.hideBrushPreview();
        
        if (this.currentTool === 'pencil') {
            const centerX = parseInt(centerPixel.dataset.x);
            const centerY = parseInt(centerPixel.dataset.y);
            const previewPixels = this.getBrushPixels(centerX, centerY);
            
            previewPixels.forEach(({x, y}) => {
                const pixelIndex = y * this.canvasSize + x;
                const pixel = document.querySelector(`.pixel[data-index="${pixelIndex}"]`);
                
                if (pixel) {
                    pixel.classList.add('brush-preview');
                    pixel.style.opacity = '0.6';
                    pixel.style.boxShadow = `inset 0 0 0 1px ${this.currentColor}`;
                }
            });
        }
    }
    
    // 隐藏画笔预览
    hideBrushPreview() {
        document.querySelectorAll('.pixel.brush-preview').forEach(pixel => {
            pixel.classList.remove('brush-preview');
            pixel.style.opacity = '1';
            pixel.style.boxShadow = 'none';
        });
    }
    
    updatePixelCount() {
        document.getElementById('pixelCount').textContent = this.pixelCount;
    }
    
    updateDisplay() {
        document.getElementById('currentColorDisplay').textContent = this.currentColor;
        document.getElementById('currentColorDisplay').style.color = this.currentColor;
    }
    
    setInitialColor() {
        const defaultColor = document.querySelector('.color[data-color="#FF0000"]');
        if (defaultColor) {
            defaultColor.classList.add('selected');
        }
    }
    
    setupEventListeners() {
        // 颜色选择
        document.querySelectorAll('.color').forEach(color => {
            color.addEventListener('click', (e) => {
                // 移除所有选中状态
                document.querySelectorAll('.color').forEach(c => c.classList.remove('selected'));
                
                // 设置当前颜色
                e.target.classList.add('selected');
                this.currentColor = e.target.dataset.color;
                this.updateDisplay();
            });
            
            // 双击设置为自定义颜色
            color.addEventListener('dblclick', (e) => {
                document.getElementById('customColor').value = e.target.dataset.color;
                this.currentColor = e.target.dataset.color;
                this.updateDisplay();
            });
        });
        
        // 自定义颜色
        document.getElementById('customColor').addEventListener('input', (e) => {
            this.currentColor = e.target.value;
            this.updateDisplay();
        });
        
        // 画笔大小
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.brushSize = parseInt(e.target.dataset.size);
                
                // 显示画笔大小效果提示
                this.showBrushSizeEffect();
            });
        });
        
        // 工具选择
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const tool = e.target.id.replace('Tool', '');
                this.currentTool = tool;
                
                if (tool === 'clear') {
                    this.clearCanvas();
                    // 重新激活画笔工具
                    setTimeout(() => {
                        document.getElementById('pencilTool').classList.add('active');
                        this.currentTool = 'pencil';
                    }, 100);
                }
            });
        });
        
        // 画布大小
        document.querySelectorAll('.size-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.size-option').forEach(o => o.classList.remove('active'));
                e.target.classList.add('active');
                
                const newSize = parseInt(e.target.dataset.size);
                this.canvasSize = newSize;
                
                // 更新画布标题
                const header = document.querySelector('.canvas-header h3');
                header.innerHTML = `<i class="fas fa-th"></i> 画布 (${this.canvasSize}×${this.canvasSize})`;
                
                // 重新创建画布
                this.createCanvas();
                this.pixelCount = 0;
                this.updatePixelCount();
                
                // 显示提示
                this.showTemporaryMessage(`画布大小已切换为 ${this.canvasSize}×${this.canvasSize}`);
            });
        });
        
        // 预设图案
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.dataset.preset;
                this.applyPreset(preset);
            });
        });
        
        // 保存作品
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveWork();
        });
        
        // 加载作品
        document.getElementById('loadBtn').addEventListener('click', () => {
            this.showLoadDialog();
        });
        
        // 分享作品
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareWork();
        });
        
        // 下载图片
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadImage();
        });
        
        // 模态框关闭
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('shareModal').style.display = 'none';
        });
        
        // 复制链接
        document.getElementById('copyUrlBtn').addEventListener('click', () => {
            this.copyShareUrl();
        });
        
        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('shareModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            // 数字键1-3选择画笔大小
            if (e.key >= '1' && e.key <= '3') {
                const size = parseInt(e.key);
                const sizeBtn = document.querySelector(`.size-btn[data-size="${size}"]`);
                if (sizeBtn) {
                    sizeBtn.click();
                }
            }
            
            // 空格键清除画布
            if (e.key === ' ') {
                e.preventDefault();
                this.clearCanvas();
            }
            
            // C键清空画布
            if (e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                this.clearCanvas();
            }
            
            // F键填充
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                document.getElementById('fillTool').click();
            }
            
            // E键橡皮擦
            if (e.key === 'e' || e.key === 'E') {
                e.preventDefault();
                document.getElementById('eraserTool').click();
            }
            
            // P键画笔
            if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                document.getElementById('pencilTool').click();
            }
        });
    }
    
    // 显示画笔大小效果提示
    showBrushSizeEffect() {
        const sizeNames = {1: '小 (单像素)', 2: '中 (3×3)', 3: '大 (5×5)'};
        this.showTemporaryMessage(`画笔大小: ${sizeNames[this.brushSize]}`);
    }
    
    // 显示临时消息
    showTemporaryMessage(message) {
        const effect = document.createElement('div');
        effect.className = 'temporary-message';
        effect.textContent = message;
        effect.style.position = 'fixed';
        effect.style.top = '20px';
        effect.style.right = '20px';
        effect.style.background = this.currentColor;
        effect.style.color = 'white';
        effect.style.padding = '10px 20px';
        effect.style.borderRadius = '10px';
        effect.style.zIndex = '1000';
        effect.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        effect.style.fontWeight = 'bold';
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.style.opacity = '0';
            effect.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (effect.parentNode) {
                    effect.parentNode.removeChild(effect);
                }
            }, 500);
        }, 1500);
    }
    
    fillCanvas() {
        const pixels = document.querySelectorAll('.pixel');
        let newlyPainted = 0;
        
        pixels.forEach(pixel => {
            if (!pixel.style.backgroundColor || pixel.style.backgroundColor !== this.currentColor) {
                pixel.style.backgroundColor = this.currentColor;
                if (!pixel.dataset.painted || pixel.dataset.painted === 'false') {
                    pixel.dataset.painted = 'true';
                    newlyPainted++;
                }
            }
        });
        
        this.pixelCount += newlyPainted;
        this.updatePixelCount();
        this.showTemporaryMessage(`已填充 ${newlyPainted} 个像素`);
    }
    
    // 修复清空画布功能
    clearCanvas() {
        if (confirm('确定要清空画布吗？所有未保存的更改将会丢失。')) {
            const pixels = document.querySelectorAll('.pixel');
            pixels.forEach(pixel => {
                pixel.style.backgroundColor = '';
                pixel.dataset.painted = 'false';
            });
            this.pixelCount = 0;
            this.updatePixelCount();
            this.showTemporaryMessage('画布已清空');
        }
    }
    
    applyPreset(preset) {
        // 确认应用预设
        if (!confirm(`确定要应用"${preset}"预设图案吗？当前画布内容将丢失。`)) {
            return;
        }
        
        // 清空画布
        this.clearCanvas();
        
        // 应用预设图案
        setTimeout(() => {
            const pixels = document.querySelectorAll('.pixel');
            
            // 调用对应的预设图案绘制函数
            switch(preset) {
                case 'heart':
                    this.drawHeart(pixels);
                    break;
                case 'smiley':
                    this.drawSmiley(pixels);
                    break;
                case 'flag':
                    this.drawFlag(pixels);
                    break;
                case 'house':
                    this.drawHouse(pixels);
                    break;
                case 'tree':
                    this.drawTree(pixels);
                    break;
            }
            
            this.updatePixelCount();
            this.showTemporaryMessage(`已应用 ${preset} 预设图案`);
        }, 100);
    }
    
    // 绘制像素图案（通用方法）
    drawPixelPattern(pixels, patternData) {
        const { pattern, color, offsetX = 0, offsetY = 0 } = patternData;
        const patternSize = pattern.length;
        
        // 临时保存当前颜色
        const tempColor = this.currentColor;
        this.currentColor = color;
        
        for (let y = 0; y < patternSize; y++) {
            for (let x = 0; x < patternSize; x++) {
                if (pattern[y][x] === 1) {
                    const targetY = y + offsetY;
                    const targetX = x + offsetX;
                    
                    if (targetY >= 0 && targetY < this.canvasSize && 
                        targetX >= 0 && targetX < this.canvasSize) {
                        const pixelIndex = targetY * this.canvasSize + targetX;
                        pixels[pixelIndex].style.backgroundColor = color;
                        if (!pixels[pixelIndex].dataset.painted || pixels[pixelIndex].dataset.painted === 'false') {
                            pixels[pixelIndex].dataset.painted = 'true';
                            this.pixelCount++;
                        }
                    }
                }
            }
        }
        
        // 恢复当前颜色
        this.currentColor = tempColor;
    }
    
    saveWork() {
        // 获取当前画布状态
        const pixels = document.querySelectorAll('.pixel');
        const canvasData = [];
        
        pixels.forEach(pixel => {
            canvasData.push(pixel.style.backgroundColor || '');
        });
        
        const workName = prompt('请输入作品名称:', `像素艺术 ${new Date().toLocaleDateString()}`);
        
        if (workName) {
            const work = {
                id: Date.now(),
                name: workName,
                date: new Date().toLocaleString(),
                canvasSize: this.canvasSize,
                data: canvasData,
                pixelCount: this.pixelCount
            };
            
            this.savedWorks.push(work);
            this.saveToLocalStorage();
            this.updateGallery();
            
            this.showTemporaryMessage(`作品 "${workName}" 已保存！`);
        }
    }
    
    loadSavedWorks() {
        const saved = localStorage.getItem('pixelArtWorks');
        if (saved) {
            this.savedWorks = JSON.parse(saved);
            this.updateGallery();
        }
    }
    
    saveToLocalStorage() {
        localStorage.setItem('pixelArtWorks', JSON.stringify(this.savedWorks));
    }
    
    updateGallery() {
        const gallery = document.getElementById('savedGallery');
        
        if (this.savedWorks.length === 0) {
            gallery.innerHTML = `
                <div class="empty-gallery">
                    <i class="fas fa-palette"></i>
                    <p>暂无保存的作品</p>
                    <p>开始绘制并保存你的第一件像素艺术吧！</p>
                </div>
            `;
            return;
        }
        
        gallery.innerHTML = '';
        
        // 显示最近保存的6个作品
        const recentWorks = this.savedWorks.slice(-6).reverse();
        
        recentWorks.forEach(work => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.dataset.id = work.id;
            
            // 创建预览
            const preview = document.createElement('div');
            preview.className = 'gallery-preview';
            
            // 简化预览（显示8x8的缩略图）
            const previewSize = 8;
            preview.style.gridTemplateColumns = `repeat(${previewSize}, 1fr)`;
            
            // 计算缩放比例
            const scale = previewSize / work.canvasSize;
            
            // 创建预览像素
            for (let y = 0; y < previewSize; y++) {
                for (let x = 0; x < previewSize; x++) {
                    const srcX = Math.floor(x / scale);
                    const srcY = Math.floor(y / scale);
                    const srcIndex = srcY * work.canvasSize + srcX;
                    
                    const previewPixel = document.createElement('div');
                    previewPixel.className = 'gallery-pixel';
                    previewPixel.style.backgroundColor = work.data[srcIndex] || '#FFFFFF';
                    preview.appendChild(previewPixel);
                }
            }
            
            galleryItem.appendChild(preview);
            
            const info = document.createElement('div');
            info.className = 'gallery-info';
            info.innerHTML = `
                <p><strong>${work.name}</strong></p>
                <p>${work.date}</p>
                <p>${work.pixelCount} 像素</p>
            `;
            
            galleryItem.appendChild(info);
            
            // 点击加载作品
            galleryItem.addEventListener('click', () => {
                this.loadWork(work.id);
            });
            
            gallery.appendChild(galleryItem);
        });
    }
    
    showLoadDialog() {
        if (this.savedWorks.length === 0) {
            alert('暂无保存的作品。请先创建并保存一个作品。');
            return;
        }
        
        let message = '选择要加载的作品:\n\n';
        this.savedWorks.forEach((work, index) => {
            message += `${index + 1}. ${work.name} (${work.date})\n`;
        });
        
        const choice = prompt(`${message}\n请输入作品编号:`);
        const index = parseInt(choice) - 1;
        
        if (index >= 0 && index < this.savedWorks.length) {
            this.loadWork(this.savedWorks[index].id);
        }
    }
    
    loadWork(workId) {
        const work = this.savedWorks.find(w => w.id === workId);
        
        if (!work) {
            alert('作品不存在！');
            return;
        }
        
        // 确认加载
        if (confirm(`加载作品 "${work.name}" 吗？当前画布内容将丢失。`)) {
            // 设置画布大小
            this.canvasSize = work.canvasSize;
            
            // 更新UI
            document.querySelectorAll('.size-option').forEach(option => option.classList.remove('active'));
            const activeBtn = document.querySelector(`.size-option[data-size="${this.canvasSize}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
            
            // 更新画布标题
            const header = document.querySelector('.canvas-header h3');
            header.innerHTML = `<i class="fas fa-th"></i> 画布 (${this.canvasSize}×${this.canvasSize})`;
            
            // 重新创建画布
            this.createCanvas();
            
            // 加载数据
            const pixels = document.querySelectorAll('.pixel');
            this.pixelCount = 0;
            
            work.data.forEach((color, index) => {
                if (index < pixels.length) {
                    pixels[index].style.backgroundColor = color;
                    if (color) {
                        pixels[index].dataset.painted = 'true';
                        this.pixelCount++;
                    }
                }
            });
            
            this.updatePixelCount();
            this.showTemporaryMessage(`作品 "${work.name}" 已加载！`);
        }
    }
    
    shareWork() {
        // 获取当前画布数据
        const pixels = document.querySelectorAll('.pixel');
        const canvasData = [];
        
        pixels.forEach(pixel => {
            canvasData.push(pixel.style.backgroundColor || '');
        });
        
        // 创建分享数据
        const shareData = {
            canvasSize: this.canvasSize,
            data: canvasData,
            date: new Date().toISOString()
        };
        
        // 编码为Base64
        const jsonString = JSON.stringify(shareData);
        const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
        
        // 生成分享URL
        const shareUrl = `${window.location.origin}${window.location.pathname}?art=${base64Data}`;
        
        // 显示分享模态框
        document.getElementById('shareUrl').value = shareUrl;
        document.getElementById('shareModal').style.display = 'block';
        
        // 检查URL中是否有艺术数据
        this.checkUrlForArt();
    }
    
    checkUrlForArt() {
        const urlParams = new URLSearchParams(window.location.search);
        const artData = urlParams.get('art');
        
        if (artData) {
            try {
                // 解码Base64
                const jsonString = decodeURIComponent(escape(atob(artData)));
                const shareData = JSON.parse(jsonString);
                
                if (confirm('检测到分享的艺术作品，是否加载？')) {
                    // 设置画布大小
                    this.canvasSize = shareData.canvasSize;
                    
                    // 更新UI
                    document.querySelectorAll('.size-option').forEach(option => option.classList.remove('active'));
                    const activeBtn = document.querySelector(`.size-option[data-size="${this.canvasSize}"]`);
                    if (activeBtn) {
                        activeBtn.classList.add('active');
                    }
                    
                    // 更新画布标题
                    const header = document.querySelector('.canvas-header h3');
                    header.innerHTML = `<i class="fas fa-th"></i> 画布 (${this.canvasSize}×${this.canvasSize})`;
                    
                    // 重新创建画布
                    this.createCanvas();
                    
                    // 加载数据
                    const pixels = document.querySelectorAll('.pixel');
                    this.pixelCount = 0;
                    
                    shareData.data.forEach((color, index) => {
                        if (index < pixels.length) {
                            pixels[index].style.backgroundColor = color;
                            if (color) {
                                pixels[index].dataset.painted = 'true';
                                this.pixelCount++;
                            }
                        }
                    });
                    
                    this.updatePixelCount();
                    
                    // 清除URL参数
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    this.showTemporaryMessage('已加载分享的作品');
                }
            } catch (error) {
                console.error('加载分享作品失败:', error);
            }
        }
    }
    
    copyShareUrl() {
        const shareUrlInput = document.getElementById('shareUrl');
        shareUrlInput.select();
        shareUrlInput.setSelectionRange(0, 99999); // 移动设备支持
        
        try {
            navigator.clipboard.writeText(shareUrlInput.value);
            alert('链接已复制到剪贴板！');
        } catch (error) {
            // 备用方法
            document.execCommand('copy');
            alert('链接已复制到剪贴板！');
        }
    }
    
    downloadImage() {
        // 创建临时Canvas来绘制图像
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置Canvas大小（放大像素）
        const scale = 20;
        canvas.width = this.canvasSize * scale;
        canvas.height = this.canvasSize * scale;
        
        // 获取像素数据
        const pixels = document.querySelectorAll('.pixel');
        
        // 绘制每个像素
        for (let y = 0; y < this.canvasSize; y++) {
            for (let x = 0; x < this.canvasSize; x++) {
                const pixelIndex = y * this.canvasSize + x;
                const color = pixels[pixelIndex].style.backgroundColor || '#FFFFFF';
                
                ctx.fillStyle = color;
                ctx.fillRect(x * scale, y * scale, scale, scale);
                
                // 绘制像素边框
                ctx.strokeStyle = '#CCCCCC';
                ctx.strokeRect(x * scale, y * scale, scale, scale);
            }
        }
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `像素艺术_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        this.showTemporaryMessage('图片已开始下载');
    }
    
    // 预设图案方法
    drawHeart(pixels) {
        // 根据画布大小调整图案
        let heartPattern, offsetX, offsetY;
        
        if (this.canvasSize === 8) {
            // 8×8 爱心
            heartPattern = [
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0]
            ];
            offsetX = 0;
            offsetY = 0;
        } else if (this.canvasSize === 16) {
            // 16×16 爱心
            heartPattern = [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ];
            offsetX = 0;
            offsetY = 0;
        } else if (this.canvasSize === 24) {
            // 24×24 爱心
            heartPattern = [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ];
            offsetX = 0;
            offsetY = 0;
        }
        
        this.drawPixelPattern(pixels, {
            pattern: heartPattern,
            color: '#FF0000',
            offsetX,
            offsetY
        });
    }
    
    drawSmiley(pixels) {
        // 根据画布大小调整图案
        let smileyPattern, offsetX, offsetY;
        
        if (this.canvasSize === 8) {
            // 8×8 笑脸
            smileyPattern = [
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 1, 0, 0, 1, 0, 1],
                [1, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 1, 0, 0, 1, 0, 1],
                [1, 0, 0, 1, 1, 0, 0, 1],
                [0, 1, 0, 0, 0, 0, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0]
            ];
            offsetX = 0;
            offsetY = 0;
        } else if (this.canvasSize === 16) {
            // 16×16 笑脸
            smileyPattern = [
                [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
                [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1],
                [1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1],
                [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1],
                [1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1],
                [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ];
            offsetX = 0;
            offsetY = 0;
        } else if (this.canvasSize === 24) {
            // 24×24 笑脸
            smileyPattern = [
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
                [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
                [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1],
                [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1],
                [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1],
                [1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1],
                [1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
                [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ];
            offsetX = 0;
            offsetY = 0;
        }
        
        this.drawPixelPattern(pixels, {
            pattern: smileyPattern,
            color: '#FFFF00',
            offsetX,
            offsetY
        });
    }
    
    // 简化旗帜图案 - 简单的三色旗
    drawFlag(pixels) {
        const tempColor = this.currentColor;
        
        // 计算每种颜色的宽度
        const third = Math.floor(this.canvasSize / 3);
        const colors = ['#0000FF', '#FFFFFF', '#FF0000']; // 蓝、白、红
        
        // 绘制三色旗
        for (let y = 0; y < this.canvasSize; y++) {
            for (let x = 0; x < this.canvasSize; x++) {
                const pixelIndex = y * this.canvasSize + x;
                
                // 确定当前像素属于哪个颜色区域
                if (x < third) {
                    // 蓝色区域
                    pixels[pixelIndex].style.backgroundColor = colors[0];
                } else if (x < 2 * third) {
                    // 白色区域
                    pixels[pixelIndex].style.backgroundColor = colors[1];
                } else {
                    // 红色区域
                    pixels[pixelIndex].style.backgroundColor = colors[2];
                }
                
                if (!pixels[pixelIndex].dataset.painted || pixels[pixelIndex].dataset.painted === 'false') {
                    pixels[pixelIndex].dataset.painted = 'true';
                    this.pixelCount++;
                }
            }
        }
        
        this.currentColor = tempColor;
    }
    
    drawHouse(pixels) {
        // 根据画布大小调整图案
        let housePattern, offsetX, offsetY;
        
        if (this.canvasSize === 8) {
            // 8×8 房子
            housePattern = [
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 0, 1, 1, 0, 1, 1],
                [1, 1, 0, 1, 1, 0, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 1, 0, 0, 1, 0, 1],
                [1, 0, 1, 0, 0, 1, 0, 1]
            ];
            offsetX = 0;
            offsetY = 0;
        } else if (this.canvasSize === 16) {
            // 16×16 房子
            housePattern = [
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0],
                [1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1],
                [1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1],
                [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1],
                [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1],
                [1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            ];
            offsetX = 0;
            offsetY = 0;
        } else if (this.canvasSize === 24) {
            // 24×24 房子
            housePattern = [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
                [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
                [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
                [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1],
                [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1],
                [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1],
                [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
            ];
            offsetX = 0;
            offsetY = 0;
        }
        
        this.drawPixelPattern(pixels, {
            pattern: housePattern,
            color: '#FFA500',
            offsetX,
            offsetY
        });
    }
    
    drawTree(pixels) {
        // 根据画布大小调整图案
        let treePattern, offsetX, offsetY;
        
        if (this.canvasSize === 8) {
            // 8×8 树木
            treePattern = [
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0],
                [0, 0, 0, 1, 1, 0, 0, 0]
            ];
            offsetX = 0;
            offsetY = 0;
        } else if (this.canvasSize === 16) {
            // 16×16 树木
            treePattern = [
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]
            ];
            offsetX = 0;
            offsetY = 0;
        } else if (this.canvasSize === 24) {
            // 24×24 树木
            treePattern = [
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
                [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
                [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
                [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            ];
            offsetX = 0;
            offsetY = 0;
        }
        
        this.drawPixelPattern(pixels, {
            pattern: treePattern,
            color: '#228B22',
            offsetX,
            offsetY
        });
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new PixelArtApp();
    
    // 显示欢迎信息
    setTimeout(() => {
        console.log('🎨 像素绘画板已启动！');
        console.log('🖌️  画笔大小功能：1=小(单像素), 2=中(3×3), 3=大(5×5)');
        console.log('🎯 画布大小：8×8、16×16、24×24');
        console.log('🔑 快捷键：数字键1-3切换画笔大小，空格键清空画布');
        console.log('🔑 更多快捷键：P=画笔, E=橡皮, F=填充, C=清空');
        console.log('💾 所有数据保存在浏览器本地');
        console.log('🚀 可以部署到任何Web服务器');
        console.log('✨ 修复了清空功能，优化了旗帜图案（简单三色旗）');
    }, 500);
});