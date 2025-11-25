// 自由视角控制器 - 支持360度完全自由旋转的顶部控制器
class FreeCameraController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.enabled = true;
        
        // 旋转参数
        this.rotateSpeed = 0.5; // 降低旋转速度，使控制更平稳
        this.panSpeed = 0.5; // 降低平移速度
        this.zoomSpeed = 0.8; // 调整缩放速度
        
        // 添加旋转目标点(参照点)
        this.target = new THREE.Vector3(0, 0, 0);
        this.targetDistance = 0;
        
        // 鼠标状态
        this.isRotating = false;
        this.isPanning = false;
        this.isZooming = false;
        this.lastMousePosition = { x: 0, y: 0 };
        
        // 初始化事件监听
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onMouseWheel = this._onMouseWheel.bind(this);
        this._onContextMenu = this._onContextMenu.bind(this);
        
        this.addEventListeners();
        
        // 计算初始距离
        this.targetDistance = this.camera.position.distanceTo(this.target);
        
        console.log('自由视角控制器初始化完成，支持围绕目标点旋转和平移');
    }
    
    addEventListeners() {
        if (!this.domElement) return;
        
        this.domElement.addEventListener('mousedown', this._onMouseDown);
        this.domElement.addEventListener('wheel', this._onMouseWheel);
        this.domElement.addEventListener('contextmenu', this._onContextMenu); // 防止右键菜单
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
    }
    
    removeEventListeners() {
        if (!this.domElement) return;
        
        this.domElement.removeEventListener('mousedown', this._onMouseDown);
        this.domElement.removeEventListener('wheel', this._onMouseWheel);
        this.domElement.removeEventListener('contextmenu', this._onContextMenu);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
    }
    
    // 防止右键菜单出现
    _onContextMenu(event) {
        if (this.enabled) {
            event.preventDefault();
        }
    }
    
    _onMouseDown(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        
        if (event.button === 0) { // 左键 - 旋转
            this.isRotating = true;
            if (this.domElement) {
                this.domElement.style.cursor = 'grabbing';
            }
        } else if (event.button === 2) { // 右键 - 平移
            this.isPanning = true;
            if (this.domElement) {
                this.domElement.style.cursor = 'grabbing';
            }
        }
        
        this.lastMousePosition.x = event.clientX;
        this.lastMousePosition.y = event.clientY;
    }
    
    _onMouseMove(event) {
        if (!this.enabled || (!this.isRotating && !this.isPanning)) return;
        
        const deltaX = event.clientX - this.lastMousePosition.x;
        const deltaY = event.clientY - this.lastMousePosition.y;
        
        if (this.isRotating) {
            this._rotate(deltaX, deltaY);
        } else if (this.isPanning) {
            this._pan(deltaX, deltaY);
        }
        
        this.lastMousePosition.x = event.clientX;
        this.lastMousePosition.y = event.clientY;
    }
    
    _onMouseUp(event) {
        this.isRotating = false;
        this.isPanning = false;
        // 恢复鼠标样式
        if (this.domElement) {
            this.domElement.style.cursor = 'grab';
        }
    }
    
    _onMouseWheel(event) {
        if (!this.enabled) return;
        
        event.preventDefault();
        const delta = Math.sign(event.deltaY);
        this._zoom(delta);
    }
    
    _rotate(deltaX, deltaY) {
        // 计算相机到目标点的向量
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
        
        // 计算当前球面坐标
        const spherical = new THREE.Spherical().setFromVector3(offset);
        
        // 水平旋转（方位角）
        spherical.theta -= deltaX * this.rotateSpeed * 0.005;
        
        // 垂直旋转（极角）
        spherical.phi -= deltaY * this.rotateSpeed * 0.005;
        
        // 限制垂直旋转范围，防止相机翻转
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        // 保持距离不变
        spherical.radius = this.targetDistance;
        
        // 更新相机位置
        this.camera.position.setFromSpherical(spherical).add(this.target);
        
        // 确保相机始终看向目标点
        this.camera.lookAt(this.target);
    }
    
    _pan(deltaX, deltaY) {
        try {
            // 计算平移向量 - 优化计算方式确保稳定性
            const panLeft = new THREE.Vector3();
            const panUp = new THREE.Vector3(0, 1, 0);
            
            // 计算左方向向量
            panLeft.crossVectors(panUp, this.camera.getWorldDirection(new THREE.Vector3()));
            panLeft.normalize();
            
            // 重新计算上方向向量以确保垂直于视线
            panUp.crossVectors(this.camera.getWorldDirection(new THREE.Vector3()), panLeft);
            panUp.normalize();
            
            // 增加平移灵敏度，使移动更明显
            const moveDistance = this.targetDistance * 0.0015 * this.panSpeed;
            
            // 更新相机和目标点位置
            const offset = new THREE.Vector3();
            offset.add(panLeft.multiplyScalar(deltaX * moveDistance));
            offset.add(panUp.multiplyScalar(-deltaY * moveDistance)); // 反转Y轴平移方向以符合直觉
            
            this.camera.position.add(offset);
            this.target.add(offset);
            
            // 确保相机始终看向目标点
            this.camera.lookAt(this.target);
        } catch (e) {
            console.error('相机平移出错:', e);
        }
    }
    
    _zoom(delta) {
        try {
            // 计算缩放因子
            const zoomFactor = 1 + delta * this.zoomSpeed * 0.05;
            
            // 计算相机到目标点的向量
            const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
            
            // 沿向量方向缩放
            offset.multiplyScalar(zoomFactor);
            
            // 更新相机位置
            this.camera.position.copy(this.target).add(offset);
            
            // 更新距离
            this.targetDistance = this.camera.position.distanceTo(this.target);
            
            // 添加最小和最大缩放限制
            const minDistance = 50;
            const maxDistance = 500;
            
            if (this.targetDistance < minDistance) {
                offset.setLength(minDistance);
                this.camera.position.copy(this.target).add(offset);
                this.targetDistance = minDistance;
            } else if (this.targetDistance > maxDistance) {
                offset.setLength(maxDistance);
                this.camera.position.copy(this.target).add(offset);
                this.targetDistance = maxDistance;
            }
            
            // 确保相机始终看向目标点
            this.camera.lookAt(this.target);
        } catch (e) {
            console.error('相机缩放出错:', e);
        }
    }
    
    // 重置相机位置
    reset() {
        this.target.set(0, 0, 0); // 重置目标点
        this.camera.position.set(0, 50, 100);
        this.targetDistance = this.camera.position.distanceTo(this.target);
        this.camera.lookAt(this.target);
    }
    
    // 启用控制器
    enable() {
        this.enabled = true;
        // 恢复鼠标样式
        if (this.domElement) {
            this.domElement.style.cursor = 'grab';
        }
        console.log('自由视角控制器已启用');
    }
    
    // 禁用控制器
    disable() {
        this.enabled = false;
        // 停止所有操作
        this.isRotating = false;
        this.isPanning = false;
        // 更改鼠标样式表示禁用状态
        if (this.domElement) {
            this.domElement.style.cursor = 'auto';
        }
        console.log('自由视角控制器已禁用');
    }
    
    // 更新控制器状态
    update() {
        // 控制器自动更新逻辑（如果需要）
    }
}

// 全局注册
window.FreeCameraController = FreeCameraController;