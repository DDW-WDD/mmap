class Ship extends BaseModel {
    constructor(model, scene, camera, control) {
        super(model, scene, camera, control);
        this.model = this.createValidModel(model);
        if (!(this.model.position instanceof THREE.Vector3)) {
            this.model.position = new THREE.Vector3(0, 0, 0);
            console.warn('船模型position无效，强制重置');
        }
        this.model.visible = true;

        // 状态初始化
        this.isMouseTouching = false;
        this.prePos = 0;
        this.pointIndex = 0;
        this.pointArr = [];
        this.isMoveCamera = false;
        this.isRoaming = false;
        this.isMoving = false;
        this.forwardDir = new THREE.Vector3();
        this.lastPosition = new THREE.Vector3();
    }

    createValidModel(model) {
        if (model && model instanceof THREE.Object3D) {
            console.log('使用传入的船模型');
            if (!model.position) model.position = new THREE.Vector3(0, 0, 0);
            return model;
        }
        console.warn("传入模型无效，创建兜底船模型");
        const defaultModel = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 12),
            new THREE.MeshBasicMaterial({ color: 0x9900ff })
        );
        defaultModel.position = new THREE.Vector3(0, 0, 0);
        return defaultModel;
    }

    init() {
        if (this.scene && this.scene instanceof THREE.Scene && this.model && !this.model.parent) {
            this.scene.add(this.model);
            console.log('船模型添加到场景');
        } else {
            console.warn('场景无效或模型已在场景中');
        }

        if (this.model) {
            this.model.visible = true;
            this.model.scale.set(3, 3, 3);
        }

        this.initPosition();
        this.setShipColor(0x9900ff);
        if (this.model?.position) {
            this.lastPosition.copy(this.model.position);
        } else {
            this.lastPosition.set(0, 0, 0);
        }

        this.onModelAttach();
        this.waitForRailwayThenGeneratePath();
        window.shipInstance = this;
        console.log('Ship初始化完成');
    }

    initPosition() {
        const setRailwayStart = () => {
            if (!window.railwayModel) {
                console.warn("未找到“铁路3857t”模型");
                return false;
            }
            if (!window.railwayModel.geometry) {
                console.warn("“铁路3857t”模型无geometry");
                return false;
            }
            if (!window.railwayModel.geometry.attributes?.position) {
                console.warn("“铁路3857t”模型无position属性");
                return false;
            }

            const positions = window.railwayModel.geometry.attributes.position;
            if (positions.count === 0) {
                console.warn("“铁路3857t”模型无顶点数据");
                return false;
            }

            const startPoint = new THREE.Vector3();
            try {
                startPoint.x = positions.getX(0);
                startPoint.y = positions.getY(0) + 1.2;
                startPoint.z = positions.getZ(0);
                const matrix = window.railwayModel.matrixWorld || new THREE.Matrix4();
                startPoint.applyMatrix4(matrix);
                console.log('“铁路3857t”起点坐标:', startPoint);
            } catch (e) {
                console.error("“铁路3857t”起点取点失败:", e);
                return false;
            }

            if (!this.model) {
                console.error('this.model不存在，强制创建');
                this.model = this.createValidModel(null);
            }
            if (!(this.model.position instanceof THREE.Vector3)) {
                this.model.position = new THREE.Vector3();
            }
            if (!(this.lastPosition instanceof THREE.Vector3)) {
                this.lastPosition = new THREE.Vector3();
            }

            this.model.position.copy(startPoint);
            this.lastPosition.copy(startPoint);
            const nextPoint = this.getRailwayNextPoint();
            this.model.lookAt(nextPoint);
            
            // 【修复1：船方向在xy平面顺时针旋转90度】
            this.model.rotation.z -= Math.PI / 2; // 绕z轴顺时针转90度（xy平面内）
            console.log('船方向已调整为顺时针90度');
            
            return true;
        };

        if (!setRailwayStart()) {
            console.warn('使用备用起点');
            if (!this.model) this.model = this.createValidModel(null);
            if (!(this.model.position instanceof THREE.Vector3)) {
                this.model.position = new THREE.Vector3();
            }
            if (!(this.lastPosition instanceof THREE.Vector3)) {
                this.lastPosition = new THREE.Vector3();
            }
            this.model.position.set(-140, 10, -100);
            this.lastPosition.set(-140, 10, -100);
            this.model.rotation.z -= Math.PI / 2; // 备用起点也调整方向
            console.log('备用起点设置完成:', this.model.position);
        }
    }

    getRailwayNextPoint() {
        const defaultPoint = new THREE.Vector3(-130, 10, -90);
        if (!window.railwayModel || !window.railwayModel.geometry) return defaultPoint;

        const positions = window.railwayModel.geometry.attributes.position;
        if (!positions || positions.count < 2) return defaultPoint;

        const nextPoint = new THREE.Vector3();
        try {
            nextPoint.x = positions.getX(1);
            nextPoint.y = positions.getY(1) + 1.2;
            nextPoint.z = positions.getZ(1);
            nextPoint.applyMatrix4(window.railwayModel.matrixWorld || new THREE.Matrix4());
        } catch (e) {
            nextPoint.copy(defaultPoint);
        }
        return nextPoint;
    }

    waitForRailwayThenGeneratePath() {
        const generate = () => {
            this.generatorMovePath();
            this.initPosition();
        };

        if (window.railwayModel && window.railwayModel.geometry) {
            generate();
            return;
        }

        setTimeout(generate, 1000);
        if (window.EventBus) {
            EventBus.getInstance().on('railway-ready', generate);
        }
    }

    // 【修复2：路线平滑简化】
    generatorMovePath() {
        if (!window.railwayModel || !window.railwayModel.geometry) {
            this.generateDefaultPath();
            return;
        }

        const railwayGeo = window.railwayModel.geometry;
        const positions = railwayGeo.attributes.position;
        if (!positions || positions.count <= 5) {
            this.generateDefaultPath();
            return;
        }

        const matrixWorld = window.railwayModel.matrixWorld || new THREE.Matrix4();
        const railPoints = [];
        // 采样参数调整：减少采样点，增加平滑度
        const startSimplifyLength = 20;  // 开头简化更长
        const startSampleStep = 3;       // 开头步长增大（简化更明显）
        const normalSampleStep = 2;      // 后续步长增大（减少点数量）

        for (let i = 0; i < positions.count; i++) {
            if (i < startSimplifyLength && i % startSampleStep !== 0) continue;
            if (i >= startSimplifyLength && i % normalSampleStep !== 0) continue;

            const localPoint = new THREE.Vector3();
            try {
                localPoint.x = positions.getX(i);
                localPoint.y = positions.getY(i) + 1.2;
                localPoint.z = positions.getZ(i);
                localPoint.applyMatrix4(matrixWorld);
                railPoints.push(localPoint);
            } catch (e) {
                console.error('铁路顶点取点失败:', e);
            }
        }

        // 过滤反向点：保留更多平滑转向
        const filteredPoints = this.filterReversePoints(railPoints, -0.3);

        // 曲线平滑度提升：tension=0.5（更平滑，减少尖锐拐角）
        const shipPath = new THREE.CatmullRomCurve3(filteredPoints, false, 'catmullrom', 0.5);
        // 减少路径点密度（1:3比例）
        this.pointArr = shipPath.getSpacedPoints(Math.max(filteredPoints.length * 3, 20));

        // 路线可视化
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(this.pointArr),
            new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
        );
        if (this.scene) {
            this.scene.add(line);
            console.log(`简化后路线生成：${this.pointArr.length}个点（更平滑）`);
        }
    }

    filterReversePoints(points, forwardThreshold = -0.3) {
        if (points.length <= 2) return points;
        const filteredPoints = [points[0]];
        let lastDirection = new THREE.Vector3().subVectors(points[1], points[0]).normalize();

        for (let i = 1; i < points.length - 1; i++) {
            const currentDirection = new THREE.Vector3().subVectors(points[i + 1], points[i]).normalize();
            // 更宽松的过滤（允许更大角度转向，保持平滑）
            if (lastDirection.dot(currentDirection) > forwardThreshold) {
                filteredPoints.push(points[i]);
                lastDirection = currentDirection;
            }
        }
        filteredPoints.push(points[points.length - 1]);
        return filteredPoints;
    }

    generateDefaultPath() {
        const defaultPoints = [];
        for (let i = 0; i < 30; i++) {
            defaultPoints.push(new THREE.Vector3(
                -140 + Math.sin(i * 0.1) * 20,
                10,
                -100 + i * 6 + Math.cos(i * 0.08) * 8
            ));
        }
        this.pointArr = defaultPoints;
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(this.pointArr),
            new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 })
        );
        if (this.scene) {
            this.scene.add(line);
            console.log("备用路线生成：30个点");
        }
    }

    onTick(t) {
        // 打印tick状态，确认是否被调用
        console.log('【onTick执行】', 'isMoving:', this.isMoving, '路径点数量:', this.pointArr.length);

        if (!this.isMoving || this.pointArr.length === 0 || !this.model) {
            console.log('【移动条件不满足】', 'isMoving:', this.isMoving, '路径点:', this.pointArr.length);
            return;
        }

        // 增加移动速度（解决移动过慢问题）
        this.pointIndex += 0.05; // 从0.02提升到0.05
        if (this.pointIndex >= this.pointArr.length - 1) {
            this.pointIndex = 0;
        }

        const currentIdx = Math.floor(this.pointIndex);
        const nextIdx = Math.min(currentIdx + 2, this.pointArr.length - 1);
        const currentPoint = this.pointArr[currentIdx];
        const targetPoint = this.pointArr[nextIdx];

        if (!currentPoint || !targetPoint) {
            console.error('【路径点无效】currentPoint:', currentPoint, 'targetPoint:', targetPoint);
            return;
        }

        this.forwardDir.subVectors(targetPoint, currentPoint).normalize();

        // 优化插值，确保船实际移动
        const smoothPoint = new THREE.Vector3().lerpVectors(this.lastPosition, currentPoint, 0.3); // 提升插值因子
        this.model.position.copy(smoothPoint);
        this.lastPosition.copy(smoothPoint);
        console.log('【船位置更新】', smoothPoint);

        // 方向调整（确保正确）
        this.model.lookAt(targetPoint);
        this.model.rotation.z -= Math.PI / 2; // 顺时针90度
        this.model.rotation.y += Math.PI;

        // 强制更新相机位置 - 仅在明确的漫游模式下执行，避免与OrbitControls冲突
        if (this.isMoveCamera && this.isRoaming && this.camera) {
            const cameraOffset = new THREE.Vector3(-15, 7, -10);
            cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.model.rotation.y);
            const targetCameraPos = new THREE.Vector3(
                smoothPoint.x + cameraOffset.x,
                smoothPoint.y + cameraOffset.y,
                smoothPoint.z + cameraOffset.z
            );
            this.camera.position.lerp(targetCameraPos, 0.5); // 提升相机跟随速度
            console.log('【相机位置更新】', this.camera.position);

            if (!this.isMouseTouching) {
                const lookAhead = new THREE.Vector3().copy(targetPoint)
                    .add(this.forwardDir.clone().multiplyScalar(3));
                this.camera.lookAt(lookAhead);
            }
        }
    }


    // 漫游事件
    mousedownFn = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isMouseTouching = true;
        this.prePos = e.clientX;
    }

    mousemoveFn = (e) => {
        if (!this.isMouseTouching || !this.isRoaming) return;
        const delta = (this.prePos - e.clientX) * 0.006;
        this.camera.rotateY(delta);
        this.prePos = e.clientX;
    }

    mouseupFn = () => {
        this.isMouseTouching = false;
    }

    // 【修复3：点击漫游响应 - 绑定点击事件并确保EventBus正常】
    onModelAttach() {
        if (!window.EventBus || !EventBus.getInstance()) {
            console.error('EventBus不存在，创建简易替代方案');
            // 无EventBus时的降级处理
            this.setupClickHandlerWithoutEventBus();
            return;
        }

        // 正常绑定EventBus事件
        const eventBus = EventBus.getInstance();
        eventBus.on('mode-roaming', (isOpen) => {
            console.log('漫游模式切换:', isOpen);
            this.isRoaming = isOpen;
            this.isMoveCamera = isOpen;
            this.isMoving = isOpen;
            this.pointIndex = 0;

            if (isOpen) {
                document.addEventListener('mousedown', this.mousedownFn);
                document.addEventListener('mousemove', this.mousemoveFn);
                document.addEventListener('mouseup', this.mouseupFn);
            } else {
                document.removeEventListener('mousedown', this.mousedownFn);
                document.removeEventListener('mousemove', this.mousemoveFn);
                document.removeEventListener('mouseup', this.mouseupFn);
            }
        });

        // 【添加点击触发漫游的逻辑】
        this.setupClickHandler();

        // 移除自动开启漫游的调试代码
    }

    // 移除漫游按钮相关功能
    setupClickHandler() {
        // 不再创建或使用漫游按钮
        console.log('漫游按钮功能已禁用');
        // 移除自动开启漫游的调试代码
        // 不执行任何与漫游按钮相关的操作
    }

    // 移除无EventBus时的降级处理
    setupClickHandlerWithoutEventBus() {
        // 不再创建或使用漫游按钮
        console.log('漫游按钮功能已禁用（无EventBus模式）');
        // 不执行任何与漫游按钮相关的操作
    }

    setShipColor(hexColor) {
        if (!this.model) return;
        this.model.traverse(child => {
            if (child.isMesh) {
                child.visible = true;
                child.material = new THREE.MeshBasicMaterial({
                    color: hexColor,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 1
                });
                child.material.map = null;
            }
        });
    }

    moveToRailwayStart() { this.initPosition(); }
    animateToPosition(targetPosition, duration) {}
    easeOutQuad(t) { return t * (2 - t); }
}

function getRailwayStartPosition(railwayModel) {
    const defaultPoint = new THREE.Vector3(0, 0, 0);
    if (!railwayModel || !railwayModel.geometry) return defaultPoint;

    try {
        const positions = railwayModel.geometry.attributes.position;
        if (positions && positions.count > 0) {
            const point = new THREE.Vector3();
            point.x = positions.getX(0);
            point.y = positions.getY(0);
            point.z = positions.getZ(0);
            point.applyMatrix4(railwayModel.matrixWorld);
            return point;
        }

        railwayModel.geometry.computeBoundingBox();
        const { min } = railwayModel.geometry.boundingBox || { min: defaultPoint };
        const point = new THREE.Vector3(min.x, min.y, min.z);
        point.applyMatrix4(railwayModel.matrixWorld);
        return point;
    } catch (e) {
        return defaultPoint;
    }
}