 class Sky
{
    constructor(scene)
    {
        this.scene=scene;
    }
    setBack(publicPath,publicList)
    {
        (new THREE.CubeTextureLoader()).setPath(publicPath).load( publicList, 
                (texture) => {
                    this.scene.background = texture;
                    console.log("天空背景加载成功！"); // 验证成功
                },
                (xhr) => {
                    console.log(`天空图片加载进度：${(xhr.loaded / xhr.total) * 100}%`); // 查看进度
                },
                (err) => {
                    console.error("天空背景加载失败：", err); // 关键！排查错误原因
                })
    }
}