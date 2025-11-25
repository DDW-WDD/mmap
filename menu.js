// menu.js 修正版本
window.addEventListener('DOMContentLoaded', () => {
    let modeArr = [
        {
            mode: 'mode-topView',
            isOpen: false
        },
        // 移除漫游按钮相关配置
    ];
    
    for(let i = 0; i < modeArr.length; i++) {
        let item = modeArr[i];
        const element = document.getElementById(item.mode);
        if (element) {
            element.onclick = function() {
                item.isOpen = !item.isOpen;
                EventBus.getInstance().emit(item.mode, item.isOpen);
            };
        } else {
            console.warn(`Element with id '${item.mode}' not found`);
        }
    }
});