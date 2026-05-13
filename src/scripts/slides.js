/**
 * AI魔法课 - 幻灯片控制逻辑
 * 支持键盘导航、触摸滑动、视频自动播放、演讲者备注
 */

(function () {
  'use strict';

  // ========== 状态 ==========
  const slides = document.querySelectorAll('.slide');
  const totalSlides = slides.length;
  let currentSlide = 0;
  let isTransitioning = false;
  const TRANSITION_DURATION = 400; // ms，与CSS过渡一致

  // ========== DOM引用 ==========
  const progressBar = document.getElementById('progress-bar');
  const speakerNotes = document.getElementById('speaker-notes');
  const fullscreenHint = document.getElementById('fullscreen-hint');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  // ========== 初始化 ==========
  function init() {
    // 显示第一页
    slides[0].classList.add('active');
    updateProgress();
    updateSpeakerNotes();

    // 全屏提示：点击或按键开始
    fullscreenHint.addEventListener('click', startPresentation);
    document.addEventListener('keydown', function onFirstKey(e) {
      startPresentation();
      document.removeEventListener('keydown', onFirstKey);
    });

    // 键盘导航
    document.addEventListener('keydown', handleKeydown);

    // 按钮导航
    btnPrev.addEventListener('click', () => goToSlide(currentSlide - 1));
    btnNext.addEventListener('click', () => goToSlide(currentSlide + 1));

    // 触摸滑动
    setupTouchNavigation();

    // 鼠标移动时显示光标和备注
    document.addEventListener('mousemove', () => {
      document.body.style.cursor = 'default';
      speakerNotes.classList.add('visible');
      clearTimeout(speakerNotes._hideTimer);
      speakerNotes._hideTimer = setTimeout(() => {
        speakerNotes.classList.remove('visible');
        document.body.style.cursor = 'none';
      }, 3000);
    });
  }

  // ========== 开始演示 ==========
  function startPresentation() {
    fullscreenHint.classList.add('hidden');
    // 尝试全屏
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch (e) {
      // 全屏失败也无所谓
    }
  }

  // ========== 键盘事件 ==========
  function handleKeydown(e) {
    if (fullscreenHint && !fullscreenHint.classList.contains('hidden')) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'Enter':
        e.preventDefault();
        goToSlide(currentSlide + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'Backspace':
        e.preventDefault();
        goToSlide(currentSlide - 1);
        break;
      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(totalSlides - 1);
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
    }
  }

  // ========== 触摸滑动 ==========
  function setupTouchNavigation() {
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - touchStartX;
      const dy = e.changedTouches[0].screenY - touchStartY;

      // 水平滑动幅度大于垂直，且超过阈值
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) goToSlide(currentSlide + 1);  // 左滑→下一页
        else goToSlide(currentSlide - 1);           // 右滑→上一页
      }
    }, { passive: true });
  }

  // ========== 翻页核心 ==========
  function goToSlide(index) {
    if (isTransitioning) return;
    if (index < 0 || index >= totalSlides) return;
    if (index === currentSlide) return;

    isTransitioning = true;

    // 停止当前页的视频
    pauseAllVideos();

    // 切换active类
    slides[currentSlide].classList.remove('active');
    slides[index].classList.add('active');

    currentSlide = index;

    // 更新UI
    updateProgress();
    updateSpeakerNotes();

    // 播放当前页的视频
    playCurrentVideo();

    // 过渡完成后解锁
    setTimeout(() => {
      isTransitioning = false;
    }, TRANSITION_DURATION);
  }

  // ========== 进度条 ==========
  function updateProgress() {
    const progress = ((currentSlide + 1) / totalSlides) * 100;
    progressBar.style.width = progress + '%';
  }

  // ========== 演讲者备注 ==========
  function updateSpeakerNotes() {
    const notes = slides[currentSlide].getAttribute('data-notes') || '';
    speakerNotes.textContent = notes;
  }

  // ========== 视频控制 ==========
  function pauseAllVideos() {
    slides.forEach(slide => {
      const videos = slide.querySelectorAll('video');
      videos.forEach(v => {
        v.pause();
        v.currentTime = 0;
      });
    });
  }

  function playCurrentVideo() {
    const videos = slides[currentSlide].querySelectorAll('video');
    videos.forEach(v => {
      // 尝试播放（静音视频通常可以自动播放）
      v.currentTime = 0;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // 自动播放被阻止，静音重试
          v.muted = true;
          v.play().catch(() => { });
        });
      }

      // 视频播放完毕后自动下一页
      v.addEventListener('ended', onVideoEnded, { once: true });
    });
  }

  function onVideoEnded(e) {
    // 延迟1秒后自动翻到下一页
    setTimeout(() => {
      goToSlide(currentSlide + 1);
    }, 1000);
  }

  // ========== 全屏 ==========
  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => { });
    }
  }

  // ========== 启动 ==========
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
