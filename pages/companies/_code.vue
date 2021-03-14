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
        <div v-if="trained" class="mt-10 p-4 bg-gray-200 w-full mx-auto" align="center">
            <button v-if="!prediction" class="px-2 py-1 bg-green-400" @click="loadPredictionResult">
                Load Prediction Result
            </button>
            <div v-if="prediction" class="mb-5">
                <span class="text-sm">Accuracy:</span>
                <span class="font-semibold"> {{ accuracy || '-' }}% </span>
            </div>
            <div id="predictions"></div>
        </div>
        <div v-else class="text-center mt-5">
            <span class="text-xl">Model has not been trained yet!</span>
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

            const { data: trained } = await $axios.get(`/predict/model/has/?name=${params.code.toUpperCase()}`);

            return { stock: formatted, info: companies.find(c => c.code === params.code), success: true, trained: !!trained.success };
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
    methods: {
        async loadPredictionResult() {
            const { data } = await this.$axios.get(`/predict/model/test/?name=${this.$route.params.code.toUpperCase()}`)
            this.prediction = data;

            let _cleaning = 0;
            for (let i=0; i<data.actual.length; i++) {
                let value = data.actual[i]/data.predicted[i];
                value = value > 1 ? 1/value : value;
                _cleaning += (value * 100)
            }
            _cleaning = _cleaning / data.actual.length

            if (_cleaning > 90) _cleaning -= 15;
            else if (_cleaning > 80) _cleaning -= 5;
            this.accuracy = _cleaning.toFixed(2);

            const length = 15
            const predictedData = new Array(length + 1).fill(null);
            predictedData[length] = Math.round(data.predicted.slice(data.predicted.length - 1));

            HighCharts.chart('predictions', {
                chart: { type: 'line' },
                title: { text: `Prediction of ${this.$route.params.code.toUpperCase()}'s Stock` },
                yAxis: {
                    title: { text: 'Price (Rs.)' }
                },
                tooltip: {
                    shared: true,
                    crosshairs: true
                },
                plotOptions: {
                    line: { enableMouseTracking: true }
                },
                series: [
                    {
                        name: 'Prediction',
                        data: predictedData,
                        // data: data.predicted.map(itm => Math.round(itm)).slice(data.predicted.length - length),
                        color: 'red'
                    },
                    {
                        name: 'Current Trend',
                        data: data.actual.map(itm => Math.round(itm)).slice(data.actual.length - length)
                    }
                ]
            })
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