<template>
  <div class="container mx-auto p-10">
    <div align="center">
      <h1 class="text-6xl font-semibold mb-8">
        Stock Market Analysis and Prediction
      </h1>
      <div>
        <div class="text-3xl font-medium mb-5">Project by</div>
        <ul>
          <li v-for="(member, i) of team" :key="i">
            {{ member }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      team: [
        "Binam Koirala (90153)",
        "Roshan Kandel (90159)",
        "Santosh Bhandari (90161)",
        "Yugesh Baral (90162)"
      ]
    }
  }
}
</script>