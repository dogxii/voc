<script lang="ts">
  import { page } from '$app/stores'
  import { VOCABULARY } from '$lib/vocabulary'
  import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    RefreshCw,
    Settings2,
    ArrowRightLeft,
    ChevronLeft,
    ChevronRight,
    Volume2,
    VolumeX,
  } from 'lucide-svelte'
  import { fade } from 'svelte/transition'

  let unitId = $derived($page.params.id ?? '')
  let type = $derived($page.params.type as 'quiz' | 'test')
  let unit = $derived(VOCABULARY.find((u) => u.id === unitId))
  let words = $derived(unit ? unit[type] : [])

  // Mode: 'en-zh' (English to Chinese) or 'zh-en' (Chinese to English)
  let mode = $state<'en-zh' | 'zh-en'>('en-zh')
  let audioEnabled = $state(true)

  let currentIndex = $state(0)
  let correctCount = $state(0)
  let wrongCount = $state(0)
  let isFinished = $state(false)

  let currentWord = $derived(words[currentIndex])

  // Options generation
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

  function loadQuestion() {
    if (!currentWord || words.length === 0) return

    if (history[currentIndex]) {
      const h = history[currentIndex]
      options = h.options
      selectedOptionIndex = h.selectedOptionIndex
      isAnswered = h.isAnswered
      return
    }

    const correctText =
      mode === 'en-zh' ? currentWord.definition : currentWord.term
    const otherWords = words.filter((w) => w !== currentWord)

    // Pick 2 random distractors
    const distractors = []
    const shuffledOthers = [...otherWords].sort(() => Math.random() - 0.5)

    if (shuffledOthers.length >= 2) {
      distractors.push(shuffledOthers[0], shuffledOthers[1])
    } else {
      distractors.push(...shuffledOthers)
    }

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

  // Effect to trigger option generation
  $effect(() => {
    // We depend on currentWord and mode
    // We only want to run this when index changes or mode changes, basically new question
    if (currentWord) {
      loadQuestion()
    }
  })

  function next() {
    if (currentIndex < words.length - 1) {
      currentIndex++
    } else if (isAnswered && options[selectedOptionIndex!].isCorrect) {
      isFinished = true
    }
  }

  function prev() {
    if (currentIndex > 0) {
      currentIndex--
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
    history = {}
    currentIndex = 0
    correctCount = 0
    wrongCount = 0
    isFinished = false
    loadQuestion()
  }

  function toggleMode() {
    mode = mode === 'en-zh' ? 'zh-en' : 'en-zh'
    restart()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (isFinished) return

    if (e.key === 'ArrowLeft') {
      prev()
      return
    }
    if (e.key === 'ArrowRight') {
      next()
      return
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if unit && words.length > 0}
  <div class="flex flex-col h-dvh bg-gray-50 overflow-hidden">
    <!-- Header -->
    <header
      class="flex-none flex items-center justify-between px-4 py-4 bg-white shadow-sm z-10"
    >
      <div class="flex items-center gap-2">
        <a
          href="/unit/{unitId}"
          class="p-2 -ml-2 text-gray-600 hover:text-gray-900 active:scale-95 transition-transform"
        >
          <ArrowLeft class="w-6 h-6" />
        </a>
      </div>

      <div class="flex flex-col items-center">
        <span class="font-semibold text-gray-800">{unit.name}</span>
        <span class="text-xs text-gray-500 font-medium">Choice Mode</span>
      </div>

      <div class="flex items-center gap-2">
        <button
          onclick={() => (audioEnabled = !audioEnabled)}
          class="p-2 text-gray-500 hover:text-gray-700 transition-colors bg-gray-50 rounded-lg"
          title={audioEnabled ? 'Mute auto-play' : 'Enable auto-play'}
        >
          {#if audioEnabled}
            <Volume2 class="w-4 h-4" />
          {:else}
            <VolumeX class="w-4 h-4" />
          {/if}
        </button>

        <button
          onclick={toggleMode}
          class="p-2 text-blue-600 bg-blue-50 rounded-lg active:scale-95 transition-all text-sm font-medium flex items-center gap-1"
        >
          <ArrowRightLeft class="w-4 h-4" />
          {mode === 'en-zh' ? 'En' : 'Zh'}
        </button>
      </div>
    </header>

    <!-- Progress Bar -->
    <div class="w-full bg-gray-200 h-1">
      <div
        class="bg-blue-500 h-1 transition-all duration-300"
        style="width: {((currentIndex + (isFinished ? 1 : 0)) / words.length) *
          100}%"
      ></div>
    </div>

    <!-- Main Content -->
    <div
      class="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-lg mx-auto"
    >
      {#if !isFinished}
        <div class="w-full flex-1 flex flex-col justify-center max-h-[80vh]">
          <!-- Question Card -->
          <button
            class="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 text-center flex flex-col items-center justify-center min-h-50 w-full hover:shadow-md transition-shadow active:scale-[0.99]"
            onclick={() => playAudio(currentWord.term)}
          >
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
                <span class="text-lg font-medium">{option.text}</span>

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
            {currentIndex + 1} / {words.length}
          </div>

          <button
            onclick={next}
            disabled={currentIndex === words.length - 1 &&
              (!isAnswered || !options[selectedOptionIndex ?? -1]?.isCorrect)}
            class="p-3 rounded-xl bg-white border border-gray-200 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      {:else}
        <!-- Results -->
        <div
          class="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full text-center"
          in:fade
        >
          <div
            class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600"
          >
            <CheckCircle class="w-10 h-10" />
          </div>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">
            Session Complete!
          </h2>
          <p class="text-gray-500 mb-8">Here is how you did</p>

          <div class="grid grid-cols-2 gap-4 mb-8">
            <div class="p-4 bg-green-50 rounded-2xl">
              <div class="text-2xl font-bold text-green-600">
                {correctCount}
              </div>
              <div class="text-xs text-green-800 font-medium uppercase">
                Correct
              </div>
            </div>
            <div class="p-4 bg-red-50 rounded-2xl">
              <div class="text-2xl font-bold text-red-600">{wrongCount}</div>
              <div class="text-xs text-red-800 font-medium uppercase">
                Wrong
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <a
              href="/unit/{unitId}"
              class="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors"
            >
              Back
            </a>
            <button
              onclick={restart}
              class="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw class="w-4 h-4" />
              Restart
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div
    class="flex flex-col items-center justify-center min-h-screen p-4 text-center"
  >
    <p class="text-gray-500 mb-4">No words found.</p>
    <a href="/" class="text-blue-500 font-medium hover:underline"
      >Go Back Home</a
    >
  </div>
{/if}
