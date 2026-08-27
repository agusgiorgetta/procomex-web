// ProComex — index.html
// Menú mobile, animaciones al scroll, envío del formulario de contacto (Netlify) y acordeón de FAQ.

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initAnchorScroll();
  initRevealOnScroll();
  initContactForm();
  initFaqAccordion();
});

function initNavToggle() {
  const navToggle = document.querySelector('.nav-toggle');
  const navbar = document.querySelector('.navbar');
  if (!navToggle || !navbar) return;

  navToggle.addEventListener('click', () => {
    const isOpen = navbar.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });
}

// Scroll manual a las secciones con ancla (#servicios, #contacto, etc.)
// calculando a mano cuánto hay que compensar por el header fijo.
// No alcanza con `scroll-padding-top` en el CSS: en varios celulares reales
// (sobre todo tocando un link con el menú hamburguesa todavía abierto) el
// navegador no lo respeta bien y el título de la sección queda tapado
// detrás del header. Esto funciona igual en todos los dispositivos.
function initAnchorScroll() {
  const header = document.querySelector('.logo');
  const navToggle = document.querySelector('.nav-toggle');
  const navbar = document.querySelector('.navbar');

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href').slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;

      event.preventDefault();

      if (navbar && navbar.classList.contains('is-open')) {
        navbar.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }

      // Un frame de margen para que el menú ya esté cerrado y el layout
      // recalculado antes de medir la posición real del destino.
      requestAnimationFrame(() => {
        const headerHeight = header ? header.getBoundingClientRect().height : 0;
        const targetY = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
        window.scrollTo({ top: Math.max(targetY, 0), behavior: 'smooth' });
        history.pushState(null, '', `#${id}`);
      });
    });
  });
}

function initRevealOnScroll() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach((el) => revealObserver.observe(el));
}

function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  const contactStatus = document.getElementById('contact-form-status');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(contactForm);
    contactStatus.textContent = 'Enviando...';

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString(),
    })
      .then(() => {
        contactForm.reset();
        contactStatus.textContent = 'Gracias, te responderemos a la brevedad.';
      })
      .catch(() => {
        contactStatus.textContent = 'Hubo un error al enviar. Escribinos a administracion@procomex.ar.';
      });
  });
}

function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const button = item.querySelector('.faq-question');

    button.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      faqItems.forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });
}
