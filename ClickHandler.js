// ClickHandler.js - 移除有问题的调试代码
class ClickHandler {
    static getInstance() {
        if (!this.instance) {
            this.instance = new ClickHandler();
        }
        return this.instance;
    }

    constructor() {
        this.list = [];
        this.map = new Map();
        this.camera = null;
        this.initialized = false;
    }

    init(camera) {
        if (this.initialized) {
            console.warn('ClickHandler already initialized');
            return;
        }
        
        this.camera = camera;
        this.initialized = true;

        const rayCaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        
        window.addEventListener('click', e => {
            e.stopPropagation();
            pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            rayCaster.setFromCamera(pointer, this.camera);
            const resultList = rayCaster.intersectObjects(this.list);
            
            if (resultList.length > 0) {
                const targetObj = resultList[0];
                const fn = this.map.get(targetObj.object);
                if (fn) {
                    fn(targetObj.object);
                }
            }
        });
        
        console.log('ClickHandler initialized successfully');
    }
    
    addMesh(mesh, fn) {
        this.list.push(mesh);
        this.map.set(mesh, fn);
    }
}

// 全局注册
window.ClickHandler = ClickHandler;