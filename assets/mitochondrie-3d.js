/**
 * Schéma 3D interactif d'une mitochondrie.
 *
 * Trois.js en build global (r128). Les contrôles orbitaux sont écrits à la main
 * plutôt qu'importés : cela évite une seconde dépendance pour une quarantaine
 * de lignes, et le survol au doigt reste gérable.
 *
 * Les parties cliquables sont déclarées dans PARTIES ; chaque entrée construit
 * sa géométrie et porte le texte affiché dans le panneau latéral. La légende
 * HTML est générée à partir de la même liste, si bien qu'on peut tout parcourir
 * au clavier sans jamais viser un pixel dans la scène.
 */
(() => {
  const hote = document.getElementById('scene');
  const panneau = document.getElementById('panneau');
  const legende = document.getElementById('legende');
  if (!hote) return;

  /* ------------------------------------------------------------------ données */

  const PARTIES = [
    {
      id: 'externe',
      nom: 'Membrane externe',
      couleur: 0x8fb8d8,
      resume: 'Une double couche lipidique perméable, criblée de porines.',
      texte: `Elle délimite l'organite et le sépare du cytosol. Ses porines laissent
        passer librement ions et petites molécules jusqu'à environ 5 000 daltons,
        si bien que l'espace intermembranaire a une composition proche de celle
        du cytosol. C'est aussi par elle que transitent les protéines
        mitochondriales fabriquées dans la cellule, via le complexe TOM.`,
    },
    {
      id: 'intermembranaire',
      nom: 'Espace intermembranaire',
      couleur: 0xe8c48a,
      resume: 'Le réservoir de protons qui fait tourner l’ATP synthase.',
      texte: `Un espace mince entre les deux membranes, où la chaîne respiratoire
        refoule les protons. Il y règne un pH plus acide que dans la matrice&nbsp;:
        c'est cette différence, le gradient électrochimique, qui stocke l'énergie.
        On y trouve aussi le cytochrome&nbsp;c, dont la libération vers le cytosol
        déclenche l'apoptose.`,
    },
    {
      id: 'interne',
      nom: 'Membrane interne',
      couleur: 0xd98c4a,
      resume: 'Imperméable, repliée, couverte de complexes respiratoires.',
      texte: `Riche en cardiolipide, elle est quasiment étanche&nbsp;: rien ne la
        traverse sans transporteur dédié. Elle porte les quatre complexes de la
        chaîne respiratoire et l'ATP synthase (complexe&nbsp;V), qui fabrique
        l'ATP en laissant les protons refluer vers la matrice.`,
    },
    {
      id: 'cretes',
      nom: 'Crêtes',
      couleur: 0xe8a765,
      resume: 'Les replis qui multiplient la surface utile.',
      texte: `Les crêtes (ou <i>cristae</i>) sont les invaginations de la membrane
        interne. Elles peuvent multiplier sa surface par cinq, et les cellules les
        plus gourmandes en énergie — muscle cardiaque, neurones — en possèdent les
        plus denses. Leur forme n'est pas figée&nbsp;: elle se remodèle selon
        l'état métabolique de la cellule.`,
    },
    {
      id: 'matrice',
      nom: 'Matrice',
      couleur: 0xf0d9b5,
      resume: 'Le compartiment enzymatique, siège du cycle de Krebs.',
      texte: `Un gel dense en enzymes où se déroulent le cycle de Krebs, la
        β-oxydation des acides gras et une partie du cycle de l'urée. C'est là que
        sont produits le NADH et le FADH₂ qui alimenteront la chaîne respiratoire,
        et là que baignent l'ADN et les ribosomes de l'organite.`,
    },
    {
      id: 'adn',
      nom: 'ADN mitochondrial',
      couleur: 0x6fae8f,
      resume: 'Un chromosome circulaire, transmis par la mère.',
      texte: `Chez l'humain, une molécule circulaire de 16&nbsp;569 paires de bases
        portant 37 gènes&nbsp;: 13 protéines de la chaîne respiratoire, 22 ARN de
        transfert, 2 ARN ribosomiques. Présent en dizaines de copies par
        organite, il est hérité presque exclusivement de la mère, ce qui en fait
        un marqueur de généalogie maternelle.`,
    },
    {
      id: 'ribosomes',
      nom: 'Ribosomes',
      couleur: 0xb08cc4,
      resume: 'Une machinerie de traduction propre à l’organite.',
      texte: `Les mitoribosomes traduisent sur place les 13 protéines codées par
        l'ADN mitochondrial. Plus proches des ribosomes bactériens que de ceux du
        cytosol, ils sont sensibles à certains antibiotiques — un indice de plus
        de l'origine bactérienne de l'organite.`,
    },
  ];

  /* ------------------------------------------------------- garde-fou matériel */

  if (!window.THREE) {
    hote.innerHTML = `<p class="repli">Le schéma 3D n’a pas pu être chargé.
      Les descriptions ci-dessous restent lisibles.</p>`;
    construireLegende(null);
    return;
  }

  /* ------------------------------------------------------------------- scène */

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  const rendu = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  rendu.setPixelRatio(Math.min(devicePixelRatio, 2));
  hote.append(rendu.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const cle = new THREE.DirectionalLight(0xfff2e0, 0.85);
  cle.position.set(4, 5, 6);
  scene.add(cle);
  const appoint = new THREE.DirectionalLight(0x9fc4e8, 0.35);
  appoint.position.set(-5, -2, -4);
  scene.add(appoint);

  const organite = new THREE.Group();
  scene.add(organite);

  /** Rayon de l'ellipsoïde de référence, pour poser les éléments internes. */
  const RX = 2.3, RY = 1.15, RZ = 1.15;

  const maillages = new Map();   // id -> Mesh|Group
  const materiaux = new Map();   // id -> [Material]

  function enregistrer(partie, objet, mats) {
    objet.userData.partieId = partie.id;
    objet.traverse(n => { n.userData.partieId = partie.id; });
    maillages.set(partie.id, objet);
    materiaux.set(partie.id, mats);
    organite.add(objet);
  }

  function matiere(couleur, opacite, options = {}) {
    return new THREE.MeshStandardMaterial({
      color: couleur,
      roughness: 0.55,
      metalness: 0.05,
      transparent: opacite < 1,
      opacity: opacite,
      ...options,
    });
  }

  // Membrane externe — enveloppe translucide, visible de l'intérieur aussi.
  {
    const geo = new THREE.SphereGeometry(1, 64, 48);
    const mesh = new THREE.Mesh(geo, matiere(0x8fb8d8, 0.22, {
      side: THREE.DoubleSide, depthWrite: false, roughness: 0.25,
    }));
    mesh.scale.set(RX, RY, RZ);
    enregistrer(PARTIES[0], mesh, [mesh.material]);
  }

  // Espace intermembranaire — une coquille fine, juste sous la précédente.
  {
    const geo = new THREE.SphereGeometry(1, 48, 36);
    const mesh = new THREE.Mesh(geo, matiere(0xe8c48a, 0.16, {
      side: THREE.DoubleSide, depthWrite: false,
    }));
    mesh.scale.set(RX * 0.94, RY * 0.9, RZ * 0.9);
    enregistrer(PARTIES[1], mesh, [mesh.material]);
  }

  // Membrane interne.
  {
    const geo = new THREE.SphereGeometry(1, 48, 36);
    const mesh = new THREE.Mesh(geo, matiere(0xd98c4a, 0.38, {
      side: THREE.DoubleSide, depthWrite: false,
    }));
    mesh.scale.set(RX * 0.86, RY * 0.8, RZ * 0.8);
    enregistrer(PARTIES[2], mesh, [mesh.material]);
  }

  // Crêtes — des replis en forme d'étagères, posés le long du grand axe.
  {
    const groupe = new THREE.Group();
    const mats = [];
    const nombre = 9;

    for (let i = 0; i < nombre; i++) {
      const t = (i + 0.5) / nombre;              // 0 → 1 le long de l'axe x
      const x = (t * 2 - 1) * RX * 0.74;
      const profil = Math.sqrt(Math.max(0, 1 - (x / (RX * 0.86)) ** 2));
      const rayon = RY * 0.78 * profil;
      if (rayon < 0.12) continue;

      // Un tore aplati lu de profil donne la silhouette d'un repli membranaire.
      const geo = new THREE.TorusGeometry(rayon * 0.82, rayon * 0.2, 10, 48);
      const mat = matiere(0xe8a765, 0.92, { roughness: 0.45 });
      const crete = new THREE.Mesh(geo, mat);
      crete.rotation.y = Math.PI / 2;
      crete.rotation.x = (i % 2 ? 1 : -1) * 0.14;
      crete.position.x = x;
      crete.scale.z = 0.42;                      // aplatissement
      groupe.add(crete);
      mats.push(mat);
    }
    enregistrer(PARTIES[3], groupe, mats);
  }

  // Matrice — un volume diffus qui remplit l'intérieur.
  {
    const geo = new THREE.SphereGeometry(1, 32, 24);
    const mesh = new THREE.Mesh(geo, matiere(0xf0d9b5, 0.14, { depthWrite: false }));
    mesh.scale.set(RX * 0.8, RY * 0.74, RZ * 0.74);
    enregistrer(PARTIES[4], mesh, [mesh.material]);
  }

  // ADN mitochondrial — deux boucles circulaires dans la matrice.
  {
    const groupe = new THREE.Group();
    const mats = [];
    [[-0.55, 0.22, 0.2, 0.34], [0.78, -0.26, -0.18, 0.26]].forEach(([x, y, z, r], i) => {
      const geo = new THREE.TorusKnotGeometry(r, r * 0.17, 72, 8, 1, 3);
      const mat = matiere(0x6fae8f, 1, { roughness: 0.4 });
      const boucle = new THREE.Mesh(geo, mat);
      boucle.position.set(x, y, z);
      boucle.rotation.set(0.6 * i, 0.9 * i, 0.3);
      groupe.add(boucle);
      mats.push(mat);
    });
    enregistrer(PARTIES[5], groupe, mats);
  }

  // Ribosomes — un semis de granules.
  {
    const groupe = new THREE.Group();
    const geo = new THREE.SphereGeometry(0.055, 12, 10);
    const mat = matiere(0xb08cc4, 1, { roughness: 0.5 });
    let graine = 7;
    const aleatoire = () => (graine = (graine * 16807) % 2147483647) / 2147483647;

    for (let i = 0; i < 46; i++) {
      const granule = new THREE.Mesh(geo, mat);
      granule.position.set(
        (aleatoire() * 2 - 1) * RX * 0.72,
        (aleatoire() * 2 - 1) * RY * 0.6,
        (aleatoire() * 2 - 1) * RZ * 0.6);
      groupe.add(granule);
    }
    enregistrer(PARTIES[6], groupe, [mat]);
  }

  /* ------------------------------------------------- mise en avant / panneau */

  const opaciteInitiale = new Map();
  for (const [id, mats] of materiaux) opaciteInitiale.set(id, mats.map(m => m.opacity));

  let actif = null;
  let coupe = false;

  function appliquerStyles() {
    for (const [id, mats] of materiaux) {
      const base = opaciteInitiale.get(id);
      const estActif = id === actif;
      const masque = coupe && (id === 'externe' || id === 'intermembranaire');

      mats.forEach((mat, i) => {
        const depart = base[i];
        let opacite = depart;
        if (masque) opacite = depart * 0.12;
        else if (actif && !estActif) opacite = depart * 0.35;
        else if (estActif) opacite = Math.min(1, depart * 1.8);

        mat.opacity = opacite;
        mat.transparent = opacite < 1;
        mat.emissive.setHex(estActif ? 0x3a2a12 : 0x000000);
      });
    }

    for (const bouton of legende.querySelectorAll('button')) {
      bouton.setAttribute('aria-pressed', String(bouton.dataset.id === actif));
    }
  }

  function selectionner(id) {
    actif = id && id !== actif ? id : null;
    const partie = PARTIES.find(p => p.id === actif);

    if (!partie) {
      panneau.innerHTML = `<p class="invite">Fais tourner le schéma, puis clique
        une zone — ou choisis une entrée de la légende — pour la description.</p>`;
    } else {
      panneau.innerHTML = `<h3>${partie.nom}</h3><p>${partie.texte}</p>`;
    }
    appliquerStyles();
  }

  function construireLegende(interactive) {
    legende.replaceChildren(...PARTIES.map(partie => {
      const li = document.createElement('li');
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.dataset.id = partie.id;
      bouton.setAttribute('aria-pressed', 'false');
      bouton.innerHTML =
        `<span class="puce" style="--c:#${partie.couleur.toString(16).padStart(6, '0')}"></span>
         <span class="nom">${partie.nom}</span>
         <span class="resume">${partie.resume}</span>`;
      if (interactive !== null) bouton.addEventListener('click', () => selectionner(partie.id));
      li.append(bouton);
      return li;
    }));
  }

  construireLegende(true);
  selectionner(null);

  /* --------------------------------------------------------------- contrôles */

  let azimut = 0.6, elevation = 0.42, distance = 7.2;
  let rotationAuto = !matchMedia('(prefers-reduced-motion: reduce)').matches;

  function placerCamera() {
    const d = Math.max(4, Math.min(14, distance));
    camera.position.set(
      d * Math.cos(elevation) * Math.sin(azimut),
      d * Math.sin(elevation),
      d * Math.cos(elevation) * Math.cos(azimut));
    camera.lookAt(0, 0, 0);
  }

  let pointeur = null;
  let deplacement = 0;

  rendu.domElement.addEventListener('pointerdown', event => {
    pointeur = { x: event.clientX, y: event.clientY, id: event.pointerId };
    deplacement = 0;
    rendu.domElement.setPointerCapture(event.pointerId);
    rotationAuto = false;
  });

  rendu.domElement.addEventListener('pointermove', event => {
    if (!pointeur || event.pointerId !== pointeur.id) return;
    const dx = event.clientX - pointeur.x;
    const dy = event.clientY - pointeur.y;
    deplacement += Math.abs(dx) + Math.abs(dy);
    azimut -= dx * 0.006;
    elevation = Math.max(-1.3, Math.min(1.3, elevation + dy * 0.006));
    pointeur.x = event.clientX;
    pointeur.y = event.clientY;
    placerCamera();
  });

  rendu.domElement.addEventListener('pointerup', event => {
    if (!pointeur) return;
    // Un geste court est un clic ; au-delà, c'était une rotation.
    if (deplacement < 6) viser(event);
    pointeur = null;
  });

  rendu.domElement.addEventListener('wheel', event => {
    event.preventDefault();
    distance += event.deltaY * 0.004;
    placerCamera();
  }, { passive: false });

  const rayon = new THREE.Raycaster();
  const cible = new THREE.Vector2();

  function viser(event) {
    const cadre = rendu.domElement.getBoundingClientRect();
    cible.x = ((event.clientX - cadre.left) / cadre.width) * 2 - 1;
    cible.y = -((event.clientY - cadre.top) / cadre.height) * 2 + 1;
    rayon.setFromCamera(cible, camera);

    const touches = rayon.intersectObjects(organite.children, true)
      .filter(t => {
        const id = t.object.userData.partieId;
        return !(coupe && (id === 'externe' || id === 'intermembranaire'));
      });

    selectionner(touches.length ? touches[0].object.userData.partieId : null);
  }

  document.getElementById('coupe').addEventListener('click', event => {
    coupe = !coupe;
    event.currentTarget.setAttribute('aria-pressed', String(coupe));
    event.currentTarget.textContent = coupe ? 'Refermer la membrane' : 'Vue en coupe';
    appliquerStyles();
  });

  document.getElementById('tourner').addEventListener('click', event => {
    rotationAuto = !rotationAuto;
    event.currentTarget.setAttribute('aria-pressed', String(rotationAuto));
  });

  document.getElementById('recadrer').addEventListener('click', () => {
    azimut = 0.6; elevation = 0.42; distance = 7.2;
    placerCamera();
    selectionner(null);
  });

  /* ------------------------------------------------------- boucle et cadrage */

  function dimensionner() {
    const l = hote.clientWidth;
    const h = hote.clientHeight;
    if (!l || !h) return;
    rendu.setSize(l, h, false);
    camera.aspect = l / h;
    camera.updateProjectionMatrix();
  }

  new ResizeObserver(dimensionner).observe(hote);
  dimensionner();
  placerCamera();

  let visible = true;
  new IntersectionObserver(([entree]) => { visible = entree.isIntersecting; })
    .observe(hote);

  function animer() {
    if (visible) {
      if (rotationAuto) {
        azimut += 0.0022;
        placerCamera();
      }
      rendu.render(scene, camera);
    }
    requestAnimationFrame(animer);
  }
  animer();
})();
