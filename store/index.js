export const state = () => ({
    companies: []
})

export const mutations = {
    SET_COMPANIES(state, data) {
        state.companies = data;
    }
}

export const actions = {
    async getCompanies({ commit, state }) {
        if (state.companies.length) return state.companies;

        const { data } = await this.$axios.post('/api/AutoSuggestHandler.ashx?type=Company');
        const output = data.map(item => ({
            id: item.v,
            code: item.d,
            name: item.l.split('(')[1].replace(')', '')
        }))
        commit('SET_COMPANIES', output)
        return state.companies;
    }
}
