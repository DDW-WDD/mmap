// Fly.js - 修复视角控制逻辑
if (typeof Fly === 'undefined') {
    class Fly extends BaseModel {
        constructor(model, scene, camera, control) {
            super(model, scene, camera, control);
            // 初始化顶视模式状态
            this.isTopViewMode = false;
            // 初始化环绕速度
            this.orbitSpeed = 0.005;
            // 顶视高度
            this.topViewHeight = 120;
            // 环绕角度
            this.orbitAngle = 0;
            // 初始化时钟
            this.clock = new THREE.Clock();
            // 初始化路径相关属性
            this.path = null;
            // 方块移动进度
            this.t = 0;
        }

        init() {
            this.scene.add(this.model);
            this.pointIndex = 0;
            this.isCameraMove = false;
            this.generateMovePath();
            
            // 初始状态禁用控制，由index.js的switchViewMode控制
            if (this.control) {
                this.control.enabled = false;
                console.log('Fly初始化时禁用OrbitControls，由全局视角模式控制');
            }
        }
        
        generateMovePath() {
            const AirFly_PATH = new THREE.EllipseCurve(
                0, 0,
                110, 110,
                0, -2 * Math.PI,
                false,
                0
            );
            let tempArr = AirFly_PATH.getPoints(3500);
            let result = [];
            for(var i = 0; i < tempArr.length; i++) {
                let item = new THREE.Vector3(tempArr[i].x, 120, tempArr[i].y);
                result.push(item);
            }
            this.pointsArr = result;
            
            // 初始化路径对象
            this.path = new THREE.CatmullRomCurve3(result);
        }
        
        // 启用顶视模式
        enableTopView() {
            console.log('Fly启用顶视环绕模式');
            this.isTopViewMode = true;
            
            // 重置环绕角度
            this.orbitAngle = 0;
            
            // 先设置初始相机位置为顶视
            this.resetToTopView();
            
            // 配置OrbitControls为顶视模式
            if (this.control) {
                this.control.enabled = true;
                this.control.enableRotate = true;
                this.control.enableZoom = true;
                this.control.enablePan = true; // 允许顶视模式下的平移
                this.control.autoRotate = false;
                
                // 锁定顶视角度
                this.control.minPolarAngle = Math.PI / 2 - 0.05; // 稍微放宽限制以避免卡顿
                this.control.maxPolarAngle = Math.PI / 2 + 0.05;
                
                // 设置环绕中心为方块模型位置
                this.control.target.copy(this.model.position);
                
                // 调整控制灵敏度
                this.control.rotateSpeed = 0.5;
                this.control.zoomSpeed = 1.0;
                this.control.panSpeed = 0.5;
            }
        }
        
        // 禁用顶视模式
        disableTopView() {
            console.log('Fly禁用顶视环绕模式');
            this.isTopViewMode = false;
            
            // 禁用OrbitControls，由自由控制器接管
            if (this.control) {
                this.control.enabled = false;
                
                // 重置视角限制
                this.control.minPolarAngle = 0;
                this.control.maxPolarAngle = Math.PI;
            }
        }
        
        // 重置到顶视位置
        resetToTopView() {
            if (this.model) {
                // 设置相机位置为方块上方，稍微偏移以产生环绕效果
                const radius = 50; // 环绕半径
                const x = this.model.position.x + Math.cos(this.orbitAngle) * radius;
                const z = this.model.position.z + Math.sin(this.orbitAngle) * radius;
                
                this.camera.position.set(x, this.topViewHeight, z);
                
                // 确保相机看向方块
                this.camera.lookAt(this.model.position);
                
                // 更新控制器目标（如果存在）
                if (this.control) {
                    this.control.target.copy(this.model.position);
                }
            }
        }
        
        // 移动方块模型
        moveModel() {
            if (this.path) {
                // 更新移动进度
                this.t += 0.0005;
                if (this.t > 1) this.t = 0;
                
                // 获取路径上的点并更新模型位置
                const newPos = this.path.getPoint(this.t);
                this.model.position.copy(newPos);
                
                // 如果是顶视模式，立即更新相机目标
                if (this.isTopViewMode && this.control) {
                    this.control.target.copy(newPos);
                }
            }
        }
        
        // 顶视环绕逻辑 - 简化实现，主要依赖OrbitControls的target跟随
        orbitAroundTopView() {
            // 更新环绕角度
            this.orbitAngle += this.orbitSpeed;
            
            // 计算新的相机位置（围绕方块的圆形轨道）
            const radius = 50; // 环绕半径
            const x = this.model.position.x + Math.cos(this.orbitAngle) * radius;
            const z = this.model.position.z + Math.sin(this.orbitAngle) * radius;
            
            // 设置相机位置
            this.camera.position.set(x, this.topViewHeight, z);
            
            // 确保相机始终看向方块
            this.camera.lookAt(this.model.position);
            
            // 同步更新控制器的目标点
            if (this.control) {
                this.control.target.copy(this.model.position);
            }
        }
        
        onTick(t) {
            // 无论什么模式，都先更新方块位置
            this.moveModel();
            
            if (this.isTopViewMode) {
                // 顶视模式：执行顶视环绕
                this.orbitAroundTopView();
                
                // 确保控制器启用
                if (this.control) {
                    this.control.enabled = true;
                }
            } else {
                // 自由模式：禁用控制器，由自由控制器处理
                if (this.control) {
                    this.control.enabled = false;
                }
            }
            
            // 原有移动逻辑（如果需要保留）
            if (this.isCameraMove && this.path && this.clock) {
                try {
                    this.currentPosition = this.path.getPoint(this.clock.getElapsedTime() * 0.0001);
                    this.currentPosition.y += 1.5; // 高度偏移
                    this.camera.position.copy(this.currentPosition);
                    this.camera.lookAt(0, 0, 0);
                } catch (e) {
                    console.error('飞行路径移动出错:', e);
                }
            }
        }
    }
    
    // 全局注册
    window.Fly = Fly;
}