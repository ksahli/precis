/**
 * Jour / Nuit — le bouton du titre courant.
 *
 * Par défaut, la page suit le réglage du système. Un clic fixe le choix
 * contraire de ce qui est affiché, le pose en data-theme sur <html> et le
 * retient : le petit script de tête de chaque page le réapplique avant le
 * premier rendu, si bien que le papier ne clignote pas d'une page à l'autre.
 *
 * Sans script, le bouton reste caché et la page suit le système.
 */
(() => {
  const racine = document.documentElement;
  const systeme = matchMedia('(prefers-color-scheme: dark)');
  const boutons = document.querySelectorAll('[data-bascule-theme]');

  const nuit = () =>
    racine.dataset.theme ? racine.dataset.theme === 'sombre' : systeme.matches;

  const peindre = () => {
    for (const bouton of boutons) {
      bouton.textContent = nuit() ? 'Jour' : 'Nuit';
      bouton.setAttribute('aria-label', nuit() ? 'Passer au papier clair' : 'Passer au papier sombre');
      bouton.hidden = false;
    }
  };

  for (const bouton of boutons) {
    bouton.addEventListener('click', () => {
      const theme = nuit() ? 'clair' : 'sombre';
      racine.dataset.theme = theme;
      try { localStorage.setItem('theme', theme); } catch { /* stockage refusé : le choix vaut pour la page */ }
      peindre();
    });
  }

  systeme.addEventListener('change', peindre);
  peindre();
})();
