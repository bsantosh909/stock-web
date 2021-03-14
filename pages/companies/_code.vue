<template>
    <div v-if="success" class="container mx-auto pb-10">
        <div class="text-4xl font-semibold text-center"> {{ info.name }} </div>
        <div class="mt-10 p-4 bg-gray-200">
            <div id="charts"></div>
        </div>
        <div class="mt-10 p-4 bg-gray-200 w-full md:w-1/2 mx-auto">
            <div
                v-for="(stat, i) of techStats"
                :key="i"
                :class="{ 'bg-white': i % 2 === 0 }"
                class="flex justify-between p-2 text-sm border-t"
            >
                <span class="font-semibold"> {{ stat.title }} </span>
                <span> {{ stat.value }} </span>
            </div>
        </div>
    </div>
    <div v-else class="container mx-auto pb-10">
        <span class="text-6xl">Data not available for selected company!</span>
    </div>
</template>

<script>
import highChart from 'highcharts/highstock';
import HighCharts from 'highcharts';

export default {
    data() {
        return {
            prediction: null,
            accuracy: null
        }
    },
    async asyncData({ $axios, params, store }) {
        try {
            const { data } = await $axios.get(`/api/TechnicalChartHandler.ashx?type=get_advanced_chart&symbol=${params.code.toUpperCase()}&resolution=1D&rangeStartDate=631152000&rangeEndDate=${Math.floor(Date.now()/1000)}&from=&isAdjust=1&currencyCode=NPR`)
            const companies = await store.dispatch('getCompanies')
            
            let _output = [];
            for (let i=0; i<data.t.length; i++) _output.push({ t: data.t[i], o: data.o[i], c: data.c[i], h: data.h[i], l: data.l[i], v: data.v[i] })
            _output = _output.sort((a,b) => b.t - a.t)

            const formatted = _output
            .sort((a,b) => a.t - b.t)
            .map(item => [
                item.t * 1000,
                item.o,
                item.h,
                item.l,
                item.c,
                item.v
            ])

            return { stock: formatted, info: companies.find(c => c.code === params.code), success: true };
        } catch(err) {
            console.log(err)
            return { success: false };
        }
    },
    computed: {
        techStats() {
            if (!this.success) return [];
            const latestDay = this.stock[this.stock.length - 1]
            const previousClose = this.stock[this.stock.length - 2][4];
            const highPrice = latestDay[2];
            const lowPrice = latestDay[3];
            
            const yearValues = this.stock.slice(this.stock.length - 365, this.stock.length - 1)
            const yearHigh = Math.max(...yearValues.map(yr => yr[2]));
            const yearLow = Math.min(...yearValues.map(yr => yr[3]));

            const allTimeHigh = Math.max(...this.stock.map(yr => yr[2]));
            const allTimeLow = Math.min(...this.stock.map(yr => yr[3]));

            return [
                { title: 'Previous Day Close Price', value: previousClose },
                { title: 'High Price', value: highPrice },
                { title: 'Low Price', value: lowPrice },
                { title: '52 Weeks High', value: yearHigh },
                { title: '52 Weeks Low', value: yearLow },
                { title: 'All Time High', value: allTimeHigh },
                { title: 'All Time Low', value: allTimeLow }
            ]
        }
    },
    async mounted() {
        if (!this.success) return;
        const info = [];
        const volume = [];
        const dataLength = this.stock.length;
        const groupingUnits = [
            ['week', [1]],
            ['month', [1,2,3,4,6]]
        ]

        for (let i=0; i<this.stock.length; i++) {
            const stock = this.stock[i];
            info.push([ stock[0], stock[1], stock[2], stock[3], stock[4] ]);
            volume.push([ stock[0], stock[5] ]);
        }

        highChart.stockChart('charts', {
            rangeSelector: { selected: 2 },
            title: { text: `${this.info.code} Stock data` },
            yAxis: [{
                startOnTick: false,
                endOnTick: false,
                labels: { align: 'right', x: -3 },
                title: { text: 'OHLC' },
                lineWidth: 2,
                offset: 0,
                height: '70%',
                resize: { enabled: true }
            }, {
                labels: { align: 'right', x: -3 },
                title: { text: 'Volume' },
                top: '75%',
                height: '25%',
                offset: 0,
                lineWidth: 2
            }],
            tooltip: { split: true },
            plotOptions: {
                series: {
                    dataGrouping: {
                        units: groupingUnits
                    }
                }
            },
            series: [{
                type: 'candlestick',
                name: this.info.code,
                id: this.info.code,
                zIndex: 2,
                data: info,
                color: '#f56565',
                upColor: '#48bb78'
            }, {
                type: 'column',
                name: 'Volume',
                id: 'volume',
                data: volume,
                yAxis: 1,
            },
           ],
           rangeSelector: {
               selected: 1
           },
           navigator: {
               series: {
                   color: '#9f7aea'
               }
           }
        })
    }
}
</script>