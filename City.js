class City extends BaseModel {
    constructor(model, scene, camera, control) {
        super(model, scene, camera, control);
        this.railwayModel = null; // 存储铁路模型
        this.buildNameObj = {};   // 建筑信息映射
    }

    init() {
        this.scene.add(this.model);
        this.initEffect();       // 初始化模型效果
        this.initFire('立方体11');// 初始化火灾效果
        this.bindClick();        // 绑定点击事件
        
        // 暴露铁路模型到全局
        window.railwayModel = this.railwayModel;
        console.log("City初始化完成，铁路模型是否存在：", !!this.railwayModel);

        // 铁路模型就绪后，触发事件通知其他组件
        if (this.railwayModel && window.EventBus) {
            EventBus.getInstance().emit('railway-ready', this.railwayModel);
        }
    }

    // 初始化模型效果（材质、水面、边线等）
    initEffect() {
        const nameList = [
            '立方体','立方体11','立方体12','立方体13','居民地','居民地3857t',
            '恩施地形','平面','立方体15','立方体14','立方体21','立方体22',
            '立方体23','立方体25','立方体24','铁路3857t'
        ];
        const mainModelNames = [
            '立方体','立方体11','立方体12','立方体13','立方体15','立方体14',
            '立方体21','立方体22','立方体23','立方体25','立方体24'
        ];

        this.model.traverse(model => {
            if (model.isMesh && model.geometry) {
                if (nameList.includes(model.name)) {
                    model.visible = true;

                    // 中心模型：渐变材质+边线
                    if (mainModelNames.includes(model.name)) {
                        if (window.EagesLine) {
                            new EagesLine(this.scene, model, new THREE.Color('#B3E5FC'));
                        }
                        console.log("中心模型:", model.name);
                        model.material = createCenterGradientMaterial(model);
                    }
                    // 铁路模型：隐藏+生成水面
                    else if (model.name === '铁路3857t') {
                        this.railwayModel = model;
                        model.visible = false; // 隐藏铁路模型

                        window.railwayModel = this.railwayModel;
                        console.log('铁路模型已暴露到全局');

                        // 简化铁路顶点数据（优化路径生成）
                        if (model.geometry.attributes.position) {
                            const positions = model.geometry.attributes.position;
                            const simplifiedPoints = [];
                            const sampleRate = 3; // 每隔3个点取1个
                            
                            for (let i = 0; i < positions.count; i += sampleRate) {
                                simplifiedPoints.push(new THREE.Vector3(
                                    positions.getX(i),
                                    positions.getY(i),
                                    positions.getZ(i)
                                ));
                            }
                            model.simplifiedPoints = simplifiedPoints;
                            console.log(`铁路顶点简化：${positions.count}个 → ${simplifiedPoints.length}个`);
                        }

                        // 创建水面（检查CityWater类）
                        if (window.CityWater && window.EffectManager) {
                            const theWater = new CityWater(model, this.scene);
                            EffectManager.getInstance().addObj(theWater);
                        }
                    }
                    // 外围模型：纹理材质
                    else {
                        const textureLoader = new THREE.TextureLoader();
                        const texture = textureLoader.load('./tif2.png');
                        model.material = new THREE.MeshBasicMaterial({
                            map: texture,
                            transparent: true
                        });
                        console.log("外围纹理模型:", model.name);
                    }
                } else {
                    // 其他模型：边线+外围渐变材质
                    if (window.EagesLine) {
                        new EagesLine(this.scene, model, new THREE.Color('#B3E5FC'));
                    }
                    console.log("其他模型:", model.name);
                    model.material = createPeripheryGradientMaterial(model);
                }
            } else {
                // 非网格模型隐藏
                if (model.isMesh) {
                    model.visible = false;
                }
            }
        });
    }

    // 初始化火灾效果
    initFire(buildName) {
        const build = this.model.getObjectByName(buildName);
        if (build) {
            const { center, size } = getBoxCenter(build);
            new Fire(this.scene, center, size);
            const fireBall = new FireBall(this.scene, center);
            EffectManager.getInstance().addObj(fireBall);
        } else {
            console.warn(`未找到建筑：${buildName}，无法初始化火灾效果`);
        }
    }

    // 绑定建筑点击事件
    bindClick() {
    console.log('City绑定点击事件 - 开始初始化');
    // 重置buildNameObj，确保数据完全正确
    this.buildNameObj = {};
    
    // 脱贫保障措施 - 立方体11-15
    this.buildNameObj['立方体11'] = {
        name: '脱贫保障措施',
        squareMeters: '"4" 项保障：减免学杂费、基本生活费、交通费和医保费'
    };
    this.buildNameObj['立方体12'] = {
        name: '贫困生管理',
        squareMeters: '"3" 项管理：市级信息库、学校教育和 "爱心妈妈" 帮扶管理'
    };
    this.buildNameObj['立方体13'] = {
        name: '结对帮扶',
        squareMeters: '"2" 对 "1"：班主任 + 科任教师或学生结对帮扶 1 名贫困生'
    };
    this.buildNameObj['立方体14'] = {
        name: '通村公路',
        squareMeters: '通村公路硬化：投入 24.5 亿元，新改建农村公路 4697.52 公里，实现 100% 行政村通沥青 / 水泥路'
    };
    this.buildNameObj['立方体15'] = {
        name: '旅游公路',
        squareMeters: '旅游公路：提档升级旅游公路 26 条，打造 "车在路上行，人在画中游" 的景观路'
    };
    
    // 产业发展 - 立方体21-25
    this.buildNameObj['立方体21'] = {
        name: '茶叶产业',
        squareMeters: '茶叶产业：投入近 3 亿元中央财政衔接资金，免费提供茶园改造和基础设施建设，每亩补贴 1350-2000 元，实现 "一年半小投产，三年正式投产"'
    };
    this.buildNameObj['立方体22'] = {
        name: '马铃薯产业',
        squareMeters: '马铃薯产业：投资 2.2 亿元建设标准化基地、存储库和加工中心，"恩施土豆" 区域公用品牌授权企业达 38 家，带动每亩年增收 1200 元以上'
    };
    this.buildNameObj['立方体23'] = {
        name: '中药材产业',
        squareMeters: '中药材产业：对新建林药、果药、粮药生态种植基地 (50 亩以上) 按 200 元 / 亩奖补，连片紫油厚朴基地按 50 元 / 亩 / 年奖补'
    };
    this.buildNameObj['立方体24'] = {
        name: '高山蔬菜',
        squareMeters: '高山蔬菜：建设富硒蔬菜产业强镇，面积达 49 万亩以上，产量稳定增长'
    };
    this.buildNameObj['立方体25'] = {
        name: '专家驻村',
        squareMeters: '专家驻村：组建产业帮扶团队，选派农业技术人员驻村指导，开展 "田间课堂"'
    };
    
    // 主建筑
    this.buildNameObj['立方体'] = {
        name: '主建筑',
        squareMeters: '5000'
    };
    
    console.log('City绑定点击事件 - buildNameObj初始化完成，包含', Object.keys(this.buildNameObj).length, '个建筑数据');

    Object.keys(this.buildNameObj).forEach(key => {
        console.log('City绑定点击事件 - 处理建筑:', key);
        const build = this.model.getObjectByName(key);
        if (!build) {
            console.warn(`未找到建筑模型：${key}`);
            return;
        }
        
        const data = this.buildNameObj[key];
        if (!data) {
            console.error(`建筑数据不存在：${key}`);
            return;
        }
        
        // 存储建筑信息到userData
        build.userData.name = key;
        build.userData.buildInfo = data;
        console.log(`City绑定点击事件 - 为${key}存储建筑数据:`, data);
        
        ClickHandler.getInstance().addMesh(build, (object) => {
            const { center } = getBoxCenter(object);
            console.log('City触发点击事件 - 建筑名称:', key, '传递数据:', data);
            // 关键：调用全局管理器，而非直接new BuildInfo
            window.BuildInfoManager.toggleBuildInfo(this.scene, center, data, key);
        });
    });
    console.log('City绑定点击事件 - 完成初始化')
}
}

