<template>
    <div class="container mx-auto pb-10">
        <div class="text-center font-semibold text-3xl">
            Available companies
        </div>
        <div class="flex my-5" align="center">
            <input v-model="filter" placeholder="Search for company" class="border border-black rounded-md w-64 p-2 shadow-md">
        </div>
        <div>
            <ol class="list-disc">
                <li v-for="(company, i) of filteredList" :key="i">
                    <nuxt-link :to="`/companies/${company.code}`">
                        <span class="text-purple-700"> {{ company.name }} </span>
                        <span class="ml-3 font-semibold"> ({{ company.code }}) </span>
                    </nuxt-link>
                </li>
            </ol>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            filter: null,
            trained: false
        }
    },
    computed: {
        filteredList() {
            if (!this.filter) return this.companies;
            if (!this.companies) return [];
            return this.companies.filter(comp => comp.code.toLowerCase().includes(this.filter.toLowerCase()) || comp.name.toLowerCase().includes(this.filter.toLowerCase()))
        }
    },
    async asyncData({ store }) {
        const output = await store.dispatch('getCompanies')
        return { companies: output }
    },
}
</script>