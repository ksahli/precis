/**
 * Planche d'une mitochondrie — deux volumes en perspective isométrique.
 *
 * Tout est dessiné en SVG, sans bibliothèque : une projection isométrique de
 * quelques lignes, et des volumes faits de faces planes. Chaque face prend la
 * teinte de sa région, plus ou moins assombrie selon qu'elle regarde le haut,
 * la gauche ou la droite — la lumière tombe d'en haut à gauche. Les teintes
 * sortent toutes de la palette du précis ; le rouge du typographe ne sert qu'à
 * marquer la partie choisie et à tracer le circuit des protons.
 *
 * La planche porte deux figures, comme il se doit quand une échelle ne suffit
 * pas. La figure 1 donne l'organite ouvert par le dessus, comme une gélule dont
 * on aurait ôté le couvercle : on voit le fond de la matrice, et les crêtes s'y
 * dressent en cloisons. La figure 2 agrandit, en bloc, le morceau de membrane
 * interne que le cartouche en pointillé désigne ; c'est là seulement que la
 * machinerie est à une taille lisible. Une seule liste de parties sert les
 * deux : choisir « matrice » éclaire aussi bien le fond de la figure 1 que le
 * haut du bloc de la figure 2.
 *
 * Le contour de la figure 1 est un superellipse (|x/a|^n + |y/b|^n = 1, n ≈ 3),
 * qui donne la silhouette en gélule de l'organite. Le même rayon sert ensuite à
 * savoir si un point tombe dans la matrice — ce qui sème les ribosomes sans
 * qu'aucun ne chevauche un repli, un chromosome ou un repère.
 *
 * Les volumes se recouvrent selon l'ordre du peintre : on dessine du fond vers
 * l'avant, la profondeur d'un point valant x + y dans le repère du monde.
 *
 * La chimiosmose est portée par des flèches, non par un mouvement. Rien ne
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

  const CADRE = { l: 760, h: 840 };
  const fixe = n => n.toFixed(1);

  /* --------------------------------------------------- projection isométrique */

  const COS30 = Math.cos(Math.PI / 6);

  /**
   * Une projection isométrique : l'axe x file vers la droite et le bas, l'axe y
   * vers la gauche et le bas, l'axe z monte. Seules les faces tournées vers
   * +x, +y ou +z sont visibles.
   */
  const projection = (ox, oy, echelle) => (x, y, z) =>
    [ox + (x - y) * COS30 * echelle, oy + (x + y) * 0.5 * echelle - z * echelle];

  /** Un chemin de points d'écran. */
  const chemin = (points, ferme = true) =>
    'M' + points.map(([x, y]) => `${fixe(x)},${fixe(y)}`).join('L') + (ferme ? 'Z' : '');

  /** Une face plane, teintée selon sa région et son orientation. */
  const face = (points, teinte, orientation, extra = '') =>
    `<path class="face t-${teinte} f-${orientation} ${extra}" d="${chemin(points)}"/>`;

  /**
   * Orientation d'une paroi verticale d'après sa normale (nx, ny) dans le
   * monde : face à +y elle regarde à gauche, face à +x à droite.
   */
  const orientation = (nx, ny) => (ny > nx ? 'gauche' : 'droite');

  /**
   * Les parois entre deux contours de même longueur, fusionnées en bandes
   * quand des segments voisins partagent la même teinte — sans quoi chaque
   * jointure laisserait voir un fil.
   */
  function bandes(haut, bas, teinte, classeDe) {
    const n = haut.length;
    const classes = haut.map((_, i) => classeDe(i));
    let debut = classes.findIndex((c, i) => c !== classes[(i + n - 1) % n]);
    if (debut < 0) debut = 0;
    let svg = '';
    for (let k = 0; k < n;) {
      const i = (debut + k) % n;
      const classe = classes[i];
      let j = k;
      while (j + 1 < n && classes[(debut + j + 1) % n] === classe) j++;
      if (classe) {
        const indices = [];
        for (let m = k; m <= j + 1; m++) indices.push((debut + m) % n);
        svg += face([...indices.map(m => haut[m]), ...indices.reverse().map(m => bas[m])],
                    teinte, classe);
      }
      k = j + 1;
    }
    return svg;
  }

  /* ------------------------------------------- figure 1 : l'organite ouvert */

  const CX = 380, CY = 185, N = 3.2;

  const EXT     = { a: 318, b: 140 };   // membrane externe, bord extérieur
  const EXT_INT = { a: 306, b: 128 };   // son bord intérieur — l'ouverture
  const INT     = { a: 282, b: 104 };   // membrane interne

  const SOL = -16;     // le fond de l'organite, sous le bord de la membrane externe
  const CLOISON = 15;  // hauteur des cloisons : membrane interne et crêtes
  const CORPS = 44;    // épaisseur de la gélule sous son bord

  const P1 = projection(380, 214, 0.78);
  /** Un point de la figure 1, en coordonnées de la coupe d'origine. */
  const p1 = (X, Y, z = SOL) => P1(X - CX, Y - CY, z);

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

  /** Contour fermé d'une forme, échantillonné au pas donné (en degrés). */
  function contour(forme, pas = 1.5, k = 1) {
    const points = [];
    for (let t = 0; t < 360; t += pas) {
      const theta = t * Math.PI / 180;
      const r = k * rayon(theta, forme);
      points.push([CX + r * Math.cos(theta), CY + r * Math.sin(theta)]);
    }
    return points;
  }

  /** Normale sortante d'un segment du contour (parcouru dans le sens des angles). */
  const normale = ([ax, ay], [bx, by]) => {
    const l = Math.hypot(bx - ax, by - ay) || 1;
    return [(by - ay) / l, -(bx - ax) / l];
  };

  /**
   * Les crêtes sont des lamelles, non des bosses : des doigts à flancs
   * parallèles qui plongent depuis le fond de la membrane interne. Leur lumière
   * communique avec l'espace intermembranaire, d'où la même teinte — et la
   * cloison de la membrane interne s'ouvre à leur embouchure.
   *
   * Elles alternent de longueur : une rangée parfaitement égale ferait un
   * peigne, non un organite.
   */
  const CRETES = [190, 253, 316, 380, 443, 506, 569].map((x, i) => {
    const base = plafond(x, INT);
    return { x, base, fond: base + (i % 2 ? 0.42 : 0.54) * (plancher(x, INT) - base) };
  });
  const CRETE_DEMI = 13;

  /** Le doigt d'une crête, en U ouvert vers la membrane interne. */
  function creteU({ x, fond }) {
    const g = x - CRETE_DEMI, d = x + CRETE_DEMI, coude = fond - CRETE_DEMI;
    const flanc = (xf, y0, y1) => {
      const n = Math.max(2, Math.ceil(Math.abs(y1 - y0) / 10));
      return Array.from({ length: n }, (_, i) => [xf, y0 + (y1 - y0) * i / n]);
    };
    const arc = Array.from({ length: 9 }, (_, i) => {
      const a = Math.PI - (i * Math.PI) / 8;
      return [x + CRETE_DEMI * Math.cos(a), coude + CRETE_DEMI * Math.sin(a)];
    });
    return [...flanc(g, plafond(g, INT), coude), ...arc, ...flanc(d, coude, plafond(d, INT)).slice(1), [d, plafond(d, INT)]];
  }

  // Deux chromosomes circulaires, sur le fond de la matrice.
  const ADN = [[250, 250, 26], [480, 252, 19]];

  /* ------------------------- figure 2 : le détail de la membrane interne */

  /*
   * Le bloc se lit sur sa face avant, en coordonnées de coupe (X vers la
   * droite, Y vers le bas) ; il fuit en profondeur sur PROFONDEUR unités.
   */
  const DETAIL = {
    gauche: 60, droite: 700,
    haut: 486, bas: 516,        // les deux feuillets de la membrane
    matrice: 396,               // le dessus du bloc
    ims: 580,                   // le dessous du bloc
  };
  DETAIL.allee = (DETAIL.bas + DETAIL.ims) / 2;   // l'allée des protons
  DETAIL.conduit = (DETAIL.haut + DETAIL.bas) / 2; // l'axe des électrons
  const PROFONDEUR = 70;

  const ECHELLE2 = 0.74;
  const P2 = projection(196, 566, ECHELLE2);
  /**
   * Un point de la figure 2 : (X, Y) sur la face avant, avancé de `avant`
   * unités vers l'observateur (négatif pour s'enfoncer dans le bloc).
   */
  const p2 = (X, Y, avant = 0) =>
    P2(X - DETAIL.gauche, PROFONDEUR + avant, DETAIL.ims - Y);

  // Le cartouche de renvoi part de ce segment de la membrane interne.
  const RENVOI = [300, 460];

  const COMPLEXES = [
    { nom: 'I',   x: 150, pompe: true },
    { nom: 'II',  x: 250, pompe: false },
    { nom: 'III', x: 350, pompe: true },
    { nom: 'IV',  x: 450, pompe: true },
  ];
  const POMPES = COMPLEXES.filter(c => c.pompe);
  const FUT = { r: 25, h: 54 };

  const SYNTHASE = { x: 592, r: 24, rTete: 36, yTete: 432 };

  /* ----------------------------------------------------------------- parties */

  /*
   * Les repères et leurs filets se donnent dans le repère de leur figure :
   * (X, Y, z) de la coupe pour la figure 1, (X, Y, avant) de la face avant pour
   * la figure 2. On les projette au moment de dessiner. Une pastille qui doit
   * se tenir hors du bloc se donne directement en coordonnées d'écran.
   */
  const PARTIES = [
    {
      id: 'externe',
      chiffre: 1,
      nom: 'Membrane externe',
      figure: 1, repere: [20, 200, 0], vers: [62, 200, 0],
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
      figure: 1, repere: [700, 20, 0], vers: [660, 120, SOL],
      resume: 'Le réservoir de protons qui fait tourner l’ATP synthase.',
      texte: `Un espace mince entre les deux membranes, où la chaîne respiratoire
        refoule les protons&nbsp;— c'est la flèche qui court vers la droite au bas de
        la figure&nbsp;2. Il y règne un pH plus acide que dans la matrice&nbsp;: c'est cette différence, le gradient électrochimique, qui
        stocke l'énergie. La lumière des crêtes en fait partie, et c'est pourquoi
        elle porte la même teinte. On y trouve aussi le cytochrome&nbsp;c, dont la
        libération vers le cytosol déclenche l'apoptose.`,
    },
    {
      id: 'interne',
      chiffre: 3,
      nom: 'Membrane interne',
      figure: 1, repere: [60, 330, 0], vers: [150, 265, SOL + CLOISON],
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
      figure: 1, repere: [200, -20, 0], vers: [240, 100, SOL + CLOISON],
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
      figure: 1, repere: [340, 254, SOL],
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
      figure: 1, repere: [570, 256, SOL], vers: [500, 254, SOL],
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
      figure: 1, repere: [162, 250, SOL],
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
      figure: 2, ecran: [240, 742], vers: [350, 528, FUT.r],
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
      figure: 2, ecran: [448, 806], vers: [592 + SYNTHASE.r, 500, SYNTHASE.r],
      resume: 'La turbine qui monnaie le gradient en ATP.',
      texte: `Les protons accumulés ne peuvent revenir que par elle. Leur reflux
        fait tourner le rotor, et chaque tour soude un phosphate sur l'ADP&nbsp;:
        c'est la <b class="font-semibold">chimiosmose</b> de Peter Mitchell. La
        planche compte trois protons par molécule d'ATP, ce qui est l'ordre de
        grandeur admis.`,
    },
  ];

  /** Un point de repère, projeté selon sa figure. */
  const ecran = (figure, [a, b, c = 0]) => (figure === 1 ? p1(a, b, c) : p2(a, b, c));

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
    if (dansCrete(x, y, 14)) continue;
    if (ADN.some(([ax, ay, r]) => Math.hypot(x - ax, y - ay) < r + 16)) continue;
    if (PARTIES.some(p => p.figure === 1
        && Math.hypot(x - p.repere[0], y - p.repere[1]) < 30)) continue;
    if (GRANULES.some(([gx, gy]) => Math.hypot(x - gx, y - gy) < 28)) continue;
    GRANULES.push([x, y]);
  }

  // Le repère des ribosomes pointe le granule le plus proche, plutôt qu'un vide.
  {
    const cle = PARTIES.find(p => p.id === 'ribosomes');
    const [cx, cy] = cle.repere;
    const proche = GRANULES.reduce((a, b) =>
      Math.hypot(cx - a[0], cy - a[1]) < Math.hypot(cx - b[0], cy - b[1]) ? a : b);
    if (proche) cle.vers = [proche[0] - Math.sign(proche[0] - cx) * 8, proche[1], SOL + 6];
  }

  /* ------------------------------------------------------- dessin, figure 1 */

  /** La gélule sous son bord : deux étages de parois qui s'arrondissent. */
  function dessinCorps() {
    const etages = [[1, 0], [0.985, -CORPS * 0.55], [0.9, -CORPS]].map(([k, z]) =>
      contour(EXT, 1.5, k).map(([X, Y]) => p1(X, Y, z)));
    const plan = contour(EXT, 1.5);
    const n = plan.length;
    const visible = i => {
      const [nx, ny] = normale(plan[i], plan[(i + 1) % n]);
      return nx + ny > 0 ? [nx, ny] : null;
    };
    const assombri = { gauche: 'droite', droite: 'ombre' };
    return bandes(etages[0], etages[1], 'filet', i => {
      const v = visible(i);
      return v && orientation(...v);
    }) + bandes(etages[1], etages[2], 'filet', i => {
      const v = visible(i);
      return v && assombri[orientation(...v)];
    });
  }

  /** Le bord de la membrane externe, et l'ouverture qu'il cerne. */
  const BORD = contour(EXT).map(([X, Y]) => p1(X, Y, 0));
  const OUVERTURE = contour(EXT_INT).map(([X, Y]) => p1(X, Y, 0));

  /** La paroi intérieure de la membrane externe, visible sur le bord du fond. */
  function dessinParoiInterieure() {
    const plan = contour(EXT_INT);
    const n = plan.length;
    return bandes(OUVERTURE, plan.map(([X, Y]) => p1(X, Y, SOL)), 'papier', i => {
      const [nx, ny] = normale(plan[i], plan[(i + 1) % n]);
      return -nx - ny > 0 ? orientation(-nx, -ny) : null;
    });
  }

  /**
   * Une cloison : un segment de mur dressé sur le fond, qu'on range parmi les
   * autres volumes selon sa profondeur. On en voit tantôt une face, tantôt
   * l'autre, selon qu'elle regarde l'observateur ou s'en détourne.
   */
  function cloison(a, b, partie) {
    let [nx, ny] = normale(a, b);
    if (nx + ny < 0) [nx, ny] = [-nx, -ny];
    const haut = SOL + CLOISON;
    const sommet = [p1(...a, haut), p1(...b, haut)];
    return {
      profondeur: (a[0] + b[0] + a[1] + b[1]) / 2 - 2 * CY,
      svg: `<g data-partie="${partie}" class="cloison">
        ${face([p1(...a), p1(...b), sommet[1], sommet[0]], 'papier', orientation(nx, ny))}
        <path class="trait arete-haute" d="${chemin(sommet, false)}"/>
      </g>`,
    };
  }

  function volumesDuFond() {
    const volumes = [];

    // La membrane interne, ouverte à l'embouchure de chaque crête.
    const interne = contour(INT, 2.5);
    interne.forEach((a, i) => {
      const b = interne[(i + 1) % interne.length];
      const xm = (a[0] + b[0]) / 2;
      if ((a[1] + b[1]) / 2 < CY && CRETES.some(c => Math.abs(xm - c.x) < CRETE_DEMI)) return;
      volumes.push(cloison(a, b, 'interne'));
    });

    for (const c of CRETES) {
      const u = creteU(c);
      for (let i = 0; i + 1 < u.length; i++) volumes.push(cloison(u[i], u[i + 1], 'cretes'));
    }

    // Un ribosome : une petite sphère posée sur le fond.
    const r = 6.5;
    for (const [X, Y] of GRANULES) {
      const [x, y] = p1(X, Y, SOL + r / 0.78);
      volumes.push({
        profondeur: X + Y - 2 * CY,
        svg: `<g data-partie="ribosomes">
          <ellipse class="ombre-portee" cx="${fixe(x + 2)}" cy="${fixe(y + r)}" rx="${fixe(r * 1.1)}" ry="${fixe(r * 0.45)}"/>
          <circle class="face t-filet f-droite" cx="${fixe(x)}" cy="${fixe(y)}" r="${r}"/>
          <circle class="face t-filet f-haut" cx="${fixe(x - 1.2)}" cy="${fixe(y - 1.2)}" r="${fixe(r * 0.72)}"/>
          <circle class="reflet" cx="${fixe(x - 2.4)}" cy="${fixe(y - 2.6)}" r="1.6"/>
        </g>`,
      });
    }

    return volumes.sort((a, b) => a.profondeur - b.profondeur).map(v => v.svg).join('');
  }

  /** Un chromosome circulaire, couché sur le fond. */
  function dessinAdn([X, Y, r]) {
    const anneau = rr => Array.from({ length: 48 }, (_, i) => {
      const a = (i * 2 * Math.PI) / 48;
      return p1(X + rr * Math.cos(a), Y + rr * Math.sin(a));
    });
    return `<path class="trait epais" d="${chemin(anneau(r))}"/>
            <path class="trait fin" d="${chemin(anneau(r - 6))}"/>`;
  }

  /** Le fond lui-même : l'espace intermembranaire, la matrice, la lumière des crêtes. */
  const fond = forme => chemin(contour(forme).map(([X, Y]) => p1(X, Y)));

  function lumiereCrete(c) {
    const u = creteU(c);
    const g = u[0], d = u[u.length - 1];
    return chemin([[g[0], g[1] - 6], ...u, [d[0], d[1] - 6]].map(([X, Y]) => p1(X, Y)));
  }

  /* ------------------------------------------------------- dessin, figure 2 */

  /** Une tranche horizontale du bloc, entre deux ordonnées de la face avant. */
  function tranche(y0, y1, teinte, dessus = false) {
    const { gauche: g, droite: d } = DETAIL;
    const avant = face([p2(g, y0), p2(d, y0), p2(d, y1), p2(g, y1)], teinte, 'gauche');
    const cote = face([p2(d, y0), p2(d, y0, -PROFONDEUR), p2(d, y1, -PROFONDEUR), p2(d, y1)],
                      teinte, 'droite');
    const toit = dessus
      ? face([p2(g, y0), p2(d, y0), p2(d, y0, -PROFONDEUR), p2(g, y0, -PROFONDEUR)], teinte, 'haut')
      : '';
    return avant + cote + toit;
  }

  /**
   * Un cylindre vertical dressé contre la face avant du bloc, son axe avancé
   * de `axe` unités. On n'en voit que le dessus et le flanc tourné vers
   * l'observateur — de -45° à 135°, coupé en deux teintes à 45°.
   */
  function cylindre(X, y0, y1, r, teinte, axe = r) {
    const arc = (Y, de, a) => Array.from({ length: 17 }, (_, i) => {
      const t = de + ((a - de) * i) / 16;
      return p2(X + r * Math.cos(t), Y, axe + r * Math.sin(t));
    });
    const flanc = (de, a, orient) =>
      face([...arc(y0, de, a), ...arc(y1, de, a).reverse()], teinte, orient);
    const q = Math.PI / 4;
    return flanc(-q, q, 'droite') + flanc(q, 3 * q, 'gauche')
         + face(arc(y0, -q, 7 * q), teinte, 'haut', 'arete');
  }

  /** Un complexe respiratoire : un fût qui traverse la membrane. */
  function futComplexe({ nom, x }) {
    const y0 = DETAIL.conduit - FUT.h / 2, y1 = DETAIL.conduit + FUT.h / 2;
    const [tx, ty] = p2(x, DETAIL.conduit + 4, FUT.r * 1.7);
    return cylindre(x, y0, y1, FUT.r, 'ombre')
         + `<text class="romain" x="${fixe(tx)}" y="${fixe(ty + 6)}">${nom}</text>`;
  }

  /** L'ATP synthase : un pied dans la membrane, une tige, une tête ronde. */
  function dessinSynthase() {
    const { x, r, rTete, yTete } = SYNTHASE;
    const y0 = DETAIL.conduit - FUT.h / 2, y1 = DETAIL.conduit + FUT.h / 2;
    const [cx, cy] = p2(x, yTete, r);
    const R = rTete * ECHELLE2;
    const branches = [0, 1, 2].map(i => {
      const a = (i * 2 * Math.PI) / 3 - Math.PI / 2;
      return `M${fixe(cx)},${fixe(cy)}L${fixe(cx + R * 0.62 * Math.cos(a))},${fixe(cy + R * 0.62 * Math.sin(a))}`;
    }).join('');
    return cylindre(x, y0, y1, r, 'ombre')
         + cylindre(x, yTete + rTete * 0.7, y0, 7, 'ombre', r)
         + `<circle class="face t-papier f-droite arete" cx="${fixe(cx)}" cy="${fixe(cy)}" r="${fixe(R)}"/>
            <circle class="face t-papier f-haut" cx="${fixe(cx - R * 0.13)}" cy="${fixe(cy - R * 0.13)}" r="${fixe(R * 0.8)}"/>
            <path class="trait epais" d="${branches}"/>`;
  }

  /**
   * Le circuit des protons, en flèches plutôt qu'en mouvement : ils sortent par
   * les trois pompes, gagnent la synthase sous la membrane, refluent au travers,
   * et l'ATP paraît dans la matrice. Les électrons, eux, sautent de complexe en
   * complexe dans l'épaisseur même de la membrane.
   *
   * Tout est tracé sur la face avant du bloc, ou dans le plan des axes des
   * fûts pour les traverser. Le circuit vit hors des groupes de parties : c'est
   * une annotation, non une pièce de l'organite, et il ne doit donc ni
   * s'éteindre ni se laisser cliquer.
   */
  function dessinCircuit() {
    const fleche = (classe, points) =>
      `<path class="fleche ${classe}" d="${chemin(points.map(([X, Y, av = 0]) => p2(X, Y, av)), false)}"/>`;
    const haut = DETAIL.haut - 34;
    const bas = DETAIL.allee + 2;
    const voie = DETAIL.allee + 10;

    // Trois descentes, au travers des fûts qui pompent.
    const descentes = POMPES.map(p =>
      fleche('circuit-proton', [[p.x, haut, FUT.r], [p.x, bas, FUT.r]])).join('');

    // La dérive sous la membrane et le reflux par la synthase ne font qu'un coude.
    const coude = fleche('circuit-proton', [
      [POMPES[0].x + 30, voie], [SYNTHASE.x, voie],
      [SYNTHASE.x, SYNTHASE.yTete + SYNTHASE.rTete + 6],
    ]);
    const sortie = fleche('circuit-proton', [
      [SYNTHASE.x + SYNTHASE.rTete + 4, SYNTHASE.yTete - 4, SYNTHASE.r],
      [SYNTHASE.x + SYNTHASE.rTete + 34, SYNTHASE.yTete - 24, SYNTHASE.r],
    ]);

    // Les sauts d'électrons, dans les intervalles entre complexes.
    const intervalles = COMPLEXES.slice(0, -1).map((c, i) => [
      c.x + 10, COMPLEXES[i + 1].x - 34,
    ]);
    const sauts = intervalles.map(([a, b]) =>
      fleche('circuit-electron', [[a, DETAIL.conduit], [b, DETAIL.conduit]])).join('');
    const [a0, b0] = intervalles[0];

    const texte = (classe, X, Y, av, contenu) => {
      const [x, y] = p2(X, Y, av);
      return `<text class="${classe}" x="${fixe(x)}" y="${fixe(y)}">${contenu}</text>`;
    };
    return `<g class="circuit">
      ${descentes}${coude}${sortie}${sauts}
      ${texte('formule', SYNTHASE.x - 60, voie - 6, 0, 'H⁺')}
      ${texte('formule', SYNTHASE.x + SYNTHASE.rTete + 56, SYNTHASE.yTete - 30, SYNTHASE.r, 'ATP')}
      ${texte('formule sobre', (a0 + b0) / 2, DETAIL.haut - 10, 0, 'e⁻')}
    </g>`;
  }

  /** Une étiquette couchée sur la face avant du bloc. */
  function etiquette(X, Y, contenu) {
    const [x, y] = p2(X, Y);
    return `<text class="etiquette" transform="matrix(${fixe(COS30)} 0.5 0 1 ${fixe(x)} ${fixe(y)})">${contenu}</text>`;
  }

  /** Repère chiffré : une pastille, et son filet de renvoi. */
  function dessinRepere({ chiffre, figure, repere, vers, ecran: pose }) {
    const [x, y] = pose ?? ecran(figure, repere);
    const filet = vers
      ? `<path class="renvoi" d="${chemin([[x, y], ecran(figure, vers)], false)}"/>
         <circle class="renvoi-point" cx="${fixe(ecran(figure, vers)[0])}" cy="${fixe(ecran(figure, vers)[1])}" r="2.2"/>`
      : '';
    return `${filet}
      <circle class="pastille" cx="${fixe(x)}" cy="${fixe(y)}" r="12"/>
      <text class="chiffre" x="${fixe(x)}" y="${fixe(y + 5)}">${chiffre}</text>`;
  }

  const pointes = () => [['proton', 'encre-rubrique'], ['electron', 'encre-noire']].map(([nom, encre]) => `
    <marker id="pointe-${nom}" viewBox="0 0 10 10" refX="8.5" refY="5"
            markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
      <path class="${encre}" d="M0.5,1L9,5L0.5,9Z" stroke="none"/>
    </marker>`).join('');

  // Le segment de membrane que la figure 2 agrandit, et les arêtes du bloc où
  // aboutit le cartouche.
  const segmentRenvoi = [];
  for (let X = RENVOI[0]; X <= RENVOI[1]; X += 8) segmentRenvoi.push(p1(X, plancher(X, INT)));
  const coinsBloc = [p2(DETAIL.gauche, DETAIL.matrice), p2(DETAIL.droite, DETAIL.matrice, -PROFONDEUR)];

  const svg = `
<svg class="planche" viewBox="0 0 ${CADRE.l} ${CADRE.h}" role="img"
     aria-label="Planche en deux figures, en perspective isométrique. Figure 1,
     l’organite ouvert par le dessus : le bord de la membrane externe, l’espace
     intermembranaire, la membrane interne dressée en cloison et repliée en sept
     crêtes, et le fond de la matrice où reposent deux chromosomes circulaires et
     des ribosomes. Figure 2, un bloc de membrane interne agrandi : les quatre
     complexes de la chaîne respiratoire, puis l’ATP synthase. Des flèches y tracent
     le circuit des protons : refoulés sous la membrane par les complexes, ils
     gagnent l’ATP synthase, refluent au travers, et l’ATP paraît dans la matrice.">
  <defs>
    ${pointes()}
    <clipPath id="ouverture"><path d="${chemin(OUVERTURE)}"/></clipPath>
  </defs>

  <!-- ------------------------------- cartouche de renvoi vers la figure 2 -->

  <path class="cartouche" d="${chemin([segmentRenvoi[0], coinsBloc[0]], false)}
                             ${chemin([segmentRenvoi.at(-1), coinsBloc[1]], false)}"/>

  <!-- ------------------------------------------- figure 1 : l'organite -->

  <g data-partie="externe">
    ${dessinCorps()}
    <path class="face t-papier f-haut arete" fill-rule="evenodd"
          d="${chemin(BORD)}${chemin(OUVERTURE)}"/>
  </g>

  <g clip-path="url(#ouverture)">
    <g data-partie="externe">${dessinParoiInterieure()}</g>
    <g data-partie="intermembranaire">
      <path class="face t-ombre f-haut" d="${fond(EXT_INT)}"/>
    </g>
    <g data-partie="matrice">
      <path class="face t-rose f-haut" d="${fond(INT)}"/>
    </g>
    <g data-partie="cretes">
      ${CRETES.map(c => `<path class="face t-ombre f-haut" d="${lumiereCrete(c)}"/>`).join('')}
    </g>
    <g data-partie="adn">${ADN.map(dessinAdn).join('')}</g>
    ${volumesDuFond()}
    <path class="cartouche" d="${chemin(segmentRenvoi, false)}"/>
  </g>

  <!-- ------------------------------- figure 2 : le bloc de membrane -->

  <g data-partie="intermembranaire">
    ${tranche(DETAIL.bas, DETAIL.ims, 'ombre')}
  </g>

  <g data-partie="interne">
    ${tranche(DETAIL.haut, DETAIL.haut + 7, 'papier')}
    ${tranche(DETAIL.haut + 7, DETAIL.bas - 7, 'filet')}
    ${tranche(DETAIL.bas - 7, DETAIL.bas, 'papier')}
  </g>

  <g data-partie="matrice">
    ${tranche(DETAIL.matrice, DETAIL.haut, 'rose', true)}
  </g>

  <path class="arete-bloc" d="${chemin([
    p2(DETAIL.gauche, DETAIL.ims), p2(DETAIL.gauche, DETAIL.matrice),
    p2(DETAIL.gauche, DETAIL.matrice, -PROFONDEUR), p2(DETAIL.droite, DETAIL.matrice, -PROFONDEUR),
    p2(DETAIL.droite, DETAIL.ims, -PROFONDEUR), p2(DETAIL.droite, DETAIL.ims),
  ])}M${chemin([p2(DETAIL.gauche, DETAIL.matrice), p2(DETAIL.droite, DETAIL.matrice),
               p2(DETAIL.droite, DETAIL.ims)], false).slice(1)}
     M${chemin([p2(DETAIL.droite, DETAIL.matrice), p2(DETAIL.droite, DETAIL.matrice, -PROFONDEUR)], false).slice(1)}"/>

  ${etiquette(DETAIL.gauche + 12, DETAIL.matrice + 24, 'Matrice')}
  ${etiquette(DETAIL.gauche + 4, DETAIL.ims + 22, 'Espace intermembranaire')}

  <g data-partie="chaine">
    ${COMPLEXES.map(futComplexe).join('')}
  </g>

  <g data-partie="synthase">
    ${dessinSynthase()}
  </g>

  ${dessinCircuit()}

  <text class="annotation" x="40" y="36">Fig. 1</text>
  <text class="annotation" x="40" y="${fixe(coinsBloc[0][1] - 40)}">Fig. 2</text>

  ${PARTIES.map(p => `<g data-partie="${p.id}" class="cle">${dessinRepere(p)}</g>`).join('')}
</svg>`;

  hote.innerHTML = svg;

  const planche = hote.querySelector('svg');
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
