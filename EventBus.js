class EventBus {
    constructor() {
        this.eventMap = {};
    }

    static getInstance() {  // 确保是 getInstance 不是 getinstance
        if (!this.instance) {
            this.instance = new EventBus();
        }
        return this.instance;
    }

    on(eventName, fn) {
        if (typeof fn !== 'function') {
            console.warn('事件回调必须是函数');
            return;
        }
        
        if (!this.eventMap[eventName]) {
            this.eventMap[eventName] = [];
        }
        this.eventMap[eventName].push(fn);
    }

    emit(eventName, ...args) {
        if (!this.eventMap[eventName]) return;
        
        // 创建副本以防事件处理中修改数组
        [...this.eventMap[eventName]].forEach((fn) => {
            try {
                fn(...args);
            } catch (error) {
                console.error(`事件 ${eventName} 处理出错:`, error);
            }
        });
    }

    off(eventName, fn) {
        if (!this.eventMap[eventName]) return;
        
        if (fn) {
            // 移除特定回调
            this.eventMap[eventName] = this.eventMap[eventName].filter(
                callback => callback !== fn
            );
        } else {
            // 移除所有回调
            this.eventMap[eventName] = [];
        }
    }
}

// 确保全局注册
window.EventBus = EventBus;