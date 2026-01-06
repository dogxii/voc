<script lang="ts">
  import { page } from '$app/stores'
  import { VOCABULARY } from '$lib/vocabulary'
  import { studyStore } from '$lib/store.svelte'
  import { ArrowLeft, BookOpen, GraduationCap } from 'lucide-svelte'

  let unitId = $derived($page.params.id)
  let unit = $derived(VOCABULARY.find((u) => u.id === unitId))

  function getSectionStats(type: 'quiz' | 'test') {
    if (!unit) return { count: 0, percentage: 0, total: 0 }
    const list = unit[type]
    const progress = studyStore.getProgress(unit.id, type, list.length)
    return { ...progress, total: list.length }
  }

  let quizStats = $derived(getSectionStats('quiz'))
  let testStats = $derived(getSectionStats('test'))
</script>

{#if unit}
  <div class="container mx-auto px-4 py-8 max-w-md min-h-screen flex flex-col">
    <header class="flex items-center mb-8 relative">
      <a
        href="/"
        class="absolute left-0 p-2 -ml-2 text-gray-600 hover:text-gray-900 active:scale-95 transition-transform"
      >
        <ArrowLeft class="w-6 h-6" />
      </a>
      <h1 class="w-full text-center text-xl font-bold text-gray-800">
        {unit.name}
      </h1>
    </header>

    <div class="grid gap-6">
      <!-- Quiz Section -->
      <div
        class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all"
      >
        <div class="flex items-start justify-between mb-4">
          <div
            class="p-3 bg-blue-50 text-blue-600 rounded-xl transition-colors"
          >
            <BookOpen class="w-6 h-6" />
          </div>
          <span
            class="text-sm font-bold {quizStats.percentage === 100
              ? 'text-green-600 bg-green-50'
              : 'text-gray-500 bg-gray-50'} px-3 py-1 rounded-full"
          >
            {quizStats.percentage}%
          </span>
        </div>
        <h2 class="text-xl font-bold text-gray-800 mb-1">Quiz 词汇</h2>
        <p class="text-gray-500 text-sm mb-4">
          基础词汇测试 ({quizStats.count}/{quizStats.total})
        </p>
        <div class="w-full bg-gray-100 rounded-full h-2 mb-6">
          <div
            class="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style="width: {quizStats.percentage}%"
          ></div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <a
            href="/unit/{unit.id}/quiz"
            class="flex items-center justify-center py-2.5 px-4 rounded-xl bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 active:scale-95 transition-all text-sm"
          >
            Cards
          </a>
          <a
            href="/unit/{unit.id}/quiz/choice"
            class="flex items-center justify-center py-2.5 px-4 rounded-xl bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 active:scale-95 transition-all text-sm"
          >
            Choice
          </a>
        </div>
      </div>

      <!-- Test Section -->
      <div
        class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-100 transition-all"
      >
        <div class="flex items-start justify-between mb-4">
          <div
            class="p-3 bg-purple-50 text-purple-600 rounded-xl transition-colors"
          >
            <GraduationCap class="w-6 h-6" />
          </div>
          <span
            class="text-sm font-bold {testStats.percentage === 100
              ? 'text-green-600 bg-green-50'
              : 'text-gray-500 bg-gray-50'} px-3 py-1 rounded-full"
          >
            {testStats.percentage}%
          </span>
        </div>
        <h2 class="text-xl font-bold text-gray-800 mb-1">Test 词汇</h2>
        <p class="text-gray-500 text-sm mb-4">
          进阶词汇考核 ({testStats.count}/{testStats.total})
        </p>
        <div class="w-full bg-gray-100 rounded-full h-2 mb-6">
          <div
            class="bg-purple-500 h-2 rounded-full transition-all duration-500"
            style="width: {testStats.percentage}%"
          ></div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <a
            href="/unit/{unit.id}/test"
            class="flex items-center justify-center py-2.5 px-4 rounded-xl bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 active:scale-95 transition-all text-sm"
          >
            Cards
          </a>
          <a
            href="/unit/{unit.id}/test/choice"
            class="flex items-center justify-center py-2.5 px-4 rounded-xl bg-purple-50 text-purple-700 font-medium hover:bg-purple-100 active:scale-95 transition-all text-sm"
          >
            Choice
          </a>
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="flex flex-col items-center justify-center min-h-screen p-4">
    <p class="text-gray-500 mb-4">Unit not found</p>
    <a href="/" class="text-blue-500 font-medium hover:underline">Go Home</a>
  </div>
{/if}
