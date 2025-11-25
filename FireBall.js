class FireBall
{
    constructor(scene,center)
    {
        this.scene=scene
        this.center=center
        this.nowMesh={}
        this.nowScale=0
        this.init()
    }
    init()
    {
        const geometry=new THREE.SphereGeometry(
            25,
            32,
            16,
            0,
            Math.PI*2,
            0,
            Math.PI/2,
        )
        const material =new THREE.MeshBasicMaterial({
            color:new THREE.Color('#f4790d'),
            side:THREE.DoubleSide,
            depthTest:false
        })
        const sphere=new THREE.Mesh(geometry,material)
        sphere.position.set(this.center.x,0,this.center.z)
        this.scene.add(sphere)
        this.nowMesh=sphere
    }
    onTick()
    {
        if(this.nowScale<1)
        {
            this.nowScale+=0.001
            this.nowMesh.scale.set(this.nowScale,this.nowScale,this.nowScale)
        }
        else
        {
            this.nowScale=0
        }
    }
}

// 注册到全局窗口对象，确保City.js可以访问
window.FireBall = FireBall;