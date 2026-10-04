/**
 * Planche d'une mitochondrie — une gravure au trait, en deux dimensions.
 *
 * Tout est dessiné en SVG, d'une seule encre : les régions se distinguent par
 * leur hachure, comme sur une planche gravée, et non par une couleur. Le rouge
 * du typographe ne sert qu'à deux choses, marquer la partie choisie et tracer
 * le circuit des protons.
 *
 * La planche porte deux figures, comme il se doit quand une échelle ne suffit
 * pas. La figure 1 donne l'organite en coupe ; la figure 2 agrandit le morceau
 * de membrane interne que le cartouche en pointillé désigne, et c'est là
 * seulement que la machinerie est à une taille lisible. Une seule liste de
 * parties sert les deux : choisir « matrice » éclaire aussi bien le dedans de
 * la figure 1 que la bande supérieure de la figure 2.
 *
 * Le contour de la figure 1 est un superellipse (|x/a|^n + |y/b|^n = 1, n ≈ 3),
 * qui donne la silhouette en gélule de l'organite. Le même rayon sert ensuite à
 * savoir si un point tombe dans la matrice — ce qui sème les ribosomes sans
 * qu'aucun ne chevauche un repli, un chromosome ou un repère.
 *
 * La chimiosmose est portée par des flèches, non par un mouvement : les
 * complexes refoulent les protons sous la membrane, ceux-ci gagnent l'ATP
 * synthase, refluent au travers, et l'ATP paraît dans la matrice. Rien ne
 * bouge — la planche est un schéma, pas un film.
 *
 * Les repères chiffrés de la planche et les entrées de la légende sortent de la
 * même liste : on peut donc tout parcourir au clavier, sans jamais viser un
 * pixel.
 */
