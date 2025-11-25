window.addEventListener('DOMContentLoaded',()=>{
    const myBarChart=echarts.init(document.getElementById('bar-chart'))
    const myPieChart=echarts.init(document.getElementById('pie-chart'))
    initChart()

    async function initChart() {
        let datajson=await datamanager.getInstance().getData()

        const{  
            industryData,  
            industryDistribution,  
            base,  
        }=datajson

        // 堆叠柱状图配置 - 四大产业集群产值数据
const barOption = {
    title: {
        text: '四大产业集群产值(亿元)',
        textStyle: {
            color: '#B4C0CC',
            fontSize: 14
        },
        left: 'center',
        top: 0
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow',
        },
        formatter: function(params) {
            let result = params[0].name + '年<br/>';
            let total = 0;
            params.forEach(item => {
                result += item.marker + item.seriesName + ': ' + item.value + '亿元<br/>';
                total += item.value;
            });
            result += '总价值: ' + total + '亿元';
            return result;
        }
    },
    legend: {
        data: ['生态文化旅游', '硒食品精深加工', '生物医药', '清洁能源'],
        bottom: 0,
        textStyle: {
            color: '#B4C0CC'
        }
    },
    grid: {
        top: '25%',
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
    },
    xAxis: [
        {
            type: 'category',
            axisTick: {
                alignWithLabel: true,
                show: false,
            },
            data: industryData.years,
            axisLine: {
                lineStyle: {
                    color: '#B4C0CC'
                }
            }
        },
    ],
    yAxis: [
        {
            type: 'value',
            name: '产值(亿元)',
            nameTextStyle: {
                color: '#B4C0CC'
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(180, 192, 204, 0.1)'
                }
            },
            axisLine: {
                lineStyle: {
                    color: '#B4C0CC'
                }
            }
        },
    ],
    series: [
        {
            name: '生态文化旅游',
            type: 'bar',
            stack: 'total',
            barWidth: '30%',
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#74c0f8' },
                    { offset: 1, color: 'rgba(116,192,248,0.7)' }
                ])
            },
            data: industryData.tourism
        },
        {
            name: '硒食品精深加工',
            type: 'bar',
            stack: 'total',
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#ff7152' },
                    { offset: 1, color: 'rgba(255,113,82,0.7)' }
                ])
            },
            data: industryData.seleniumFood
        },
        {
            name: '生物医药',
            type: 'bar',
            stack: 'total',
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#892CFF' },
                    { offset: 1, color: 'rgba(137,44,255,0.7)' }
                ])
            },
            data: industryData.bioMedicine
        },
        {
            name: '清洁能源',
            type: 'bar',
            stack: 'total',
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#FFCF54' },
                    { offset: 1, color: 'rgba(255,207,84,0.7)' }
                ])
            },
            data: industryData.cleanEnergy
        }
    ],
    textStyle: {
        color: '#B4C0CC',
    },
};

        const pieOption={
            title: {
                text: '三大产业占比经济扇形统计图',
                textStyle: {
                    color: '#B4C0CC',
                    fontSize: 14
                },
                left: 'center',
                top: 0
            },
            color:[
                '#00B2FF','#2CF2FF','#892CFF'
            ],
            legend:{
                itemGap:20,
                bottom:10,
                icon:'rect',
                itemHeight:10,
                itemWidth:10,
                textStyle:{
                    color:'#c6d1db',
                },
            },
            tooltip:{
                trigger:'item',
                formatter:(params)=>{
                    // 从数据中获取预设的百分比值
                    const dataItem = industryDistribution.find(item => item.name === params.name);
                    const percentage = dataItem ? dataItem.percentage : `${params.percent}%`;
                    return `${params.seriesName}</br><div style='display:flex;justify-content:space-between;'>
                    <div>${params.marker}${params.name}</div><div>增加值: ${params.value}亿元 | ${percentage}</div></div>`;
                }
            },
            series:[
                {
                    name:'三大产业分布',
                    type:'pie',
                    radius:['40%','70%'],
                    center:['50%','50%'],
                    avoidLabelOverlap: false,
                    label:{
                        show:true,
                        position:'center',
                        formatter:(params)=>{
                            // 只在中心显示总标题
                            return '{a|三大产业分布}';
                        },
                        rich:{
                            a:{
                                color:'#B4C0CC',
                                fontSize:14,
                                fontWeight:'bold'
                            }
                        }
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 16,
                            fontWeight: 'bold',
                            formatter: (params) => {
                                const dataItem = industryDistribution.find(item => item.name === params.name);
                                const percentage = dataItem ? dataItem.percentage : `${params.percent}%`;
                                return `${params.name}\n${percentage}`;
                            }
                        }
                    },
                    labelLine: {
                        show: false
                    },
                    data:industryDistribution,
                },
            ],
        };

        myBarChart.setOption(barOption)
        myPieChart.setOption(pieOption)

        // 移除不再使用的点击事件处理函数
        // 如需添加新的交互行为，可以在此处添加

        window.addEventListener('resize',function(){
            myBarChart.resize();
            myPieChart.resize();
        })

        EventBus.getInstance().on('refreshHomeCount',(data)=>{
            animateValue(data)
        })

        // 更新脱贫数据展示
    async function animateValue(data) {
        if(data&&data.base)
        {
            const {povertyAlleviationPopulation, povertyReductionRate, perCapitaDisposableIncome, eliminatedVillages}=data.base
            gsap.to('#poverty-population',{
                duration:1,
                innerText:function(){
                    return povertyAlleviationPopulation.toLocaleString()
                },
                transformOrigin:'center bottom',
                onUpdate:function(){
                    let n=(gsap.getProperty(this.targets()[0],"innerText"));
                    this.targets()[0].innerText=parseInt(n).toLocaleString()
                },
            })
            gsap.to('#reduction-rate',{
                duration:1,
                innerText:function(){
                    return povertyReductionRate.toFixed(2)
                },
                transformOrigin:'center bottom',
                onUpdate:function(){
                    let n=(gsap.getProperty(this.targets()[0],"innerText"));
                    this.targets()[0].innerText=parseFloat(n).toFixed(2)
                },
            })
            gsap.to('#disposable-income',{
                duration:1,
                innerText:function(){
                    return perCapitaDisposableIncome.toLocaleString()
                },
                transformOrigin:'center bottom',
                onUpdate:function(){
                    let n=(gsap.getProperty(this.targets()[0],"innerText"));
                    this.targets()[0].innerText=parseInt(n).toLocaleString()
                },
            })
            gsap.to('#eliminated-villages',{
                duration:1,
                innerText:function(){
                    return eliminatedVillages.toFixed(0)
                },
                transformOrigin:'center bottom',
                onUpdate:function(){
                    let n=(gsap.getProperty(this.targets()[0],"innerText"));
                    this.targets()[0].innerText=parseInt(n).toFixed(0)
                },
            })
        }
    }

    }
})