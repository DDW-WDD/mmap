const getBoxCenter=mesh=>{
    let box=new THREE.Box3()
    box.expandByObject(mesh)
    let center=new THREE.Vector3()
    box.getCenter(center)
    var size=new THREE.Vector3()
    box.getSize(size)
    return {
        center,
        size
    }
}