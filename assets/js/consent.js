// ProComex — aviso de cookies y carga de Google Analytics 4.
// Google Analytics NO se descarga ni se ejecuta hasta que la persona acepta
// (Consent Mode en modo "basic"). La elección se guarda en localStorage y se
// vuelve a pedir pasados 12 meses. Para cambiarla en cualquier momento, el
// footer de cada página tiene un botón con el atributo [data-cookie-settings].
//
// El aviso es una barra de lado a lado arriba de la pantalla, con el fondo
// oscurecido: mientras no se elige, el resto de la página queda bloqueado
// (inert). Las páginas con <body data-cookie-banner="compact"> (privacidad y
// términos) muestran la barra sin fondo y sin bloquear, y se va con el scroll:
// ahí hay que poder leer la política antes de decidir.
(function () {
  var GA_ID = 'G-0V2RVDG1E1';

  // Solo se mide en producción: abriendo el HTML en local o en un deploy
  // preview de Netlify el aviso funciona igual, pero no se mandan visitas a GA.
  var GA_HOSTS = ['procomex.ar', 'www.procomex.ar'];

  var STORAGE_KEY = 'procomex-cookie-consent';
  var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

  var overlay = null;
  var card = null;
  var gaLoaded = false;
  var lastTrigger = null;
  var currentChoice = null;
  var inertedEls = [];

  // Sin el atributo en <body>, el aviso bloquea la página hasta que se elige.
  var compact = document.body.getAttribute('data-cookie-banner') === 'compact';

  // Consent Mode: todo denegado por defecto, antes de que exista cualquier etiqueta.
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  });

  function readChoice() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || typeof saved.savedAt !== 'number') return null;
      if (saved.analytics !== 'granted' && saved.analytics !== 'denied') return null;
      if (Date.now() - saved.savedAt > MAX_AGE_MS) return null;
      return saved.analytics;
    } catch (e) {
      return null;
    }
  }

  function saveChoice(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: value, savedAt: Date.now() }));
    } catch (e) {
      // Sin localStorage (modo privado, bloqueo del navegador): la elección vale
      // solo para esta página y el aviso vuelve a aparecer en la próxima.
    }
  }

  function enableAnalytics() {
    window['ga-disable-' + GA_ID] = false;
    gtag('consent', 'update', { analytics_storage: 'granted' });

    if (gaLoaded || GA_HOSTS.indexOf(location.hostname) === -1) return;
    gaLoaded = true;

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(script);

    gtag('js', new Date());
    // Google Signals y la personalización de anuncios quedan apagados a propósito:
    // hoy no hay campañas ni remarketing. Sacar estas dos opciones cuando haga falta.
    gtag('config', GA_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
  }

  function disableAnalytics() {
    window['ga-disable-' + GA_ID] = true;
    gtag('consent', 'update', { analytics_storage: 'denied' });
    deleteGaCookies();
  }

  // Si ya estaba aceptado y se cambia a "Rechazar", se cortan los envíos de esta
  // página y se borran las cookies de GA (en el dominio actual y en el raíz).
  function deleteGaCookies() {
    var names = ['_ga', '_ga_' + GA_ID.replace('G-', '')];
    var host = location.hostname;
    var rootDomain = '.' + host.split('.').slice(-2).join('.');
    var expired = '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

    names.forEach(function (name) {
      document.cookie = name + expired;
      document.cookie = name + expired + '; domain=' + host;
      document.cookie = name + expired + '; domain=.' + host;
      document.cookie = name + expired + '; domain=' + rootDomain;
    });
  }

  function applyChoice(value) {
    currentChoice = value;
    saveChoice(value);
    if (value === 'granted') {
      enableAnalytics();
    } else {
      disableAnalytics();
    }
  }

  // Mientras no hay una elección, el aviso no se puede cerrar sin elegir.
  function isDismissable() {
    return currentChoice !== null || readChoice() !== null;
  }

  // Bloquea el resto de la página: sin scroll, y sin foco ni clics (inert).
  function lockPage() {
    if (compact) return;
    document.documentElement.classList.add('cookie-modal-open');
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el === overlay || el.tagName === 'SCRIPT' || el.hasAttribute('inert')) return;
      el.setAttribute('inert', '');
      inertedEls.push(el);
    });
  }

  function unlockPage() {
    document.documentElement.classList.remove('cookie-modal-open');
    inertedEls.forEach(function (el) { el.removeAttribute('inert'); });
    inertedEls = [];
  }

  function buildBanner() {
    overlay = document.createElement('div');
    overlay.className = 'cookie-overlay' + (compact ? ' is-compact' : '');
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="cookie-banner" role="dialog" aria-modal="' + (compact ? 'false' : 'true') + '" aria-labelledby="cookie-banner-title" aria-describedby="cookie-banner-text" tabindex="-1">' +
        '<button type="button" class="cookie-close" data-cookie-close aria-label="Cerrar">&times;</button>' +
        '<div class="cookie-banner-body">' +
          '<p class="cookie-banner-title" id="cookie-banner-title">Cookies de analítica</p>' +
          '<p class="cookie-banner-text" id="cookie-banner-text">Usamos Google Analytics (Google LLC, con servidores en Estados Unidos) para entender cómo se usa el sitio y mejorarlo. Solo se activa si lo aceptás. Más información en nuestra <a href="privacidad.html#cookies" target="_blank" rel="noopener">Política de Privacidad</a>.</p>' +
        '</div>' +
        '<div class="cookie-banner-actions">' +
          '<button type="button" class="cookie-banner-btn" data-cookie-choice="denied">Rechazar</button>' +
          '<button type="button" class="cookie-banner-btn" data-cookie-choice="granted">Aceptar</button>' +
        '</div>' +
      '</div>';
    card = overlay.querySelector('.cookie-banner');

    overlay.addEventListener('click', function (event) {
      var choiceButton = event.target.closest('[data-cookie-choice]');
      if (choiceButton) {
        applyChoice(choiceButton.getAttribute('data-cookie-choice'));
        hideBanner();
        return;
      }

      var closeButton = event.target.closest('[data-cookie-close]');
      var backdropClick = event.target === overlay && !compact;
      if ((closeButton || backdropClick) && isDismissable()) hideBanner();
    });

    // Con una elección ya guardada, Escape cierra el aviso sin cambiarla.
    overlay.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isDismissable()) hideBanner();
    });

    document.body.appendChild(overlay);
  }

  function showBanner(moveFocus) {
    if (!overlay) buildBanner();
    overlay.setAttribute('data-dismissable', isDismissable() ? 'true' : 'false');
    overlay.hidden = false;
    lockPage();
    // En el modal el foco entra al cartel; en la barra de las páginas legales
    // solo se mueve cuando la persona lo abre a propósito desde el footer.
    if (!compact || moveFocus) card.focus();
  }

  function hideBanner() {
    if (!overlay) return;
    overlay.hidden = true;
    unlockPage();
    if (lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  }

  // Eventos de conversión (ej. generate_lead cuando el formulario se envió).
  // Solo se mandan si la persona aceptó la analítica; si no, se descartan en
  // vez de quedar en cola y enviarse recién cuando acepte.
  window.procomexTrack = function (eventName, params) {
    if (currentChoice !== 'granted') return;
    gtag('event', eventName, params || {});
  };

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-cookie-settings]');
    if (!trigger) return;
    lastTrigger = trigger;
    showBanner(true);
  });

  var choice = readChoice();
  if (choice !== null) currentChoice = choice;

  if (choice === 'granted') {
    enableAnalytics();
  } else if (choice === null) {
    showBanner(false);
  }
})();
