class Fire{
    constructor(scene,center,size)
    {
        this.scene=scene
        this.center=center
        this.size=size
        this.init()
    }
    init()
    {
        const texture=new THREE.TextureLoader().load('./小麦.png')
        texture.colorSpace=THREE.SRGBColorSpace
        const spriteMaterial=new THREE.SpriteMaterial({
            map:texture
        })
        const sprite=new THREE.Sprite(spriteMaterial)
        sprite.position.set(this.center.x,this.center.y+this.size.y/2+3,this.center.z)
        sprite.scale.set(10,10,10)
        this.scene.add(sprite)
    }
    
    // 添加onTick方法以兼容其他组件的调用
    onTick() {}
}

// 注册到全局窗口对象，确保City.js可以访问
window.Fire = Fire;