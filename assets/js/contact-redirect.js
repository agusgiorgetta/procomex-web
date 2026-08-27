// ProComex — páginas de perfil de equipo
// En desktop, los enlaces "mailto:" abren Gmail web en vez de un cliente de correo local.
// Requiere que el body tenga data-mail="direccion@procomex.ar".

document.addEventListener('DOMContentLoaded', () => {
  const mail = document.body.dataset.mail;
  if (!mail) return;

  const isMobile = /iPhone|Android/i.test(navigator.userAgent);
  if (isMobile) return;

  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    link.href = `https://mail.google.com/mail/?view=cm&to=${mail}`;
  });
});
