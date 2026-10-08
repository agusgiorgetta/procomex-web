// ProComex — validación del formulario de contacto (index.html).
// Cada función recibe el texto de un campo y devuelve '' si está bien, o el
// mensaje de error que se le muestra a la persona.
// Filtran lo que es claramente basura (frases como "ni idea", teclazos, números
// en el nombre) sin rechazar gente real: perder una consulta legítima cuesta más
// que recibir una de más. Es ayuda para quien completa el formulario, no una
// medida de seguridad: el navegador se puede saltear.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ProcomexValidation = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  // Se comparan sin tildes ni mayúsculas. Para sumar una palabra, agregarla acá.
  var JUNK_NAME_WORDS = [
    'nada', 'nadie', 'ninguno', 'ninguna', 'anonimo', 'anonima', 'nn',
    'test', 'tester', 'testing', 'prueba', 'xxx', 'yyy', 'zzz', 'abc', 'asd',
    'asdf', 'asdasd', 'qwerty', 'nose',
  ];
  var JUNK_NAME_PHRASES = ['ni idea', 'ni se', 'no se', 'no tengo', 'sin nombre', 'quien sabe'];
  var KEYBOARD_RUNS = ['qwer', 'asdf', 'sdfg', 'dfgh', 'zxcv', 'xcvb', 'hjkl'];

  var MSG_REAL_NAME = 'Ingresá tu nombre real para que podamos responderte.';

  // Letras sin tildes ni mayúsculas, para comparar contra las listas de arriba.
  function normalize(text) {
    return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function looksMashed(word) {
    if (/(.)\1{2,}/.test(word)) return true;
    var isLatin = /^[a-z]+$/.test(word);
    if (isLatin && word.length >= 3 && !/[aeiouy]/.test(word)) return true;
    return KEYBOARD_RUNS.some(function (run) { return word.indexOf(run) !== -1; });
  }

  function validateName(value) {
    var name = String(value).trim().replace(/\s+/g, ' ');
    if (!name) return 'Completá tu nombre y apellido.';
    if (name.length > 80) return 'El nombre es demasiado largo. Escribí solo tu nombre y apellido.';
    if (!/^\p{L}[\p{L}\p{M}'’.\- ]*$/u.test(name)) {
      return 'El nombre solo puede tener letras. Revisá que no haya números ni símbolos.';
    }

    var words = name.split(' ')
      .map(function (word) { return normalize(word).replace(/[^\p{L}]/gu, ''); })
      .filter(Boolean);

    // Una inicial suelta ("J.") alcanza como segundo nombre, pero no como nombre.
    if (!words.some(function (word) { return word.length >= 2; })) {
      return 'Ingresá tu nombre completo, no solo iniciales.';
    }

    var padded = ' ' + words.join(' ') + ' ';
    var hasJunkWord = words.some(function (word) { return JUNK_NAME_WORDS.indexOf(word) !== -1; });
    var hasJunkPhrase = JUNK_NAME_PHRASES.some(function (phrase) { return padded.indexOf(' ' + phrase + ' ') !== -1; });
    if (hasJunkWord || hasJunkPhrase || words.some(looksMashed)) return MSG_REAL_NAME;

    return '';
  }

  var EMAIL_PATTERN = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

  function validateEmail(value) {
    var email = String(value).trim();
    if (!email) return 'Completá tu email.';
    var localPart = email.split('@')[0];
    if (email.length > 254 || localPart.length > 64 || !EMAIL_PATTERN.test(email)) {
      return 'Ingresá un email válido, por ejemplo nombre@dominio.com.';
    }
    return '';
  }

  var ASCENDING_DIGITS = '01234567890123456789';
  var DESCENDING_DIGITS = '98765432109876543210';

  // Opcional: vacío es válido. Si se completa, tiene que parecer un teléfono.
  function validatePhone(value) {
    var phone = String(value).trim();
    if (!phone) return '';

    if (!/^\+?[\d\s().\-]+$/.test(phone)) {
      return 'El teléfono solo puede tener números, espacios, guiones, paréntesis y un + al inicio.';
    }

    var digits = phone.replace(/\D/g, '');
    var tooShortOrLong = digits.length < 8 || digits.length > 15;
    var allSame = /^(\d)\1+$/.test(digits);
    var isSequence = ASCENDING_DIGITS.indexOf(digits) !== -1 || DESCENDING_DIGITS.indexOf(digits) !== -1;
    if (tooShortOrLong || allSame || isSequence) {
      return 'Ingresá un teléfono válido (entre 8 y 15 dígitos) o dejalo en blanco.';
    }
    return '';
  }

  function validateMessage(value) {
    var message = String(value).trim().replace(/\s+/g, ' ');
    if (!message) return 'Contanos tu consulta.';
    if (message.length < 10) return 'Contanos un poco más sobre tu consulta (mínimo 10 caracteres).';
    if (message.length > 2000) return 'El mensaje es demasiado largo (máximo 2000 caracteres).';

    var letters = normalize(message).replace(/[^\p{L}]/gu, '');
    var distinctLetters = new Set(letters.split('')).size;
    if (letters.length < 6 || distinctLetters < 4) {
      return 'Escribí tu consulta con palabras para que podamos entenderla.';
    }
    return '';
  }

  return {
    validateName: validateName,
    validateEmail: validateEmail,
    validatePhone: validatePhone,
    validateMessage: validateMessage,
  };
});
