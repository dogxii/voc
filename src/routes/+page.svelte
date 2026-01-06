<script lang="ts">
  import { VOCABULARY } from '$lib/vocabulary'
  import { studyStore } from '$lib/store.svelte'
  import { Trophy, User, ExternalLink, ListOrdered } from 'lucide-svelte'

  function getUnitProgress(unitId: string) {
    const unit = VOCABULARY.find((u) => u.id === unitId)
    if (!unit) return { total: 0, done: 0, percentage: 0 }

    const quizTotal = unit.quiz.length
    const testTotal = unit.test.length
    const quizProgress = studyStore.getProgress(unitId, 'quiz', quizTotal)
    const testProgress = studyStore.getProgress(unitId, 'test', testTotal)

    const total = quizTotal + testTotal
    const done = quizProgress.count + testProgress.count

    return {
      total,
      done,
      percentage: total === 0 ? 0 : Math.round((done / total) * 100),
    }
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-md">
  <header class="mb-8 text-center">
    <h1 class="text-3xl font-bold text-gray-800 mb-2">英语A3单词速通</h1>
    <p class="text-gray-600">U校园Quiz + Test (15x2=30)</p>
  </header>

  <div class="space-y-4">
    <a
      href="/exam"
      class="block bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white active:scale-95 transition-transform relative overflow-hidden group"
    >
      <div
        class="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-500"
      >
        <Trophy class="w-32 h-32" />
      </div>
      <div class="relative z-10 flex items-center gap-4">
        <div class="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
          <Trophy class="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 class="text-xl font-bold">模拟考试</h2>
          <p class="text-blue-100 text-sm">随机抽取 15 道真题进行测试</p>
        </div>
      </div>
    </a>

    <a
      href="/choice"
      class="block bg-linear-to-br from-purple-500 to-purple-600 rounded-xl shadow-md p-6 text-white active:scale-95 transition-transform relative overflow-hidden group"
    >
      <div
        class="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-500"
      >
        <ListOrdered class="w-32 h-32" />
      </div>
      <div class="relative z-10 flex items-center gap-4">
        <div class="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
          <ListOrdered class="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 class="text-xl font-bold">全词汇特训</h2>
          <p class="text-purple-100 text-sm">挑战所有单元单词，支持乱序/顺序</p>
        </div>
      </div>
    </a>

    {#each VOCABULARY as unit}
      {@const progress = getUnitProgress(unit.id)}
      <a
        href="/unit/{unit.id}"
        class="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 active:scale-95 transition-transform hover:shadow-md"
      >
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-xl font-semibold text-gray-800">{unit.name}</h2>
          <span
            class="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
          >
            {progress.percentage}%
          </span>
        </div>

        <div class="w-full bg-gray-100 rounded-full h-2 mb-2">
          <div
            class="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style="width: {progress.percentage}%"
          ></div>
        </div>

        <p class="text-xs text-gray-500 text-right">
          已掌握 {progress.done} / {progress.total} 词
        </p>
      </a>
    {/each}
  </div>

  <footer class="mt-12 text-center border-t border-gray-100 pt-8">
    <a
      href="https://dogxi.me/zh"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-50"
    >
      <User class="w-4 h-4" />
      <span>My Homepage</span>
      <ExternalLink class="w-3 h-3 opacity-50" />
    </a>
  </footer>
</div>
