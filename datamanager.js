class DataManager {
    constructor() {
        this.data = this.generateMockData();
        this.initDataUpdate();
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new DataManager();
        }
        return this.instance;
    }

    // 生成模拟数据
    generateMockData() {
        return {
            base: {
                povertyAlleviationPopulation: 175688,
                povertyReductionRate: 25.38,
                perCapitaDisposableIncome: 12291,
                eliminatedVillages: 145
            },
            industryData: {
                years: ['2016', '2017', '2018', '2019', '2020'],
                total: [120.00, 140.00, 180.00, 220.00, 255.00],
                tourism: [50.00, 60.00, 80.00, 100.00, 120.00],
                seleniumFood: [40.00, 45.00, 55.00, 65.00, 70.00],
                bioMedicine: [15.00, 20.00, 25.00, 30.00, 35.00],
                cleanEnergy: [15.00, 15.00, 20.00, 25.00, 30.00]
            },
            industryDistribution: [
                { value: 54.24, name: '第一产业(农业)', percentage: '10.6%' },
                { value: 169.45, name: '第二产业(工业)', percentage: '33.1%' },
                { value: 288.87, name: '第三产业(服务业)', percentage: '56.3%' }
            ]
        };
    }

    // 获取数据
    getData() {
        return new Promise(resolve => {
            // 模拟网络请求延迟
            setTimeout(() => {
                resolve(this.data);
            }, 500);
        });
    }

    // 定时更新数据
    initDataUpdate() {
        setInterval(() => {
            this.data = this.generateMockData();
            EventBus.getInstance().emit('refreshHomeCount', this.data);
        }, 15000); // 每15秒更新一次
    }
}

// 全局实例化
window.datamanager = DataManager;