function modifyCityDefaultMaterial(mesh, isCenter) {
    mesh.material.transparent = true;
    mesh.material.blending = THREE.NormalBlending;
    if (isCenter) {
          
        mesh.material.onBeforeCompile = (shader) => {
            console.log("中心着色器编译，模型:", mesh.name);
            // 替换片段着色器中的dithering部分，插入结束标记
            shader.fragmentShader = shader.fragmentShader.replace(
                "#include<output_fragment>",
                `#include<output_fragment>
                //#end#`
            );
            addGradColor(shader, mesh);
        };
        mesh.material.needsUpdate = true;
    } else {
        
        mesh.material.onBeforeCompile = (shader) => {
             console.log("外围着色器编译，模型:", mesh.name);
            shader.fragmentShader = shader.fragmentShader.replace(
                "#include<output_fragment>",
                `#include<output_fragment>
                //#end#`
            );
            addLowGradColor(shader, mesh);
        };
        mesh.material.needsUpdate = true;
    }
    
}

function addGradColor(shader, mesh) {
    mesh.geometry.computeBoundingBox();
    const { min, max } = mesh.geometry.boundingBox;
    const uHeight = max.z - min.z;

    // 定义白膜渐变的核心变量（确保所有变量都有定义）
    shader.uniforms.uTopColor = { value: new THREE.Color("#1B2569") }; // 顶部深色
    shader.uniforms.uBottomColor = { value: new THREE.Color("#000000") }; // 白膜底色（浅灰）
    shader.uniforms.uHeight = { value: uHeight };
    shader.uniforms.uMinZ = { value: min.z }; // z轴最小值

    if (uHeight <= 0) {
        uHeight = 0.001;
        console.warn("外围模型高度为0，使用默认高度:", mesh.name);
    }

    // 顶点着色器：传递顶点位置
    shader.vertexShader = shader.vertexShader.replace(
        "#include<common>",
        `#include<common>
        varying vec3 vPosition;`
    );
    shader.vertexShader = shader.vertexShader.replace(
        "#include<begin_vertex>",
        `#include<begin_vertex>
        vPosition = position;`
    );

    // 片段着色器：使用白膜底色作为混合基础（不依赖原始材质）
    shader.fragmentShader = shader.fragmentShader.replace(
        "#include<common>",
        `#include<common>
        uniform vec3 uTopColor;
        uniform vec3 uBottomColor;
        uniform float uHeight;
        uniform float uMinZ;
        varying vec3 vPosition;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        "//#end#",
        `// 计算渐变比例（0-1）
        float gradMix = (vPosition.z - uMinZ) / uHeight;
        gradMix = clamp(gradMix, 0.0, 1.0);
        // 混合白膜底色和顶部颜色（核心：不依赖原始材质颜色）
        vec3 gradColor = mix(uBottomColor, uTopColor, gradMix);
        gl_FragColor = vec4(gradColor, 0.8); // 半透白膜
        //#end#`
    );
}

function addLowGradColor(shader, mesh) {
    mesh.geometry.computeBoundingBox();
    const { min, max } = mesh.geometry.boundingBox;
    const uHeight = max.z - min.z;

    // 修复：定义uBottomColor，删除重复的uTopColor
    shader.uniforms.uBottomColor = { value: new THREE.Color("#87CEFA") }; // 外围白膜底色（近白）
    shader.uniforms.uTopColor = { value: new THREE.Color("#990033") }; // 外围顶部颜色（中灰）
    shader.uniforms.uHeight = { value: uHeight };
    shader.uniforms.uMinZ = { value: min.z };

    if (uHeight <= 0) {
        uHeight = 0.001;
        console.warn("外围模型高度为0，使用默认高度:", mesh.name);
    }

    // 顶点着色器：传递位置
    shader.vertexShader = shader.vertexShader.replace(
        "#include<common>",
        `#include<common>
        varying vec3 vPosition;`
    );
    shader.vertexShader = shader.vertexShader.replace(
        "#include<begin_vertex>",
        `#include<begin_vertex>
        vPosition = position;`
    );

    // 片段着色器：使用uniform的uMinZ，避免硬编码
    shader.fragmentShader = shader.fragmentShader.replace(
        "#include<common>",
        `#include<common>
        uniform vec3 uBottomColor;
        uniform vec3 uTopColor;
        uniform float uHeight;
        uniform float uMinZ;
        varying vec3 vPosition;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
        "//#end#",
        `float gradMix = (vPosition.z - uMinZ) / uHeight;
        gradMix = clamp(gradMix, 0.0, 1.0);
        vec3 gradColor = mix(uBottomColor, uTopColor, gradMix);
        gl_FragColor = vec4(gradColor, 0.6); // 外围白膜
        //#end#`
    );
}