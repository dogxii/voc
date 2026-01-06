<script lang="ts">
  import QUESTIONS from '$lib/questions.json'
  import { studyStore } from '$lib/store.svelte'
  import { WORD_LOOKUP } from '$lib/vocabulary'
  import confetti from 'canvas-confetti'
  import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    RefreshCw,
    Trophy,
    History,
    RotateCcw,
    LayoutGrid,
    Flag,
    ChevronLeft,
    ChevronRight,
  } from 'lucide-svelte'
  import { fade, fly } from 'svelte/transition'

  // Types based on generated JSON
  interface Question {
    id: string
    unitId: string
    section: string
    question: string
    options: Record<string, string>
    answer: string | null
  }

  let examQuestions = $state<Question[]>([])
  let currentIndex = $state(0)
  let isStarted = $state(false)
  let isFinished = $state(false)
  let showOverview = $state(false)
  let examSize = $state(15)

  let mode = $state<'normal' | 'retry'>('normal')
  let sessionWrongIds = $state<string[]>([])

  // State for all answers
  let userAnswers = $state<Record<number, string>>({})

  // Derived state
  let selectedOption = $derived(userAnswers[currentIndex] ?? null)
  let isAnswered = $derived(currentIndex in userAnswers)
  let score = $derived(
    Object.entries(userAnswers).reduce((acc, [idx, ans]) => {
      const q = examQuestions[parseInt(idx)]
      return acc + (q && ans === q.answer ? 1 : 0)
    }, 0),
  )

  // Filter valid questions (must have an answer)
  const validQuestions = (QUESTIONS as Question[]).filter((q) => q.answer)

  function startExam() {
    // Shuffle and pick examSize
    const shuffled = [...validQuestions].sort(() => Math.random() - 0.5)
    examQuestions = shuffled.slice(0, examSize)
    currentIndex = 0
    userAnswers = {}
    isFinished = false
    isStarted = true
    showOverview = false
    mode = 'normal'
    sessionWrongIds = []
  }

  function startRetry() {
    const wrongQs = validQuestions.filter((q) => sessionWrongIds.includes(q.id))
    examQuestions = wrongQs
    currentIndex = 0
    userAnswers = {}
    isFinished = false
    isStarted = true
    showOverview = false
    mode = 'retry'
    sessionWrongIds = []
  }

  function handleAnswer(key: string) {
    if (isAnswered) return

    userAnswers[currentIndex] = key

    const currentQ = examQuestions[currentIndex]
    if (key === currentQ.answer) {
      playCorrectSound()
      if (mode === 'retry') {
        studyStore.removeWrongQuestion(currentQ.id)
      }
      setTimeout(() => {
        nextQuestion()
      }, 800)
    } else {
      studyStore.addWrongQuestion(currentQ.id)
      if (!sessionWrongIds.includes(currentQ.id)) {
        sessionWrongIds.push(currentQ.id)
      }
    }
  }

  function playCorrectSound() {
    if (typeof window === 'undefined') return
    try {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 800
      gain.gain.value = 0.1
      osc.start()
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3)
      osc.stop(ctx.currentTime + 0.3)
    } catch (e) {
      console.error('Audio context error', e)
    }
  }

  function nextQuestion() {
    if (currentIndex < examQuestions.length - 1) {
      currentIndex++
    } else {
      submitExam()
    }
  }

  function prevQuestion() {
    if (currentIndex > 0) {
      currentIndex--
    }
  }

  function submitExam() {
    // Check for unanswered questions
    examQuestions.forEach((q, i) => {
      if (!userAnswers[i]) {
        // Treat as wrong
        studyStore.addWrongQuestion(q.id)
        if (!sessionWrongIds.includes(q.id)) {
          sessionWrongIds.push(q.id)
        }
      }
    })

    isFinished = true
    showOverview = false
    if (mode === 'normal') {
      studyStore.addExamResult(score, examQuestions.length)
    }

    if (score / examQuestions.length >= 0.6) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      })
    }
  }

  function getWordInfo(text: string) {
    if (!text) return null
    return WORD_LOOKUP.get(text) || WORD_LOOKUP.get(text.toLowerCase()) || null
  }

  let currentQ = $derived(examQuestions[currentIndex])

  function handleKeydown(e: KeyboardEvent) {
    if (!isStarted || isFinished) return

    if (e.key === 'ArrowLeft') {
      prevQuestion()
    } else if (e.key === 'ArrowRight') {
      nextQuestion()
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-dvh bg-gray-50 flex flex-col font-sans">
  <!-- Header -->
  <header
    class="bg-white shadow-sm px-4 py-4 flex items-center justify-between z-10 sticky top-0"
  >
    <a
      href="/"
      class="p-2 -ml-2 text-gray-600 hover:text-gray-900 active:scale-95 transition-transform"
    >
      <ArrowLeft class="w-6 h-6" />
    </a>
    <h1 class="font-bold text-gray-800 text-lg">模拟考试</h1>
    {#if isStarted && !isFinished}
      <button
        onclick={() => (showOverview = !showOverview)}
        class="p-2 -mr-2 text-gray-600 hover:text-blue-600 transition-colors"
      >
        <LayoutGrid class="w-6 h-6" />
      </button>
    {:else}
      <div class="w-8"></div>
    {/if}
  </header>

  <main class="flex-1 max-w-lg mx-auto w-full p-4 flex flex-col relative">
    {#if showOverview && isStarted && !isFinished}
      <div
        class="absolute inset-0 bg-gray-50 z-20 p-4 overflow-y-auto"
        transition:fade={{ duration: 200 }}
      >
        <h2 class="text-xl font-bold text-gray-800 mb-4">题目总览</h2>
        <div class="grid grid-cols-5 gap-3 mb-8">
          {#each examQuestions as _, i}
            <button
              onclick={() => {
                currentIndex = i
                showOverview = false
              }}
              class="aspect-square rounded-lg font-medium text-sm flex items-center justify-center transition-all border-2
                {i === currentIndex ? 'ring-2 ring-blue-400 ring-offset-2' : ''}
                {userAnswers[i]
                ? examQuestions[i].answer === userAnswers[i]
                  ? 'bg-green-100 border-green-200 text-green-700'
                  : 'bg-red-100 border-red-200 text-red-700'
                : 'bg-white border-gray-200 text-gray-500'}"
            >
              {i + 1}
            </button>
          {/each}
        </div>
        <button
          onclick={submitExam}
          class="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Flag class="w-5 h-5" />
          提交试卷 (Submit)
        </button>
      </div>
    {/if}

    {#if !isStarted}
      <!-- Start Screen -->
      <div
        class="flex-1 flex flex-col items-center justify-center text-center space-y-6"
      >
        <div
          class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4"
        >
          <Trophy class="w-12 h-12" />
        </div>
        <h2 class="text-2xl font-bold text-gray-800">
          Ready for the Challenge?
        </h2>
        <p class="text-gray-600 max-w-xs">
          从题库中随机抽取 15 道题目进行模拟测试。测试结束后将生成成绩单。
        </p>
        <div
          class="bg-white p-4 rounded-xl border border-gray-200 w-full max-w-xs shadow-sm text-left space-y-2"
        >
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Question Count</span>
            <select
              bind:value={examSize}
              class="font-medium bg-transparent border-none text-right focus:ring-0 p-0 text-blue-600 cursor-pointer"
            >
              <option value={15}>15 Questions</option>
              <option value={50}>50 Questions</option>
              <option value={validQuestions.length}
                >All ({validQuestions.length})</option
              >
            </select>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Source</span>
            <span class="font-medium">Unit 1 - Unit 6</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Passing Score</span>
            <span class="font-medium">60%</span>
          </div>
        </div>

        {#if studyStore.examHistory.length > 0}
          <div class="w-full max-w-xs">
            <div
              class="flex items-center gap-2 mb-2 text-sm text-gray-500 font-medium"
            >
              <History class="w-4 h-4" />
              <span>Recent Results</span>
            </div>
            <div
              class="flex gap-1 h-16 items-end justify-between bg-white p-2 rounded-xl border border-gray-200 shadow-sm"
            >
              {#each studyStore.examHistory.slice(-7) as result}
                <div
                  class="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div
                    class="w-full rounded-t-sm transition-all {result.score >=
                    Math.ceil(result.total * 0.6)
                      ? 'bg-green-400'
                      : 'bg-red-400'}"
                    style="height: {Math.max(
                      10,
                      (result.score / result.total) * 100,
                    )}%"
                  ></div>
                  <!-- Tooltip -->
                  <div
                    class="absolute bottom-full mb-1 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"
                  >
                    {result.score}/{result.total}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <button
          onclick={startExam}
          class="w-full max-w-xs bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          Start Exam
        </button>
      </div>
    {:else if !isFinished}
      <!-- Exam Interface -->
      <div class="w-full mb-6">
        <div
          class="flex justify-between text-xs font-medium text-gray-500 mb-2"
        >
          <span>Question {currentIndex + 1}/{examQuestions.length}</span>
          <span>Score: {score}</span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-blue-500 transition-all duration-300 ease-out"
            style="width: {((currentIndex + 1) / examQuestions.length) * 100}%"
          ></div>
        </div>
      </div>

      <div
        class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex-1 flex flex-col justify-center min-h-50"
      >
        <h3
          class="text-lg sm:text-xl font-medium text-gray-800 leading-relaxed"
        >
          {@html currentQ.question}
        </h3>
      </div>

      <div class="space-y-3 pb-40">
        {#each Object.entries(currentQ.options) as [key, value]}
          <button
            onclick={() => handleAnswer(key)}
            disabled={isAnswered}
            class="w-full text-left p-4 rounded-xl border-2 transition-all relative
                 {isAnswered && key === currentQ.answer
              ? 'bg-green-50 border-green-500 text-green-900'
              : isAnswered && key === selectedOption && key !== currentQ.answer
                ? 'bg-red-50 border-red-500 text-red-900'
                : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-blue-200'}
               "
          >
            <div class="flex items-start gap-3">
              <span
                class="flex-none w-6 h-6 rounded-full border flex items-center justify-center text-sm font-bold
                      {isAnswered && key === currentQ.answer
                  ? 'bg-green-500 border-green-500 text-white'
                  : isAnswered &&
                      key === selectedOption &&
                      key !== currentQ.answer
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-gray-100 border-gray-200 text-gray-500'}
                  "
              >
                {key}
              </span>
              <span class="flex-1">{value}</span>
            </div>

            {#if isAnswered && key === currentQ.answer}
              <CheckCircle
                class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600"
              />
            {/if}
            {#if isAnswered && key === selectedOption && key !== currentQ.answer}
              <XCircle
                class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600"
              />
            {/if}
          </button>
        {/each}
      </div>

      <div class="flex items-center justify-between gap-4 mt-6 mb-32">
        <button
          onclick={prevQuestion}
          disabled={currentIndex === 0}
          class="p-3 rounded-xl bg-white border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>

        <div class="text-center text-gray-400 text-sm font-medium">
          {currentIndex + 1} / {examQuestions.length}
        </div>

        <button
          onclick={nextQuestion}
          disabled={currentIndex === examQuestions.length - 1 &&
            !userAnswers[currentIndex]}
          class="p-3 rounded-xl bg-white border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>

      <!-- Footer Action -->
      {#if isAnswered}
        <div
          class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20"
          in:fly={{ y: 20 }}
        >
          <div class="max-w-lg mx-auto">
            {#if selectedOption !== currentQ.answer}
              <div
                class="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg flex flex-col gap-2"
              >
                <div class="flex items-start gap-2">
                  <XCircle class="w-4 h-4 mt-0.5 flex-none" />
                  <span
                    >Correct Answer: <span class="font-bold"
                      >{currentQ.answer}</span
                    >. {currentQ.options[currentQ.answer || ''] || ''}</span
                  >
                </div>
                {#if getWordInfo(currentQ.options[currentQ.answer || ''])}
                  {@const info = getWordInfo(
                    currentQ.options[currentQ.answer || ''],
                  )}
                  <div
                    class="ml-6 bg-white/50 p-2 rounded border border-red-100 text-gray-700"
                  >
                    <div class="font-bold text-gray-900">{info?.term}</div>
                    <div class="text-xs">{info?.definition}</div>
                  </div>
                {/if}
              </div>
            {/if}
            <button
              onclick={nextQuestion}
              class="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
            >
              {currentIndex < examQuestions.length - 1
                ? 'Next Question'
                : 'Finish Exam'}
            </button>
          </div>
        </div>
      {/if}
    {:else}
      <!-- Results Screen -->
      <div
        class="flex-1 flex flex-col items-center justify-center text-center space-y-8"
        in:fade
      >
        <div class="relative">
          <div
            class="w-32 h-32 rounded-full border-8 {score >= 9
              ? 'border-green-100 text-green-600'
              : 'border-red-100 text-red-600'} flex items-center justify-center"
          >
            <div class="flex flex-col items-center">
              <span class="text-4xl font-bold"
                >{Math.round((score / examQuestions.length) * 100)}%</span
              >
              <span class="text-sm font-medium text-gray-400">Score</span>
            </div>
          </div>
          {#if score >= 9}
            <div
              class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold"
            >
              PASSED
            </div>
          {:else}
            <div
              class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold"
            >
              FAILED
            </div>
          {/if}
        </div>

        <div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">
            {score >= 13
              ? 'Outstanding!'
              : score >= 9
                ? 'Good Job!'
                : 'Keep Practicing!'}
          </h2>
          <p class="text-gray-500">
            You answered {score} out of {examQuestions.length} questions correctly.
          </p>
        </div>

        <div class="grid grid-cols-2 w-full gap-4 max-w-xs">
          {#if sessionWrongIds.length > 0}
            <button
              onclick={startRetry}
              class="col-span-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
            >
              <RotateCcw class="w-4 h-4" />
              Retry {sessionWrongIds.length} Mistakes
            </button>
          {/if}

          <button
            onclick={startExam}
            class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
          >
            <RefreshCw class="w-4 h-4" />
            {mode === 'retry' ? 'New Exam' : 'Try Again'}
          </button>
          <a
            href="/"
            class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
          >
            Home
          </a>
        </div>
      </div>
    {/if}
  </main>
</div>
