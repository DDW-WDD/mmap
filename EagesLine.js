class EagesLine
{
    constructor(scene,mesh,color)
    {
        this.scene=scene
        this.mesh=mesh
        this.color=color
        this.init()
    }

     init()
    {
        const eagesGeometry=new THREE.EdgesGeometry(this.mesh.geometry)
        const material=new THREE.LineBasicMaterial({color:this.color})
        const line=new THREE.LineSegments(eagesGeometry,material)
        line.position.copy(this.mesh.position)
        line.rotation.copy(this.mesh.rotation)
        line.scale.copy(this.mesh.scale)
        this.scene.add(line)
    }
}