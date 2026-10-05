/**
 * Interrogation de fin de chapitre.
 *
 * Les questions sont écrites dans la page : chacune est un groupe de boutons
 * radio, la bonne réponse porte data-juste, et le corrigé suit dans un
 * <details>. Sans script, le lecteur coche et déplie lui-même « Réponse ».
 *
 * Avec le script, le corrigé reste caché jusqu'au choix ; le choix fait, la
 * question se fige, la bonne réponse est marquée, la mauvaise aussi s'il y a
 * lieu, et le corrigé s'ouvre. Quand tout est répondu, la note paraît, avec
 * une appréciation et de quoi recommencer. L'ordre des réponses est battu à
 * chaque tentative, pour que la place de la bonne ne s'apprenne pas.
 */
(() => {
  const APPRECIATIONS = [
    [1, 'Parfait — le chapitre est su.'],
    [0.75, 'Bien — quelques points à revoir.'],
    [0.5, 'Passable — une relecture s’impose.'],
    [0, 'Insuffisant — reprendre le chapitre depuis le début.'],
  ];

  /** Bat les réponses d'une question (Fisher-Yates), sur place. */
  const battre = question => {
    const liste = question.querySelector('.choix').parentElement;
    const choix = [...liste.children];
    for (let i = choix.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choix[i], choix[j]] = [choix[j], choix[i]];
    }
    liste.append(...choix);
  };

  for (const quiz of document.querySelectorAll('[data-quiz]')) {
    const questions = [...quiz.querySelectorAll('.question')];
    const bilan = quiz.querySelector('.bilan');
    const note = bilan.querySelector('.note');
    const appreciation = bilan.querySelector('.appreciation');

    const corriger = (question, choisi) => {
      const juste = choisi.hasAttribute('data-juste');
      question.dataset.repondu = juste ? 'juste' : 'faux';
      for (const entree of question.querySelectorAll('input')) {
        entree.disabled = true;
        const choix = entree.closest('.choix');
        if (entree.hasAttribute('data-juste')) choix.classList.add('juste');
        else if (entree === choisi) choix.classList.add('faux');
      }
      const corrige = question.querySelector('.corrige');
      corrige.querySelector('summary').textContent = juste ? 'Juste' : 'Inexact';
      corrige.dataset.verdict = juste ? 'juste' : 'faux';
      corrige.hidden = false;
      corrige.open = true;
      faireLeBilan();
    };

    const faireLeBilan = () => {
      const repondues = questions.filter(q => q.dataset.repondu);
      if (repondues.length < questions.length) { bilan.hidden = true; return; }
      const justes = repondues.filter(q => q.dataset.repondu === 'juste').length;
      note.textContent = `${justes} / ${questions.length}`;
      appreciation.textContent =
        APPRECIATIONS.find(([seuil]) => justes / questions.length >= seuil)[1];
      bilan.hidden = false;
    };

    const remettreAZero = () => {
      for (const question of questions) {
        delete question.dataset.repondu;
        for (const entree of question.querySelectorAll('input')) {
          entree.disabled = false;
          entree.checked = false;
          entree.closest('.choix').classList.remove('juste', 'faux');
        }
        const corrige = question.querySelector('.corrige');
        corrige.querySelector('summary').textContent = 'Réponse';
        delete corrige.dataset.verdict;
        corrige.open = false;
        corrige.hidden = true;
        battre(question);
      }
      bilan.hidden = true;
      questions[0].querySelector('input').focus();
    };

    for (const question of questions) {
      battre(question);
      question.querySelector('.corrige').hidden = true;
      question.addEventListener('change', evenement => {
        if (!question.dataset.repondu) corriger(question, evenement.target);
      });
    }
    bilan.querySelector('button').addEventListener('click', remettreAZero);
    quiz.querySelector('.consigne-script').hidden = false;
    quiz.querySelector('.consigne-sans-script').hidden = true;
  }
})();
