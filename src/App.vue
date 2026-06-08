<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { FastForward, Heart, Pause, Play, Rewind, Sparkles, Volume2 } from "lucide-vue-next";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { Flip } from "gsap/Flip";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { Observer } from "gsap/Observer";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(
  Draggable,
  Flip,
  MotionPathPlugin,
  Observer,
  ScrambleTextPlugin,
  ScrollToPlugin,
  SplitText,
);

const root = ref(null);
const activeOutfit = ref("uniform");
const tracks = ref([]);
const trackIndex = ref(0);
const playing = ref(false);
const progress = ref(0);
const volume = ref(0.72);
const audio = ref(null);

const activeTrack = computed(() => tracks.value[trackIndex.value]);
const outfits = [
  {
    id: "uniform",
    label: "制服",
    src: "/images/chara1_main.png",
    tone: "mint",
  },
  {
    id: "room",
    label: "部屋着",
    src: "/images/chara1_main2.png",
    tone: "berry",
  },
];

const faceImages = [
  "/images/mahiro_face01.png",
  "/images/mahiro_face02.png",
  "/images/mahiro_face03.png",
  "/images/mahiro_face04.png",
  "/images/mahiro_face05.png",
];

const pages = [
  {
    id: "morning",
    tag: "Page 01",
    title: "醒来的房间像糖纸一样发光",
    body: "真寻的早晨从软绵绵的困惑开始，拖鞋、手柄、粉色闹钟一起滚进新日常。",
  },
  {
    id: "closet",
    tag: "Page 02",
    title: "衣柜把今天变成选择题",
    body: "一点害羞，一点勇气，再加上妹妹准备好的可爱服装，页面就在心跳里翻面。",
  },
  {
    id: "snack",
    tag: "Page 03",
    title: "甜点时间连接下一次冒险",
    body: "零食、贴纸和闪亮小物围成圆圈，普通生活突然变得像片尾曲一样轻盈。",
  },
];

let ctx;
let observer;
let stickerInstances = [];
let splitInstances = [];

function scrollToPage(direction) {
  const sections = Array.from(document.querySelectorAll(".kawaii-page"));
  const current = Math.round(window.scrollY / Math.max(window.innerHeight, 1));
  const next = gsap.utils.clamp(0, sections.length - 1, current + direction);
  gsap.to(window, {
    duration: 0.85,
    scrollTo: sections[next],
    ease: "power3.inOut",
    overwrite: "auto",
  });
}

function pickOutfit(id) {
  if (activeOutfit.value === id) return;
  const stage = root.value?.querySelector(".character-stage");
  if (!stage) {
    activeOutfit.value = id;
    return;
  }
  const state = Flip.getState(".outfit-card, .character-cutout");
  activeOutfit.value = id;
  nextTick(() => {
    Flip.from(state, {
      duration: 0.58,
      ease: "power3.inOut",
      absolute: true,
      nested: true,
      scale: true,
    });
    gsap.to(".spark-burst", {
      autoAlpha: 1,
      scale: 1.16,
      yoyo: true,
      repeat: 1,
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto",
    });
  });
}

function togglePlay() {
  if (!audio.value || !activeTrack.value) return;
  if (playing.value) {
    audio.value.pause();
    playing.value = false;
    return;
  }
  audio.value.play().then(() => {
    playing.value = true;
  }).catch(() => {
    playing.value = false;
  });
}

function changeTrack(direction) {
  if (!tracks.value.length) return;
  trackIndex.value = gsap.utils.wrap(0, tracks.value.length, trackIndex.value + direction);
  progress.value = 0;
  nextTick(() => {
    audio.value?.load();
    if (playing.value) audio.value?.play().catch(() => { playing.value = false; });
  });
}

function onTimeUpdate() {
  if (!audio.value?.duration) return;
  progress.value = audio.value.currentTime / audio.value.duration;
}

function seek(event) {
  if (!audio.value?.duration) return;
  const value = Number(event.target.value);
  audio.value.currentTime = value * audio.value.duration;
  progress.value = value;
}

