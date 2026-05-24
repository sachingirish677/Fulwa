document.addEventListener('DOMContentLoaded', function () {
  const track = document.querySelector('.vc-slider-track');
  if (!track) return;
  let slides = Array.from(document.querySelectorAll('.vc-slide'));
  if (slides.length === 0) return;

  // We need at least 9 slides to have an offscreen buffer (7 visible + 2 buffer)
  // to avoid popping when wrapping. If fewer, we duplicate them.
  if (slides.length < 9) {
    const originalLength = slides.length;
    while (slides.length < 9) {
      for (let i = 0; i < originalLength; i++) {
        const clone = slides[i]?.cloneNode(true);
        if (!(clone instanceof Element)) continue;
        // ensure video in clone starts paused
        const video = clone.querySelector('video');
        if (video) video.pause();
        track.appendChild(clone);
        slides.push(clone);
      }
    }
  }

  let virtualActiveIndex = 0;

  function updateCarousel(isImmediate = false, jump = 0) {
    const isMobile = window.innerWidth <= 768;
    const n = slides.length;

    slides.forEach((slide, index) => {
      if (!(slide instanceof HTMLElement)) return;

      // If mobile, clear inline positioning styles and skip virtual math
      if (isMobile) {
        slide.style.position = '';
        slide.style.top = '';
        slide.style.left = '';
        slide.style.transform = '';
        slide.style.zIndex = '';
        slide.style.opacity = '';
        slide.style.visibility = '';
        slide.style.pointerEvents = '';
        return;
      }

      const oldOffset = parseInt(slide.dataset.offset || '0');

      // Calculate wrapped shortest path offset
      let offset = ((index - virtualActiveIndex) % n + n) % n;
      if (offset > Math.floor(n / 2)) offset -= n;

      // Determine if the element wrapped around the back of the cylinder
      const expectedOffset = oldOffset - jump;
      const wrapped = !isImmediate && jump !== 0 && (offset !== expectedOffset);

      // Determine responsive dimensions
      const activeWidth = 623;
      const inactiveWidth = 222;
      const gap = 24;

      // Calculate physical X offset
      let xOffset = 0;
      if (offset > 0) {
        xOffset = (activeWidth / 2) + gap + (inactiveWidth / 2) + (offset - 1) * (inactiveWidth + gap);
      } else if (offset < 0) {
        xOffset = -((activeWidth / 2) + gap + (inactiveWidth / 2) + (Math.abs(offset) - 1) * (inactiveWidth + gap));
      }

      // If wrapped, disable transition for a clean teleport behind the scenes
      if (wrapped) {
        slide.style.transition = 'none';
      }

      slide.dataset.offset = offset.toString();
      slide.style.setProperty('--x-offset', `${xOffset}px`);
      slide.style.zIndex = offset === 0 ? '10' : '5';

      // Update visibility: only -3 to +3 are visible
      if (Math.abs(offset) <= 3) {
        slide.style.opacity = offset === 0 ? '1' : '0.8';
        slide.style.visibility = 'visible';
        slide.style.pointerEvents = 'auto';
      } else {
        slide.style.opacity = '0';
        slide.style.visibility = 'hidden';
        slide.style.pointerEvents = 'none';
      }

      // Update functional classes
      slide.classList.remove('is-active', 'is-prev', 'is-next');
      if (offset === 0) {
        slide.classList.add('is-active');
      } else if (offset === -1) {
        slide.classList.add('is-prev');
      } else if (offset === 1) {
        slide.classList.add('is-next');
      }

      // Restore transition if it was disabled
      if (wrapped) {
        void slide.offsetWidth; // force reflow
        slide.style.transition = '';
      }
    });
  }

  // Initial update
  updateCarousel(true);

  // Maintain responsiveness
  window.addEventListener('resize', () => updateCarousel(true));

  // Modal logic
  const vcModal = document.querySelector('.vc-modal');
  const vcModalVideo = document.querySelector('.vc-modal__video');
  const vcMuteBtn = document.querySelector('[data-vc-mute]');
  const vcCloseBtns = document.querySelectorAll('[data-vc-close]');
  const vcPrevModalBtn = document.querySelector('[data-vc-modal-prev]');
  const vcNextModalBtn = document.querySelector('[data-vc-modal-next]');
  
  let isVcMuted = true;
  let currentModalSlide = null;

  const updateVcMuteIcon = () => {
    if (!vcMuteBtn) return;
    const unmuteIcon = vcMuteBtn.querySelector('.vc-icon-unmute');
    const muteIcon = vcMuteBtn.querySelector('.vc-icon-mute');
    if (isVcMuted) {
      unmuteIcon.style.display = 'none';
      muteIcon.style.display = 'block';
    } else {
      unmuteIcon.style.display = 'block';
      muteIcon.style.display = 'none';
    }
  };

  const openVcModal = (slide) => {
    if (!vcModal || !vcModalVideo) return;
    const videoSrc = slide.getAttribute('data-video-url');
    if (!videoSrc) return;

    currentModalSlide = slide;
    vcModalVideo.src = videoSrc;
    vcModalVideo.muted = isVcMuted;
    
    vcModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    const playPromise = vcModalVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        vcModalVideo.muted = true;
        isVcMuted = true;
        updateVcMuteIcon();
        vcModalVideo.play();
      });
    }
  };

  const closeVcModal = () => {
    if (!vcModal || !vcModalVideo) return;
    vcModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    vcModalVideo.pause();
    vcModalVideo.src = '';
    currentModalSlide = null;
  };

  if (vcMuteBtn) {
    vcMuteBtn.addEventListener('click', () => {
      isVcMuted = !isVcMuted;
      vcModalVideo.muted = isVcMuted;
      updateVcMuteIcon();
    });
  }

  if (vcCloseBtns) {
    vcCloseBtns.forEach(btn => btn.addEventListener('click', closeVcModal));
  }

  const goVcPrev = () => {
    if (!currentModalSlide) return;
    const currentIndex = slides.indexOf(currentModalSlide);
    const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
    openVcModal(slides[prevIndex]);
  };

  const goVcNext = () => {
    if (!currentModalSlide) return;
    const currentIndex = slides.indexOf(currentModalSlide);
    const nextIndex = (currentIndex + 1) % slides.length;
    openVcModal(slides[nextIndex]);
  };

  if (vcPrevModalBtn) vcPrevModalBtn.addEventListener('click', goVcPrev);
  if (vcNextModalBtn) vcNextModalBtn.addEventListener('click', goVcNext);

  // Inline mute logic
  document.querySelectorAll('.vc-inline-mute').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const slide = this.closest('.vc-slide');
      const video = slide.querySelector('video');
      if (video) {
        video.muted = !video.muted;
        const unmuteIcon = this.querySelector('.vc-icon-unmute');
        const muteIcon = this.querySelector('.vc-icon-mute');
        if (video.muted) {
          unmuteIcon.style.display = 'none';
          muteIcon.style.display = 'block';
        } else {
          unmuteIcon.style.display = 'block';
          muteIcon.style.display = 'none';
        }
      }
    });
  });

  let wasDragged = false;

  // Event delegation or looping (since we cloned nodes, we add listeners directly to the new array)
  slides.forEach((slide) => {
    if (!(slide instanceof HTMLElement)) return;
    slide.addEventListener('click', function (e) {
      if (wasDragged) {
        e.preventDefault();
        return;
      }
      if (e.target.closest('.vc-inline-mute')) return;

      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        if (slide.classList.contains('is-active')) {
          openVcModal(slide);
          return;
        }
        
        slides.forEach(s => {
          s.classList.remove('is-active');
          const video = s.querySelector('video');
          if (video) video.pause();
        });
        
        slide.classList.add('is-active');
        const video = slide.querySelector('video');
        if (video) video.play();

        slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        return;
      }

      const offset = parseInt(slide.dataset.offset || '0');
      if (offset === 0) {
        openVcModal(slide);
        return; // already active, open modal
      }

      // Pause old active video
      const oldActiveSlide = slides.find(s => s.classList.contains('is-active'));
      if (oldActiveSlide) {
        const oldVideo = oldActiveSlide.querySelector('video');
        if (oldVideo) oldVideo.pause();
      }

      // Move virtual index
      virtualActiveIndex += offset;
      updateCarousel(false, offset);

      // Play new active video
      const newVideo = this.querySelector('video');
      if (newVideo) {
        newVideo.play();
      }
    });
  });

  // Desktop Drag-to-Scroll Logic
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  track.addEventListener('mousedown', (e) => {
    if (window.innerWidth <= 768) return; // Native scroll handles mobile
    if (e.button !== 0) return;
    if (e.target.closest('.vc-inline-mute') || e.target.closest('a')) return;
    isDragging = true;
    wasDragged = false;
    startX = e.clientX;
    startY = e.clientY;
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5) {
      wasDragged = true;
      e.preventDefault();
    }
  });

  const endDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    if (window.innerWidth <= 768) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) {
      // Not enough horizontal movement, let it be a click if it was small
      return;
    }
    
    // Pause old active video
    const oldActiveSlide = slides.find(s => s.classList.contains('is-active'));
    if (oldActiveSlide) {
      const oldVideo = oldActiveSlide.querySelector('video');
      if (oldVideo) oldVideo.pause();
    }

    // Determine direction: drag left = next (+1), drag right = prev (-1)
    let offset = dx < 0 ? 1 : -1; 
    virtualActiveIndex += offset;
    updateCarousel(false, offset);

    // Play new active video
    setTimeout(() => {
      const newActiveSlide = slides.find(s => s.classList.contains('is-active'));
      if (newActiveSlide) {
        const newVideo = newActiveSlide.querySelector('video');
        if (newVideo) newVideo.play();
      }
    }, 50); // slight delay to allow classes to update
  };

  track.addEventListener('mouseup', endDrag);
  track.addEventListener('mouseleave', endDrag);

});
