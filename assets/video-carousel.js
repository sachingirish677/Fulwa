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

  // Event delegation or looping (since we cloned nodes, we add listeners directly to the new array)
  slides.forEach((slide) => {
    if (!(slide instanceof HTMLElement)) return;
    slide.addEventListener('click', function () {
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        if (slide.classList.contains('is-active')) return;
        
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
      if (offset === 0) return; // already active

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
});
