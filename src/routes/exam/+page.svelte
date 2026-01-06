<script lang="ts">
  import { onMount } from 'svelte'
  import QUESTIONS from '$lib/questions.json'
  import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    RefreshCw,
    Trophy,
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
  let score = $state(0)
  let isStarted = $state(false)
  let isFinished = $state(false)

  // Current question state
  let selectedOption = $state<string | null>(null)
  let isAnswered = $state(false)

  // Filter valid questions (must have an answer)
  const validQuestions = (QUESTIONS as Question[]).filter((q) => q.answer)

  function startExam() {
    // Shuffle and pick 15
    const shuffled = [...validQuestions].sort(() => Math.random() - 0.5)
    examQuestions = shuffled.slice(0, 15)
    currentIndex = 0
    score = 0
    isFinished = false
    isStarted = true
    resetQuestionState()
  }

  function resetQuestionState() {
    selectedOption = null
    isAnswered = false
  }

  function handleAnswer(key: string) {
    if (isAnswered) return

    selectedOption = key
    isAnswered = true

    const currentQ = examQuestions[currentIndex]
    if (key === currentQ.answer) {
      score++
    }
  }

  function nextQuestion() {
    if (currentIndex < examQuestions.length - 1) {
      currentIndex++
      resetQuestionState()
    } else {
      isFinished = true
    }
  }

  let currentQ = $derived(examQuestions[currentIndex])
  let progress = $derived(((currentIndex + (isFinished ? 1 : 0)) / 15) * 100)
</script>

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
    <div class="w-8"></div>
    <!-- Spacer -->
  </header>

  <main class="flex-1 max-w-lg mx-auto w-full p-4 flex flex-col">
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
            <span class="text-gray-500">Total Questions</span>
            <span class="font-medium">15</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Source</span>
            <span class="font-medium">Unit 1 - Unit 6</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Passing Score</span>
            <span class="font-medium">60% (9/15)</span>
          </div>
        </div>
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
          <span>Question {currentIndex + 1}/15</span>
          <span>Score: {score}</span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-blue-500 transition-all duration-300 ease-out"
            style="width: {progress}%"
          ></div>
        </div>
      </div>

      <div
        class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex-1 flex flex-col justify-center min-h-[200px]"
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

      <!-- Footer Action -->
      {#if isAnswered}
        <div
          class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20"
          in:fly={{ y: 20 }}
        >
          <div class="max-w-lg mx-auto">
            {#if selectedOption !== currentQ.answer}
              <div
                class="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg flex items-start gap-2"
              >
                <XCircle class="w-4 h-4 mt-0.5 flex-none" />
                <span
                  >Correct Answer: <span class="font-bold"
                    >{currentQ.answer}</span
                  >. {currentQ.options[currentQ.answer || ''] || ''}</span
                >
              </div>
            {/if}
            <button
              onclick={nextQuestion}
              class="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-transform"
            >
              {currentIndex < 14 ? 'Next Question' : 'Finish Exam'}
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
                >{Math.round((score / 15) * 100)}%</span
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
            You answered {score} out of 15 questions correctly.
          </p>
        </div>

        <div class="grid grid-cols-2 w-full gap-4 max-w-xs">
          <button
            onclick={startExam}
            class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
          >
            <RefreshCw class="w-4 h-4" />
            Try Again
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
