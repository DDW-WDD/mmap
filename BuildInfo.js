if (!window.CSS2DObject) {
    window.CSS2DObject = window.THREE && window.THREE.CSS2DObject;
    if (!window.CSS2DObject) {
        window.CSS2DObject = class CSS2DObject extends THREE.Object3D {
            constructor(element) {
                super();
                this.element = element;
                this.element.style.position = 'absolute';
                this.element.style.pointerEvents = 'none';
                this.element.style.userSelect = 'none';
                this.element.style.transformOrigin = '0 0';
                this.element.style.zIndex = 100;
                // 核心：固定过渡动画样式（不随实例重建）
                this.element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                this.element.style.opacity = '0';
                this.element.style.transform = 'translateY(8px)';
                this.element.style.display = 'none';
            }
            copy(source, recursive) {
                super.copy(source, recursive);
                return this;
            }
        };
    }
}

const BuildInfoManager = {
    currentInstance: null,
    currentBuildKey: null,
    
    toggleBuildInfo(scene, center, dataObj, buildKey) {
        console.log('BuildInfoManager.toggleBuildInfo - 接收到的参数:');
        console.log('  - 场景:', scene ? '有效' : '无效');
        console.log('  - 中心点:', center);
        console.log('  - 数据对象:', dataObj);
        console.log('  - 建筑键:', buildKey);
        
        // 确保参数有效
        if (!scene || !center || !dataObj || !buildKey) {
            console.error('BuildInfoManager.toggleBuildInfo - 参数不完整');
            return;
        }
        
        // 如果是同一个建筑，先检查数据是否有更新
        if (this.currentBuildKey === buildKey && this.currentInstance) {
            // 检查数据是否相同（简单比较字符串表示）
            const currentDataStr = JSON.stringify(this.currentInstance.dataObj);
            const newDataStr = JSON.stringify(dataObj);
            
            if (currentDataStr === newDataStr) {
                // 数据相同，直接切换可见性
                console.log('BuildInfoManager - 使用已存在的实例，数据未变:', buildKey);
                this.currentInstance.toggleVisible();
            } else {
                // 数据已更新，先清除旧实例，然后创建新实例
                console.log('BuildInfoManager - 数据已更新，重新创建实例:', buildKey);
                this.currentInstance.clear();
                this.currentInstance = new BuildInfo(scene, center, dataObj, buildKey);
            }
            return;
        }
        
        // 不同建筑或无实例，创建新实例
        if (this.currentInstance) {
            this.currentInstance.clear();
        }
        
        console.log('BuildInfoManager - 创建新实例:', buildKey);
        this.currentInstance = new BuildInfo(scene, center, dataObj, buildKey);
        this.currentBuildKey = buildKey;
    },
    
    clearAll() {
        if (this.currentInstance) {
            this.currentInstance.clear();
            this.currentInstance = null;
            this.currentBuildKey = null;
        }
    }
};

class BuildInfo {
    constructor(scene, center, dataObj, buildKey) {
        console.log('BuildInfo构造函数 - 参数:');
        console.log('  - 场景:', scene ? '有效' : '无效');
        console.log('  - 中心点:', center);
        console.log('  - 数据对象:', dataObj);
        console.log('  - 建筑键:', buildKey);
        
        this.scene = scene;
        this.center = center || new THREE.Vector3(0, 0, 0);
        this.dataObj = dataObj;
        this.buildKey = buildKey;
        this.dataObj.name = this.dataObj.name || '未知建筑';
        this.isVisible = false; // 初始隐藏，通过toggle触发显示
        this.list = [];
        
        this.initDomElements();
        this.createNameDiv();
        this.createInfoDiv();
        // 首次创建直接触发显示动画
        this.toggleVisible();
    }
    
    initDomElements() {
        // 确保DOM元素样式统一
        let nameDiv = document.querySelector('#tag-1');
        if (!nameDiv) {
            nameDiv = document.createElement('div');
            nameDiv.id = 'tag-1';
            document.body.appendChild(nameDiv);
        }
        nameDiv.style.cssText = `
            position: absolute; color: white; background: rgba(0,0,0,0.8);
            padding: 3px 10px; border-radius: 4px; font-size: 14px;
        `;

        let infoDiv = document.querySelector('#tag-2');
        if (!infoDiv) {
            infoDiv = document.createElement('div');
            infoDiv.id = 'tag-2';
            document.body.appendChild(infoDiv);
        }
        infoDiv.style.cssText = `
            position: absolute; color: white; background: rgba(0,0,0,0.8);
            padding: 10px; border-radius: 4px; font-size: 13px; line-height: 1.6;
        `;
    }
    
