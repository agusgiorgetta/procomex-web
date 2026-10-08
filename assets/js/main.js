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

  const submitButton = contactForm.querySelector('button[type="submit"]');

  // Mensaje debajo del botón. type: 'sending', 'success', 'error' o '' (vacío).
  // El estilo de cada estado está en style.css (.contact-form-status.is-...).
  function setStatus(type, message) {
    contactStatus.className = type ? `contact-form-status is-${type}` : 'contact-form-status';
    contactStatus.textContent = message;
    if (type === 'success' || type === 'error') contactStatus.scrollIntoView({ block: 'nearest' });
  }

  // Las reglas de cada campo están en contact-validation.js. Si ese archivo no
  // cargara, igual se exige que los campos obligatorios no estén vacíos.
  const rules = window.ProcomexValidation || {};
  const requiredOnly = (field) => (field.value.trim() ? '' : 'Completá este campo.');

  const validators = {
    'cf-nombre': (field) => (rules.validateName ? rules.validateName(field.value) : requiredOnly(field)),
    'cf-email': (field) => (rules.validateEmail ? rules.validateEmail(field.value) : requiredOnly(field)),
    // Opcional: vacío es válido, y si se completa tiene que parecer un teléfono.
    'cf-telefono': (field) => (rules.validatePhone ? rules.validatePhone(field.value) : ''),
    'cf-mensaje': (field) => (rules.validateMessage ? rules.validateMessage(field.value) : requiredOnly(field)),
    'cf-consentimiento': (field) => (
      field.checked ? '' : 'Tenés que aceptar los Términos y Condiciones y la Política de Privacidad para enviar el formulario.'
    ),
  };

  const fields = Array.from(
    contactForm.querySelectorAll('#cf-nombre, #cf-email, #cf-telefono, #cf-mensaje, #cf-consentimiento')
  );

  // aria-describedby original de cada campo (ej. la ayuda del teléfono): el
  // mensaje de error se suma adelante mientras haya error, y se saca después.
  const baseDescribedBy = new Map(fields.map((field) => [field, field.getAttribute('aria-describedby')]));

  function styleTargetFor(field) {
    return field.type === 'checkbox' ? field.closest('.contact-form-consent') : field;
  }

  function showFieldError(field, message) {
    const errorEl = document.getElementById(`${field.id}-error`);
    if (errorEl) {
      errorEl.querySelector('.field-error-text').textContent = message;
      errorEl.classList.add('is-visible');
    }
    const styleTarget = styleTargetFor(field);
    if (styleTarget) styleTarget.classList.add('has-error');

    field.setAttribute('aria-invalid', 'true');
    field.setAttribute(
      'aria-describedby',
      [`${field.id}-error`, baseDescribedBy.get(field)].filter(Boolean).join(' ')
    );
  }

  function clearFieldError(field) {
    const errorEl = document.getElementById(`${field.id}-error`);
    if (errorEl) errorEl.classList.remove('is-visible');
    const styleTarget = styleTargetFor(field);
    if (styleTarget) styleTarget.classList.remove('has-error');

    field.removeAttribute('aria-invalid');
    const base = baseDescribedBy.get(field);
    if (base) {
      field.setAttribute('aria-describedby', base);
    } else {
      field.removeAttribute('aria-describedby');
    }
  }

  // Valida un campo y muestra u oculta su error. Devuelve true si está bien.
  function checkField(field) {
    const message = validators[field.id](field);
    if (message) {
      showFieldError(field, message);
      return false;
    }
    clearFieldError(field);
    return true;
  }

  let submitAttempted = false;
  let isSending = false;

  fields.forEach((field) => {
    const isCheckbox = field.type === 'checkbox';

    // Mientras escribe, solo se actualiza un error que ya está a la vista.
    field.addEventListener(isCheckbox ? 'change' : 'input', () => {
      if (field.getAttribute('aria-invalid') === 'true') checkField(field);
      if (contactStatus.classList.contains('is-success') || contactStatus.classList.contains('is-error')) {
        setStatus('', '');
      }
    });

    // Al salir del campo se valida si ya escribió algo (o si ya intentó enviar),
    // para no marcar en rojo un campo vacío que apenas se recorrió con Tab.
    if (!isCheckbox) {
      field.addEventListener('blur', () => {
        if (submitAttempted || field.value.trim()) checkField(field);
      });
    }
  });

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (isSending) return;
    submitAttempted = true;
    setStatus('', '');

    let firstInvalid = null;
    fields.forEach((field) => {
      if (!checkField(field) && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Se envía sin espacios sobrantes al principio y al final.
    fields.forEach((field) => {
      if (field.type !== 'checkbox') field.value = field.value.trim();
    });

    const data = new FormData(contactForm);
    isSending = true;
    submitButton.disabled = true;
    setStatus('sending', 'Enviando...');

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(data).toString(),
    })
      .then((response) => {
        // fetch solo falla ante errores de red: un 404 o 500 de Netlify también
        // es un envío que no llegó, y no debe mostrarse como exitoso.
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        contactForm.reset();
        submitAttempted = false;
        setStatus('success', '¡Gracias! Recibimos tu consulta y te responderemos a la brevedad.');

        // Conversión: solo se cuenta si Netlify confirmó el envío, y solo se
        // manda si la persona aceptó la analítica (lo decide consent.js).
        if (typeof window.procomexTrack === 'function') window.procomexTrack('generate_lead');
      })
      .catch(() => {
        setStatus('error', 'No pudimos enviar tu consulta. Probá de nuevo o escribinos a administracion@procomex.ar.');
      })
      .finally(() => {
        isSending = false;
        submitButton.disabled = false;
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