(() => {
  const hote = document.getElementById('planche');
  const panneau = document.getElementById('panneau');
  const legende = document.getElementById('legende');
  if (!hote) return;

  const SVGNS = 'http://www.w3.org/2000/svg';
  const CADRE = { l: 760, h: 640 };
  const fixe = n => n.toFixed(1);

  /* ------------------------------------------- figure 1 : l'organite en coupe */

  const CX = 380, CY = 185, N = 3.2;

  const EXT     = { a: 318, b: 140 };   // membrane externe, trait extérieur
  const EXT_INT = { a: 310, b: 132 };   // son trait intérieur — la bicouche
  const INT     = { a: 282, b: 104 };   // membrane interne

  /** Rayon du superellipse à l'angle donné. */
  function rayon(theta, forme) {
    const c = Math.abs(Math.cos(theta) / forme.a) ** N;
    const s = Math.abs(Math.sin(theta) / forme.b) ** N;
    return (c + s) ** (-1 / N);
  }

  /** Demi-hauteur de la forme à l'abscisse donnée. */
  function demiHauteur(x, forme) {
    const u = Math.min(1, Math.abs(x - CX) / forme.a);
    return forme.b * (1 - u ** N) ** (1 / N);
  }

  const plafond = (x, forme) => CY - demiHauteur(x, forme);
  const plancher = (x, forme) => CY + demiHauteur(x, forme);

  /** Contour fermé d'une forme, échantillonné au demi-degré. */
  function trace(forme) {
    const pas = 0.7 * Math.PI / 180;
    let d = '';
    for (let t = 0; t < 2 * Math.PI; t += pas) {
      const r = rayon(t, forme);
      d += `${d ? 'L' : 'M'}${fixe(CX + r * Math.cos(t))},${fixe(CY + r * Math.sin(t))}`;
    }
    return d + 'Z';
  }

  /**
   * Les crêtes sont des lamelles, non des bosses : des doigts à flancs
   * parallèles qui plongent depuis le haut de la membrane interne. Leur lumière
   * communique avec l'espace intermembranaire, d'où la même hachure.
   *
   * Elles alternent de longueur : une rangée parfaitement égale ferait un
   * peigne, non un organite.
   */
  const CRETES = [190, 253, 316, 380, 443, 506, 569].map((x, i) => {
    const base = plafond(x, INT);
    return { x, base, fond: base + (i % 2 ? 0.42 : 0.54) * (plancher(x, INT) - base) };
  });
  const CRETE_DEMI = 13;

  /** Le doigt refermé, pour la hachure. */
  function creteFermee({ x, base, fond }) {
    const g = x - CRETE_DEMI, d = x + CRETE_DEMI;
    return `M${fixe(g)},${fixe(base - 7)}V${fixe(fond - CRETE_DEMI)}`
         + `A${CRETE_DEMI},${CRETE_DEMI} 0 0 0 ${fixe(d)},${fixe(fond - CRETE_DEMI)}`
         + `V${fixe(base - 7)}Z`;
  }

  /** Le même doigt, ouvert à son embouchure : la membrane ne s'y referme pas. */
  function creteOuverte({ x, base, fond }) {
    const g = x - CRETE_DEMI, d = x + CRETE_DEMI;
    return `M${fixe(g)},${fixe(base - 7)}V${fixe(fond - CRETE_DEMI)}`
         + `A${CRETE_DEMI},${CRETE_DEMI} 0 0 0 ${fixe(d)},${fixe(fond - CRETE_DEMI)}`
         + `V${fixe(base - 7)}`;
  }

  // Deux chromosomes circulaires, dans la matrice sous les crêtes.
  const ADN = [[250, 250, 26], [480, 252, 19]];

  /* ------------------------- figure 2 : le détail de la membrane interne */

  const DETAIL = {
    gauche: 60, droite: 700,
    haut: 486, bas: 516,        // les deux feuillets de la membrane
    matrice: 380,               // plafond de la bande matricielle
    ims: 580,                   // plancher de la bande intermembranaire
  };
  DETAIL.allee = (DETAIL.bas + DETAIL.ims) / 2;   // l'allée des protons
  DETAIL.conduit = (DETAIL.haut + DETAIL.bas) / 2; // l'axe des électrons

  // Le cartouche de renvoi part de ce segment de la membrane interne.
  const RENVOI = [300, 460];

  const COMPLEXES = [
    { nom: 'I',   x: 150, pompe: true },
    { nom: 'II',  x: 250, pompe: false },
    { nom: 'III', x: 350, pompe: true },
    { nom: 'IV',  x: 450, pompe: true },
  ];
  const POMPES = COMPLEXES.filter(c => c.pompe);
  const FUT = { l: 54, h: 54 };

  const SYNTHASE = { x: 592, l: 50, rTete: 36, yTete: 432 };

  /* ----------------------------------------------------------------- parties */

  const PARTIES = [
    {
      id: 'externe',
      chiffre: 1,
      nom: 'Membrane externe',
      repere: [28, 184], vers: [58, 185],
      resume: 'Une double couche lipidique perméable, criblée de porines.',
      texte: `Elle délimite l'organite et le sépare du cytosol. Ses porines laissent
        passer librement ions et petites molécules jusqu'à environ 5 000 daltons,
        si bien que l'espace intermembranaire a une composition proche de celle
        du cytosol. C'est aussi par elle que transitent les protéines
        mitochondriales fabriquées dans la cellule, via le complexe TOM.`,
    },
    {
      id: 'intermembranaire',
      chiffre: 2,
      nom: 'Espace intermembranaire',
      repere: [730, 128], vers: [676, 152],
      resume: 'Le réservoir de protons qui fait tourner l’ATP synthase.',
      texte: `Un espace mince entre les deux membranes, où la chaîne respiratoire
        refoule les protons&nbsp;— c'est la flèche qui court vers la droite au bas de
        la figure&nbsp;2. Il y règne un pH plus acide que dans la matrice&nbsp;: c'est cette différence, le gradient électrochimique, qui
        stocke l'énergie. La lumière des crêtes en fait partie, et c'est pourquoi
        elle porte la même hachure. On y trouve aussi le cytochrome&nbsp;c, dont la
        libération vers le cytosol déclenche l'apoptose.`,
    },
    {
      id: 'interne',
      chiffre: 3,
      nom: 'Membrane interne',
      repere: [28, 258], vers: [134, 258],
      resume: 'Imperméable, repliée, couverte de complexes respiratoires.',
      texte: `Riche en cardiolipide, elle est quasiment étanche&nbsp;: rien ne la
        traverse sans transporteur dédié. Elle porte les quatre complexes de la
        chaîne respiratoire et l'ATP synthase, que la figure&nbsp;2 agrandit, et
        c'est son étanchéité même qui rend le gradient possible&nbsp;— une membrane
        qui fuit ne stocke rien.`,
    },
    {
      id: 'cretes',
      chiffre: 4,
      nom: 'Crêtes',
      repere: [380, 26], vers: [380, 84],
      resume: 'Les replis qui multiplient la surface utile.',
      texte: `Les crêtes (ou <i>cristae</i>) sont les invaginations de la membrane
        interne. Elles peuvent multiplier sa surface par cinq, et les cellules les
        plus gourmandes en énergie — muscle cardiaque, neurones — en possèdent les
        plus denses. La machinerie dessinée à la figure&nbsp;2 en garnit toute la
        longueur. Leur forme n'est pas figée&nbsp;: elle se remodèle selon l'état
        métabolique de la cellule.`,
    },
    {
      id: 'matrice',
      chiffre: 5,
      nom: 'Matrice',
      repere: [330, 252],
      resume: 'Le compartiment enzymatique, siège du cycle de Krebs.',
      texte: `Un gel dense en enzymes où se déroulent le cycle de Krebs, la
        β-oxydation des acides gras et une partie du cycle de l'urée. C'est là que
        sont produits le NADH et le FADH₂ qui alimenteront la chaîne respiratoire,
        là que baignent l'ADN et les ribosomes de l'organite, et là que l'ATP
        paraît.`,
    },
    {
      id: 'adn',
      chiffre: 6,
      nom: 'ADN mitochondrial',
      repere: [560, 252], vers: [502, 252],
      resume: 'Un chromosome circulaire, transmis par la mère.',
      texte: `Chez l'humain, une molécule circulaire de 16&nbsp;569 paires de bases
        portant 37 gènes&nbsp;: 13 protéines de la chaîne respiratoire, 22 ARN de
        transfert, 2 ARN ribosomiques. Présent en dizaines de copies par
        organite, il est hérité presque exclusivement de la mère, ce qui en fait
        un marqueur de généalogie maternelle.`,
    },
    {
      id: 'ribosomes',
      chiffre: 7,
      nom: 'Ribosomes',
      repere: [162, 250],
      resume: 'Une machinerie de traduction propre à l’organite.',
      texte: `Les mitoribosomes traduisent sur place les 13 protéines codées par
        l'ADN mitochondrial. Plus proches des ribosomes bactériens que de ceux du
        cytosol, ils sont sensibles à certains antibiotiques — un indice de plus
        de l'origine bactérienne de l'organite.`,
    },
    {
      id: 'chaine',
      chiffre: 8,
      nom: 'Chaîne respiratoire',
      repere: [300, 608], vers: [350, 538],
      resume: 'Quatre complexes ; trois d’entre eux refoulent des protons.',
      texte: `Les électrons du NADH et du FADH₂ descendent de complexe en complexe
        — les petites flèches de la figure&nbsp;2 vont de <b class="font-semibold">I</b>
        à <b class="font-semibold">IV</b>. À chaque transfert, l'énergie libérée sert
        à refouler des protons vers l'espace intermembranaire&nbsp;; seul le
        complexe <b class="font-semibold">II</b>, qui ne fait qu'injecter des
        électrons, ne pompe pas. Au terme de la chaîne, l'oxygène recueille les
        électrons épuisés pour former de l'eau — sans lui, tout s'engorge.`,
    },
    {
      id: 'synthase',
      chiffre: 9,
      nom: 'ATP synthase',
      repere: [650, 608], vers: [614, 540],
      resume: 'La turbine qui monnaie le gradient en ATP.',
      texte: `Les protons accumulés ne peuvent revenir que par elle. Leur reflux
        fait tourner le rotor, et chaque tour soude un phosphate sur l'ADP&nbsp;:
        c'est la <b class="font-semibold">chimiosmose</b> de Peter Mitchell. La
        planche compte trois protons par molécule d'ATP, ce qui est l'ordre de
        grandeur admis.`,
    },
  ];

  /* ------------------------------------------------------- semis de ribosomes */

  // Tirage déterministe : la même planche à chaque chargement.
  let graine = 7;
  const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;

  const dansMatrice = (x, y, marge) => {
    const dx = x - CX, dy = y - CY;
    return Math.hypot(dx, dy) < rayon(Math.atan2(dy, dx), INT) - marge;
  };

  const dansCrete = (x, y, marge) => CRETES.some(c =>
    Math.abs(x - c.x) < CRETE_DEMI + marge && y > c.base - marge && y < c.fond + marge);

  const GRANULES = [];
  for (let essais = 0; GRANULES.length < 20 && essais < 8000; essais++) {
    const x = CX + (hasard() * 2 - 1) * INT.a;
    const y = CY + (hasard() * 2 - 1) * INT.b;
    if (!dansMatrice(x, y, 16)) continue;
    if (dansCrete(x, y, 11)) continue;
    if (ADN.some(([ax, ay, r]) => Math.hypot(x - ax, y - ay) < r + 16)) continue;
    if (PARTIES.some(p => Math.hypot(x - p.repere[0], y - p.repere[1]) < 24)) continue;
    if (GRANULES.some(([gx, gy]) => Math.hypot(x - gx, y - gy) < 28)) continue;
    GRANULES.push([x, y]);
  }

  // Le repère des ribosomes pointe le granule le plus proche, plutôt qu'un vide.
  {
    const cle = PARTIES.find(p => p.id === 'ribosomes');
    const [cx, cy] = cle.repere;
    const proche = GRANULES.reduce((a, b) =>
      Math.hypot(cx - a[0], cy - a[1]) < Math.hypot(cx - b[0], cy - b[1]) ? a : b);
    if (proche) cle.vers = [proche[0] - Math.sign(proche[0] - cx) * 9, proche[1]];
  }

  /* ------------------------------------------------------------ dessin SVG */

  /** Un complexe respiratoire : un fût qui traverse la membrane. */
  function futComplexe({ nom, x }) {
    const y = (DETAIL.haut + DETAIL.bas) / 2;
    return `<rect class="piece" x="${fixe(x - FUT.l / 2)}" y="${fixe(y - FUT.h / 2)}"
              width="${FUT.l}" height="${FUT.h}" rx="11"/>
            <text class="romain" x="${fixe(x)}" y="${fixe(y + 7)}">${nom}</text>`;
  }

  function dessinSynthase() {
    const { x, l, rTete, yTete } = SYNTHASE;
    const y = (DETAIL.haut + DETAIL.bas) / 2;
    const branches = [0, 1, 2].map(i => {
      const a = (i * 2 * Math.PI) / 3;
      return `M0,0L${fixe(rTete * 0.74 * Math.cos(a))},${fixe(rTete * 0.74 * Math.sin(a))}`;
    }).join('');
    return `
      <rect class="piece" x="${fixe(x - l / 2)}" y="${fixe(y - FUT.h / 2)}"
            width="${l}" height="${FUT.h}" rx="11"/>
      <path class="trait epais" d="M${fixe(x - 7)},${fixe(y - FUT.h / 2)}V${fixe(yTete + rTete - 6)}
                                   M${fixe(x + 7)},${fixe(y - FUT.h / 2)}V${fixe(yTete + rTete - 6)}"/>
      <circle class="tete" cx="${fixe(x)}" cy="${fixe(yTete)}" r="${rTete}"/>
      <g transform="translate(${fixe(x)} ${fixe(yTete)})">
        <path class="trait epais" d="${branches}"/>
      </g>`;
  }

  /**
   * Le circuit des protons, en flèches plutôt qu'en mouvement : ils sortent par
   * les trois pompes, gagnent la synthase sous la membrane, refluent au travers,
   * et l'ATP paraît dans la matrice. Les électrons, eux, sautent de complexe en
   * complexe dans l'épaisseur même de la membrane.
   *
   * Le circuit vit hors des groupes de parties : c'est une annotation, non une
   * pièce de l'organite, et il ne doit donc ni s'éteindre ni se laisser cliquer.
   */
  function dessinCircuit() {
    const fleche = (classe, d) => `<path class="fleche ${classe}" d="${d}"/>`;
    const haut = DETAIL.haut - 36;              // d'où partent les protons
    const bas = DETAIL.allee + 6;               // où ils débouchent
    const voie = DETAIL.allee + 20;             // l'allée qu'ils suivent ensuite

    // Trois descentes, au flanc des fûts qui pompent.
    const descentes = POMPES.map(p =>
      fleche('circuit-proton', `M${fixe(p.x + 18)},${fixe(haut)}V${fixe(bas)}`)).join('');

    // La dérive sous la membrane et le reflux par la synthase ne font qu'un
    // coude : deux flèches bout à bout laisseraient voir le raccord.
    const coude = fleche('circuit-proton',
      `M${fixe(POMPES[0].x + 32)},${fixe(voie)}H${fixe(SYNTHASE.x)}`
      + `V${fixe(SYNTHASE.yTete + SYNTHASE.rTete + 6)}`);
    const sortie = fleche('circuit-proton',
      `M${fixe(SYNTHASE.x + SYNTHASE.rTete + 4)},${fixe(SYNTHASE.yTete - 8)}`
      + `L${fixe(SYNTHASE.x + SYNTHASE.rTete + 30)},${fixe(SYNTHASE.yTete - 24)}`);

    // Les sauts d'électrons, dans les intervalles entre complexes.
    const intervalles = COMPLEXES.slice(0, -1).map((c, i) => [
      c.x + FUT.l / 2 + 6, COMPLEXES[i + 1].x - FUT.l / 2 - 6,
    ]);
    const sauts = intervalles.map(([a, b]) =>
      fleche('circuit-electron', `M${fixe(a)},${fixe(DETAIL.conduit)}H${fixe(b)}`)).join('');
    const [a0, b0] = intervalles[0];

    return `<g class="circuit">
      ${descentes}${coude}${sortie}${sauts}
      <text class="formule" x="${fixe(SYNTHASE.x - 180)}" y="${fixe(voie - 14)}">H⁺</text>
      <text class="formule" x="${fixe(SYNTHASE.x + SYNTHASE.rTete + 52)}" y="${fixe(SYNTHASE.yTete - 26)}">ATP</text>
      <text class="formule sobre" x="${fixe((a0 + b0) / 2)}" y="${fixe(DETAIL.haut - 12)}">e⁻</text>
    </g>`;
  }

  /** Repère chiffré : une pastille sur fond de papier, et son filet de renvoi. */
  function dessinRepere({ chiffre, repere, vers }) {
    const [x, y] = repere;
    const filet = vers
      ? `<path class="renvoi" d="M${fixe(x)},${fixe(y)}L${fixe(vers[0])},${fixe(vers[1])}"/>`
      : '';
    return `${filet}
      <circle class="pastille" cx="${fixe(x)}" cy="${fixe(y)}" r="12"/>
      <text class="chiffre" x="${fixe(x)}" y="${fixe(y + 5)}">${chiffre}</text>`;
  }

  /**
   * Hachures et semis : les aplats d'une gravure. Chaque motif existe en deux
   * encres, la noire et celle du typographe, pour que la partie choisie change
   * de teinte jusque dans son remplissage.
   */
  function motifs() {
    const paire = (nom, taille, contenu) => `
      <pattern id="motif-${nom}" width="${taille}" height="${taille}" patternUnits="userSpaceOnUse">
        <g class="encre-noire">${contenu}</g>
      </pattern>
      <pattern id="motif-${nom}-rubrique" width="${taille}" height="${taille}" patternUnits="userSpaceOnUse">
        <g class="encre-rubrique">${contenu}</g>
      </pattern>`;
    const pointe = (nom, encre) => `
      <marker id="pointe-${nom}" viewBox="0 0 10 10" refX="8.5" refY="5"
              markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
        <path class="${encre}" d="M0.5,1L9,5L0.5,9Z" stroke="none"/>
      </marker>`;
    return pointe('proton', 'encre-rubrique') + pointe('electron', 'encre-noire')
         + paire('hachure', 9, '<path d="M-1,8L8,-1M2,11L11,2" stroke-width="1.1" fill="none"/>')
         + paire('semis', 11, '<circle cx="2.6" cy="2.6" r="0.9" stroke="none"/>'
                            + '<circle cx="8.1" cy="8.1" r="0.9" stroke="none"/>')
         + paire('serre', 7, '<path d="M-1,3L4,-2M-1,8L8,-1M3,8L8,3" stroke-width="1.5" fill="none"/>');
  }

  const bandeDetail = (y0, y1, classe) =>
    `<rect class="${classe}" x="${DETAIL.gauche}" y="${fixe(y0)}"
           width="${DETAIL.droite - DETAIL.gauche}" height="${fixe(y1 - y0)}"/>`;

  const svg = `
<svg class="planche" viewBox="0 0 ${CADRE.l} ${CADRE.h}" role="img"
     aria-label="Planche en deux figures. Figure 1, l’organite en coupe : la membrane
     externe, l’espace intermembranaire, la membrane interne repliée en sept crêtes,
     et la matrice où baignent deux chromosomes circulaires et des ribosomes.
     Figure 2, un agrandissement de la membrane interne : les quatre complexes de la
     chaîne respiratoire, puis l’ATP synthase. Des flèches y tracent le circuit des
     protons : refoulés sous la membrane par les complexes, ils gagnent l’ATP synthase,
     refluent au travers, et l’ATP paraît dans la matrice.">
  <defs>${motifs()}</defs>

  <!-- ------------------------------------------- figure 1 : l'organite -->

  <g data-partie="intermembranaire">
    <path class="aplat hachure" fill-rule="evenodd" d="${trace(EXT_INT)}${trace(INT)}"/>
  </g>

  <g data-partie="matrice">
    <path class="aplat semis" d="${trace(INT)}"/>
  </g>

  <g data-partie="ribosomes">
    ${GRANULES.map(([x, y]) => `
      <circle class="granule" cx="${fixe(x)}" cy="${fixe(y)}" r="6"/>
      <circle class="granule-coeur" cx="${fixe(x)}" cy="${fixe(y)}" r="2.4"/>`).join('')}
  </g>

  <g data-partie="adn">
    ${ADN.map(([x, y, r]) => `
      <circle class="trait epais" cx="${fixe(x)}" cy="${fixe(y)}" r="${r}"/>
      <circle class="trait fin" cx="${fixe(x)}" cy="${fixe(y)}" r="${r - 6}"/>`).join('')}
  </g>

  <g data-partie="externe">
    <path class="trait epais" d="${trace(EXT)}"/>
    <path class="trait epais" d="${trace(EXT_INT)}"/>
  </g>

  <g data-partie="interne">
    <path class="trait epais" d="${trace(INT)}"/>
    ${bandeDetail(DETAIL.haut, DETAIL.bas, 'feuillets')}
  </g>

  <g data-partie="cretes">
    ${CRETES.map(c => `<path class="aplat hachure" d="${creteFermee(c)}"/>`).join('')}
    ${CRETES.map(c => `<path class="trait epais" d="${creteOuverte(c)}"/>`).join('')}
  </g>

  <!-- ------------------------------- cartouche de renvoi vers la figure 2 -->

  <path class="cartouche" d="M${RENVOI[0]},${fixe(plancher(RENVOI[0], INT))}
                             L${DETAIL.gauche},${DETAIL.haut}
                             M${RENVOI[1]},${fixe(plancher(RENVOI[1], INT))}
                             L${DETAIL.droite},${DETAIL.haut}"/>

  <!-- ------------------------------- figure 2 : le détail de la membrane -->

  <g data-partie="matrice">
    ${bandeDetail(DETAIL.matrice, DETAIL.haut, 'aplat semis')}
  </g>

  <g data-partie="intermembranaire">
    ${bandeDetail(DETAIL.bas, DETAIL.ims, 'aplat hachure')}
  </g>

  <g data-partie="interne">
    <path class="trait epais"
          d="M${DETAIL.gauche},${DETAIL.haut}H${DETAIL.droite}
             M${DETAIL.gauche},${DETAIL.bas}H${DETAIL.droite}"/>
  </g>

  <g data-partie="chaine">
    ${COMPLEXES.map(futComplexe).join('')}
  </g>

  <g data-partie="synthase">
    ${dessinSynthase()}
  </g>

  ${dessinCircuit()}

  <text class="annotation" x="${DETAIL.gauche}" y="36" text-anchor="start">Fig. 1</text>
  <text class="annotation" x="${DETAIL.gauche}" y="366" text-anchor="start">Fig. 2</text>
  <text class="etiquette" x="${DETAIL.gauche + 10}" y="${DETAIL.matrice + 22}"
        text-anchor="start">Matrice</text>
  <text class="etiquette" x="${DETAIL.gauche + 10}" y="${DETAIL.ims - 10}"
        text-anchor="start">Espace intermembranaire</text>

  ${PARTIES.map(p => `<g data-partie="${p.id}" class="cle">${dessinRepere(p)}</g>`).join('')}
</svg>`;

  hote.innerHTML = svg;

  const planche = hote.querySelector('svg');

  /*
   * Les étiquettes des bandes tombent en plein dans la hachure. Plutôt qu'un
   * listel autour de chaque lettre, qui les empâte, on leur ménage une réserve
   * de papier — exactement la taille du mot, mesurée une fois les caractères
   * chargés, sans quoi on mesurerait la fonte de repli.
   */
  function poserReserves() {
    for (const etiquette of planche.querySelectorAll('.etiquette, .formule')) {
      const boite = etiquette.getBBox();
      if (!boite.width) continue;
      const reserve = document.createElementNS(SVGNS, 'rect');
      const sorte = etiquette.classList.contains('etiquette') ? 'etiquette' : 'formule';
      reserve.setAttribute('class', `reserve reserve-${sorte}`);
      reserve.setAttribute('x', fixe(boite.x - 7));
      reserve.setAttribute('y', fixe(boite.y - 3));
      reserve.setAttribute('width', fixe(boite.width + 14));
      reserve.setAttribute('height', fixe(boite.height + 6));
      etiquette.before(reserve);
    }
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(poserReserves);
  else poserReserves();

  /* ------------------------------------------------- mise en avant / panneau */

  let actif = null;

  function appliquerStyles() {
    planche.classList.toggle('a-selection', actif !== null);
    for (const groupe of planche.querySelectorAll('[data-partie]')) {
      groupe.classList.toggle('actif', groupe.dataset.partie === actif);
    }
    for (const bouton of legende.querySelectorAll('button')) {
      bouton.setAttribute('aria-pressed', String(bouton.dataset.id === actif));
    }
  }

  function selectionner(id) {
    actif = id && id !== actif ? id : null;
    const partie = PARTIES.find(p => p.id === actif);

    if (!partie) {
      panneau.innerHTML = `<p class="text-encre-pale text-[0.8rem] leading-relaxed italic">
        Désignez une partie de la planche — ou choisissez une entrée de
        l’explication — pour en lire la description.</p>`;
    } else {
      panneau.innerHTML =
        `<h3 class="font-titre text-encre mb-2 text-[0.95rem] leading-snug">
           <span class="text-rubrique">${partie.chiffre}.</span> ${partie.nom}</h3>
         <p class="text-encre-douce justif text-[0.85rem] leading-relaxed">${partie.texte}</p>`;
    }
    appliquerStyles();
  }

  function construireLegende() {
    legende.replaceChildren(...PARTIES.map(partie => {
      const li = document.createElement('li');
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.dataset.id = partie.id;
      bouton.setAttribute('aria-pressed', 'false');
      bouton.className = [
        'grid w-full grid-cols-[auto_1fr] items-baseline gap-x-2.5 gap-y-0.5',
        'border border-transparent px-2 py-1.5 text-left',
        'hover:bg-rubrique-pale/60',
        'aria-pressed:border-filet aria-pressed:bg-rubrique-pale/80',
      ].join(' ');
      bouton.innerHTML =
        `<span class="font-titre text-rubrique w-4 text-right text-[0.8rem]">${partie.chiffre}</span>
         <span class="text-encre text-[0.85rem] leading-snug font-medium">${partie.nom}</span>
         <span class="text-encre-pale col-start-2 text-[0.75rem] leading-snug italic">${partie.resume}</span>`;
      bouton.addEventListener('click', () => selectionner(partie.id));
      li.append(bouton);
      return li;
    }));
  }

  construireLegende();
  selectionner(null);

  planche.addEventListener('click', event => {
    const groupe = event.target.closest('[data-partie]');
    selectionner(groupe ? groupe.dataset.partie : null);
  });
})();
