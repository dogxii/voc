<script lang="ts">
  import { VOCABULARY, type Unit, type Word } from '$lib/vocabulary'
  import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    RefreshCw,
    ArrowRightLeft,
    Shuffle,
    ListOrdered,
    Trophy,
    ChevronLeft,
    ChevronRight,
    Volume2,
    VolumeX,
  } from 'lucide-svelte'
  import { fade } from 'svelte/transition'
  import { onMount } from 'svelte'

  // Flatten all vocabulary into a single list
  const ALL_WORDS = VOCABULARY.flatMap((unit) => [
    ...unit.quiz.map((w) => ({ ...w, source: `${unit.name} Quiz` })),
    ...unit.test.map((w) => ({ ...w, source: `${unit.name} Test` })),
  ])

  // Game Settings
  let mode = $state<'en-zh' | 'zh-en'>('en-zh')
  let order = $state<'sequential' | 'shuffled'>('shuffled')
  let audioEnabled = $state(true)

  // Game State
  let sessionWords = $state<(Word & { source: string })[]>([])
  let currentIndex = $state(0)
  let correctCount = $state(0)
  let wrongCount = $state(0)
  let isFinished = $state(false)
  let isStarted = $state(false)

  // Current Question State
  let currentWord = $derived(sessionWords[currentIndex])
  let options = $state<{ text: string; isCorrect: boolean }[]>([])
  let selectedOptionIndex = $state<number | null>(null)
  let isAnswered = $state(false)

  let history = $state<
    Record<
      number,
      {
        options: typeof options
        selectedOptionIndex: number | null
        isAnswered: boolean
      }
    >
  >({})

  // Audio Playback
  function playAudio(word: string) {
    const audio = new Audio(
      `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`,
    )
    audio.play().catch((err) => console.error('Audio play failed', err))
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

  // Load or generate question
  function loadQuestion() {
    if (!currentWord) return

    if (history[currentIndex]) {
      const h = history[currentIndex]
      options = h.options
      selectedOptionIndex = h.selectedOptionIndex
      isAnswered = h.isAnswered
      return
    }

    const correctText =
      mode === 'en-zh' ? currentWord.definition : currentWord.term

    // Pick 2 random distractors from ALL_WORDS excluding current
    const otherWords = ALL_WORDS.filter((w) => w.term !== currentWord.term)
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5)
    const distractors = shuffledOthers.slice(0, 2)

    const newOptions = [
      { text: correctText, isCorrect: true },
      ...distractors.map((w) => ({
        text: mode === 'en-zh' ? w.definition : w.term,
        isCorrect: false,
      })),
    ]

    // Shuffle options
    options = newOptions.sort(() => Math.random() - 0.5)
    selectedOptionIndex = null
    isAnswered = false

    // Save to history
    history[currentIndex] = { options, selectedOptionIndex, isAnswered }

    // Auto-play audio if English -> Chinese
    if (mode === 'en-zh' && audioEnabled) {
      playAudio(currentWord.term)
    }
  }

  function startSession() {
    // Prepare words list based on order
    if (order === 'shuffled') {
      sessionWords = [...ALL_WORDS].sort(() => Math.random() - 0.5)
    } else {
      sessionWords = [...ALL_WORDS]
    }

    history = {}
    currentIndex = 0
    correctCount = 0
    wrongCount = 0
    isFinished = false
    isStarted = true
    loadQuestion()
  }

  function next() {
    if (currentIndex < sessionWords.length - 1) {
      currentIndex++
      loadQuestion()
    } else if (isAnswered && options[selectedOptionIndex!].isCorrect) {
      isFinished = true
    }
  }

  function prev() {
    if (currentIndex > 0) {
      currentIndex--
      loadQuestion()
    }
  }

  function handleAnswer(index: number) {
    if (isAnswered) return

    selectedOptionIndex = index
    isAnswered = true

    // Update history
    history[currentIndex] = { options, selectedOptionIndex, isAnswered }

    if (options[index].isCorrect) {
      correctCount++
      playCorrectSound()
      // Auto advance
      setTimeout(() => {
        next()
      }, 800)
    } else {
      wrongCount++
    }
  }

  function restart() {
    isStarted = false
  }

  // Keyboard support
  function handleKeydown(e: KeyboardEvent) {
    if (!isStarted || isFinished) return

    if (e.key === 'ArrowLeft') {
      prev()
      return
    }
    if (e.key === 'ArrowRight') {
      next()
      return
    }

    if (isAnswered) return

    const key = parseInt(e.key)
    if (key >= 1 && key <= 3) {
      handleAnswer(key - 1)
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex flex-col h-dvh bg-gray-50 overflow-hidden">
  <!-- Header -->
  <header
    class="flex-none flex items-center justify-between px-4 py-4 bg-white shadow-sm z-10"
  >
    <div class="flex items-center gap-2">
      <a
        href="/"
        class="p-2 -ml-2 text-gray-600 hover:text-gray-900 active:scale-95 transition-transform"
      >
        <ArrowLeft class="w-6 h-6" />
      </a>
      <span class="font-bold text-gray-800 text-lg">全词汇特训</span>
    </div>

    {#if isStarted && !isFinished}
      <div class="flex gap-4 text-sm font-medium items-center">
        <button
          onclick={() => (audioEnabled = !audioEnabled)}
          class="text-gray-500 hover:text-gray-700 transition-colors p-1"
          title={audioEnabled ? 'Mute auto-play' : 'Enable auto-play'}
        >
          {#if audioEnabled}
            <Volume2 class="w-5 h-5" />
          {:else}
            <VolumeX class="w-5 h-5" />
          {/if}
        </button>
        <div class="w-px h-4 bg-gray-200"></div>
        <div class="text-green-600 flex items-center gap-1">
          <CheckCircle class="w-4 h-4" />
          {correctCount}
        </div>
        <div class="text-red-600 flex items-center gap-1">
          <XCircle class="w-4 h-4" />
          {wrongCount}
        </div>
      </div>
    {/if}
  </header>

  {#if !isStarted}
    <!-- Intro / Settings Screen -->
    <div class="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
      <div class="text-center space-y-4">
        <div
          class="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mx-auto"
        >
          <Trophy class="w-12 h-12" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Global Challenge</h1>
        <p class="text-gray-500 max-w-xs mx-auto">
          挑战全部 {ALL_WORDS.length} 个单词.
        </p>
      </div>

      <div class="w-full max-w-xs space-y-4">
        <!-- Mode Selection -->
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h3 class="text-sm font-bold text-gray-400 uppercase mb-3">
            语言模式
          </h3>
          <div class="flex bg-gray-100 p-1 rounded-lg">
            <button
              onclick={() => (mode = 'en-zh')}
              class="flex-1 py-2 rounded-md text-sm font-medium transition-all {mode ===
              'en-zh'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}"
            >
              En → Zh
            </button>
            <button
              onclick={() => (mode = 'zh-en')}
              class="flex-1 py-2 rounded-md text-sm font-medium transition-all {mode ===
              'zh-en'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}"
            >
              Zh → En
            </button>
          </div>
        </div>

        <!-- Order Selection -->
        <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h3 class="text-sm font-bold text-gray-400 uppercase mb-3">
            单词顺序
          </h3>
          <div class="flex bg-gray-100 p-1 rounded-lg">
            <button
              onclick={() => (order = 'shuffled')}
              class="flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 {order ===
              'shuffled'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}"
            >
              <Shuffle class="w-4 h-4" />
              Random
            </button>
            <button
              onclick={() => (order = 'sequential')}
              class="flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 {order ===
              'sequential'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'}"
            >
              <ListOrdered class="w-4 h-4" />
              Sequential
            </button>
          </div>
        </div>

        <button
          onclick={startSession}
          class="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          开始挑战
        </button>
      </div>
    </div>
  {:else if !isFinished}
    <!-- Game Interface -->
    <div class="w-full bg-gray-200 h-1">
      <div
        class="bg-purple-500 h-1 transition-all duration-300"
        style="width: {((currentIndex + 1) / sessionWords.length) * 100}%"
      ></div>
    </div>

    <div
      class="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-lg mx-auto"
    >
      <div class="w-full flex-1 flex flex-col justify-center max-h-[80vh]">
        <!-- Question Card -->
        <button
          class="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 text-center flex flex-col items-center justify-center min-h-50 relative w-full hover:shadow-md transition-shadow active:scale-[0.99]"
          onclick={() => playAudio(currentWord.term)}
        >
          <span
            class="absolute top-4 right-4 text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded"
          >
            {currentWord.source}
          </span>
          <h2 class="text-3xl font-bold text-gray-800 mb-2 wrap-break-word">
            {mode === 'en-zh' ? currentWord.term : currentWord.definition}
          </h2>
          <div class="flex items-center gap-2 text-gray-400 text-sm">
            <Volume2 class="w-4 h-4" />
            <span>Select the correct meaning</span>
          </div>
        </button>

        <!-- Options -->
        <div class="grid gap-3">
          {#each options as option, i}
            <button
              onclick={() => handleAnswer(i)}
              disabled={isAnswered}
              class="relative p-4 rounded-xl text-left transition-all border-2 w-full
                              {isAnswered && option.isCorrect
                ? 'bg-green-50 border-green-500 text-green-800'
                : ''}
                              {isAnswered &&
              !option.isCorrect &&
              selectedOptionIndex === i
                ? 'bg-red-50 border-red-500 text-red-800'
                : ''}
                              {!isAnswered
                ? 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-700 shadow-sm'
                : ''}
                              {isAnswered &&
              !option.isCorrect &&
              selectedOptionIndex !== i
                ? 'opacity-50 bg-gray-50 border-gray-100'
                : ''}
                              "
            >
              <div class="flex gap-3">
                <span
                  class="flex-none w-6 h-6 rounded-full border flex items-center justify-center text-xs text-gray-400 font-mono mt-0.5"
                >
                  {i + 1}
                </span>
                <span class="text-lg font-medium">{option.text}</span>
              </div>

              {#if isAnswered && option.isCorrect}
                <CheckCircle
                  class="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-green-600"
                />
              {/if}
              {#if isAnswered && !option.isCorrect && selectedOptionIndex === i}
                <XCircle
                  class="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-red-600"
                />
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="flex items-center justify-between gap-4 mt-6">
        <button
          onclick={prev}
          disabled={currentIndex === 0}
          class="p-3 rounded-xl bg-white border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>

        <div class="text-center text-gray-400 text-sm font-medium">
          {currentIndex + 1} / {sessionWords.length}
        </div>

        <button
          onclick={next}
          disabled={currentIndex === sessionWords.length - 1 &&
            (!isAnswered || !options[selectedOptionIndex ?? -1]?.isCorrect)}
          class="p-3 rounded-xl bg-white border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
    </div>
  {:else}
    <!-- Results -->
    <div
      class="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-lg mx-auto"
      in:fade
    >
      <div
        class="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full text-center"
      >
        <div
          class="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600"
        >
          <Trophy class="w-10 h-10" />
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-2">Great Effort!</h2>
        <p class="text-gray-500 mb-8">
          You completed {sessionWords.length} questions.
        </p>

        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="p-4 bg-green-50 rounded-2xl">
            <div class="text-3xl font-bold text-green-600">
              {correctCount}
            </div>
            <div class="text-xs text-green-800 font-medium uppercase mt-1">
              Correct
            </div>
          </div>
          <div class="p-4 bg-red-50 rounded-2xl">
            <div class="text-3xl font-bold text-red-600">{wrongCount}</div>
            <div class="text-xs text-red-800 font-medium uppercase mt-1">
              Wrong
            </div>
          </div>
        </div>

        <div class="text-sm text-gray-400 mb-8">
          Accuracy: {Math.round((correctCount / sessionWords.length) * 100)}%
        </div>

        <div class="flex gap-3">
          <a
            href="/"
            class="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
          >
            Home
          </a>
          <button
            onclick={restart}
            class="flex-1 py-3 px-4 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw class="w-4 h-4" />
            New Session
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>
