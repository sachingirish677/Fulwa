document.addEventListener('DOMContentLoaded', function() {
  const headers = document.querySelectorAll('.faq-accordion-header');
  
  headers.forEach(header => {
    header.addEventListener('click', function() {
      const item = this.parentElement;
      const content = item ? item.querySelector('.faq-accordion-content') : null;
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      
      // Close all other accordions
      document.querySelectorAll('.faq-accordion-header').forEach(h => {
        h.setAttribute('aria-expanded', 'false');
        
        const otherContent = h.parentElement ? h.parentElement.querySelector('.faq-accordion-content') : null;
        if (otherContent instanceof HTMLElement) {
          otherContent.style.maxHeight = '';
        }
        
        const plusIcon = h.querySelector('.faq-icon-plus');
        if (plusIcon instanceof HTMLElement || plusIcon instanceof SVGElement) {
          plusIcon.style.display = 'block';
        }
        
        const minusIcon = h.querySelector('.faq-icon-minus');
        if (minusIcon instanceof HTMLElement || minusIcon instanceof SVGElement) {
          minusIcon.style.display = 'none';
        }
      });
      
      // Toggle current
      if (!isExpanded && content instanceof HTMLElement) {
        this.setAttribute('aria-expanded', 'true');
        content.style.maxHeight = content.scrollHeight + "px";
        
        const plusIcon = this.querySelector('.faq-icon-plus');
        if (plusIcon instanceof HTMLElement || plusIcon instanceof SVGElement) {
          plusIcon.style.display = 'none';
        }
        
        const minusIcon = this.querySelector('.faq-icon-minus');
        if (minusIcon instanceof HTMLElement || minusIcon instanceof SVGElement) {
          minusIcon.style.display = 'block';
        }
      }
    });
  });
});
