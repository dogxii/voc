<script lang="ts">
  import '../app.css'
  import { studyStore } from '$lib/store.svelte'
  import { browser } from '$app/environment'

  let { children } = $props()

  $effect(() => {
    if (browser) {
      const data = {
        mastered: studyStore.mastered,
        currentUnitId: studyStore.currentUnitId,
        currentType: studyStore.currentType,
        examHistory: studyStore.examHistory,
        wrongQuestions: studyStore.wrongQuestions,
      }
      localStorage.setItem('voc_progress', JSON.stringify(data))
    }
  })
</script>

<svelte:head>
  <link
    rel="icon"
    type="image/svg+xml"
    href="https://avatar.dogxi.me/favicon.ico"
  />
  <title>英语A4考试速通</title>
</svelte:head>

{@render children()}
