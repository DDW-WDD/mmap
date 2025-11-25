// BaseModel.js - 添加检查
if (typeof BaseModel === 'undefined') {
    class BaseModel {
        constructor(model, scene, camera, control) {
            this.model = model;
            this.scene = scene;
            this.camera = camera;
            this.control = control;
            this.init();  // 确保调用init
        }

        init() {
            // 基础初始化可以在这里实现
            // this.setupModel();
        }

        setupModel() {
            // 模型基本设置
            if (this.model) {
                // 可以添加通用的模型处理逻辑
                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
            }
        }
    }
    
    // 全局注册
    window.BaseModel = BaseModel;
}