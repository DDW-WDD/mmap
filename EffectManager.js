// EffectManager.js - 添加错误处理
class EffectManager
{
    constructor()
    {
        this.list = [];
    }
    
    static getInstance()
    {
        if(!this.instance)
        {
            this.instance = new EffectManager();
        }
        return this.instance;
    }
    
    addObj(obj)
    {
        // 确保对象有 onTick 方法
        if (obj && typeof obj.onTick === 'function') {
            this.list.push(obj);
        } else {
            console.warn('尝试添加无效对象到 EffectManager:', obj);
        }
    }
    
    tickForEach(t)
    {
        this.list.forEach((obj, index) => {
            try {
                if (obj && typeof obj.onTick === 'function') {
                    obj.onTick(t);
                }
            } catch (error) {
                console.error(`EffectManager tick 错误在对象 ${index}:`, error);
                // 可选：从列表中移除有问题的对象
                // this.list.splice(index, 1);
            }
        });
    }
}

// 全局注册
window.EffectManager = EffectManager;