    createNameDiv() {
        const nameDiv = document.querySelector('#tag-1');
        nameDiv.innerHTML = this.dataObj.name;
        
        const nameObject = new CSS2DObject(nameDiv);
        nameObject.position.set(this.center.x, this.center.y + 12, this.center.z);
        this.scene.add(nameObject);
        this.list.push({ obj: nameObject, element: nameDiv });
    }
    
    createInfoDiv() {
        // 先移除场景中现有的#tag-2相关元素
        const existingElements = document.querySelectorAll('#tag-2');
        existingElements.forEach(el => {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
        
        // 创建全新的DOM元素
        const infoDiv = document.createElement('div');
        infoDiv.id = 'tag-2';
        infoDiv.style.cssText = `
            position: absolute; color: white; background: rgba(0,0,0,0.8);
            padding: 10px; border-radius: 4px; font-size: 13px; line-height: 1.6;
            pointer-events: auto; display: none; z-index: 1000;
        `;
        document.body.appendChild(infoDiv);
        
        // 添加详细调试日志
        console.log('BuildInfo创建信息 - 建筑键:', this.buildKey);
        console.log('BuildInfo创建信息 - 数据对象:', this.dataObj);
        
        // 确保数据对象存在
        if (!this.dataObj) {
            console.error('数据对象不存在');
            infoDiv.textContent = '数据加载失败';
            return;
        }
        
        // 直接使用squareMeters字段作为弹窗内容
        const squareMeters = this.dataObj.squareMeters || '暂无详细信息';
        
        console.log('BuildInfo创建信息 - 设置的内容:', squareMeters);
        
        // 设置新内容 - 使用innerHTML允许更灵活的内容格式
        infoDiv.innerHTML = squareMeters;
        
        // 添加点击事件
        infoDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleVisible();
        });
        
        // 创建CSS2D对象并添加到场景
        const infoObject = new CSS2DObject(infoDiv);
        infoObject.position.set(this.center.x, this.center.y + 5, this.center.z);
        this.scene.add(infoObject);
        this.list.push({ obj: infoObject, element: infoDiv });
    }
    
    // 核心：简化显隐逻辑，确保每次点击都触发动画
    toggleVisible() {
        console.log('BuildInfo切换可见性 - 当前状态:', this.isVisible);
        this.isVisible = !this.isVisible;
        
        this.list.forEach(item => {
            if (!item.element) return;
            
            if (this.isVisible) {
                console.log('显示元素:', item.element.id || 'unnamed');
                // 显示：立即设置display，再触发过渡
                item.obj.visible = true;
                item.element.style.display = 'block';
                // 强制重绘，确保过渡生效
                void item.element.offsetWidth;
                item.element.style.opacity = '1';
                item.element.style.transform = 'translateY(0)';
            } else {
                console.log('隐藏元素:', item.element.id || 'unnamed');
                // 隐藏：先过渡，结束后隐藏display
                item.element.style.opacity = '0';
                item.element.style.transform = 'translateY(8px)';
                // 过渡结束后清理
                setTimeout(() => {
                    item.obj.visible = false;
                    item.element.style.display = 'none';
                }, 300); // 匹配CSS过渡时间
            }
        });
        
        // 隐藏时清空管理器
        if (!this.isVisible) {
            BuildInfoManager.currentInstance = null;
            BuildInfoManager.currentBuildKey = null;
        }
    }
    
    // 清除（带退场特效）
    clear() {
        this.list.forEach(item => {
            item.element.style.opacity = '0';
            item.element.style.transform = 'translateY(8px)';
            setTimeout(() => {
                if (item.obj.parent === this.scene) {
                    this.scene.remove(item.obj);
                }
                item.element.style.display = 'none';
            }, 300);
        });
        this.list = [];
        this.isVisible = false;
    }
}

window.BuildInfoManager = BuildInfoManager;