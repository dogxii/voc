<script lang="ts">
  import { page } from '$app/stores'
  import { VOCABULARY } from '$lib/vocabulary'
  import { studyStore } from '$lib/store.svelte'
  import {
    ArrowLeft,
    Volume2,
    CheckCircle2,
    Circle,
    ChevronLeft,
    ChevronRight,
    RotateCw,
  } from 'lucide-svelte'

  let unitId = $derived($page.params.id ?? '')
  let type = $derived($page.params.type as 'quiz' | 'test')

  let unit = $derived(VOCABULARY.find((u) => u.id === unitId))
  let words = $derived(unit ? unit[type] : [])

  let currentIndex = $state(0)
  let isFlipped = $state(false)

  let currentWord = $derived(words[currentIndex])

  let isMastered = $derived(
    currentWord ? studyStore.isMastered(unitId, type, currentWord.term) : false,
  )

  function next() {
    if (currentIndex < words.length - 1) {
      currentIndex++
      isFlipped = false
    }
  }

  function prev() {
    if (currentIndex > 0) {
      currentIndex--
      isFlipped = false
    }
  }

  function toggleFlip() {
    isFlipped = !isFlipped
  }

  function toggleMastery(e: Event) {
    e.stopPropagation()
    if (currentWord) {
      studyStore.toggleMastered(unitId, type, currentWord.term)
    }
  }

  function playAudio(e: Event) {
    e.stopPropagation()
    if (!currentWord) return
    // Using Youdao API: type=2 (American English)
    const audio = new Audio(
      `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(currentWord.term)}&type=2`,
    )
    audio.play().catch((err) => console.error('Audio play failed', err))
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      if (currentIndex < words.length - 1) next()
    } else if (e.key === 'ArrowLeft') {
      if (currentIndex > 0) prev()
    } else if (e.key === ' ' || e.key === 'Enter') {
      toggleFlip()
      e.preventDefault()
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
      <a
        href="/unit/{unitId}"
        class="p-2 -ml-2 text-gray-600 hover:text-gray-900 active:scale-95 transition-transform"
      >
        <ArrowLeft class="w-6 h-6" />
      </a>
      <div class="flex flex-col items-center">
        <span class="font-semibold text-gray-800">{unit.name}</span>
        <span class="text-xs text-gray-500 uppercase tracking-wider font-bold"
          >{type}</span
        >
      </div>
      <div class="w-10 text-center text-sm font-medium text-gray-500">
        {currentIndex + 1}/{words.length}
      </div>
    </header>

    <!-- Main Card Area -->
    <div
      class="flex-1 flex flex-col items-center justify-center p-4 relative w-full max-w-lg mx-auto"
    >
      <!-- Card Container -->
      <div
        class="relative w-full aspect-3/4 max-h-[60vh] perspective-1000 group cursor-pointer outline-none focus:ring-2 focus:ring-blue-200 rounded-3xl"
        onclick={toggleFlip}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleFlip()
          }
        }}
        role="button"
        tabindex="0"
        aria-label="Flip card"
      >
        <div
          class="relative w-full h-full duration-500 transform-style-3d transition-transform {isFlipped
            ? 'rotate-y-180'
            : ''}"
        >
          <!-- Front -->
          <div
            class="absolute inset-0 bg-white rounded-3xl shadow-xl backface-hidden flex flex-col items-center justify-center p-8 border-4 transition-colors {isMastered
              ? 'border-green-100'
              : 'border-white'}"
          >
            <div class="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
              <button
                onclick={toggleMastery}
                class="p-2 rounded-full hover:bg-gray-100 transition-all active:scale-90"
                title={isMastered ? 'Mark as unlearned' : 'Mark as mastered'}
              >
                {#if isMastered}
                  <CheckCircle2 class="w-8 h-8 text-green-500 fill-green-50" />
                {:else}
                  <Circle class="w-8 h-8 text-gray-300 hover:text-gray-400" />
                {/if}
              </button>
            </div>

            <h2
              class="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-8 wrap-break-word max-w-full leading-tight"
            >
              {currentWord.term}
            </h2>

            <button
              onclick={playAudio}
              class="p-4 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors active:scale-95 z-20"
              aria-label="Play pronunciation"
            >
              <Volume2 class="w-8 h-8" />
            </button>

            <p
              class="absolute bottom-8 text-gray-400 text-sm font-medium animate-pulse"
            >
              Tap to flip
            </p>
          </div>

          <!-- Back -->
          <div
            class="absolute inset-0 bg-slate-800 rounded-3xl shadow-xl rotate-y-180 backface-hidden flex flex-col items-center justify-center p-8 text-white border-4 border-slate-800"
          >
            <div class="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
              <button
                onclick={toggleMastery}
                class="p-2 rounded-full hover:bg-slate-700 transition-all active:scale-90"
              >
                {#if isMastered}
                  <CheckCircle2 class="w-8 h-8 text-green-400 fill-green-900" />
                {:else}
                  <Circle class="w-8 h-8 text-slate-600 hover:text-slate-500" />
                {/if}
              </button>
            </div>

            <h3
              class="text-xl sm:text-2xl font-medium text-center leading-relaxed"
            >
              {currentWord.definition}
            </h3>

            <div
              class="mt-8 pt-8 border-t border-slate-700 w-full flex justify-center"
            >
              <button
                onclick={playAudio}
                class="p-3 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 active:scale-95 z-20"
              >
                <Volume2 class="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div
      class="flex-none bg-white border-t border-gray-100 p-4 pb-8 sm:p-6 sm:pb-8"
    >
      <div class="max-w-md mx-auto flex items-center justify-between gap-4">
        <button
          onclick={prev}
          disabled={currentIndex === 0}
          class="p-4 rounded-2xl bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 active:scale-95 transition-all"
          aria-label="Previous word"
        >
          <ChevronLeft class="w-6 h-6" />
        </button>

        <button
          onclick={toggleFlip}
          class="flex-1 py-4 rounded-2xl bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <RotateCw class="w-5 h-5" />
          <span>{isFlipped ? 'Hide Meaning' : 'Show Meaning'}</span>
        </button>

        <button
          onclick={next}
          disabled={currentIndex === words.length - 1}
          class="p-4 rounded-2xl bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 active:scale-95 transition-all"
          aria-label="Next word"
        >
          <ChevronRight class="w-6 h-6" />
        </button>
      </div>
    </div>
  </div>
{:else}
  <div
    class="flex flex-col items-center justify-center min-h-screen p-4 text-center"
  >
    <p class="text-gray-500 mb-4">No words found in this section.</p>
    <a href="/" class="text-blue-500 font-medium hover:underline"
      >Go Back Home</a
    >
  </div>
{/if}

<style>
  .perspective-1000 {
    perspective: 1000px;
  }
  .transform-style-3d {
    transform-style: preserve-3d;
  }
  .backface-hidden {
    backface-visibility: hidden;
  }
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
</style>
