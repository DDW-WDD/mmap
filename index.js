// 全局变量
// 全局变量定义
let camera, scene, renderer, css2Renderer, control, freeCameraController;
let ship, fly, fire, city;

// 添加全局视角模式变量
let currentViewMode = 'free'; // 'free' 或 'topView'

// 定义BaseModel基类
if (typeof BaseModel === 'undefined') {
    window.BaseModel = class BaseModel {
        constructor(model, scene, camera, control) {
            this.model = model;
            this.scene = scene;
            this.camera = camera;
            this.control = control;
            this.init();
        }
        
        init() { console.log('BaseModel初始化'); }
        onTick(t) {}
        onModelAttach() {}
    };
}

// 灯光初始化
function createLight() {
    const ambientLight = new THREE.AmbientLight('#fff', 3);
    scene.add(ambientLight);
}

// 切换视角模式的函数
function switchViewMode(mode) {
    console.log(`切换视角模式: ${currentViewMode} -> ${mode}`);
    currentViewMode = mode;
    
    if (mode === 'topView') {
        // 顶视模式：启用Fly顶视环绕，禁用自由控制器
        if (freeCameraController) {
            freeCameraController.disable();
        }
        if (fly) {
            fly.enableTopView();
        }
    } else {
        // 自由模式：禁用Fly顶视环绕，启用自由控制器
        if (fly) {
            fly.disableTopView();
        }
        if (freeCameraController) {
            freeCameraController.enable();
        }
    }
}

// 3D环境初始化
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(-148, 55, -101);

    // 渲染器配置
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // CSS2D渲染器
    css2Renderer = new THREE.CSS2DRenderer();
    css2Renderer.setSize(window.innerWidth, window.innerHeight);
    css2Renderer.domElement.style.position = 'absolute';
    css2Renderer.domElement.style.top = '0px';
    css2Renderer.domElement.style.pointerEvents = 'none';

    // 挂载DOM
    const canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(css2Renderer.domElement);

    // 轨道控制器 - 增强初始化和错误处理
    if (window.THREE && THREE.OrbitControls) {
        try {
            // 重新创建控制器，确保没有残留的错误状态
            control = new THREE.OrbitControls(camera, renderer.domElement);
            
            // 确保所有控制功能启用
            control.enabled = false; // 初始禁用，默认使用自由控制器
            control.enablePan = true;
            control.enableZoom = true;
            control.enableRotate = true;
            
            // 移除所有视角限制
            control.minAzimuthAngle = null;
            control.maxAzimuthAngle = null;
            control.minPolarAngle = null;
            control.maxPolarAngle = null;
            
            // 设置合适的缩放范围
            control.minDistance = 50;
            control.maxDistance = 1000;
            
            // 启用阻尼效果
            control.enableDamping = true;
            control.dampingFactor = 0.05;
            
            // 鼠标按钮配置
            control.mouseButtons = {
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
            };
            
            // 触控配置
            control.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            };
            
            // 设置速度
            control.panSpeed = 1.0;
            control.rotateSpeed = 1.0;
            control.zoomSpeed = 1.0;
            
            // 暴露到全局用于调试
            window.debugOrbitControl = control;
        } catch (e) {
            console.error('创建OrbitControls失败:', e);
        }
    }
    
    // 创建自由视角控制器（默认启用）
    if (window.FreeCameraController) {
        try {
            // 创建自由视角控制器，设置为最顶层控制
            freeCameraController = new FreeCameraController(camera, renderer.domElement);
            console.log('自由视角控制器已创建');
        } catch (e) {
            console.error('自由视角控制器初始化失败:', e);
        }
    }
    
    // 暴露视角模式控制函数到全局
    window.switchViewMode = switchViewMode;
}

// 渲染循环
function animate() {
    requestAnimationFrame(animate);
    
    // 根据当前视角模式更新相应的控制器
    if (currentViewMode === 'free' && freeCameraController) {
        freeCameraController.update();
    } else if (control && control.enabled) {
        control.update();
    }
    
    // 确保EffectManager调用ship的onTick
    if (window.EffectManager && window.EffectManager.getInstance) {
        const effectManager = EffectManager.getInstance();
        if (effectManager && effectManager.tickForEach) {
            effectManager.tickForEach();
        } else {
            // 降级：直接调用ship的onTick
            if (window.shipInstance && window.shipInstance.onTick) {
                window.shipInstance.onTick();
            }
        }
    } else {
        // 降级：直接调用ship的onTick
        if (window.shipInstance && window.shipInstance.onTick) {
            window.shipInstance.onTick();
        }
    }
    
    // 其他动画更新
    if (fly) fly.onTick();
    if (ship) ship.onTick();
    if (fire) fire.onTick();
    
    // 渲染场景
    renderer.render(scene, camera);
    // 确保CSS2D渲染也执行
    if (css2Renderer) {
        css2Renderer.render(scene, camera);
    }
}