function updateVolume(event) {
  volume.value = Number(event.target.value);
  if (audio.value) audio.value.volume = volume.value;
}

onMounted(async () => {
  fetch("/music/playlist.json", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : []))
    .then((items) => {
      tracks.value = Array.isArray(items) ? items : [];
    })
    .catch(() => {
      tracks.value = [];
    });

  await nextTick();
  if (audio.value) audio.value.volume = volume.value;

  ctx = gsap.context(() => {
    gsap.defaults({ duration: 0.56, ease: "power2.out" });

    gsap.from(".hero-card", {
      y: 46,
      autoAlpha: 0,
      stagger: 0.1,
      ease: "bounce.out",
      duration: 1.1,
    });

    gsap.to(".cloud", {
      x: (index) => (index % 2 === 0 ? 26 : -30),
      y: (index) => (index % 3 === 0 ? 14 : -10),
      repeat: -1,
      yoyo: true,
      duration: (index) => 3.4 + index * 0.34,
      ease: "sine.inOut",
      stagger: 0.08,
    });

    gsap.to(".heart-runner", {
      motionPath: {
        path: "#heartPath",
        align: "#heartPath",
        alignOrigin: [0.5, 0.5],
        autoRotate: true,
      },
      duration: 7,
      ease: "none",
      repeat: -1,
    });

    splitInstances = gsap.utils.toArray(".split-title").map((element) => SplitText.create(element, {
      type: "words, chars",
      aria: "auto",
      charsClass: "split-char",
      wordsClass: "split-word",
    }));

    splitInstances.forEach((split, sectionIndex) => {
      gsap.from(split.chars, {
        yPercent: 110,
        rotation: "random(-10, 10)",
        autoAlpha: 0,
        stagger: {
          each: 0.018,
          from: sectionIndex % 2 === 0 ? "start" : "random",
        },
        duration: 0.6,
        ease: "back.out(1.8)",
        delay: sectionIndex * 0.12,
      });
    });

    gsap.to(".scramble-line", {
      scrambleText: {
        text: "Mahiro mode: soft, silly, brave.",
        chars: "あいうえお☆♡123",
        speed: 0.35,
      },
      duration: 1.8,
      ease: "none",
      repeat: -1,
      repeatDelay: 2.4,
    });

    stickerInstances = Draggable.create(".sticker", {
      type: "x,y",
      bounds: ".play-mat",
      inertia: false,
      edgeResistance: 0.72,
      cursor: "grab",
      activeCursor: "grabbing",
      onDragStart() {
        gsap.to(this.target, { rotation: "random(-12, 12)", scale: 1.08, duration: 0.2 });
      },
      onDragEnd() {
        gsap.to(this.target, { scale: 1, ease: "elastic.out(1, 0.42)", duration: 0.58 });
      },
    });

    const reveal = gsap.utils.toArray(".page-panel").map((panel) => {
      const timeline = gsap.timeline({ paused: true });
      timeline.from(panel.querySelectorAll(".reveal-item"), {
        y: 28,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 0.5,
      });
      return { panel, timeline };
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const item = reveal.find((candidate) => candidate.panel === entry.target);
        if (!item) return;
        if (entry.isIntersecting) item.timeline.play();
        else item.timeline.reverse();
      });
    }, { threshold: 0.45 });

    reveal.forEach(({ panel }) => io.observe(panel));

    observer = Observer.create({
      target: window,
      type: "wheel,touch",
      tolerance: 24,
      preventDefault: true,
      onDown: () => scrollToPage(1),
      onUp: () => scrollToPage(-1),
    });

    const onKey = (event) => {
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        scrollToPage(1);
      }
      if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        scrollToPage(-1);
      }
      if (event.key === "ArrowLeft") pickOutfit("uniform");
      if (event.key === "ArrowRight") pickOutfit("room");
    };
    window.addEventListener("keydown", onKey);

    return () => {
      io.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  }, root.value);
});