// 工具函数：创建中心模型渐变材质
function createCenterGradientMaterial(mesh) {
    if (!mesh.geometry) {
        console.warn('模型无几何体:', mesh.name);
        return new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true });
    }

    mesh.geometry.computeBoundingBox();
    const { min, max } = mesh.geometry.boundingBox;
    const height = max.z - min.z;

    return new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            uTopColor: { value: new THREE.Color("#1B2569") },
            uBottomColor: { value: new THREE.Color("#000000") },
            uHeight: { value: height },
            uMinZ: { value: min.z }
        },
        vertexShader: `
            varying vec3 vPosition;
            void main() {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uTopColor;
            uniform vec3 uBottomColor;
            uniform float uHeight;
            uniform float uMinZ;
            varying vec3 vPosition;
            
            void main() {
                float gradMix = (vPosition.z - uMinZ) / uHeight;
                gradMix = clamp(gradMix, 0.0, 1.0);
                vec3 gradColor = mix(uBottomColor, uTopColor, gradMix);
                gl_FragColor = vec4(gradColor, 0.8);
            }
        `
    });
}

// 工具函数：创建外围模型渐变材质
function createPeripheryGradientMaterial(mesh) {
    if (!mesh.geometry) {
        console.warn('模型无几何体:', mesh.name);
        return new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true });
    }

    mesh.geometry.computeBoundingBox();
    const { min, max } = mesh.geometry.boundingBox;
    const height = max.z - min.z;

    return new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            uBottomColor: { value: new THREE.Color("#87CEFA") },
            uTopColor: { value: new THREE.Color("#990033") },
            uHeight: { value: height },
            uMinZ: { value: min.z }
        },
        vertexShader: `
            varying vec3 vPosition;
            void main() {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uBottomColor;
            uniform vec3 uTopColor;
            uniform float uHeight;
            uniform float uMinZ;
            varying vec3 vPosition;
            
            void main() {
                float gradMix = (vPosition.z - uMinZ) / uHeight;
                gradMix = clamp(gradMix, 0.0, 1.0);
                vec3 gradColor = mix(uBottomColor, uTopColor, gradMix);
                gl_FragColor = vec4(gradColor, 0.6);
            }
        `
    });
}