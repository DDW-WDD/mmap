function loadManager(pathlist, suc) {
    const gltfLoader = new THREE.GLTFLoader();
    const fbxLoader = new THREE.FBXLoader();

    const models = [];
    let loadedCount = 0;
    const total = pathlist.length;

    console.log(`开始加载 ${total} 个模型`);

    pathlist.forEach(path => {
        console.log(`尝试加载: ${path}`);

        const onLoad = (loadedModel) => {
            console.log(`成功加载: ${path}`);
            models.push({
                model: loadedModel,
                url: path
            });
            loadedCount++;
            
            if (loadedCount === total) {
                console.log(`所有模型加载完成，共 ${models.length} 个`);
                suc(models);
            }
        };

        const onProgress = (xhr) => {
            console.log(`${path} 加载进度: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
        };

        const onError = (error) => {
            console.error(`加载失败 ${path}:`, error);
            loadedCount++;
            if (loadedCount === total) {
                console.log(`加载完成，成功 ${models.length}/${total} 个模型`);
                suc(models);
            }
        };

        if (path.includes('.fbx')) {
            fbxLoader.load(path, onLoad, onProgress, onError);
        } else if (path.includes('.gltf') || path.includes('.glb')) {
            gltfLoader.load(path, (gltf) => {
                onLoad(gltf.scene); // GLTF返回的是包含scene的对象
            }, onProgress, onError);
        } else {
            console.warn(`未知格式: ${path}`);
            loadedCount++;
        }
    });

    if (total === 0) {
        suc(models);
    }
}