onUnmounted(() => {
  observer?.kill();
  stickerInstances.forEach((instance) => instance.kill());
  splitInstances.forEach((instance) => instance.revert());
  ctx?.revert();
});
</script>

<template>
  <main ref="root" class="mahiro-app">
    <aside class="music-bubble" aria-label="音乐播放器">
      <audio
        ref="audio"
        :src="activeTrack?.src"
        @timeupdate="onTimeUpdate"
        @ended="changeTrack(1)"
      />
      <div class="music-title">
        <Sparkles :size="15" />
        <span>{{ activeTrack?.title || "No mp3 tracks" }}</span>
      </div>
      <div class="music-controls">
        <button type="button" :disabled="!tracks.length" aria-label="上一首" @click="changeTrack(-1)">
          <Rewind :size="16" />
        </button>
        <button type="button" :disabled="!tracks.length" :aria-label="playing ? '暂停' : '播放'" @click="togglePlay">
          <Pause v-if="playing" :size="17" />
          <Play v-else :size="17" />
        </button>
        <button type="button" :disabled="!tracks.length" aria-label="下一首" @click="changeTrack(1)">
          <FastForward :size="16" />
        </button>
      </div>
      <input
        class="music-progress"
        type="range"
        min="0"
        max="1"
        step="0.001"
        :value="progress"
        :disabled="!tracks.length"
        aria-label="播放进度"
        @input="seek"
      />
      <label class="volume">
        <Volume2 :size="15" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="volume"
          aria-label="音量"
          @input="updateVolume"
        />
      </label>
    </aside>

    <svg class="motion-map" viewBox="0 0 900 480" aria-hidden="true">
      <path id="heartPath" d="M105,292 C132,92 345,102 450,235 C555,102 768,92 795,292 C810,398 640,430 450,410 C260,430 90,398 105,292" />
    </svg>
    <Heart class="heart-runner" :size="26" />

    <section
      v-for="(page, pageIndex) in pages"
      :id="page.id"
      :key="page.id"
      class="kawaii-page"
      :class="`page-${page.id}`"
    >
      <div class="cloud cloud-a" />
      <div class="cloud cloud-b" />
      <div class="page-panel">
        <div class="copy-side">
          <p class="page-tag reveal-item">{{ page.tag }}</p>
          <h1 v-if="pageIndex === 0" class="split-title reveal-item">{{ page.title }}</h1>
          <h2 v-else class="split-title reveal-item">{{ page.title }}</h2>
          <p class="lead reveal-item">{{ page.body }}</p>
          <p class="scramble-line reveal-item">Mahiro mode loading...</p>
        </div>

        <div v-if="pageIndex === 0" class="hero-card character-stage">
          <div class="spark-burst" />
          <img class="character-cutout" :src="outfits.find((item) => item.id === activeOutfit).src" alt="绪山真寻" />
          <div class="outfit-switch" aria-label="服装切换">
            <button
              v-for="outfit in outfits"
              :key="outfit.id"
              type="button"
              class="outfit-card"
              :class="{ active: activeOutfit === outfit.id, [outfit.tone]: true }"
              @click="pickOutfit(outfit.id)"
            >
              <span>{{ outfit.label }}</span>
            </button>
          </div>
        </div>

        <div v-else-if="pageIndex === 1" class="hero-card face-board">
          <button
            v-for="(face, index) in faceImages"
            :key="face"
            type="button"
            class="face-chip reveal-item"
            @click="pickOutfit(index % 2 === 0 ? 'uniform' : 'room')"
          >
            <img :src="face" alt="真寻表情" />
          </button>
        </div>

        <div v-else class="hero-card play-mat">
          <span class="sticker sticker-a">ゲーム</span>
          <span class="sticker sticker-b">おやつ</span>
          <span class="sticker sticker-c">ねむい</span>
          <span class="sticker sticker-d">♡</span>
          <img class="mini-mahiro" src="/images/chara1_main2.png" alt="绪山真寻" />
        </div>
      </div>
    </section>
  </main>
</template>