// 窗口适配
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    css2Renderer.setSize(window.innerWidth, window.innerHeight);
});

// 精准查找"铁路3857t"模型
function findRailway3857tModel(parent) {
    if (!parent) return null;
    // 匹配模型名称（支持name或userData.name）
    if (parent.name === '铁路3857t' || parent.userData.name === '铁路3857t') {
        console.log('找到"铁路3857t"模型:', parent);
        return parent;
    }
    // 递归查找子模型
    for (let i = 0; i < parent.children.length; i++) {
        const found = findRailway3857tModel(parent.children[i]);
        if (found) return found;
    }
    return null;
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    init();
    createLight();

    // 初始化ClickHandler
    function initializeClickHandler() {
        if (typeof ClickHandler === 'undefined') {
            setTimeout(initializeClickHandler, 100);
            return;
        }
        const clickHandler = ClickHandler.getInstance();
        if (clickHandler && clickHandler.init) {
            clickHandler.init(camera);
        }
    }
    initializeClickHandler();

    // 设置单一背景图片pp.png
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('./pp.png', (texture) => {
        scene.background = texture;
        console.log('背景图片pp.png加载成功');
    }, undefined, (error) => {
        console.error('背景图片加载失败:', error);
    });

    // 加载模型
    if (typeof loadManager !== 'undefined') {
        loadManager(['./ens_11_1_2.fbx', './boa2t.glb'], (modelList) => {
            let cityModel = null;
            // 先加载城市模型
            modelList.forEach(obj => {
                if (obj.url === './ens_11_1_2.fbx') {
                    if (typeof City !== 'undefined') {
                        try {
                            cityModel = new City(obj.model, scene, camera, control);
                            scene.add(obj.model); // 加入场景，方便查找子模型
                        } catch (e) {
                            console.error('创建City失败:', e);
                        }
                    } else {
                        console.error('City类未定义');
                    }
                }
            });

            // 延迟查找"铁路3857t"，确保模型加载完成
            setTimeout(() => {
                window.railwayModel = findRailway3857tModel(scene) || findRailway3857tModel(cityModel?.model);
                
                // 验证铁路模型并移除显示
                if (window.railwayModel && window.railwayModel.geometry?.attributes?.position) {
                    console.log('"铁路3857t"模型找到，已移除显示');
                    // 从父节点中移除铁路模型
                    if (window.railwayModel.parent) {
                        window.railwayModel.parent.remove(window.railwayModel);
                    }
                    // 或者隐藏模型
                    window.railwayModel.visible = false;
                } else {
                    console.log('未找到铁路模型或模型无效');
                    window.railwayModel = null;
                }
                // 验证铁路模型
                if (window.railwayModel && window.railwayModel.geometry?.attributes?.position) {
                    console.log('"铁路3857t"模型验证通过，顶点数量:', window.railwayModel.geometry.attributes.position.count);
                } else {
                    console.error('未找到有效"铁路3857t"模型');
                    window.railwayModel = null;
                }

                // 初始化船模型
                modelList.forEach(obj => {
                    if (obj.url === './boa2t.glb') {
                        // 跳过加载boa2t.glb模型
                        console.log('跳过加载boa2t.glb模型');
                        return; // 不执行后面的代码
                    }
                    // 其他模型正常加载
                    // 这里可能有其他模型的加载逻辑...
                });
            }, 1000);

            // 创建Fly实例
            try {
                const meshObj = new THREE.Mesh(
                    new THREE.BoxGeometry(5, 5, 5),
                    new THREE.MeshBasicMaterial({ color: 'lightblue' })
                );
                if (typeof Fly !== 'undefined') {
                    const fly = new Fly(meshObj, scene, camera, control);
                    if (window.EffectManager && EffectManager.getInstance) {
                        EffectManager.getInstance().addObj(fly);
                    }
                    if (window.EventBus && EventBus.getInstance) {
                        EventBus.getInstance().on('mode-topView', (isOpen) => {
                            // 增强事件处理，确保control存在且状态正确
                            if (control && fly.control) {
                                fly.control.enabled = !isOpen;
                                // 确保在退出顶视图模式时，主控制器也被启用
                                control.enabled = !isOpen;
                                console.log('顶视图模式变更:', isOpen, '控制器状态:', control.enabled);
                            }
                            fly.isCameraMove = isOpen;
                        });
                    }
                }
            } catch (flyError) {
                console.error('创建Fly失败:', flyError);
            }
        });
    } else {
        console.error('loadManager未定义');
    }

    // 启动渲染循环 - 使用新的animate函数
    animate();
});