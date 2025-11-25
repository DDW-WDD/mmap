
// CityWater.js - 修正版本
class CityWater {
    constructor(originalMesh, scene) {
        this.scene = scene;
        this.originalMesh = originalMesh; // 保存原始模型（用于继承位置/旋转）
        this.init();
    }

    init() {
        // 1. 获取原始模型的几何体（用于水面对应的形状）
        const geometry = this.originalMesh.geometry;
        if (!geometry) {
            console.error("原始模型无几何体，无法创建水面");
            return;
        }

        // 2. 正确加载水法线纹理
        const textureLoader = new THREE.TextureLoader();
        const waterNormals = textureLoader.load(
            './water_face.png', // 法线纹理路径（确保文件存在）
            (texture) => {
                // 纹理重复模式（使水波纹更自然）
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(4, 4); // 重复次数，控制波纹密度
            },
            null,
            (err) => console.error("水法线纹理加载失败:", err)
        );

        // 3. 创建Water对象（Three.js的水效果）
        this.water = new THREE.Water(
            geometry,
            {
                textureWidth: 512,    // 水纹理宽度
                textureHeight: 512,   // 水纹理高度
                waterNormals: waterNormals, // 法线纹理（核心）
                sunDirection: new THREE.Vector3(-0.5, -1, -0.5).normalize(), // 太阳方向（影响反光）
                sunColor: 0xffffff,   // 太阳光颜色
                waterColor: '#1e90ff', // 水本身颜色（深青色）
                distortionScale: 3.7, // 水面扭曲程度
                fog: this.scene.fog !== undefined, // 是否受场景雾影响
            }
        );

        this.water.material.side = THREE.DoubleSide; // 双面渲染（正面和背面都显示）

        // 4. 继承原始模型的位置、旋转和缩放（确保水在正确位置）
        this.water.position.copy(this.originalMesh.position);
        this.water.rotation.copy(this.originalMesh.rotation);
        this.water.scale.copy(this.originalMesh.scale);

        // 5. 调整水面朝向（默认可能需要旋转至水平）
        this.water.rotation.x = -Math.PI / 2; // 确保水面水平

        // 6. 隐藏原始模型，添加水面到场景
        this.originalMesh.visible = false;
        this.scene.add(this.water);

        // 7. 初始化时间uniform
        if (this.water.material && this.water.material.uniforms) {
            this.water.material.uniforms.time = { value: 0 };
        }
    }

    // 修正onTick方法
    onTick(t) {
        if (this.water && this.water.material && this.water.material.uniforms && 
            this.water.material.uniforms.time) {
            this.water.material.uniforms.time.value = t / 1000;
        }
    }

    // 可选：添加水面动画（波纹流动效果）
    update(deltaTime) {
        if (this.water && this.water.material && this.water.material.uniforms && 
            this.water.material.uniforms.time) {
            // 法线纹理偏移，模拟水流动
            this.water.material.uniforms.time.value += deltaTime * 0.5;
        }
    }
}