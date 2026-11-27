import { auth, db, storage } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  runTransaction,
  deleteField,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref,
  uploadString,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

(() => {
  const previewParams = new URLSearchParams(window.location.search);
  const isFeedbackPreview = previewParams.get("feedback-preview") === "1";

  const STUDY_SUBJECTS = {
    "1r Curs": [
      "Fonaments del disseny gràfic",
      "Llenguatge cinematogràfic",
      "Teoria i anàlisi de la imatge",
      "Disseny i creació del so digital",
      "Estètica i teoria de l'art",
      "Fonaments de la multimèdia",
      "Fotografia",
      "Operativa de càmera i il·luminació",
      "Projecte audiovisual I",
      "Tecnologia audiovisual i del so",
      "Teoria i tècnica del muntatge"
    ],
    "2n Curs": [
      "Cultura i pensament",
      "Llenguatges contemporanis",
      "Metodologies i tècniques creatives",
      "Producció audiovisual i multimèdia",
      "Projecte creatiu",
      "3D I",
      "Projectes de disseny gràfic",
      "Sociologia i teoria de la comunicació",
      "Tecnologies multimèdia"
    ],
    "3r Curs": [
      "Creació d'empreses",
      "Direcció de projectes transmèdia",
      "Estructures i dispositius narratius",
      "Guió videogràfic",
      "Màrqueting",
      "Taller de generació d'idees",
      "Assignatures optatives"
    ],
    "4t Curs (TFG)": [
      "Pràctiques",
      "Projecte transmèdia: Eines",
      "Projecte transmèdia: Expressió",
      "Projecte transmèdia: Idea",
      "Treball final de grau (TFG)",
      "Reconeixement acadèmic",
      "Assignatures optatives"
    ]
  };

  const OPTIONAL_SUBJECTS = [
    "3D II",
    "3D III",
    "Direcció audiovisual",
    "Direcció d'actors",
    "Direcció d'art",
    "Direcció de fotografia",
    "Disseny audiovisual",
    "Disseny del so",
    "Disseny interactiu",
    "Edició de vídeo",
    "Escena per l'audiovisual",
    "Fotografia creativa",
    "Il·lustració",
    "Projecte audiovisual II",
    "Projectes de disseny gràfic II",
    "Realitat immersiva",
    "Redacció i desenvolupament del guió",
    "Seminaris complementaris",
    "Tecnologies creatives",
    "Tecnologies multimèdia II"
  ];

  const SUBJECT_GROUPS = [
    { label: "1r Curs", subjects: STUDY_SUBJECTS["1r Curs"] },
    { label: "2n Curs", subjects: STUDY_SUBJECTS["2n Curs"] },
    {
      label: "3r Curs",
      subjects: STUDY_SUBJECTS["3r Curs"].filter((subject) => subject !== "Assignatures optatives")
    },
    {
      label: "4t Curs (TFG)",
      subjects: STUDY_SUBJECTS["4t Curs (TFG)"].filter((subject) => subject !== "Assignatures optatives")
    },
    { label: "Optatives", subjects: ["Assignatures optatives", ...OPTIONAL_SUBJECTS] }
  ];

  const ALL_STUDY_SUBJECTS = [
    ...new Set([
      ...Object.values(STUDY_SUBJECTS).flat(),
      ...OPTIONAL_SUBJECTS
    ])
  ];

  const REGISTRATION_PROGRAMS = {
    GCAM: {
      label: "GCAM · Grau en Comunicació Audiovisual i Multimèdia",
      shortName: "Grau en Comunicació Audiovisual i Multimèdia",
      years: {
        "1r Curs": STUDY_SUBJECTS["1r Curs"],
        "2n Curs": STUDY_SUBJECTS["2n Curs"],
        "3r Curs": STUDY_SUBJECTS["3r Curs"].filter((s) => s !== "Assignatures optatives"),
        "4t Curs (TFG)": STUDY_SUBJECTS["4t Curs (TFG)"].filter((s) => s !== "Assignatures optatives")
      },
      electives: OPTIONAL_SUBJECTS
    },
    DCAM: {
      label: "DCAM · Degree in Audiovisual and Multimedia Communication",
      shortName: "Degree in Audiovisual and Multimedia Communication",
      years: {
        "1r Curs": [
          "Fundamentals of Graphic Design",
          "Cinematic Language",
          "Theory and Image Analysis",
          "Design and Creation of Digital Sound",
          "Aesthetics and Art Theory",
          "Multimedia Fundamentals",
          "Photography",
          "Camera Operation and Lighting",
          "Audiovisual Project I",
          "Audiovisual and Sound Technology",
          "Montage Theory and Techniques"
        ],
        "2n Curs": [
          "Culture and Thought",
          "Contemporary Languages",
          "Methodologies and Creative Techniques",
          "Audiovisual and Multimedia Production",
          "Creative Project",
          "3D I",
          "Graphic Design Projects",
          "Sociology and Communication Theory",
          "Multimedia Technologies"
        ],
        "3r Curs": [
          "Business Creation",
          "Transmedia Project Management",
          "Narrative Structures and Devices",
          "Videographic Script",
          "Marketing",
          "Idea Generation Workshop"
        ],
        "4t Curs (TFG)": [
          "Internship",
          "Transmedia Project: Tools",
          "Transmedia Project: Expression",
          "Transmedia Project: Idea",
          "Final Degree Project",
          "Academic Recognition"
        ]
      },
      electives: [
        "3D II",
        "Audiovisual Direction",
        "Audiovisual Design",
        "Sound Design",
        "Interactive Design",
        "Video Editing",
        "Audiovisual Project II",
        "Immersive Reality",
        "Script Writing and Development",
        "Complementary Seminars",
        "Creative Technologies",
        "Multimedia Technologies II",
        "3D III",
        "Acting Direction",
        "Art Direction",
        "Photography Direction",
        "Creative Photography",
        "Illustration",
        "Scene for Audiovisual",
        "Graphic Design Projects II",
        "Graphic Project Methodology"
      ]
    },
    GAE: {
      label: "GAE · Grau en Arts Escèniques",
      shortName: "Grau en Arts Escèniques",
      years: {
        "1r Curs": [
          "Literatura dramàtica I",
          "Teories dramàtiques I",
          "Reproducció del comportament humà",
          "Tècniques d'interpretació: Veu i cant",
          "Àmbit de creació I",
          "Tècniques d'interpretació de dansa",
          "Tècniques d'interpretació dels llenguatges corporals"
        ],
        "2n Curs": [
          "Bases de l'escenotècnia (Escenografia)",
          "Dramatúrgia teatral (Escriptura teatral)",
          "Literatura dramàtica II",
          "Teories dramàtiques II",
          "Àmbit de creació II",
          "Àmbit de creació III",
          "Expressions de la cultura contemporània"
        ],
        "3r Curs": [
          "Àmbit de creació IV: creació audiovisual",
          "Dramatúrgia audiovisual",
          "Tecnologies emergents aplicades a l'escenotècnia"
        ],
        "4t Curs (TFG)": [
          "Gestió i produccions teatrals",
          "Seminaris complementaris",
          "Pràctiques",
          "Treball final de grau",
          "Reconeixement acadèmic"
        ]
      },
      electives: [
        "Arts del circ",
        "Arts escèniques aplicades",
        "Direcció d'actors",
        "Direcció escènica: Metodologia i desenvolupament del projecte",
        "Escena en espais públics",
        "Interpretació escènica: comportament humà",
        "Interpretació escènica: llenguatge corporal",
        "Interpretació escènica: veu II",
        "Dicció",
        "Teatre d'objectes i titelles",
        "Direcció d'art",
        "Redacció i desenvolupament del guió",
        "Interpretació avançada davant de la càmera",
        "Interpretació escènica: dansa II",
        "Vestuari d'escena"
      ]
    },
    MODA: {
      label: "MODA · Grau en Moda",
      shortName: "Grau en Moda",
      years: {
        "1r Curs": [
          "Dibuix de representació",
          "Conceptes i fonaments del disseny gràfic",
          "Creació de bases i prototips",
          "Estètica i teoria de l'art",
          "Història de la moda",
          "Llenguatges contemporanis",
          "Iniciació al patronatge: de 3D a 2D",
          "Projecte de moda I",
          "Tècniques manuals i digitals de patronatge"
        ],
        "2n Curs": [
          "Cultura i pensament",
          "Metodologies i tècniques creatives",
          "Matèries tèxtils",
          "Optimització de processos de producció",
          "Projecte de moda II",
          "Projectes de disseny I",
          "Projectes de patronatge manual i digital"
        ],
        "3r Curs": [
          "Innovació en confecció",
          "Investigació en patronatge",
          "Màrqueting i comunicació de moda",
          "Projectes de disseny II",
          "Projecte de moda III",
          "Taller de generació d'idees",
          "Tèxtil i tecnologia"
        ],
        "4t Curs (TFG)": [
          "Gestió, producció i models de negoci",
          "Pràctiques en empresa",
          "Tendències, estilisme i crítica del sector",
          "Treball de final de grau",
          "Reconeixement acadèmic"
        ]
      },
      electives: [
        "Confecció artesanal",
        "Ecodisseny",
        "Art tèxtil",
        "Creació d'empreses",
        "Disseny d'estampació",
        "Producció d'esdeveniments de moda",
        "Vestuari d'escena",
        "Comunicació transmèdia per a moda",
        "Portafoli de moda",
        "Seminaris complementaris"
      ]
    }
  };

  const COMMENT_REWARDS = Object.freeze({ first: 15, second: 10, third: 7, subsequent: 5 });

  const daysFromNow = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  };

  // =========================================================================
  // 1. DADES INICIALS DE MOSTRA (Es carreguen al núvol si la BD és buida)
  // =========================================================================
  const INITIAL_STATE = {
    currentUserId: "stu-1",
    students: [
      {
        id: "stu-1",
        name: "Laia Puig",
        email: "laia.puig@campus.eram.cat",
        year: "3r Curs",
        avatarColor: "#7c6ee6",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        bio: "Direcció de fotografia i etalonatge digital. Apassionada pel cinema documental i la narrativa visual.",
        interests: ["Cinematografia", "Etalonatge", "Documental"],
        points: 148,
        projectsCount: 3,
        commentsCount: 14,
        usefulCommentsCount: 8,
        secondedCount: 19
      },
      {
        id: "stu-2",
        name: "Pol Vila",
        email: "pol.vila@campus.eram.cat",
        year: "4t Curs (TFG)",
        avatarColor: "#d67a7a",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        bio: "Disseny d'interfícies interactives, instal·lacions multimèdia i direcció d'art digital.",
        interests: ["UI/UX", "Creative Coding", "Motion"],
        points: 215,
        projectsCount: 4,
        commentsCount: 22,
        usefulCommentsCount: 14,
        secondedCount: 31
      },
      {
        id: "stu-3",
        name: "Clara Mas",
        email: "clara.mas@campus.eram.cat",
        year: "2n Curs",
        avatarColor: "#4e9c82",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
        bio: "Disseny gràfic editorial, tipografia experimental i identitat visual per a projectes culturals.",
        interests: ["Tipografia", "Editorial", "Branding"],
        points: 86,
        projectsCount: 2,
        commentsCount: 9,
        usefulCommentsCount: 5,
        secondedCount: 11
      },
      {
        id: "stu-4",
        name: "Martí Serra",
        email: "marti.serra@campus.eram.cat",
        year: "3r Curs",
        avatarColor: "#4b87c5",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        bio: "Modelatge 3D, entorns virtuals amb Unreal Engine 5 i animació de personatges.",
        interests: ["3D", "Unreal Engine", "VFX"],
        points: 124,
        projectsCount: 2,
        commentsCount: 11,
        usefulCommentsCount: 7,
        secondedCount: 15
      },
      {
        id: "stu-5",
        name: "Núria Bosch",
        email: "nuria.bosch@campus.eram.cat",
        year: "1r Curs",
        avatarColor: "#c18b4b",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
        bio: "Fotografia analògica, retrat documental i exploració de llum natural.",
        interests: ["Fotografia", "Analògic", "Retrat"],
        points: 34,
        projectsCount: 1,
        commentsCount: 4,
        usefulCommentsCount: 2,
        secondedCount: 4
      }
    ],
    projects: [
      {
        id: "proj-1",
        title: "Curtmetratge documental",
        category: "Audiovisuals",
        aspect: "span-tall",
        cover: "ac0f2b80c7e7992a8153cea651a509b2.jpg",
        description: "Curtmetratge documental d'observació sobre la vida quotidiana d'un barri, rodat amb llum natural i so ambient.",
        briefing: "Plans fixos llargs, entrevistes curtes i paisatge sonor enregistrat in situ.",
        subject: "Direcció audiovisual",
        professor: "Dr. Marc Ferrer",
        year: "3r Curs",
        deadline: daysFromNow(3),
        createdAt: daysFromNow(-4),
        stage: "Post-production",
        teamType: "group",
        participants: ["Laia Puig", "Martí Serra"],
        ownerId: "stu-1",
        status: "In progress",
        mediaUrl: "https://vimeo.com/76979871",
        mediaImages: [],
        feedbackType: "Ritme del primer muntatge i transicions sonores"
      },
      {
        id: "proj-2",
        title: "Cartell tipogràfic",
        category: "Disseny gràfic",
        aspect: "span-portrait",
        cover: "cartell tipografic.jpg",
        description: "Cartell tipogràfic per a un festival d'arts escèniques, basat en el contrast de tipografies i una paleta reduïda.",
        briefing: "Jerarquia clara, graella modular i lectura ràpida a distància.",
        subject: "Projectes de disseny gràfic",
        professor: "Dra. Anna Rovira",
        year: "2n Curs",
        deadline: daysFromNow(6),
        createdAt: daysFromNow(-2),
        stage: "Production",
        teamType: "individual",
        participants: ["Clara Mas"],
        ownerId: "stu-3",
        status: "In progress",
        mediaUrl: "https://drive.google.com",
        mediaImages: [],
        feedbackType: "Llegibilitat i jerarquia visual"
      },
      {
        id: "proj-3",
        title: "Fotografia de paisatge",
        category: "Fotografia",
        aspect: "span-square",
        cover: "llum de paisatge.jpg",
        description: "Sèrie de 12 fotografies de paisatge en pel·lícula analògica, centrada en la llum natural a boscos i camps.",
        briefing: "Sense llum artificial; aprofitar l'hora blava i el gra natural.",
        subject: "Fotografia",
        professor: "Prof. Jordi Casals",
        year: "1r Curs",
        deadline: daysFromNow(11),
        createdAt: daysFromNow(-1),
        stage: "Final review",
        teamType: "individual",
        participants: ["Núria Bosch"],
        ownerId: "stu-5",
        status: "In progress",
        mediaUrl: "",
        mediaImages: [],
        feedbackType: "Selecció i seqüència de les 8 imatges finals"
      },
      {
        id: "proj-4",
        title: "Disseny d'una app musical",
        category: "UI/UX",
        aspect: "span-square",
        cover: "disseny app musical.jpg",
        description: "Prototip d'una aplicació per crear música des del mòbil o la tauleta, amb controls tàctils senzills.",
        briefing: "Poca càrrega cognitiva i resposta visual immediata.",
        subject: "Disseny interactiu",
        professor: "Prof. Oriol Soler",
        year: "4t Curs (TFG)",
        deadline: daysFromNow(4),
        createdAt: daysFromNow(-6),
        stage: "Production",
        teamType: "individual",
        participants: ["Pol Vila"],
        ownerId: "stu-2",
        status: "In progress",
        mediaUrl: "https://figma.com",
        mediaImages: [],
        feedbackType: "Usabilitat dels controls en pantalla tàctil"
      },
      {
        id: "proj-5",
        title: "Escenari 3D",
        category: "3D",
        aspect: "span-tall",
        cover: "escenari disseny 3d.jpg",
        description: "Escenari 3D en temps real d'un edifici abandonat, amb il·luminació atmosfèrica i textures de formigó.",
        briefing: "Estudi de llum volumètrica i materials desgastats.",
        subject: "3D I",
        professor: "Prof. Sergi Pujol",
        year: "3r Curs",
        deadline: daysFromNow(9),
        createdAt: daysFromNow(-3),
        stage: "Post-production",
        teamType: "group",
        participants: ["Martí Serra", "Pol Vila"],
        ownerId: "stu-4",
        status: "In progress",
        mediaUrl: "https://youtube.com",
        mediaImages: [],
        feedbackType: "Il·luminació i escala de l'espai"
      },
      {
        id: "proj-6",
        title: "Experiència de realitat virtual",
        category: "Realitat immersiva",
        aspect: "span-landscape",
        cover: "realitat immersiva.jpg",
        description: "Experiència de realitat virtual en què l'usuari explora una sala interactiva amb so espacial i objectes que reaccionen als seus gestos.",
        briefing: "Navegació còmoda sense marejos, interacció amb les mans i so 3D que guiï l'atenció.",
        subject: "Realitat immersiva",
        professor: "Prof. Sergi Pujol",
        year: "3r Curs",
        deadline: daysFromNow(7),
        createdAt: daysFromNow(0),
        stage: "Production",
        teamType: "individual",
        participants: ["Pol Vila"],
        ownerId: "stu-2",
        status: "In progress",
        mediaUrl: "",
        mediaImages: [],
        feedbackType: "Comoditat de la navegació i claredat de les interaccions"
      }
    ],
    comments: [
      {
        id: "com-1",
        projectId: "proj-1",
        authorId: "stu-2",
        text: "El pròleg funciona molt bé a nivell atmosfèric, però retallaria uns 15 segons el segon pla general del riu perquè l'entrada de la veu en off tingui més impacte.",
        createdAt: "Fa 3 hores",
        secondedBy: ["stu-3", "stu-4"],
        usefulnessRating: 5
      }
    ],
    positions: [
      {
        id: "pos-1",
        title: "Dissenyador/a Sonor i Perxista",
        projectTitle: "Ecos del Ter - Curtmetratge Documental",
        role: "Disseny sonor",
        spots: 1,
        compensation: "Academic collaboration",
        startDate: daysFromNow(4),
        endDate: daysFromNow(25),
        duration: "3 setmanes (2 dies de rodatge + mescla)",
        location: "In person",
        projectType: "Academic",
        subject: "Direcció audiovisual",
        year: "3r Curs",
        description: "Busquem un/a estudiant amb interès en enregistrament de camp (Zoom F6 / micròfon direccional) i postproducció sonora en Pro Tools o Reaper.",
        ownerId: "stu-1",
        createdAt: "Fa 2 dies",
        status: "Open",
        applications: []
      }
    ],
    conversations: [],
    notifications: [],
    pointsLedger: []
  };

  function userContentMarkup(value) {
    const text = value == null ? "" : String(value);
    return `<span class="user-generated-content">${escapeHtml(text)}</span>`;
  }

  // Estat reactiu en memòria sincronitzat amb Firestore
  const state = {
    currentUserId: null,
    currentUserProfile: null,
    students: [],
    projects: [],
    projectsLoaded: false,
    comments: [],
    positions: [],
    conversations: [],
    notifications: [],
    pointsLedger: [],
    suggestions: [],
    suggestionsLoaded: false,
    suggestionsError: ""
  };

  const SUGGESTION_MANAGER_IDS = new Set([
    "hlluZulYb9floOaHfJnJwJtFRd73",
    "wga43nUbJAaaaXTTFNnj2HxstZ42",
    "IkHVuvsGIMbSBcQlOSa1ZOLFv1G3",
    "6nneJjGahNTvjbNAPjSOIO6By7z1"
  ]);

  function isSuggestionManager() {
    return SUGGESTION_MANAGER_IDS.has(state.currentUserId);
  }

  // =========================================================================
  // 2. HELPERS DE SINCRONITZACIÓ AMB FIRESTORE I STORAGE
  // =========================================================================
  function compressDataUrl(dataUrl, maxWidth = 900, quality = 0.72) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  async function uploadDataUrlIfNeeded(dataUrl, folder) {
    if (!dataUrl || !dataUrl.startsWith("data:image")) return dataUrl;
    try {
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const storageRef = ref(storage, fileName);
      const uploadPromise = (async () => {
        await uploadString(storageRef, dataUrl, "data_url");
        return await getDownloadURL(storageRef);
      })();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Storage timeout")), 4000)
      );
      return await Promise.race([uploadPromise, timeoutPromise]);
    } catch (err) {
      console.warn("Firebase Storage no disponible; es comprimeix la imatge per desar-la a Firestore:", err);
      return await compressDataUrl(dataUrl, 850, 0.7);
    }
  }

  async function updateDefaultProjectCoverIfUnchanged() {
    const defaultProject = INITIAL_STATE.projects.find((project) => project.id === "proj-1");
    if (!defaultProject) return;

    const projectRef = doc(db, "projects", defaultProject.id);
    const projectSnap = await getDoc(projectRef);
    if (!projectSnap.exists()) return;

    const previousCovers = [
      "https://images.unsplash.com/photo-1485846234645-262644f84728?auto=format&fit=crop&w=900&q=80",
      "https://i.pinimg.com/1200x/ac/0f/2b/ac0f2b80c7e7992a8153cea651a509b2"
    ];
    if (previousCovers.includes(projectSnap.data().cover)) {
      await updateDoc(projectRef, { cover: defaultProject.cover });
    }
  }

  async function seedInitialDataIfNeeded() {
    const seededFlag = localStorage.getItem("eram_firestore_seeded_v1");
    try {
      if (seededFlag) {
        await updateDefaultProjectCoverIfUnchanged();
        return;
      }

      const batch = writeBatch(db);
      INITIAL_STATE.students.forEach((s) => {
        const avatar = /^https?:\/\//i.test(s.avatar || "")
          ? makeInitialAvatar(s.name, s.avatarColor || "#7c6ee6")
          : s.avatar;
        batch.set(doc(db, "students", s.id), { ...s, avatar }, { merge: true });
      });
      INITIAL_STATE.projects.forEach((p) => {
        batch.set(doc(db, "projects", p.id), p, { merge: true });
      });
      INITIAL_STATE.comments.forEach((c) => {
        batch.set(doc(db, "comments", c.id), c, { merge: true });
      });
      INITIAL_STATE.positions.forEach((pos) => {
        batch.set(doc(db, "positions", pos.id), pos, { merge: true });
      });
      await batch.commit();
      localStorage.setItem("eram_firestore_seeded_v1", "1");
    } catch (e) {
      console.warn("No s'han pogut inicialitzar les dades de mostra a Firestore:", e);
    }
  }

  let listenersStarted = false;
  let suggestionsUnsubscribe = null;

  function syncSuggestionAccess() {
    const navButton = document.getElementById("nav-suggestions");
    const canManageSuggestions = isSuggestionManager();
    navButton?.classList.toggle("hidden", !canManageSuggestions);

    if (!canManageSuggestions) {
      suggestionsUnsubscribe?.();
      suggestionsUnsubscribe = null;
      state.suggestions = [];
      state.suggestionsLoaded = false;
      state.suggestionsError = "";
      if (ui.route === "suggestions") navigateTo("discover", null, { skipHistory: true });
      return;
    }

    if (suggestionsUnsubscribe) return;
    state.suggestionsLoaded = false;
    state.suggestionsError = "";
    suggestionsUnsubscribe = onSnapshot(
      collection(db, "suggestions"),
      (snapshot) => {
        state.suggestions = snapshot.docs.map((suggestionDoc) => ({
          id: suggestionDoc.id,
          ...suggestionDoc.data()
        }));
        state.suggestionsLoaded = true;
        state.suggestionsError = "";
        if (ui.route === "suggestions") renderSuggestionsView();
      },
      (error) => {
        console.error("No s'han pogut carregar els suggeriments:", error);
        state.suggestionsLoaded = true;
        state.suggestionsError = "No s'han pogut carregar els suggeriments. Torna-ho a provar més tard.";
        if (ui.route === "suggestions") renderSuggestionsView();
      }
    );
  }

  function startRealtimeSync() {
    if (listenersStarted) return;
    listenersStarted = true;

    onSnapshot(collection(db, "students"), (snap) => {
      state.students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      refreshCurrentRoute();
    });
    onSnapshot(collection(db, "projects"), (snap) => {
      state.projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.projectsLoaded = true;
      populateDynamicFilterOptions();
      refreshCurrentRoute();
    });
    onSnapshot(collection(db, "comments"), (snap) => {
      state.comments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      refreshCurrentRoute();
    });
    onSnapshot(collection(db, "positions"), (snap) => {
      state.positions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      refreshCurrentRoute();
    });
    onSnapshot(collection(db, "conversations"), (snap) => {
      state.conversations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      updateHeaderChrome();
      if (ui.route === "messages") refreshMessagesView();
    });
    onSnapshot(collection(db, "notifications"), (snap) => {
      state.notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      updateHeaderChrome();
      const chatMainPane = document.getElementById("chat-main-pane");
      if (ui.route === "messages" && ui.activeConversationId && chatMainPane?.getClientRects().length) {
        void markMessageNotificationsAsRead(ui.activeConversationId, state.currentUserId);
      }
    });
    onSnapshot(collection(db, "pointsLedger"), (snap) => {
      state.pointsLedger = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (ui.route === "leaderboard") renderLeaderboardView();
    });
  }

  function refreshCurrentRoute() {
    updateHeaderChrome();
    if (
      !document.body.classList.contains("authenticated") &&
      !document.body.classList.contains("auth-loading")
    ) return;
    if (ui.route === "discover") renderDiscoverView();
    if (ui.route === "project") renderProjectDetailView();
    if (ui.route === "positions") renderPositionsView();
    if (ui.route === "messages") renderMessagesView();
    if (ui.route === "suggestions") renderSuggestionsView();
    if (ui.route === "profile") renderProfileView();
    if (ui.route === "leaderboard") renderLeaderboardView();
  }

  function isProjectCoverFramed(project) {
    return project.coverFramed === true || /^data:image\//i.test(project.cover || "");
  }

  // =========================================================================
  // 3. UI FILTERS, CROPPER & WIZARD STATE
  // =========================================================================
  let uploadedProjectCover = "";
  let uploadedProjectMediaImages = [];
  let projectMediaUploadPending = false;
  let projectMediaUploadGeneration = 0;

  const projectCropSizes = {
    portrait: { width: 720, height: 960 },
    wide: { width: 1280, height: 720 },
    square: { width: 960, height: 960 }
  };

  const projectCrop = {
    image: null,
    source: "",
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    dirty: false,
    framed: false,
    loading: false,
    pendingFile: null,
    dragging: false,
    lastX: 0,
    lastY: 0
  };

  let projectWizardStep = 1;
  const projectWizardStepHistory = [];

  function getProjectWizardSteps() {
    const steps = [
      { id: 1, title: "Portada i dades principals" },
      { id: 2, title: "Descripció i briefing" },
      { id: 3, title: "Context acadèmic i equip" }
    ];
    const seekingCollaborator =
      document.getElementById("proj-team-type").value === "group" &&
      document.getElementById("proj-seeking-collaborator").checked;

    if (seekingCollaborator) steps.push({ id: 4, title: "Detalls de col·laboració" });
    steps.push({ id: 5, title: "Material multimèdia" });
    return steps.map((step, index) => ({
      ...step,
      label: `Pas ${index + 1} de ${steps.length} · ${step.title}`
    }));
  }

  function setProjectWizardStep(step) {
    const steps = getProjectWizardSteps();
    const lastStep = steps.length;
    const nextStep = Math.max(1, Math.min(lastStep, step));
    if (nextStep > projectWizardStep) projectWizardStepHistory.push(projectWizardStep);
    if (nextStep === 1) projectWizardStepHistory.length = 0;
    projectWizardStep = nextStep;
    const currentStep = steps[projectWizardStep - 1];

    document.querySelectorAll("[data-project-step]").forEach((section) => {
      section.hidden = Number(section.dataset.projectStep) !== currentStep.id;
    });

    const progressTrack = document.querySelector("#publish-project-form .project-wizard-progress-track");
    if (progressTrack) progressTrack.style.gridTemplateColumns = `repeat(${lastStep}, minmax(0, 1fr))`;
    document.querySelectorAll("[data-wizard-progress]").forEach((indicator) => {
      const progressStep = Number(indicator.dataset.wizardProgress);
      indicator.hidden = progressStep > lastStep;
      const isActive = progressStep <= projectWizardStep;
      indicator.classList.toggle("is-active", isActive);
      if (progressStep === projectWizardStep) {
        indicator.setAttribute("aria-current", "step");
      } else {
        indicator.removeAttribute("aria-current");
      }
    });

    document.getElementById("proj-wizard-step-label").textContent = currentStep.label;
    document.getElementById("proj-wizard-back").classList.toggle("hidden", projectWizardStep === 1);
    document.getElementById("proj-wizard-next").classList.toggle("hidden", projectWizardStep === lastStep);
    document.getElementById("proj-wizard-submit").classList.toggle("hidden", projectWizardStep !== lastStep);
    document.getElementById("proj-form-error").classList.add("hidden");

    const modalCard = document.querySelector("#modal-publish-project .modal-card");
    if (modalCard) modalCard.scrollTop = 0;
    notifySuggestionPreviewRoute();
  }

  function goBackProjectWizardStep() {
    const previousStep = projectWizardStepHistory.pop() || Math.max(1, projectWizardStep - 1);
    setProjectWizardStep(previousStep);
  }

  function advanceProjectWizard() {
    const error = document.getElementById("proj-form-error");
    error.classList.add("hidden");
    const currentStepId = getProjectWizardSteps()[projectWizardStep - 1].id;

    if (currentStepId === 1) {
      if (projectCrop.source && !projectCrop.image) {
        error.textContent = projectCrop.loading
          ? "Espera que la imatge s'acabi de carregar."
          : "No s'ha pogut carregar la imatge. Comprova l'URL o selecciona un altre fitxer.";
        error.classList.remove("hidden");
        return;
      }

      if (projectCrop.image && projectCrop.dirty) {
        try {
          uploadedProjectCover = document.getElementById("proj-crop-canvas").toDataURL("image/jpeg", 0.85);
          projectCrop.dirty = false;
          projectCrop.framed = true;
        } catch (err) {
          error.textContent =
            err.name === "SecurityError"
              ? "Aquest servidor no permet retallar imatges d'aquesta URL. Selecciona la imatge des del teu ordinador."
              : "No s'ha pogut processar la imatge. Torna-ho a provar.";
          error.classList.remove("hidden");
          return;
        }
      }

      if (!document.getElementById("proj-title").value.trim()) {
        error.textContent = "Escriu el títol del projecte per continuar.";
        error.classList.remove("hidden");
        document.getElementById("proj-title").focus();
        return;
      }

      if (!document.getElementById("proj-deadline").value) {
        error.textContent = "Selecciona la data d'entrega per continuar.";
        error.classList.remove("hidden");
        document.getElementById("proj-deadline").focus();
        return;
      }

      if (!document.getElementById("proj-subject").value.trim()) {
        error.textContent = "Indica l'assignatura del projecte per continuar.";
        error.classList.remove("hidden");
        document.getElementById("proj-subject").focus();
        return;
      }

      if (!document.getElementById("proj-professor").value.trim()) {
        error.textContent = "Indica el nom del professor/a per continuar.";
        error.classList.remove("hidden");
        document.getElementById("proj-professor").focus();
        return;
      }
    }

    if (currentStepId === 2) {
      if (!document.getElementById("proj-description").value.trim()) {
        error.textContent = "Escriu la descripció del projecte per continuar.";
        error.classList.remove("hidden");
        document.getElementById("proj-description").focus();
        return;
      }
    }

    if (currentStepId === 4) {
      const role = document.getElementById("proj-collab-role");
      const startDate = document.getElementById("proj-collab-start");
      const endDate = document.getElementById("proj-collab-end");
      if (!role.value) {
        error.textContent = "Selecciona el perfil que busques.";
        error.classList.remove("hidden");
        role.focus();
        return;
      }
      if (!startDate.value || !endDate.value) {
        error.textContent = "Indica les dates d'inici i finalització de la col·laboració.";
        error.classList.remove("hidden");
        (startDate.value ? endDate : startDate).focus();
        return;
      }
      if (endDate.value < startDate.value) {
        error.textContent = "La data de finalització no pot ser anterior a la data d'inici.";
        error.classList.remove("hidden");
        endDate.focus();
        return;
      }
    }

    setProjectWizardStep(projectWizardStep + 1);
  }

  function syncProjectTeamFields() {
    const isGroup = document.getElementById("proj-team-type").value === "group";
    const participantsWrap = document.getElementById("proj-participants-wrap");
    const participantRows = document.getElementById("proj-participant-rows");
    const collaboratorOptionWrap = document.getElementById("proj-collaborator-option-wrap");
    const collaboratorCheckbox = document.getElementById("proj-seeking-collaborator");
    const participantsCanManageCheckbox = document.getElementById("proj-participants-can-manage");
    participantsWrap.hidden = !isGroup;
    collaboratorOptionWrap.hidden = !isGroup;
    if (!isGroup) {
      participantRows.innerHTML = "";
      collaboratorCheckbox.checked = false;
      participantsCanManageCheckbox.checked = false;
      populateParticipantSearch();
    }
  }

  function renderProjectMediaPreview() {
    const preview = document.getElementById("proj-media-images-preview");
    if (!preview) return;
    preview.innerHTML = uploadedProjectMediaImages
      .map(
        (image) => `
        <div class="project-media-upload-card">
          <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.name)}" />
          <span>${escapeHtml(image.name)}</span>
          <button type="button" class="text-link-btn" data-remove-project-media="${escapeHtml(image.id)}" aria-label="Eliminar ${escapeHtml(image.name)}">&times;</button>
        </div>`
      )
      .join("");
    preview.querySelectorAll("[data-remove-project-media]").forEach((button) => {
      button.addEventListener("click", () => {
        uploadedProjectMediaImages = uploadedProjectMediaImages.filter((image) => image.id !== button.dataset.removeProjectMedia);
        renderProjectMediaPreview();
      });
    });
  }

  function readProjectMediaImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("No s'ha pogut llegir el fitxer."));
      reader.onload = () => {
        if (typeof reader.result !== "string") {
          reject(new Error("El fitxer no s'ha pogut convertir en una imatge."));
          return;
        }
        const image = new Image();
        image.onerror = () => reject(new Error("El fitxer seleccionat no és una imatge vàlida."));
        image.onload = () => {
          const maxDimension = 1280;
          const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d");
          context.fillStyle = "#fff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve({
            id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            src: canvas.toDataURL("image/jpeg", 0.8),
            width: canvas.width,
            height: canvas.height
          });
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function showProjectCropError(message) {
    const error = document.getElementById("proj-crop-error");
    if (!error) return;
    error.textContent = message;
    error.classList.toggle("hidden", !message);
  }

  function syncProjectAspectButtons(aspectValue) {
    const input = document.getElementById("proj-aspect");
    if (input) input.value = aspectValue;
    document.querySelectorAll("[data-aspect-choice]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.aspectChoice === aspectValue);
    });
  }

  function drawProjectCrop() {
    const canvas = document.getElementById("proj-crop-canvas");
    const aspect = document.getElementById("proj-aspect")?.value || "portrait";
    const size = projectCropSizes[aspect] || projectCropSizes.portrait;
    if (!canvas || !projectCrop.image) return;

    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#161616";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const image = projectCrop.image;
    const baseScale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const scale = baseScale * projectCrop.zoom;
    const drawnWidth = image.naturalWidth * scale;
    const drawnHeight = image.naturalHeight * scale;
    const maxOffsetX = Math.max(0, (drawnWidth - canvas.width) / 2);
    const maxOffsetY = Math.max(0, (drawnHeight - canvas.height) / 2);

    projectCrop.offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, projectCrop.offsetX));
    projectCrop.offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, projectCrop.offsetY));

    context.drawImage(
      image,
      (canvas.width - drawnWidth) / 2 + projectCrop.offsetX,
      (canvas.height - drawnHeight) / 2 + projectCrop.offsetY,
      drawnWidth,
      drawnHeight
    );
  }

  function setProjectCropSource(source, { dirty = true, framed = false } = {}) {
    const cropper = document.getElementById("proj-cropper");
    const placeholder = document.getElementById("proj-cover-placeholder");
    const zoomControl = document.getElementById("proj-crop-zoom");

    projectCrop.image = null;
    projectCrop.source = source;
    projectCrop.zoom = 1;
    projectCrop.offsetX = 0;
    projectCrop.offsetY = 0;
    projectCrop.dirty = dirty;
    projectCrop.framed = framed;
    projectCrop.loading = Boolean(source);
    projectCrop.pendingFile = null;

    if (zoomControl) zoomControl.value = "1";
    if (cropper) cropper.classList.toggle("hidden", !source);
    if (placeholder) placeholder.classList.toggle("hidden", Boolean(source));
    showProjectCropError("");

    if (!source) return;

    const image = new Image();
    if (!source.startsWith("data:") && !source.startsWith("blob:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => {
      if (projectCrop.source !== source) return;
      projectCrop.image = image;
      projectCrop.loading = false;
      drawProjectCrop();
    };
    image.onerror = () => {
      if (projectCrop.source !== source) return;
      projectCrop.loading = false;
      showProjectCropError("No s'ha pogut carregar la imatge. Comprova l'URL o selecciona un fitxer del teu ordinador.");
    };
    image.src = source;
  }

  const savedRoute = isFeedbackPreview
    ? previewParams.get("feedback-route")
    : sessionStorage.getItem("eram-active-route");
  const savedRouteId = isFeedbackPreview
    ? previewParams.get("feedback-route-id")
    : sessionStorage.getItem("eram-active-route-id");
  const savedViewStateText = sessionStorage.getItem("eram-active-view-state");
  let savedViewState = {};
  if (savedViewStateText) {
    try {
      const parsedState = JSON.parse(savedViewStateText);
      if (parsedState && typeof parsedState === "object" && !Array.isArray(parsedState)) {
        savedViewState = parsedState;
      } else {
        console.warn("S'ha ignorat l'estat de vista desat perquè no té un format vàlid.");
      }
    } catch (error) {
      console.warn("No s'ha pogut recuperar l'estat de vista desat:", error);
    }
  }
  const savedFilters =
    savedViewState.filters && typeof savedViewState.filters === "object" ? savedViewState.filters : {};
  const savedPositionFilters =
    savedViewState.posFilters && typeof savedViewState.posFilters === "object"
      ? savedViewState.posFilters
      : {};
  const validRoutes = new Set([
    "discover",
    "project",
    "positions",
    "messages",
    "suggestions",
    "profile",
    "leaderboard"
  ]);
  const initialRoute =
    validRoutes.has(savedRoute) && (savedRoute !== "project" || savedRouteId) ? savedRoute : "discover";

  const ui = {
    route: initialRoute,
    selectedCategory: typeof savedViewState.selectedCategory === "string" ? savedViewState.selectedCategory : "General",
    searchQuery: typeof savedViewState.searchQuery === "string" ? savedViewState.searchQuery : "",
    sortBy: typeof savedViewState.sortBy === "string" ? savedViewState.sortBy : "recent",
    visibleCount:
      Number.isFinite(savedViewState.visibleCount) && savedViewState.visibleCount >= 15
        ? savedViewState.visibleCount
        : 15,
    advancedFiltersOpen: savedViewState.advancedFiltersOpen === true,
    filters: {
      subject: typeof savedFilters.subject === "string" ? savedFilters.subject : "",
      professor: typeof savedFilters.professor === "string" ? savedFilters.professor : "",
      year: typeof savedFilters.year === "string" ? savedFilters.year : "",
      stage: typeof savedFilters.stage === "string" ? savedFilters.stage : "",
      teamType: typeof savedFilters.teamType === "string" ? savedFilters.teamType : "",
      status: typeof savedFilters.status === "string" ? savedFilters.status : "active",
      urgentOnly: savedFilters.urgentOnly === true
    },
    activeProjectId: initialRoute === "project" ? savedRouteId : null,
    activeProfileId: initialRoute === "profile" ? savedRouteId : null,
    activeConversationId: initialRoute === "messages" ? savedRouteId : null,
    posFilters: {
      role: typeof savedPositionFilters.role === "string" ? savedPositionFilters.role : "",
      compensation: typeof savedPositionFilters.compensation === "string" ? savedPositionFilters.compensation : "",
      projectType: typeof savedPositionFilters.projectType === "string" ? savedPositionFilters.projectType : "",
      location: typeof savedPositionFilters.location === "string" ? savedPositionFilters.location : ""
    }
  };
  let activeSuggestionReference = null;
  let suggestionPreviewZoom = 1;
  let suggestionPreviewScale = 1;
  const suggestionPreviewOriginalSize = { width: 1280, height: 720 };
  const savedScrollX = Number.isFinite(savedViewState.scrollX) ? savedViewState.scrollX : 0;
  const savedScrollY = Number.isFinite(savedViewState.scrollY) ? savedViewState.scrollY : 0;
  const savedMessageScrollTop = Number.isFinite(savedViewState.messageScrollTop)
    ? savedViewState.messageScrollTop
    : 0;
  let restoreSavedViewOnEntry = Boolean(savedViewStateText) || initialRoute !== "discover";
  let restoreMessageScroll = initialRoute === "messages" && Boolean(savedViewStateText);
  const backHistoryText = sessionStorage.getItem("eram-app-back-history");
  let navigationHistory = [];
  const modalBackHistory = [];
  if (backHistoryText) {
    try {
      const parsedHistory = JSON.parse(backHistoryText);
      if (Array.isArray(parsedHistory)) {
        navigationHistory = parsedHistory
          .filter((entry) => entry && validRoutes.has(entry.route))
          .slice(-30);
      } else {
        console.warn("S'ha ignorat l'historial de navegació desat perquè no té un format vàlid.");
      }
    } catch (error) {
      console.warn("No s'ha pogut recuperar l'historial de navegació desat:", error);
    }
  }

  function getCurrentRouteId() {
    if (ui.route === "project") return ui.activeProjectId;
    if (ui.route === "profile") return ui.activeProfileId;
    if (ui.route === "messages") return ui.activeConversationId;
    return "";
  }

  function getSuggestionPreviewOverlay() {
    const activeModal = [...document.querySelectorAll(".modal-backdrop:not(.hidden)")].reverse()[0];
    if (activeModal && !["modal-suggestions", "modal-suggestion-detail"].includes(activeModal.id)) {
      if (
        activeModal.id === "modal-subject" &&
        document.getElementById("modal-subject-title")?.textContent.trim() === "About Us"
      ) {
        return { type: "about" };
      }
      if (activeModal.id === "modal-subject") {
        return {
          type: "subject",
          subject: document.getElementById("modal-subject-title")?.textContent.trim() || ""
        };
      }
      if (activeModal.id === "modal-publish-project") {
        return {
          type: "project-wizard",
          stepId: Number(activeModal.querySelector("[data-project-step]:not([hidden])")?.dataset.projectStep) || 1,
          seekingCollaborator: document.getElementById("proj-seeking-collaborator")?.checked === true
        };
      }
      if (activeModal.id === "modal-edit-profile") return { type: "profile-edit" };
      if (activeModal.id === "modal-create") return { type: "create-menu" };
      return { type: "modal", id: activeModal.id };
    }

    const activePopover = document.querySelector(".popover-menu:not(.hidden)");
    return activePopover ? { type: "popover", id: activePopover.id } : null;
  }

  function normalizeSuggestionOverlay(overlay) {
    if (!overlay || typeof overlay !== "object") return null;
    if (overlay.type === "about") return { type: "about" };
    if (overlay.type === "subject" && typeof overlay.subject === "string") {
      const subject = overlay.subject.trim();
      if (subject && subject.length <= 120) return { type: "subject", subject };
    }
    if (overlay.type === "project-wizard") {
      const stepId = Number(overlay.stepId);
      if (![1, 2, 3, 4, 5].includes(stepId)) return null;
      return {
        type: "project-wizard",
        stepId,
        seekingCollaborator: overlay.seekingCollaborator === true
      };
    }
    if (overlay.type === "profile-edit") return { type: "profile-edit" };
    if (overlay.type === "create-menu") return { type: "create-menu" };
    if (overlay.type === "popover" && ["platform-dropdown", "notif-dropdown", "profile-dropdown"].includes(overlay.id)) {
      return { type: "popover", id: overlay.id };
    }
    if (
      overlay.type === "modal" &&
      typeof overlay.id === "string" &&
      /^modal-[a-z-]+$/.test(overlay.id) &&
      !["modal-suggestions", "modal-suggestion-detail"].includes(overlay.id) &&
      document.getElementById(overlay.id)?.classList.contains("modal-backdrop")
    ) {
      return { type: "modal", id: overlay.id };
    }
    return null;
  }

  function notifySuggestionPreviewRoute() {
    if (!isFeedbackPreview || window.parent === window) return;
    window.parent.postMessage(
      {
        type: "suggestion-preview-route",
        route: ui.route,
        routeId: getCurrentRouteId() || "",
        overlay: getSuggestionPreviewOverlay()
      },
      window.location.origin
    );
  }

  function captureCurrentScreen() {
    return {
      route: ui.route,
      routeId: getCurrentRouteId(),
      selectedCategory: ui.selectedCategory,
      searchQuery: ui.searchQuery,
      sortBy: ui.sortBy,
      visibleCount: ui.visibleCount,
      advancedFiltersOpen: ui.advancedFiltersOpen,
      filters: { ...ui.filters },
      posFilters: { ...ui.posFilters },
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };
  }

  function persistNavigationHistory() {
    if (isFeedbackPreview) return;
    sessionStorage.setItem("eram-app-back-history", JSON.stringify(navigationHistory.slice(-30)));
  }

  function updateBackButton() {
    const activeModal = document.querySelector(".modal-backdrop:not(.hidden)");
    const pageBackButton = document.getElementById("app-back-btn");
    if (pageBackButton) {
      pageBackButton.classList.toggle("hidden", Boolean(activeModal));
      pageBackButton.disabled = !activeModal && navigationHistory.length === 0;
    }
  }

  function saveActiveViewState() {
    if (isFeedbackPreview) return;
    const routeId = getCurrentRouteId();
    sessionStorage.setItem("eram-active-route", ui.route);
    sessionStorage.setItem("eram-active-route-id", routeId || "");
    sessionStorage.setItem(
      "eram-active-view-state",
      JSON.stringify({
        selectedCategory: ui.selectedCategory,
        searchQuery: ui.searchQuery,
        sortBy: ui.sortBy,
        visibleCount: ui.visibleCount,
        filters: ui.filters,
        posFilters: ui.posFilters,
        advancedFiltersOpen: ui.advancedFiltersOpen,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        messageScrollTop: document.getElementById("chat-messages-scroll")?.scrollTop || 0
      })
    );
    persistNavigationHistory();
  }

  window.addEventListener("pagehide", saveActiveViewState);

  // =========================================================================
  // 4. REPUTACIÓ, NIVELLS I ALGORISME DE VISIBILITAT
  // =========================================================================
  function getCurrentUser() {
    return (
      state.students.find((s) => s.id === state.currentUserId) ||
      state.currentUserProfile || {
        id: state.currentUserId || auth.currentUser?.uid || "guest",
        name: auth.currentUser?.email?.split("@")[0] || "Estudiant ERAM",
        email: auth.currentUser?.email || "",
        year: "1r Curs",
        avatar: makeInitialAvatar(auth.currentUser?.email || "ER", "#8f7cf6"),
        points: 0,
        projectsCount: 0,
        commentsCount: 0,
        usefulCommentsCount: 0,
        secondedCount: 0
      }
    );
  }

  function getStudentByName(name) {
    if (typeof name !== "string") return undefined;
    const normalizedName = name.trim().toLocaleLowerCase();
    return state.students.find(
      (student) =>
        typeof student.name === "string" && student.name.trim().toLocaleLowerCase() === normalizedName
    );
  }

  function getStudentByDisplayName(name) {
    const normalize = (value) =>
      value.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
    const normalizedName = normalize(name);
    return state.students.find(
      (student) => typeof student.name === "string" && normalize(student.name) === normalizedName
    );
  }

  function getProjectParticipantIds(project) {
    const participantIds = new Set(
      Array.isArray(project.participantIds)
        ? project.participantIds.filter((id) => typeof id === "string" && id)
        : []
    );
    const participantDetails = Array.isArray(project.participantDetails)
      ? project.participantDetails.filter((participant) => participant && typeof participant === "object")
      : [];
    participantDetails.forEach((participant) => {
      if (typeof participant.id === "string" && participant.id) participantIds.add(participant.id);
    });
    const participantNames = new Set(
      [
        ...(Array.isArray(project.participants) ? project.participants : []),
        ...participantDetails.map((participant) => participant.name)
      ]
        .filter((name) => typeof name === "string")
        .map((name) => name.trim().toLocaleLowerCase())
        .filter(Boolean)
    );

    participantNames.forEach((name) => {
      const student = getStudentByName(name);
      if (student) participantIds.add(student.id);
    });
    return [...participantIds];
  }

  function isProjectParticipant(project, userId = state.currentUserId) {
    return Boolean(userId) && (project.ownerId === userId || getProjectParticipantIds(project).includes(userId));
  }

  function canManageProject(project, userId = state.currentUserId) {
    return project.ownerId === userId || (project.participantsCanManage === true && isProjectParticipant(project, userId));
  }

  function isProjectHiddenFromPortfolio(project, userId) {
    return Array.isArray(project.hiddenFromPortfolioBy) && project.hiddenFromPortfolioBy.includes(userId);
  }

  function getStudentById(id) {
    return (
      state.students.find((s) => s.id === id) || {
        id,
        name: "Estudiant ERAM",
        email: "",
        year: "",
        avatar: makeInitialAvatar("ER", "#8f7cf6"),
        points: 0,
        projectsCount: 0,
        commentsCount: 0,
        usefulCommentsCount: 0,
        secondedCount: 0
      }
    );
  }

  function getAchievementTier(points) {
    if (points >= 200) return { level: 4, name: "Expert", next: null, min: 200, maxImage: 1600 };
    if (points >= 120) return { level: 3, name: "Col·laborador avançat", next: 200, min: 120, maxImage: 1200 };
    if (points >= 50) return { level: 2, name: "Col·laborador", next: 120, min: 50, maxImage: 900 };
    return { level: 1, name: "Iniciació", next: 50, min: 0, maxImage: 600 };
  }

  async function awardPoints(userId, actionKey, points, description) {
    const alreadyAwarded = state.pointsLedger.some(
      (entry) => entry.userId === userId && entry.action === actionKey
    );
    if (alreadyAwarded) return false;

    try {
      const student = getStudentById(userId);
      const newPoints = (student.points || 0) + points;
      const entryId = "pt-" + Date.now() + Math.random().toString(36).slice(2, 6);
      await setDoc(doc(db, "students", userId), { points: newPoints }, { merge: true });
      await setDoc(doc(db, "pointsLedger", entryId), {
        id: entryId,
        userId,
        action: actionKey,
        label: description,
        points,
        date: new Date().toISOString().split("T")[0]
      });
      if (userId === state.currentUserId) {
        showToast(`+${points} punts: ${description}`);
      }
      return true;
    } catch (e) {
      console.warn("Error sumant punts:", e);
      return false;
    }
  }

  async function awardFirstOwnProfileVisit(userId) {
    if (isFeedbackPreview) return;
    const action = "first-own-profile-open";
    const description = "Primera visita al teu perfil";
    const entryId = `${action}-${encodeURIComponent(userId)}`;
    const studentRef = doc(db, "students", userId);
    const ledgerRef = doc(db, "pointsLedger", entryId);

    try {
      const awarded = await runTransaction(db, async (transaction) => {
        const [ledgerSnapshot, studentSnapshot] = await Promise.all([
          transaction.get(ledgerRef),
          transaction.get(studentRef)
        ]);
        if (ledgerSnapshot.exists()) return false;

        const student = studentSnapshot.data() || {};
        transaction.set(studentRef, { points: (student.points || 0) + 10 }, { merge: true });
        transaction.set(ledgerRef, {
          id: entryId,
          userId,
          action,
          label: description,
          points: 10,
          date: new Date().toISOString().split("T")[0]
        });
        return true;
      });

      if (awarded) showToast(`+10 punts: ${description}`);
    } catch (error) {
      console.warn("Error sumant els punts de la primera visita al perfil:", error);
      showToast("No s'han pogut sumar els punts de la visita al perfil.");
    }
  }

  function getDaysUntilDeadline(deadlineStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(deadlineStr);
    const diffMs = target - today;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  function computeProjectVisibilityScore(project) {
    const owner = getStudentById(project.ownerId);
    const commentsCount = state.comments.filter((c) => c.projectId === project.id).length;
    const daysLeft = getDaysUntilDeadline(project.deadline);

    let urgencyScore = 0.2;
    if (daysLeft <= 0) urgencyScore = 0.95;
    else if (daysLeft <= 3) urgencyScore = 1.0;
    else if (daysLeft <= 7) urgencyScore = 0.78;
    else if (daysLeft <= 14) urgencyScore = 0.45;

    const repScore = Math.min((owner?.points || 0) / 250, 1);
    const feedbackNeedScore = Math.max(0, 1 - commentsCount / 5);
    const ageDays = Math.max(0, -getDaysUntilDeadline(project.createdAt));
    const freshnessScore = Math.max(0, 1 - ageDays / 21);

    return urgencyScore * 0.4 + repScore * 0.3 + feedbackNeedScore * 0.2 + freshnessScore * 0.1;
  }

  // =========================================================================
  // 5. NAVEGACIÓ I ROUTER
  // =========================================================================
  function resetDiscoveryFilters() {
    ui.selectedCategory = "General";
    ui.searchQuery = "";
    ui.visibleCount = 15;
    ui.filters = { subject: "", professor: "", year: "", stage: "", teamType: "", status: "active", urgentOnly: false };

    const searchInput = document.getElementById("global-search-input");
    const searchClear = document.getElementById("search-clear-btn");
    if (searchInput) searchInput.value = "";
    if (searchClear) searchClear.classList.add("hidden");

    [
      ["filter-subject", "subject"],
      ["filter-professor", "professor"],
      ["filter-year", "year"],
      ["filter-stage", "stage"],
      ["filter-team", "teamType"],
      ["filter-status", "status"]
    ].forEach(([elId, key]) => {
      const element = document.getElementById(elId);
      if (element) element.value = ui.filters[key];
    });

    const urgentFilter = document.getElementById("filter-urgent-only");
    if (urgentFilter) urgentFilter.checked = false;

    const advancedPanel = document.getElementById("advanced-filters-panel");
    if (advancedPanel) advancedPanel.classList.add("hidden");
    ui.advancedFiltersOpen = false;

    document.querySelectorAll("[data-category]").forEach((button) => {
      const isGeneral = button.dataset.category === "General";
      button.classList.toggle("active", isGeneral);
      button.setAttribute("aria-selected", String(isGeneral));
    });
  }

  function restoreSavedViewControls() {
    const searchInput = document.getElementById("global-search-input");
    const searchClear = document.getElementById("search-clear-btn");
    if (searchInput) searchInput.value = ui.searchQuery;
    if (searchClear) searchClear.classList.toggle("hidden", !ui.searchQuery);

    [
      ["filter-subject", ui.filters.subject],
      ["filter-professor", ui.filters.professor],
      ["filter-year", ui.filters.year],
      ["filter-stage", ui.filters.stage],
      ["filter-team", ui.filters.teamType],
      ["filter-status", ui.filters.status],
      ["pos-filter-role", ui.posFilters.role],
      ["pos-filter-comp", ui.posFilters.compensation],
      ["pos-filter-type", ui.posFilters.projectType],
      ["pos-filter-location", ui.posFilters.location]
    ].forEach(([id, value]) => {
      const control = document.getElementById(id);
      if (control) control.value = value;
    });

    const urgentFilter = document.getElementById("filter-urgent-only");
    if (urgentFilter) urgentFilter.checked = ui.filters.urgentOnly;
    document.querySelectorAll("[data-category]").forEach((button) => {
      const isActive = button.dataset.category === ui.selectedCategory;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    const advancedPanel = document.getElementById("advanced-filters-panel");
    const advancedToggle = document.getElementById("toggle-advanced-filters");
    if (advancedPanel) advancedPanel.classList.toggle("hidden", !ui.advancedFiltersOpen);
    if (advancedToggle) advancedToggle.setAttribute("aria-expanded", String(ui.advancedFiltersOpen));
  }

  function navigateTo(
    route,
    payloadId = null,
    { restore = false, skipHistory = false, scrollX = savedScrollX, scrollY = savedScrollY } = {}
  ) {
    if (route === "suggestions" && !isSuggestionManager()) {
      route = "discover";
      payloadId = null;
    }
    const currentRouteId = getCurrentRouteId();
    const targetRouteId =
      route === "project"
        ? payloadId || (ui.route === route ? ui.activeProjectId : null)
        : route === "profile"
          ? payloadId || state.currentUserId
          : route === "messages"
            ? payloadId || (ui.route === route ? ui.activeConversationId : null)
            : "";
    const isDifferentScreen = ui.route !== route || currentRouteId !== targetRouteId;
    if (!restore && !skipHistory && isDifferentScreen && document.body.classList.contains("authenticated")) {
      navigationHistory.push(captureCurrentScreen());
      navigationHistory = navigationHistory.slice(-30);
    }

    ui.route = route;
    document.querySelector(".top-nav")?.classList.toggle(
      "search-hidden",
      route === "leaderboard" || route === "messages" || route === "suggestions" || route === "profile"
    );
    if (route === "discover" && !restore) resetDiscoveryFilters();
    if (restore) restoreSavedViewControls();
    if (route === "project" && payloadId) ui.activeProjectId = payloadId;
    if (route === "profile") {
      ui.activeProfileId = payloadId || state.currentUserId;
      if (!restore && state.currentUserId && ui.activeProfileId === state.currentUserId) {
        void awardFirstOwnProfileVisit(state.currentUserId);
      }
    }
    if (route === "messages" && payloadId) {
      ui.activeConversationId = payloadId;
      document.getElementById("chat-shell")?.classList.add("mobile-thread-open");
    }
    const routeId =
      route === "project" ? ui.activeProjectId :
      route === "profile" ? ui.activeProfileId :
      route === "messages" ? ui.activeConversationId :
      "";
    if (!isFeedbackPreview) {
      sessionStorage.setItem("eram-active-route", route);
      sessionStorage.setItem("eram-active-route-id", routeId || "");
    }

    document.querySelectorAll(".nav-icon-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.route === route);
    });

    document.querySelectorAll(".view-section").forEach((sec) => sec.classList.add("hidden"));
    const targetSection = document.getElementById(`view-${route === "project" ? "project-detail" : route}`);
    if (targetSection) targetSection.classList.remove("hidden");

    closeAllPopovers();
    if (!restore) window.scrollTo({ top: 0, behavior: "smooth" });

    if (route === "discover") renderDiscoverView();
    if (route === "project") renderProjectDetailView();
    if (route === "positions") renderPositionsView();
    if (route === "messages") renderMessagesView();
    if (route === "suggestions") renderSuggestionsView();
    if (route === "profile") renderProfileView();
    if (route === "leaderboard") renderLeaderboardView();
    if (restore) {
      window.scrollTo(scrollX, scrollY);
      restoreSavedViewOnEntry = false;
    }
    updateBackButton();
    persistNavigationHistory();
    notifySuggestionPreviewRoute();
  }

  // =========================================================================
  // 6. HOMEPAGE - DESCOBRIMENT DE PROJECTES
  // =========================================================================
  function populateDynamicFilterOptions() {
    const subjects = [...new Set(state.projects.map((p) => p.subject).filter(Boolean))];
    const professors = [...new Set(state.projects.map((p) => p.professor).filter(Boolean))];

    const subSel = document.getElementById("filter-subject");
    const profSel = document.getElementById("filter-professor");

    if (subSel) {
      const prev = subSel.value;
      subSel.innerHTML =
        `<option value="">Totes les assignatures</option>` +
        subjects.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
      subSel.value = ui.filters.subject || prev;
    }

    if (profSel) {
      const prev = profSel.value;
      profSel.innerHTML =
        `<option value="">Tots els professors</option>` +
        professors.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
      profSel.value = ui.filters.professor || prev;
    }
  }

  function getFilteredProjects() {
    const q = ui.searchQuery.trim().toLowerCase();
    let list = state.projects.filter((proj) => {
      const owner = getStudentById(proj.ownerId);
      if (proj.archived) return false;
      if (ui.selectedCategory !== "General" && proj.category !== ui.selectedCategory) return false;
      if (ui.filters.status === "active" && proj.status !== "In progress") return false;
      if (ui.filters.status !== "active" && ui.filters.status !== "all" && proj.status !== ui.filters.status) {
        return false;
      }
      if (ui.filters.subject && proj.subject !== ui.filters.subject) return false;
      if (ui.filters.professor && proj.professor !== ui.filters.professor) return false;
      if (ui.filters.year && proj.year !== ui.filters.year) return false;
      if (ui.filters.stage && proj.stage !== ui.filters.stage) return false;
      if (ui.filters.teamType && proj.teamType !== ui.filters.teamType) return false;
      if (ui.filters.urgentOnly && getDaysUntilDeadline(proj.deadline) > 7) return false;

      if (q) {
        const haystack = [
          proj.title,
          proj.category,
          proj.subject,
          proj.professor,
          proj.description,
          owner?.name || "",
          ...(proj.participants || [])
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (ui.sortBy === "deadline") {
        return getDaysUntilDeadline(a.deadline) - getDaysUntilDeadline(b.deadline);
      }
      if (ui.sortBy === "recent") {
        return (b.createdTimestamp || 0) - (a.createdTimestamp || 0) || new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (ui.sortBy === "needs_feedback") {
        const ca = state.comments.filter((c) => c.projectId === a.id).length;
        const cb = state.comments.filter((c) => c.projectId === b.id).length;
        return ca - cb;
      }
      if (ui.sortBy === "discussed") {
        const ca = state.comments.filter((c) => c.projectId === a.id).length;
        const cb = state.comments.filter((c) => c.projectId === b.id).length;
        return cb - ca;
      }
      return computeProjectVisibilityScore(b) - computeProjectVisibilityScore(a);
    });

    return list;
  }

  function updateActiveFilterBadge() {
    let count = 0;
    if (ui.filters.subject) count++;
    if (ui.filters.professor) count++;
    if (ui.filters.year) count++;
    if (ui.filters.stage) count++;
    if (ui.filters.teamType) count++;
    if (ui.filters.status !== "active") count++;
    if (ui.filters.urgentOnly) count++;

    const badge = document.getElementById("active-filter-count");
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle("hidden", count === 0);
    }
  }

  function animateCategoryResults(...elements) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    elements.filter(Boolean).forEach((element) => {
      element.classList.remove("category-results-enter");
      void element.offsetWidth;
      element.classList.add("category-results-enter");
    });
  }

  function getSearchMatchedStudents(query) {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (normalizedQuery.length < 2) return [];

    return state.students
      .filter(
        (student) =>
          student.id !== state.currentUserId &&
          [student.name, student.email].some((value) =>
            typeof value === "string" && value.toLocaleLowerCase().includes(normalizedQuery)
          )
      )
      .sort((a, b) => {
        const score = (student) => {
          const name = (student.name || "").toLocaleLowerCase();
          const email = (student.email || "").toLocaleLowerCase();
          if (name === normalizedQuery || email === normalizedQuery) return 0;
          if (name.startsWith(normalizedQuery) || email.startsWith(normalizedQuery)) return 1;
          return 2;
        };
        return score(a) - score(b) || (a.name || "").localeCompare(b.name || "");
      });
  }

  function renderProjectCardMarkup(proj) {
    const owner = getStudentById(proj.ownerId);
    const commentsCount = state.comments.filter((comment) => comment.projectId === proj.id).length;
    const daysLeft = getDaysUntilDeadline(proj.deadline);
    const isUrgent = daysLeft >= 0 && daysLeft <= 5 && proj.status === "In progress";
    const deadlineLabel =
      daysLeft < 0 ? "Entregat" : daysLeft === 0 ? "Avui" : `Entrega en ${daysLeft}d`;

    return `
      <article class="masonry-card ${proj.aspect || "span-portrait"} ${isProjectCoverFramed(proj) ? "framed-cover" : ""}" tabindex="0" role="button" aria-label="Obrir projecte ${escapeHtml(proj.title)}" data-open-project="${escapeHtml(proj.id)}">
        <img src="${escapeHtml(proj.cover)}" alt="${escapeHtml(proj.title)}" loading="lazy" />
        <div class="card-overlay">
          <div class="overlay-top">
            <span class="overlay-badge">${escapeHtml(proj.category)}</span>
            ${isUrgent ? `<span class="overlay-urgent">Feedback urgent</span>` : ""}
          </div>
          <div class="overlay-bottom">
            <h3>${userContentMarkup(proj.title)}</h3>
            <div class="overlay-meta">
              <span>${escapeHtml(owner.name)}</span>
              <span>${deadlineLabel} · ${commentsCount} comentaris</span>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function renderUserSearchResults(students) {
    const resultContainer = document.getElementById("user-search-results");
    const availableProjects = state.projects
      .filter((project) => !project.archived)
      .sort(
        (a, b) =>
          (b.createdTimestamp || 0) - (a.createdTimestamp || 0) ||
          new Date(b.createdAt) - new Date(a.createdAt)
      );

    resultContainer.innerHTML = students
      .map((student) => {
        const portfolioProjects = availableProjects.filter(
          (project) =>
            isProjectParticipant(project, student.id) &&
            !isProjectHiddenFromPortfolio(project, student.id)
        );
        const publishedProjects = availableProjects.filter((project) => project.ownerId === student.id);
        const participatedProjects = availableProjects.filter(
          (project) => project.ownerId !== student.id && isProjectParticipant(project, student.id)
        );
        const commentedProjectIds = new Set(
          state.comments
            .filter((comment) => comment.authorId === student.id)
            .map((comment) => comment.projectId)
        );
        const commentedProjects = availableProjects.filter((project) => commentedProjectIds.has(project.id));
        const countLabel = `${portfolioProjects.length} ${portfolioProjects.length === 1 ? "projecte" : "projectes"}`;
        const renderProjectSection = (title, projects, isCommented = false) =>
          projects.length
            ? `<section class="user-search-project-section">
                <h2 class="user-search-section-title ${isCommented ? "user-search-commented-title" : ""}">${title}</h2>
                <div class="masonry-container user-search-project-grid">${projects.map(renderProjectCardMarkup).join("")}</div>
              </section>`
            : "";

        return `
          <article class="user-search-result">
            <div class="user-search-profile-card">
              <div class="user-search-profile-info">
                <img src="${escapeHtml(student.avatar)}" alt="${escapeHtml(student.name)}" />
                <div>
                  <strong>${escapeHtml(student.name)}</strong>
                  <span>${countLabel}</span>
                </div>
              </div>
              <button type="button" class="chip-action-btn" data-open-profile="${escapeHtml(student.id)}">Veure portafoli</button>
            </div>
            ${renderProjectSection("Projectes publicats", publishedProjects)}
            ${renderProjectSection("Projectes on participa", participatedProjects)}
            ${renderProjectSection("Ha comentat", commentedProjects, true)}
          </article>
        `;
      })
      .join("");
  }

  function renderDiscoverView({ animateCategory = false } = {}) {
    updateActiveFilterBadge();
    const activeCategoryLabel = document.getElementById("active-category-label");
    if (activeCategoryLabel) {
      activeCategoryLabel.textContent = ui.filters.urgentOnly ? "Prioritaris" : ui.selectedCategory;
    }

    const grid = document.getElementById("projects-masonry-grid");
    const empty = document.getElementById("projects-empty-state");
    const loadMoreWrap = document.getElementById("load-more-container");
    const userResults = document.getElementById("user-search-results");
    const matchingStudents = getSearchMatchedStudents(ui.searchQuery);
    if (matchingStudents.length) {
      renderUserSearchResults(matchingStudents);
      userResults.classList.remove("hidden");
      grid.classList.add("hidden");
      empty.classList.add("hidden");
      loadMoreWrap.classList.add("hidden");
      if (animateCategory) animateCategoryResults(userResults);
      return;
    }

    userResults.classList.add("hidden");
    userResults.innerHTML = "";
    grid.classList.remove("hidden");
    const filtered = getFilteredProjects();
    const slice = filtered.slice(0, ui.visibleCount);

    if (filtered.length === 0) {
      grid.innerHTML = "";
      empty.classList.remove("hidden");
      loadMoreWrap.classList.add("hidden");
      if (animateCategory) animateCategoryResults(grid, empty);
      return;
    }

    empty.classList.add("hidden");
    loadMoreWrap.classList.toggle("hidden", filtered.length <= ui.visibleCount);

    grid.innerHTML = slice.map(renderProjectCardMarkup).join("");
    if (animateCategory) animateCategoryResults(grid, loadMoreWrap);
  }

  // =========================================================================
  // 7. DETALL DEL PROJECTE I FEEDBACK ENTRE IGUALS
  // =========================================================================
  const STAGE_LABELS = {
    "Initial idea": "1. Idea inicial",
    "Research and references": "2. Recerca i referències",
    "Pre-production": "3. Preproducció",
    "Production": "4. Producció",
    "Post-production": "5. Postproducció",
    "Final review": "6. Revisió final"
  };

  function updateProjectDetailStickyTop() {
    const projectDetailPage = document.querySelector("#view-project-detail .project-detail-page");
    if (!projectDetailPage) return;
    const navigationHeight = document.querySelector(".top-nav")?.getBoundingClientRect().height || 0;
    projectDetailPage.style.setProperty("--project-detail-sticky-top", `${Math.ceil(navigationHeight + 16)}px`);
  }

  function renderProjectDetailView() {
    if (!state.projectsLoaded) return;
    const container = document.getElementById("view-project-detail");
    const proj = state.projects.find((p) => p.id === ui.activeProjectId);
    if (!proj) {
      navigateTo("discover");
      return;
    }

    const owner = getStudentById(proj.ownerId);
    const currentUser = getCurrentUser();
    const isOwner = proj.ownerId === currentUser.id;
    const isParticipant = isProjectParticipant(proj, currentUser.id);
    const projectPortfolioUserIds = new Set(
      [proj.ownerId, ...getProjectParticipantIds(proj)].filter((id) => typeof id === "string" && id)
    );
    const hasOtherPortfolioUsers = [...projectPortfolioUserIds].some((id) => id !== currentUser.id);
    const canManage = canManageProject(proj, currentUser.id);
    const isHiddenFromMyPortfolio = isProjectHiddenFromPortfolio(proj, currentUser.id);
    const projectComments = state.comments.filter((c) => c.projectId === proj.id);

    const projectMediaImages = (Array.isArray(proj.mediaImages) ? proj.mediaImages : [])
      .filter((image) => image && image.id && image.src);
    const selectedPhotoReferences = new Set();

    const projectMediaColumns = [[], []];
    const projectMediaColumnHeights = [0, 0];
    const wideProjectMediaImages = [];

    const projectMediaImageMarkup = (image) => `
      <figure class="project-gallery-frame project-gallery-photo" id="project-media-${escapeHtml(image.id)}" tabindex="-1">
        <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.name || `Imatge del projecte ${proj.title}`)}" loading="lazy" />
        <button type="button" class="project-gallery-comment-action" data-comment-project-photo="${escapeHtml(image.id)}" hidden>Comenta l'imatge</button>
      </figure>
    `;

    projectMediaImages.forEach((image) => {
      const width = Number(image.width);
      const height = Number(image.height);
      const hasDimensions = Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
      if (hasDimensions && width > height) {
        wideProjectMediaImages.push(image);
        return;
      }
      const columnIndex = projectMediaColumnHeights[0] <= projectMediaColumnHeights[1] ? 0 : 1;
      projectMediaColumns[columnIndex].push(image);
      projectMediaColumnHeights[columnIndex] += hasDimensions ? height / width : 0.75;
    });

    const narrowMediaCount = projectMediaColumns.reduce((count, column) => count + column.length, 0);
    if (narrowMediaCount === 1) {
      wideProjectMediaImages.push(projectMediaColumns[0].pop() || projectMediaColumns[1].pop());
    }

    const projectMediaGridColumns =
      projectMediaColumnHeights[0] > 0 && projectMediaColumnHeights[1] > 0
        ? `${projectMediaColumnHeights[1]}fr ${projectMediaColumnHeights[0]}fr`
        : "1fr 1fr";

    const participantDetails = Array.isArray(proj.participantDetails)
      ? proj.participantDetails.filter((participant) => participant && typeof participant === "object")
      : [];
    const projectParticipants = [
      ...new Set([
        owner.name,
        ...(Array.isArray(proj.participants) ? proj.participants : []).filter(Boolean),
        ...participantDetails.map((participant) => participant.name).filter(Boolean)
      ])
    ];

    const projectParticipantsMarkup = projectParticipants
      .map((name) => {
        const participantDetail = participantDetails.find(
          (detail) =>
            (typeof detail.name === "string" &&
              detail.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase()) ||
            (detail.id && getStudentById(detail.id).name === name)
        );
        const participant =
          state.students.find((student) => student.id === participantDetail?.id) ||
          getStudentByName(name);
        const initials = name
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0] || "")
          .join("")
          .toUpperCase();
        const avatar = participant?.avatar
          ? `<img src="${escapeHtml(participant.avatar)}" alt="" />`
          : `<span class="detail-participant-initials" aria-hidden="true">${escapeHtml(initials)}</span>`;
        const role = name === owner.name ? "Autor/a" : participantDetail?.role || "Participant";
        const roleMarkup = participantDetail?.role ? userContentMarkup(role) : role;
        const avatarMarkup = participant
          ? `<button type="button" class="detail-participant-profile" data-open-profile="${escapeHtml(participant.id)}" aria-label="Obrir perfil">${avatar}</button>`
          : avatar;
        const nameMarkup = participant
          ? `<button type="button" class="detail-participant-name-trigger" data-open-profile="${escapeHtml(participant.id)}">${escapeHtml(name)}</button>`
          : escapeHtml(name);
        return `<div class="detail-participant">${avatarMarkup}<span class="detail-participant-name">${nameMarkup}<small>${roleMarkup}</small></span></div>`;
      })
      .join("");

    const projectAspectRatios = {
      portrait: "3/4",
      tall: "3/4",
      "span-portrait": "3/4",
      "span-tall": "3/4",
      square: "1/1",
      "span-square": "1/1",
      landscape: "16/9",
      wide: "16/9",
      "span-landscape": "16/9",
      "span-wide": "16/9"
    };
    const coverAspectRatio = projectAspectRatios[proj.aspect] || "3/4";

    const complementaryInfo = [
      proj.professor && `<div><span>Professor/a</span><strong>${userContentMarkup(proj.professor)}</strong></div>`,
      proj.year && `<div><span>Curs acadèmic</span><strong>${escapeHtml(proj.year)}</strong></div>`,
      proj.deadline && `<div><span>Data límit</span><strong>${escapeHtml(proj.deadline)}</strong></div>`
    ]
      .filter(Boolean)
      .join("");

    container.innerHTML = `
      <div class="page-container project-detail-page">
        <section class="project-detail-main" aria-label="Projecte i galeria">
          <div class="detail-layout">
            <div class="project-gallery-column">
              <div class="project-gallery-stack" aria-label="Galeria d'imatges del projecte">
                <figure class="project-gallery-frame project-gallery-cover ${isProjectCoverFramed(proj) ? "framed-cover" : ""}" style="--project-gallery-ratio: ${coverAspectRatio}">
                  <img src="${escapeHtml(proj.cover)}" alt="${escapeHtml(proj.title)}" />
                </figure>
                ${
                  projectMediaImages.length
                    ? `<div class="project-gallery-secondary">
                        ${
                          projectMediaColumns.some((column) => column.length)
                            ? `<div class="project-gallery-mosaic" style="grid-template-columns: ${projectMediaGridColumns}">
                                ${projectMediaColumns
                                  .map(
                                    (column) =>
                                      `<div class="project-gallery-mosaic-column">${column.map(projectMediaImageMarkup).join("")}</div>`
                                  )
                                  .join("")}
                              </div>`
                            : ""
                        }
                        ${
                          wideProjectMediaImages.length
                            ? `<div class="project-gallery-wide-stack">${wideProjectMediaImages.map(projectMediaImageMarkup).join("")}</div>`
                            : ""
                        }
                      </div>`
                    : ""
                }
              </div>
            </div>

            <aside class="detail-info-card">
              <div class="detail-info-heading">
                <div class="detail-project-badges">
                  <span class="pill-tag">${escapeHtml(proj.category)}</span>
                  ${proj.stage ? `<span class="pill-tag">${escapeHtml(STAGE_LABELS[proj.stage] || proj.stage)}</span>` : ""}
                </div>
                <span class="pill-tag ${proj.status === "In progress" ? "" : "success"}">${escapeHtml(proj.status)}</span>
              </div>

              <h1 class="detail-project-title">${userContentMarkup(proj.title)}</h1>

              <div class="detail-participants">
                <h2>Autoria i participants</h2>
                <div class="detail-participant-list">${projectParticipantsMarkup}</div>
              </div>

              <p class="detail-project-description">${userContentMarkup(proj.description)}</p>

              <div class="detail-project-facts">
                ${proj.subject ? `<div><span>Assignatura</span><strong>${escapeHtml(proj.subject)}</strong></div>` : ""}
                <div><span>Modalitat</span><strong>${proj.teamType === "group" ? "Treball en grup" : "Individual"}</strong></div>
              </div>

              ${
                proj.briefing || proj.feedbackType
                  ? `<details class="detail-project-notes">
                      <summary>Briefing i feedback buscat</summary>
                      ${proj.briefing ? `<p><strong>Objectius:</strong> ${userContentMarkup(proj.briefing)}</p>` : ""}
                      ${proj.feedbackType ? `<p><strong>Feedback:</strong> ${userContentMarkup(proj.feedbackType)}</p>` : ""}
                    </details>`
                  : ""
              }

              ${
                proj.teamType === "group" && proj.seekingCollaborator
                    ? `<div class="detail-collaborator-request">
                        <div class="detail-collaborator-content">
                          <div><span>Es busca col·laboració</span><strong>${proj.collaboratorRole ? userContentMarkup(proj.collaboratorRole) : "Rol per concretar"}</strong></div>
                          <div class="detail-collaboration-meta">
                            ${proj.collaborationStartDate || proj.collaborationEndDate ? `<span>Període: ${escapeHtml(proj.collaborationStartDate || "A concretar")} → ${escapeHtml(proj.collaborationEndDate || "A concretar")}</span>` : ""}
                            ${proj.collaborationCompensation ? `<span>${escapeHtml(proj.collaborationCompensation)}</span>` : ""}
                            ${proj.collaborationLocation ? `<span>${escapeHtml(proj.collaborationLocation)}</span>` : ""}
                            ${proj.collaborationPlace ? `<span>Ubicació: ${userContentMarkup(proj.collaborationPlace)}</span>` : ""}
                            ${proj.collaborationTransport ? `<span>Transport: ${escapeHtml(proj.collaborationTransport)}</span>` : ""}
                            ${proj.collaborationExpenses ? `<span>Dietes: ${escapeHtml(proj.collaborationExpenses)}</span>` : ""}
                          </div>
                          ${proj.collaborationDetails ? `<p class="detail-collaborator-details">${userContentMarkup(proj.collaborationDetails)}</p>` : ""}
                        </div>
                        <button type="button" class="btn-secondary" data-contact-owner="${escapeHtml(owner.id)}">Contactar</button>
                      </div>`
                  : ""
              }

              ${proj.mediaUrl ? `<a href="${escapeHtml(proj.mediaUrl)}" target="_blank" rel="noopener" class="detail-media-link">Obrir material multimèdia &nearr;</a>` : ""}

              <div class="detail-project-actions">
                ${
                  canManage
                    ? `<button type="button" class="btn-secondary-pill" id="edit-project-btn">Editar projecte</button>`
                    : ""
                }
                ${
                  isOwner
                    ? `<select id="owner-status-select" class="pill-select" aria-label="Canviar estat del projecte">
                         <option value="In progress" ${proj.status === "In progress" ? "selected" : ""}>En curs</option>
                         <option value="Submitted" ${proj.status === "Submitted" ? "selected" : ""}>Entregat (+5 pts)</option>
                         <option value="Resolved" ${proj.status === "Resolved" ? "selected" : ""}>Resolt (+5 pts)</option>
                       </select>`
                    : ""
                }
                <button type="button" class="btn-primary" id="detail-comment-action">Comentar</button>
              </div>
            </aside>
          </div>
        </section>

        <section class="feedback-section" id="project-comments-section" aria-label="Comentaris del projecte">
          <div class="feedback-header">
            <h2 style="margin:0;font-size:19px;">Comentaris i feedback (${projectComments.length})</h2>
            <select id="comment-sort-select" class="pill-select" aria-label="Ordenar comentaris">
              <option value="useful">Més útils (valoració autor)</option>
              <option value="seconded">Més secundats</option>
              <option value="recent">Més recents</option>
            </select>
          </div>

          <form id="add-comment-form" class="comment-composer">
            <textarea id="new-comment-text" rows="3" placeholder="Escriu una crítica constructiva, suggeriment tècnic o referència útil (mínim 20 caràcters per obtenir punts)..." required></textarea>
            ${
              projectMediaImages.length
                ? `<div class="comment-photo-linking" id="comment-photo-linking" hidden>
                     <div class="comment-photo-reference-list" id="comment-photo-reference-list"></div>
                     <button type="button" id="comment-photo-reference-clear">Treure totes</button>
                   </div>`
                : ""
            }
            <div class="composer-footer">
              <span style="font-size:12px; color:var(--text-secondary);">
                ${
                  isOwner
                    ? "Ets l'autor/a d'aquest projecte (pots valorar la utilitat dels comentaris d'1 a 5 estrelles)."
                    : "Primer comentari: +15 pts · segon: +10 pts · tercer: +7 pts · a partir del quart: +5 pts."
                }
              </span>
              <button type="submit" class="btn-primary">Publicar feedback</button>
            </div>
          </form>

          <div class="comment-list" id="project-comments-list"></div>
        </section>

        ${
          complementaryInfo
            ? `<section class="project-complementary-info" aria-label="Informació acadèmica complementària">
                <h2>Informació complementària</h2>
                <div>${complementaryInfo}</div>
              </section>`
            : ""
        }

        ${
          canManage || isParticipant
            ? `<section class="project-management-section" id="project-management-section" aria-label="Gestionar projecte">
                <div>
                  <h2>Gestionar projecte i portafoli</h2>
                  <p>${hasOtherPortfolioUsers ? "Pots amagar-lo només del teu portafoli. Les accions per a tothom afecten tots els participants i les llistes públiques." : "Les accions per a tothom afecten les llistes públiques."}</p>
                </div>
                <div class="project-management-actions">
                  ${
                    isParticipant && hasOtherPortfolioUsers
                      ? `<button type="button" class="btn-secondary-pill" id="toggle-my-project-portfolio">${isHiddenFromMyPortfolio ? "Tornar a afegir al meu portafoli" : "Arxivar només al meu portafoli"}</button>`
                      : ""
                  }
                  ${
                    canManage
                      ? `<button type="button" class="btn-secondary-pill" id="archive-project-btn">${proj.archived ? "Desarxivar per a tothom" : "Arxivar per a tothom"}</button>
                         <button type="button" class="project-delete-btn" id="delete-project-btn">Eliminar per a tothom</button>`
                      : ""
                  }
                </div>
              </section>`
            : ""
        }
      </div>
    `;

    updateProjectDetailStickyTop();

    document.getElementById("detail-comment-action").addEventListener("click", () => {
      document.getElementById("project-comments-section").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    const galleryStack = document.querySelector(".project-gallery-stack");
    if (galleryStack) {
      galleryStack.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        const commentAction = target.closest("[data-comment-project-photo]");
        if (commentAction) {
          const imageId = commentAction.dataset.commentProjectPhoto;
          const image = projectMediaImages.find((projectImage) => projectImage.id === imageId);
          if (!image) return;
          selectedPhotoReferences.add(image.id);
          renderCommentPhotoReferences();
          document.getElementById("project-comments-section").scrollIntoView({ behavior: "smooth", block: "start" });
          requestAnimationFrame(() => document.getElementById("new-comment-text").focus({ preventScroll: true }));
          return;
        }
        const photo = target.closest(".project-gallery-photo");
        if (!photo) return;
        galleryStack.querySelectorAll(".project-gallery-comment-action").forEach((button) => {
          button.hidden = true;
        });
        const actionButton = photo.querySelector(".project-gallery-comment-action");
        if (actionButton) {
          actionButton.hidden = false;
          actionButton.focus({ preventScroll: true });
        }
      });
    }

    const renderCommentPhotoReferences = () => {
      const linking = document.getElementById("comment-photo-linking");
      const referenceList = document.getElementById("comment-photo-reference-list");
      if (!linking || !referenceList) return;
      const selectedImages = projectMediaImages.filter((image) => selectedPhotoReferences.has(image.id));
      referenceList.innerHTML = selectedImages
        .map(
          (image) => `
            <div class="comment-photo-reference-chip">
              <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.name || "Fotografia referenciada")}" />
              <span>${escapeHtml(image.name || "Fotografia del projecte")}</span>
              <button type="button" data-remove-comment-photo="${escapeHtml(image.id)}" aria-label="Treure ${escapeHtml(image.name || "fotografia")}">&times;</button>
            </div>
          `
        )
        .join("");
      linking.hidden = selectedImages.length === 0;
    };

    document.getElementById("comment-photo-reference-list")?.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const removeButton = event.target.closest("[data-remove-comment-photo]");
      if (!removeButton) return;
      selectedPhotoReferences.delete(removeButton.dataset.removeCommentPhoto);
      renderCommentPhotoReferences();
    });

    document.getElementById("comment-photo-reference-clear")?.addEventListener("click", () => {
      selectedPhotoReferences.clear();
      renderCommentPhotoReferences();
    });

    const editBtn = document.getElementById("edit-project-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        if (!canManageProject(proj, currentUser.id)) {
          showToast("No tens permís per editar aquest projecte.");
          return;
        }
        openEditProjectModal(proj);
      });
    }

    const myPortfolioButton = document.getElementById("toggle-my-project-portfolio");
    if (myPortfolioButton) {
      myPortfolioButton.addEventListener("click", async () => {
        if (!isProjectParticipant(proj, currentUser.id)) {
          showToast("Només els participants poden canviar el seu portafoli.");
          return;
        }
        await updateDoc(doc(db, "projects", proj.id), {
          hiddenFromPortfolioBy: isHiddenFromMyPortfolio
            ? arrayRemove(currentUser.id)
            : arrayUnion(currentUser.id)
        });
        showToast(isHiddenFromMyPortfolio ? "Projecte afegit al teu portafoli." : "Projecte arxivat només al teu portafoli.");
      });
    }

    const statusSel = document.getElementById("owner-status-select");
    if (statusSel) {
      statusSel.addEventListener("change", async (e) => {
        const newStatus = e.target.value;
        await updateDoc(doc(db, "projects", proj.id), { status: newStatus });
        if (newStatus === "Submitted") {
          await awardPoints(currentUser.id, `submit-${proj.id}`, 5, `Projecte entregat: ${proj.title}`);
        } else if (newStatus === "Resolved") {
          await awardPoints(currentUser.id, `resolve-${proj.id}`, 5, `Projecte resolt: ${proj.title}`);
        }
      });
    }

    const archiveProjectButton = document.getElementById("archive-project-btn");
    if (archiveProjectButton) {
      archiveProjectButton.addEventListener("click", async () => {
        if (!canManageProject(proj, currentUser.id)) {
          showToast("No tens permís per arxivar aquest projecte per a tothom.");
          return;
        }
        const nextArchived = !Boolean(proj.archived);
        await updateDoc(doc(db, "projects", proj.id), { archived: nextArchived });
        showToast(nextArchived ? "Projecte arxivat per a tothom." : "Projecte desarxivat per a tothom.");
      });
    }

    const deleteProjectButton = document.getElementById("delete-project-btn");
    if (deleteProjectButton) {
      deleteProjectButton.addEventListener("click", async () => {
        if (!canManageProject(proj, currentUser.id)) {
          showToast("No tens permís per eliminar aquest projecte per a tothom.");
          return;
        }
        if (!window.confirm(`Vols eliminar definitivament «${proj.title}»? També s'eliminaran els comentaris d'aquest projecte.`)) return;
        await deleteDoc(doc(db, "projects", proj.id));
        const relatedComments = state.comments.filter((c) => c.projectId === proj.id);
        for (const c of relatedComments) {
          await deleteDoc(doc(db, "comments", c.id));
        }
        await setDoc(
          doc(db, "students", owner.id),
          { projectsCount: Math.max(0, (owner.projectsCount || 1) - 1) },
          { merge: true }
        );
        navigateTo("discover");
        showToast("Projecte eliminat.");
      });
    }

    document.getElementById("comment-sort-select").addEventListener("change", (e) => {
      renderCommentsList(proj, e.target.value);
    });

    document.getElementById("add-comment-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const textarea = document.getElementById("new-comment-text");
      const text = textarea.value.trim();
      if (text.length < 10) {
        showToast("Escriu un comentari més detallat (mínim 10 caràcters).");
        return;
      }

      const priorCount = state.comments.filter((c) => c.projectId === proj.id).length;
      const photoReferenceIds = [...selectedPhotoReferences];
      const commentId = "com-" + Date.now();
      const newComment = {
        id: commentId,
        projectId: proj.id,
        authorId: currentUser.id,
        text,
        mediaImageIds: photoReferenceIds,
        mediaImageId: photoReferenceIds[0] || "",
        createdAt: new Date().toLocaleTimeString("ca-ES", { hour: "2-digit", minute: "2-digit" }),
        createdTimestamp: Date.now(),
        secondedBy: [],
        usefulnessRating: 0,
        authorCommentCounted: !isOwner
      };

      const commentBatch = writeBatch(db);
      commentBatch.set(doc(db, "comments", commentId), newComment);
      if (!isOwner) {
        commentBatch.set(
          doc(db, "students", currentUser.id),
          { commentsCount: increment(1) },
          { merge: true }
        );
      }
      await commentBatch.commit();

      if (!isOwner && text.length >= 20) {
        const reward =
          priorCount === 0
            ? COMMENT_REWARDS.first
            : priorCount === 1
            ? COMMENT_REWARDS.second
            : priorCount === 2
            ? COMMENT_REWARDS.third
            : COMMENT_REWARDS.subsequent;
        await awardPoints(currentUser.id, `comment-${commentId}`, reward, `Feedback nº${priorCount + 1} a "${proj.title}"`);
      }

      if (proj.ownerId !== currentUser.id) {
        await pushNotification(proj.ownerId, `${currentUser.name} ha deixat feedback al teu projecte "${proj.title}"`, "project", proj.id);
      }
      textarea.value = "";
      selectedPhotoReferences.clear();
      renderCommentPhotoReferences();
    });

    renderCommentsList(proj, "useful");
  }

  function renderCommentsList(proj, sortBy) {
    const listEl = document.getElementById("project-comments-list");
    if (!listEl) return;

    const currentUser = getCurrentUser();
    const isProjectOwner = proj.ownerId === currentUser.id;
    const projectMediaImages = (Array.isArray(proj.mediaImages) ? proj.mediaImages : [])
      .filter((image) => image && image.id && image.src);

    let comments = state.comments.filter((c) => c.projectId === proj.id);
    comments.sort((a, b) => {
      if (sortBy === "useful") return (b.usefulnessRating || 0) - (a.usefulnessRating || 0);
      if (sortBy === "seconded") return (b.secondedBy?.length || 0) - (a.secondedBy?.length || 0);
      return (b.createdTimestamp || 0) - (a.createdTimestamp || 0);
    });

    if (comments.length === 0) {
      listEl.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:24px;">Encara no hi ha comentaris. Sigues el primer a ajudar aquest projecte!</p>`;
      return;
    }

    listEl.innerHTML = comments
      .map((c) => {
        const author = getStudentById(c.authorId);
        const secondedBy = Array.isArray(c.secondedBy) ? c.secondedBy : [];
        const isSeconded = secondedBy.includes(currentUser.id);
        const canRate = isProjectOwner && c.authorId !== currentUser.id;
        const referencedImageIds =
          Array.isArray(c.mediaImageIds) && c.mediaImageIds.length
            ? c.mediaImageIds
            : c.mediaImageId
              ? [c.mediaImageId]
              : [];
        const referencedImages = [...new Set(referencedImageIds)]
          .map((imageId) => projectMediaImages.find((image) => image.id === imageId))
          .filter(Boolean);
        const referencedImage = referencedImages[0];

        const starsHtml = [1, 2, 3, 4, 5]
          .map((star) => {
            const filled = star <= (c.usefulnessRating || 0);
            return `<button type="button" class="star-btn ${filled ? "filled" : ""}" ${canRate ? `data-rate-comment="${c.id}" data-star="${star}"` : "disabled"} title="${star} estrelles">&#9733;</button>`;
          })
          .join("");

        return `
          <div class="comment-card" id="project-comment-${escapeHtml(c.id)}">
            <div class="comment-top">
              <div class="comment-author" style="cursor:pointer;" data-open-profile="${author.id}">
                <img src="${escapeHtml(author.avatar)}" alt="${escapeHtml(author.name)}" />
                <div>
                  <strong style="font-size: 13.5px;">${escapeHtml(author.name)}</strong>
                  <span style="display:block;font-size: 11.5px;color:var(--text-muted);">${escapeHtml(author.year)} · ${escapeHtml(c.createdAt)}</span>
                </div>
              </div>
              <div class="star-rating-bar" title="Valoració d'utilitat per l'autor del projecte">
                <span>Utilitat:</span>
                ${starsHtml}
              </div>
            </div>
            <p style="margin:0;font-size: 13.5px; line-height:1.55;">${userContentMarkup(c.text)}</p>
            ${
              referencedImages.length
                ? `<div class="comment-photo-references">
                    ${referencedImages
                      .map(
                        (image) => `<button type="button" class="comment-photo-reference" data-open-project-photo="${escapeHtml(image.id)}" data-project-id="${escapeHtml(proj.id)}">
                          <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.name || "Fotografia referenciada")}" />
                          <span>Fotografia referenciada: <strong>${escapeHtml(image.name || "Fotografia del projecte")}</strong></span>
                        </button>`
                      )
                      .join("")}
                  </div>`
                : ""
            }
            <div class="comment-actions">
              <div class="comment-btn-group">
                <button type="button" class="chip-action-btn ${isSeconded ? "active" : ""}" data-second-comment="${c.id}">
                  &#9650; Secundo (${secondedBy.length})
                </button>
                ${
                  c.authorId !== currentUser.id
                    ? `<button type="button" class="chip-action-btn" data-private-reply="${c.authorId}" data-ref-project="${proj.id}" data-ref-comment="${c.id}" data-ref-photo="${referencedImage ? escapeHtml(referencedImage.id) : ""}" data-ref-photo-label="${referencedImage ? escapeHtml(referencedImage.name || "Fotografia del projecte") : ""}" data-ref-label="Comentari a: ${escapeHtml(proj.title)}">
                        Respondre en privat
                      </button>`
                    : ""
                }
              </div>
              ${c.usefulnessRating >= 4 ? `<span class="pill-tag success">Feedback destacat</span>` : ""}
            </div>
          </div>
        `;
      })
      .join("");

    listEl.querySelectorAll("[data-second-comment]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const com = state.comments.find((item) => item.id === btn.dataset.secondComment);
        if (!com) return;
        if (com.authorId === currentUser.id) {
          showToast("No pots secundar el teu propi comentari.");
          return;
        }
        const secondedBy = Array.isArray(com.secondedBy) ? [...com.secondedBy] : [];
        const idx = secondedBy.indexOf(currentUser.id);
        if (idx === -1) {
          secondedBy.push(currentUser.id);
          await updateDoc(doc(db, "comments", com.id), { secondedBy });
          const author = getStudentById(com.authorId);
          await setDoc(
            doc(db, "students", com.authorId),
            { secondedCount: (author.secondedCount || 0) + 1 },
            { merge: true }
          );
          await awardPoints(com.authorId, `second-${com.id}-${currentUser.id}`, 2, `Comentari secundat per ${currentUser.name}`);
          await pushNotification(com.authorId, `${currentUser.name} ha secundat el teu comentari a "${proj.title}"`, "project", proj.id);
        } else {
          secondedBy.splice(idx, 1);
          await updateDoc(doc(db, "comments", com.id), { secondedBy });
        }
      });
    });

    listEl.querySelectorAll("[data-rate-comment]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const com = state.comments.find((item) => item.id === btn.dataset.rateComment);
        const stars = Number(btn.dataset.star);
        if (!com || !isProjectOwner) return;
        const commentRef = doc(db, "comments", com.id);
        const ratingResult = await runTransaction(db, async (transaction) => {
          const commentSnapshot = await transaction.get(commentRef);
          if (!commentSnapshot.exists()) return null;

          const latestComment = commentSnapshot.data();
          const authorRef = doc(db, "students", latestComment.authorId);
          const authorSnapshot = await transaction.get(authorRef);
          const author = authorSnapshot.data() || {};
          const commentText = typeof latestComment.text === "string" ? latestComment.text : "";
          const previousRating = Number(latestComment.usefulnessRating) || 0;
          const wasUseful = previousRating >= 4;
          const isUseful = stars >= 4;
          const wasCountedOnCreation =
            latestComment.authorCommentCounted === true ||
            (latestComment.authorCommentCounted == null && commentText.trim().length >= 20);
          const authorUpdate = {};

          if (!wasCountedOnCreation && latestComment.authorId !== proj.ownerId) {
            authorUpdate.commentsCount = (Number(author.commentsCount) || 0) + 1;
          }
          if (wasUseful !== isUseful) {
            authorUpdate.usefulCommentsCount = Math.max(
              0,
              (Number(author.usefulCommentsCount) || 0) + (isUseful ? 1 : -1)
            );
          }

          transaction.update(commentRef, {
            usefulnessRating: stars,
            authorCommentCounted: true
          });
          if (Object.keys(authorUpdate).length) {
            transaction.set(authorRef, authorUpdate, { merge: true });
          }

          return {
            authorId: latestComment.authorId,
            becameUseful: !wasUseful && isUseful
          };
        });
        if (!ratingResult) {
          showToast("No s'ha trobat el comentari que vols valorar.");
          return;
        }
        if (ratingResult.becameUseful) {
          await awardPoints(
            ratingResult.authorId,
            `useful-${com.id}`,
            5,
            `Comentari valorat amb ${stars}★ per ${currentUser.name}`
          );
        }
        await pushNotification(
          ratingResult.authorId,
          `${currentUser.name} ha valorat el teu feedback amb ${stars} estrelles`,
          "project",
          proj.id
        );
      });
    });

    listEl.querySelectorAll("[data-private-reply]").forEach((btn) => {
      btn.addEventListener("click", () => {
        startOrOpenConversation(btn.dataset.privateReply, {
          type: "project",
          id: btn.dataset.refProject,
          label: btn.dataset.refLabel,
          commentId: btn.dataset.refComment,
          mediaImageId: btn.dataset.refPhoto || "",
          mediaImageLabel: btn.dataset.refPhotoLabel || ""
        });
      });
    });
  }

  // =========================================================================
  // 8. POSICIONS OBERTES I COL·LABORACIÓ
  // =========================================================================
  function renderPositionsView() {
    const grid = document.getElementById("positions-list-grid");
    const currentUser = getCurrentUser();

    const projectCollaborations = state.projects
      .filter((project) => project.teamType === "group" && project.seekingCollaborator)
      .map((project) => ({
        id: `project-collaboration-${project.id}`,
        title: `Busquem col·laboració - ${project.collaboratorRole || "Rol per concretar"}`,
        projectTitle: project.title,
        role: project.collaboratorRole || "Altres perfils",
        spots: 1,
        compensation: project.collaborationCompensation || "Academic collaboration",
        startDate: project.collaborationStartDate || project.createdAt || "Actualment",
        endDate: project.collaborationEndDate || project.deadline || "Sense data",
        location: project.collaborationLocation || "Hybrid",
        place: project.collaborationPlace || "",
        transport: project.collaborationTransport || "",
        expenses: project.collaborationExpenses || "",
        projectType: "Academic",
        year: project.year,
        description: [project.collaborationDetails, project.description].filter(Boolean).join("\n\n"),
        ownerId: project.ownerId,
        createdAt: "Oportunitat del projecte",
        status: "Open",
        applications: [],
        projectId: project.id,
        isProjectCollaboration: true
      }));

    const allPositions = [...state.positions, ...projectCollaborations];
    const filtered = allPositions.filter((pos) => {
      if (ui.posFilters.role && pos.role !== ui.posFilters.role) return false;
      if (ui.posFilters.compensation && pos.compensation !== ui.posFilters.compensation) return false;
      if (ui.posFilters.projectType && pos.projectType !== ui.posFilters.projectType) return false;
      if (ui.posFilters.location && pos.location !== ui.posFilters.location) return false;
      if (ui.searchQuery) {
        const q = ui.searchQuery.toLowerCase();
        const text = `${pos.title} ${pos.projectTitle} ${pos.role} ${pos.description}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p class="empty-title">No hi ha posicions obertes amb aquests filtres</p></div>`;
      return;
    }

    grid.innerHTML = filtered
      .map((pos) => {
        const owner = getStudentById(pos.ownerId);
        const isOwner = pos.ownerId === currentUser.id;
        const applications = Array.isArray(pos.applications) ? pos.applications : [];
        const myApp = applications.find((a) => a.applicantId === currentUser.id);

        return `
          <article class="position-card">
            <div>
              <div class="position-card-header">
                <span class="pill-tag">${escapeHtml(pos.role)}</span>
                <span class="pill-tag ${pos.status === "Open" ? "success" : ""}">${pos.status === "Open" ? `${pos.spots} plaça/es` : "Tancada"}</span>
              </div>
              <h3>${userContentMarkup(pos.title)}</h3>
              <div style="font-size:13px; color:var(--text-secondary); font-weight:500;">Projecte: ${userContentMarkup(pos.projectTitle)}</div>
              <div class="position-meta-pills">
                <span class="pill-tag">${escapeHtml(pos.compensation)}</span>
                <span class="pill-tag">${escapeHtml(pos.location)}</span>
                <span class="pill-tag">${escapeHtml(pos.projectType)} · ${escapeHtml(pos.year)}</span>
                <span class="pill-tag">${escapeHtml(pos.startDate)} &rarr; ${escapeHtml(pos.endDate)}</span>
                ${pos.place ? `<span class="pill-tag">Ubicació: ${userContentMarkup(pos.place)}</span>` : ""}
                ${pos.transport ? `<span class="pill-tag">Transport: ${escapeHtml(pos.transport)}</span>` : ""}
                ${pos.expenses ? `<span class="pill-tag">Dietes: ${escapeHtml(pos.expenses)}</span>` : ""}
              </div>
              <p style="font-size: 13.5px; color:var(--text-secondary); margin:8px 0 0;">${userContentMarkup(pos.description)}</p>
            </div>
            <div>
              <div class="position-card-footer">
                <div style="display: flex; align-items:center; gap:8px; cursor:pointer;" data-open-profile="${owner.id}">
                  <img src="${escapeHtml(owner.avatar)}" alt="${escapeHtml(owner.name)}" class="nav-avatar" />
                  <div>
                    <strong style="font-size: 13px; display:block;">${escapeHtml(owner.name)}</strong>
                    <span style="font-size: 11.5px; color:var(--text-muted);">${escapeHtml(pos.createdAt)}</span>
                  </div>
                </div>
                <div>
                  ${
                    pos.isProjectCollaboration
                      ? `<button type="button" class="btn-primary" data-open-project="${escapeHtml(pos.projectId)}">Veure projecte</button>`
                      : isOwner
                      ? `<span class="pill-tag">${applications.length} candidatures</span>`
                      : myApp
                      ? `<span class="pill-tag success">Candidatura: ${escapeHtml(myApp.status)}</span>`
                      : `<button type="button" class="btn-primary" data-apply-pos="${pos.id}">Presentar-me</button>`
                  }
                </div>
              </div>
              ${
                isOwner && applications.length > 0
                  ? `<div class="applicant-drawer">
                      <strong style="font-size:12px;">Candidatures rebudes:</strong>
                      ${applications
                        .map((app) => {
                          const candidate = getStudentById(app.applicantId);
                          return `
                            <div class="applicant-item">
                              <div>
                                <strong>${escapeHtml(candidate.name)}</strong> (${escapeHtml(candidate.year)})
                                <div style="font-size:12px; color:var(--text-secondary);">${userContentMarkup(app.intro)}</div>
                                <div style="font-size:11.5px; color:var(--text-muted);">Habilitats: ${userContentMarkup(app.skills || "No especificat")}</div>
                              </div>
                              <div style="display: flex; gap:6px; align-items:center;">
                                ${
                                  app.status === "Pending"
                                    ? `<button type="button" class="chip-action-btn active" data-app-decision="Accepted" data-pos-id="${pos.id}" data-app-id="${app.id}">Acceptar</button>
                                       <button type="button" class="chip-action-btn" data-app-decision="Rejected" data-pos-id="${pos.id}" data-app-id="${app.id}">Descartar</button>`
                                    : `<span class="pill-tag">${escapeHtml(app.status)}</span>`
                                }
                                <button type="button" class="chip-action-btn" data-private-reply="${candidate.id}" data-ref-project="" data-ref-label="Posició: ${escapeHtml(pos.title)}">Xat</button>
                              </div>
                            </div>
                          `;
                        })
                        .join("")}
                    </div>`
                  : ""
              }
            </div>
          </article>
        `;
      })
      .join("");

    grid.querySelectorAll("[data-apply-pos]").forEach((btn) => {
      btn.addEventListener("click", () => openApplyModal(btn.dataset.applyPos));
    });

    grid.querySelectorAll("[data-app-decision]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const pos = state.positions.find((p) => p.id === btn.dataset.posId);
        if (!pos) return;
        const applications = (pos.applications || []).map((a) =>
          a.id === btn.dataset.appId ? { ...a, status: btn.dataset.appDecision } : a
        );
        const targetApp = applications.find((a) => a.id === btn.dataset.appId);
        await updateDoc(doc(db, "positions", pos.id), { applications });
        if (targetApp) {
          await pushNotification(
            targetApp.applicantId,
            `La teva candidatura a "${pos.title}" ha estat marcada com: ${targetApp.status}`,
            "positions",
            pos.id
          );
          showToast(`Candidatura actualitzada: ${targetApp.status}`);
        }
      });
    });

    grid.querySelectorAll("[data-private-reply]").forEach((btn) => {
      btn.addEventListener("click", () => {
        startOrOpenConversation(btn.dataset.privateReply, {
          type: "position",
          id: "",
          label: btn.dataset.refLabel
        });
      });
    });
  }

  function openApplyModal(posId) {
    const pos = state.positions.find((p) => p.id === posId);
    if (!pos) return;
    const currentUser = getCurrentUser();
    const myProjects = state.projects.filter((p) => p.ownerId === currentUser.id);
    document.getElementById("apply-pos-id").value = pos.id;
    document.getElementById("apply-pos-summary").textContent = `${pos.title} · ${pos.projectTitle}`;
    document.getElementById("apply-portfolio-project").innerHTML =
      `<option value="">Cap projecte seleccionat</option>` +
      myProjects.map((p) => `<option value="${p.id}">${escapeHtml(p.title)}</option>`).join("");
    openModal("modal-apply-position");
  }

  // =========================================================================
  // 9. MISSATGERIA PRIVADA EN TEMPS REAL
  // =========================================================================
  let pendingMessageReference = null;
  const pendingReadConversationIds = new Set();
  const conversationDrafts = new Map();
  const typingIdleTimers = new Map();
  const typingLastUpdateAt = new Map();
  let showArchivedConversations = false;

  function clearLocalTypingState(conversationId) {
    const timer = typingIdleTimers.get(conversationId);
    if (timer) clearTimeout(timer);
    typingIdleTimers.delete(conversationId);
    typingLastUpdateAt.delete(conversationId);
  }

  function stopTypingIndicator(conversationId, userId) {
    clearLocalTypingState(conversationId);
    updateDoc(doc(db, "conversations", conversationId), {
      [`typingUsers.${userId}`]: deleteField()
    }).catch((error) => {
      console.warn("Error aturant l'indicador d'escriptura:", error);
    });
  }

  function updateTypingIndicator(conversationId, userId) {
    const now = Date.now();
    const timer = typingIdleTimers.get(conversationId);
    if (timer) clearTimeout(timer);
    typingIdleTimers.set(
      conversationId,
      setTimeout(() => stopTypingIndicator(conversationId, userId), 2500)
    );

    if (now - (typingLastUpdateAt.get(conversationId) || 0) < 2000) return;
    typingLastUpdateAt.set(conversationId, now);
    updateDoc(doc(db, "conversations", conversationId), {
      [`typingUsers.${userId}`]: now
    }).catch((error) => {
      console.warn("Error actualitzant l'indicador d'escriptura:", error);
    });
  }

  async function markConversationMessagesRead(conversation, userId) {
    if (pendingReadConversationIds.has(conversation.id)) return;
    if (!hasUnreadMessagesForUser(conversation, userId)) return;

    pendingReadConversationIds.add(conversation.id);
    try {
      const conversationRef = doc(db, "conversations", conversation.id);
      const updatedMessages = await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(conversationRef);
        if (!snapshot.exists()) {
          throw new Error(`No s'ha trobat la conversa ${conversation.id}.`);
        }

        const latestConversation = snapshot.data();
        const latestMessages = Array.isArray(latestConversation.messages) ? latestConversation.messages : [];
        if (!hasUnreadMessagesForUser(latestConversation, userId)) return latestMessages;

        const readMessages = latestMessages.map((message) => {
          if (message.senderId === userId) return message;
          const readBy = Array.isArray(message.readBy) ? message.readBy : [];
          return readBy.includes(userId) ? message : { ...message, readBy: [...readBy, userId] };
        });
        transaction.update(conversationRef, { messages: readMessages });
        return readMessages;
      });
      const currentConversation = state.conversations.find((item) => item.id === conversation.id);
      if (currentConversation) currentConversation.messages = updatedMessages;
      updateHeaderChrome();
    } catch (error) {
      console.warn("Error marcant els missatges com a llegits:", error);
      showToast("No s'han pogut marcar els missatges com a llegits.");
    } finally {
      pendingReadConversationIds.delete(conversation.id);
    }
  }

  async function startOrOpenConversation(otherStudentId, contextRef = null) {
    const currentUser = getCurrentUser();
    if (!otherStudentId || otherStudentId === currentUser.id) return;

    let conv = state.conversations.find(
      (c) =>
        Array.isArray(c.participantIds) &&
        c.participantIds.includes(currentUser.id) &&
        c.participantIds.includes(otherStudentId)
    );

    if (!conv) {
      const convId = "conv-" + Date.now();
      conv = {
        id: convId,
        participantIds: [currentUser.id, otherStudentId],
        messages: []
      };
      await setDoc(doc(db, "conversations", convId), conv);
    } else {
      const updates = {};
      if (conv.hiddenFor?.includes(currentUser.id)) {
        updates.hiddenFor = arrayRemove(currentUser.id);
      }
      if (conv.archivedFor?.includes(currentUser.id)) {
        updates.archivedFor = arrayRemove(currentUser.id);
      }
      if (Object.keys(updates).length) {
        try {
          await updateDoc(doc(db, "conversations", conv.id), updates);
          if (updates.hiddenFor) {
            conv.hiddenFor = conv.hiddenFor.filter((userId) => userId !== currentUser.id);
          }
          if (updates.archivedFor) {
            conv.archivedFor = conv.archivedFor.filter((userId) => userId !== currentUser.id);
          }
        } catch (error) {
          console.error("No s'ha pogut recuperar la conversa:", error);
          showToast("No s'ha pogut obrir aquesta conversa.");
          return;
        }
      }
    }

    showArchivedConversations = false;
    updateConversationArchiveToggle();
    pendingMessageReference = contextRef;
    ui.activeConversationId = conv.id;
    navigateTo("messages", conv.id);
  }

  function updateConversationArchiveToggle() {
    const toggle = document.getElementById("chat-archive-toggle");
    const title = document.getElementById("chat-list-title");
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(showArchivedConversations));
      toggle.textContent = showArchivedConversations ? "Tornar als xats" : "Arxivats";
    }
    if (title) title.textContent = showArchivedConversations ? "Arxivats" : "Missatges";
  }

  function getConversationSettingsMarkup(conversation, userId) {
    const isArchived = conversation.archivedFor?.includes(userId) === true;
    const isMuted = conversation.mutedFor?.includes(userId) === true;
    return `
      <button type="button" role="menuitem" data-conversation-action="archive" data-conversation-id="${escapeHtml(conversation.id)}">${isArchived ? "Desarxivar xat" : "Arxivar xat"}</button>
      <button type="button" role="menuitem" data-conversation-action="mute" data-conversation-id="${escapeHtml(conversation.id)}">${isMuted ? "Activar notificacions" : "Silenciar xat"}</button>
      <button type="button" role="menuitem" data-conversation-action="delete" data-conversation-id="${escapeHtml(conversation.id)}">Eliminar xat</button>
    `;
  }

  function closeConversationMenu(mainPane) {
    mainPane?.querySelectorAll(".chat-conversation-menu").forEach((menu) => menu.classList.add("hidden"));
    mainPane?.querySelectorAll("[data-chat-menu-trigger]").forEach((trigger) => {
      trigger.setAttribute("aria-expanded", "false");
    });
  }

  async function applyConversationMenuAction(conversationId, action) {
    const currentUser = getCurrentUser();
    const conversation = state.conversations.find((item) => item.id === conversationId);
    if (!conversation || !conversation.participantIds?.includes(currentUser.id)) {
      showToast("No s'ha trobat aquesta conversa.");
      return;
    }

    const actionSettings = {
      archive: {
        field: "archivedFor",
        enabled: conversation.archivedFor?.includes(currentUser.id) !== true
      },
      mute: {
        field: "mutedFor",
        enabled: conversation.mutedFor?.includes(currentUser.id) !== true
      },
      delete: { field: "hiddenFor", enabled: true }
    };
    const setting = actionSettings[action];
    if (!setting) return;

    if (
      action === "delete" &&
      !window.confirm("Vols eliminar aquest xat de la teva llista? L'altra persona continuarà veient la conversa.")
    ) {
      return;
    }

    try {
      await updateDoc(doc(db, "conversations", conversationId), {
        [setting.field]: setting.enabled
          ? arrayUnion(currentUser.id)
          : arrayRemove(currentUser.id)
      });
      const currentUsers = Array.isArray(conversation[setting.field])
        ? conversation[setting.field]
        : [];
      conversation[setting.field] = setting.enabled
        ? [...new Set([...currentUsers, currentUser.id])]
        : currentUsers.filter((userId) => userId !== currentUser.id);

      if (["archive", "delete"].includes(action) && ui.activeConversationId === conversationId) {
        ui.activeConversationId = null;
        document.getElementById("chat-shell").classList.remove("mobile-thread-open");
      }

      renderMessagesView();
      updateHeaderChrome();
      const confirmation = {
        archive: setting.enabled ? "Xat arxivat." : "Xat desarxivat.",
        mute: setting.enabled ? "Xat silenciat." : "Notificacions del xat activades.",
        delete: "Xat eliminat de la teva llista."
      };
      showToast(confirmation[action]);
    } catch (error) {
      console.error("No s'ha pogut actualitzar el xat:", error);
      showToast("No s'ha pogut actualitzar el xat. Torna-ho a provar.");
    }
  }

  function getVisibleConversations(currentUser) {
    return state.conversations.filter((conversation) =>
      Array.isArray(conversation.participantIds) &&
      conversation.participantIds.includes(currentUser.id) &&
      !conversation.hiddenFor?.includes(currentUser.id) &&
      (Boolean(conversation.archivedFor?.includes(currentUser.id)) === showArchivedConversations)
    );
  }

  function getConversationListMarkup(conversations, currentUser, filterQ) {
    return conversations
      .map((conv) => {
        const otherId = conv.participantIds.find((id) => id !== currentUser.id);
        const other = getStudentById(otherId);
        if (filterQ && !other.name.toLowerCase().includes(filterQ)) return "";
        const messages = Array.isArray(conv.messages) ? conv.messages : [];
        const lastMessage = messages[messages.length - 1];
        const hasUnreadMessages = hasUnreadMessagesForUser(conv, currentUser.id);
        return `
          <div class="conv-item ${conv.id === ui.activeConversationId ? "active" : ""}${hasUnreadMessages ? " unread" : ""}" data-select-conv="${conv.id}">
            <img src="${escapeHtml(other.avatar)}" alt="${escapeHtml(other.name)}" />
            <div class="conv-info">
              <div class="conv-title-row">
                <strong title="${escapeHtml(other.name)}">${escapeHtml(other.name)}</strong>
                <div class="chat-conversation-menu-wrap">
                  <button type="button" class="chat-conversation-menu-trigger" data-chat-menu-trigger aria-label="Opcions del xat amb ${escapeHtml(other.name)}" aria-haspopup="menu" aria-expanded="false" aria-controls="chat-conversation-menu-${escapeHtml(conv.id)}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="5" cy="12" r="1.7" />
                      <circle cx="12" cy="12" r="1.7" />
                      <circle cx="19" cy="12" r="1.7" />
                    </svg>
                  </button>
                  <div class="chat-conversation-menu hidden" id="chat-conversation-menu-${escapeHtml(conv.id)}" role="menu" aria-label="Opcions del xat amb ${escapeHtml(other.name)}">
                    ${getConversationSettingsMarkup(conv, currentUser.id)}
                  </div>
                </div>
              </div>
              <p>${lastMessage ? userContentMarkup(lastMessage.text) : "Inicia la conversa..."}</p>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderChatUserSearchResults() {
    const input = document.getElementById("chat-search-input");
    const results = document.getElementById("chat-user-search-results");
    if (!input || !results) return;
    const query = input.value.trim().toLocaleLowerCase();
    if (!query) {
      results.innerHTML = "";
      results.classList.add("hidden");
      input.setAttribute("aria-expanded", "false");
      return;
    }

    const currentUser = getCurrentUser();
    const matches = state.students
      .filter(
        (student) =>
          student.id !== currentUser.id &&
          typeof student.name === "string" &&
          student.name.toLocaleLowerCase().includes(query)
      )
      .sort((a, b) => {
        const aStartsWithQuery = a.name.toLocaleLowerCase().startsWith(query);
        const bStartsWithQuery = b.name.toLocaleLowerCase().startsWith(query);
        if (aStartsWithQuery !== bStartsWithQuery) return aStartsWithQuery ? -1 : 1;
        return a.name.localeCompare(b.name, "ca");
      })
      .slice(0, 8);

    results.innerHTML = matches.length
      ? matches
          .map(
            (student) => `
              <button type="button" class="chat-user-suggestion" data-start-chat-user="${escapeHtml(student.id)}" role="option">
                <img src="${escapeHtml(student.avatar || "")}" alt="" />
                <span class="chat-user-suggestion-info">
                  <strong>${escapeHtml(student.name)}</strong>
                  <small>${escapeHtml(student.year || "")}</small>
                </span>
              </button>`
          )
          .join("")
      : `<div class="chat-user-search-empty">No s'han trobat usuaris.</div>`;
    results.classList.remove("hidden");
    input.setAttribute("aria-expanded", "true");
  }

  function bindConversationList(listContainer) {
    listContainer.querySelectorAll("[data-select-conv]").forEach((item) => {
      item.addEventListener("click", (event) => {
        if (event.target.closest(".chat-conversation-menu-wrap")) return;
        ui.activeConversationId = item.dataset.selectConv;
        document.getElementById("chat-shell").classList.add("mobile-thread-open");
        renderMessagesView();
      });
    });
  }

  function getConversationMessagesMarkup(messages, currentUser, showTypingIndicator = false, typingAt = 0) {
    const messageMarkup = messages
      .map((message) => {
        const isOutgoing = message.senderId === currentUser.id;
        return `
          <div class="msg-bubble ${isOutgoing ? "outgoing" : "incoming"}">
            ${
              message.ref
                ? `<div class="msg-context-ref" ${message.ref.id ? `data-open-project="${escapeHtml(message.ref.id)}"` : ""} ${
                    message.ref.commentId ? `data-open-project-comment="${escapeHtml(message.ref.commentId)}"` : ""
                  }>&#128206; ${userContentMarkup(message.ref.label)}</div>`
                : ""
            }
            ${
              message.ref?.mediaImageId
                ? `<button type="button" class="msg-context-photo-ref" data-open-project-photo="${escapeHtml(message.ref.mediaImageId)}" data-project-id="${escapeHtml(message.ref.id)}">&#128247; Foto: ${escapeHtml(message.ref.mediaImageLabel || "Fotografia del projecte")}</button>`
                : ""
            }
            <div>${userContentMarkup(message.text)}</div>
            <span class="msg-time">${escapeHtml(message.timestamp)}</span>
          </div>
        `;
      })
      .join("");

    const typingMarkup = showTypingIndicator
      ? `<div class="msg-bubble incoming typing-indicator" id="chat-typing-indicator" data-typing-at="${typingAt}" role="status" aria-label="L'altra persona està escrivint">
          <span class="typing-dot" aria-hidden="true"></span>
          <span class="typing-dot" aria-hidden="true"></span>
          <span class="typing-dot" aria-hidden="true"></span>
        </div>`
      : "";

    return messageMarkup + typingMarkup;
  }

  function scheduleTypingIndicatorExpiry(conversationId, typingAt) {
    if (typingAt <= 0 || Date.now() - typingAt >= 5000) return;
    setTimeout(() => {
      const currentIndicator = document.getElementById("chat-typing-indicator");
      if (
        ui.activeConversationId === conversationId &&
        currentIndicator?.dataset.typingAt === String(typingAt) &&
        Date.now() - typingAt >= 5000
      ) {
        currentIndicator.remove();
      }
    }, Math.max(0, 5000 - (Date.now() - typingAt)));
  }

  function refreshMessagesView() {
    const currentUser = getCurrentUser();
    const listContainer = document.getElementById("conversation-list");
    const mainPane = document.getElementById("chat-main-pane");
    const messageInput = document.getElementById("chat-message-input");
    const activeConv = state.conversations.find(
      (conversation) => conversation.id === ui.activeConversationId
    );
    if (!listContainer || !mainPane || !messageInput || !activeConv) {
      renderMessagesView();
      return;
    }

    const myConvs = getVisibleConversations(currentUser);
    if (!myConvs.some((conversation) => conversation.id === activeConv.id)) {
      renderMessagesView();
      return;
    }

    const filterQ = (document.getElementById("chat-search-input")?.value || "").toLowerCase();
    listContainer.innerHTML = getConversationListMarkup(myConvs, currentUser, filterQ);
    bindConversationList(listContainer);

    const otherId = activeConv.participantIds.find((id) => id !== currentUser.id);
    const typingAt = Number(activeConv.typingUsers?.[otherId] || 0);
    const isOtherTyping = typingAt > 0 && Date.now() - typingAt < 5000;
    const scrollBox = document.getElementById("chat-messages-scroll");
    if (scrollBox) {
      const wasNearBottom = scrollBox.scrollHeight - scrollBox.scrollTop - scrollBox.clientHeight < 48;
      const messages = Array.isArray(activeConv.messages) ? activeConv.messages : [];
      scrollBox.innerHTML = getConversationMessagesMarkup(messages, currentUser, isOtherTyping, typingAt);
      if (isOtherTyping) scheduleTypingIndicatorExpiry(activeConv.id, typingAt);
      if (wasNearBottom) scrollBox.scrollTop = scrollBox.scrollHeight;
    }

    if (mainPane.getClientRects().length > 0) {
      void markConversationMessagesRead(activeConv, currentUser.id);
      void markMessageNotificationsAsRead(activeConv.id, currentUser.id);
    }
  }

  function renderMessagesView() {
    const currentUser = getCurrentUser();
    const listContainer = document.getElementById("conversation-list");
    const mainPane = document.getElementById("chat-main-pane");
    const filterQ = (document.getElementById("chat-search-input")?.value || "").toLowerCase();
    const previousMessageInput = document.getElementById("chat-message-input");
    const previousConversationId = previousMessageInput?.dataset.conversationId;
    const wasMessageInputFocused = previousMessageInput && document.activeElement === previousMessageInput;
    const selectionStart = previousMessageInput?.selectionStart;
    const selectionEnd = previousMessageInput?.selectionEnd;
    if (previousMessageInput && previousConversationId) {
      conversationDrafts.set(previousConversationId, previousMessageInput.value);
    }

    updateConversationArchiveToggle();
    const myConvs = getVisibleConversations(currentUser);

    listContainer.innerHTML = getConversationListMarkup(myConvs, currentUser, filterQ);
    bindConversationList(listContainer);

    const selectedConversationId = ui.activeConversationId;
    const activeConv = myConvs.find((c) => c.id === selectedConversationId) || myConvs[0];
    if (!activeConv) {
      ui.activeConversationId = null;
      document.getElementById("chat-shell").classList.remove("mobile-thread-open");
      mainPane.innerHTML = `<div class="chat-empty-placeholder"><p>${showArchivedConversations ? "No hi ha xats arxivats." : "Cerca un usuari per iniciar un xat."}</p></div>`;
      return;
    }

    ui.activeConversationId = activeConv.id;
    if (mainPane.getClientRects().length > 0) {
      void markConversationMessagesRead(activeConv, currentUser.id);
      void markMessageNotificationsAsRead(activeConv.id, currentUser.id);
    }
    const otherId = activeConv.participantIds.find((id) => id !== currentUser.id);
    const other = getStudentById(otherId);
    const messages = Array.isArray(activeConv.messages) ? activeConv.messages : [];
    const otherTypingAt = Number(activeConv.typingUsers?.[otherId] || 0);
    const isOtherTyping = otherTypingAt > 0 && Date.now() - otherTypingAt < 5000;

    mainPane.innerHTML = `
      <div class="chat-header">
        <div class="chat-user-header">
          <button type="button" class="chip-action-btn mobile-chat-back" id="mobile-chat-back-btn">&larr;</button>
          <img src="${escapeHtml(other.avatar)}" alt="${escapeHtml(other.name)}" class="nav-avatar" />
          <div class="chat-user-heading">
            <strong style="display:block;font-size:14px;">${escapeHtml(other.name)}</strong>
            <span style="font-size: 11.5px;color:var(--text-secondary);">${escapeHtml(other.year)} · ${escapeHtml(other.email)}</span>
          </div>
        </div>
        <button type="button" class="chip-action-btn" data-open-profile="${other.id}">Veure portafoli</button>
      </div>

      <div class="chat-messages-scroll" id="chat-messages-scroll">
        ${getConversationMessagesMarkup(messages, currentUser, isOtherTyping, otherTypingAt)}
      </div>

      ${
        pendingMessageReference
          ? `<div id="pending-message-reference" style="padding:8px 16px;background: var(--bg-subtle); font-size:12px;display: flex; justify-content:space-between; align-items:center;">
              <span>Referència adjunta: <strong>${escapeHtml(pendingMessageReference.label)}</strong>${
              pendingMessageReference.mediaImageLabel ? ` · Foto: ${escapeHtml(pendingMessageReference.mediaImageLabel)}` : ""
            }</span>
              <button type="button" class="text-link-btn" id="clear-msg-ref">Treure</button>
            </div>`
          : ""
      }

      <form class="chat-input-bar" id="send-chat-form">
        <input type="text" id="chat-message-input" data-conversation-id="${escapeHtml(activeConv.id)}" placeholder="Escriu un missatge a ${escapeHtml(other.name)}..." required autocomplete="off" />
        <button type="submit" class="btn-primary">Enviar</button>
      </form>
    `;
    if (isOtherTyping) scheduleTypingIndicatorExpiry(activeConv.id, otherTypingAt);

    const messageInput = document.getElementById("chat-message-input");
    messageInput.value = conversationDrafts.get(activeConv.id) || "";
    if (wasMessageInputFocused && previousConversationId === activeConv.id) {
      messageInput.focus();
      if (selectionStart !== undefined && selectionEnd !== undefined) {
        messageInput.setSelectionRange(selectionStart, selectionEnd);
      }
    }
    messageInput.addEventListener("input", () => {
      conversationDrafts.set(activeConv.id, messageInput.value);
      if (messageInput.value.trim()) {
        updateTypingIndicator(activeConv.id, currentUser.id);
      } else {
        stopTypingIndicator(activeConv.id, currentUser.id);
      }
    });
    const backBtn = document.getElementById("mobile-chat-back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        document.getElementById("chat-shell").classList.remove("mobile-thread-open");
      });
    }

    const clearRef = document.getElementById("clear-msg-ref");
    if (clearRef) {
      clearRef.addEventListener("click", () => {
        pendingMessageReference = null;
        renderMessagesView();
      });
    }

    const scrollBox = document.getElementById("chat-messages-scroll");
    if (scrollBox) {
      if (restoreMessageScroll) {
        scrollBox.scrollTop = savedMessageScrollTop;
        restoreMessageScroll = false;
      } else {
        scrollBox.scrollTop = scrollBox.scrollHeight;
      }
    }

    document.getElementById("send-chat-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("chat-message-input");
      const text = input.value.trim();
      if (!text) return;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const newMessage = {
        id: "m-" + Date.now(),
        senderId: currentUser.id,
        readBy: [currentUser.id],
        text,
        ref: pendingMessageReference,
        timestamp: timeStr
      };
      const conversationRef = doc(db, "conversations", activeConv.id);
      let shouldNotifyOtherUser = true;
      try {
        shouldNotifyOtherUser = await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(conversationRef);
          if (!snapshot.exists()) {
            throw new Error(`No s'ha trobat la conversa ${activeConv.id}.`);
          }
          const currentConversation = snapshot.data();
          const currentMessages = Array.isArray(currentConversation.messages) ? currentConversation.messages : [];
          transaction.update(conversationRef, {
            messages: [...currentMessages, newMessage],
            [`typingUsers.${currentUser.id}`]: deleteField(),
            hiddenFor: arrayRemove(other.id),
            archivedFor: arrayRemove(other.id)
          });
          return !currentConversation.mutedFor?.includes(other.id);
        });
      } catch (error) {
        console.warn("Error enviant el missatge privat:", error);
        showToast("No s'ha pogut enviar el missatge. El text es conserva.");
        return;
      }

      pendingMessageReference = null;
      conversationDrafts.set(activeConv.id, "");
      clearLocalTypingState(activeConv.id);
      input.value = "";
      document.getElementById("pending-message-reference")?.remove();
      if (shouldNotifyOtherUser) {
        try {
          await pushNotification(other.id, `Nou missatge privat de ${currentUser.name}`, "messages", activeConv.id);
        } catch (error) {
          console.warn("Error creant la notificació del missatge privat:", error);
          showToast("El missatge s'ha enviat, però no s'ha pogut crear la notificació.");
        }
      }
    });
  }

  // =========================================================================
  // 10. PERFIL D'ESTUDIANT I RÀNQUING
  // =========================================================================
  function getSuggestionTimestamp(suggestion) {
    const createdAt = suggestion.createdAt;
    if (createdAt && typeof createdAt.toMillis === "function") return createdAt.toMillis();
    if (createdAt && typeof createdAt.toDate === "function") return createdAt.toDate().getTime();
    const timestamp = new Date(createdAt || "").getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function getSuggestionScreenshot(suggestion) {
    const source = suggestion.screenshot;
    if (typeof source !== "string") return "";
    if (/^data:image\/(?:jpeg|png);base64,/i.test(source)) return source;
    try {
      const url = new URL(source);
      return url.protocol === "https:" && url.hostname === "firebasestorage.googleapis.com"
        ? source
        : "";
    } catch {
      return "";
    }
  }

  function openSuggestionDetail(suggestionId) {
    if (!isSuggestionManager()) return;
    const suggestion = state.suggestions.find((entry) => entry.id === suggestionId);
    if (!suggestion) return;

    const author = state.students.find((student) => student.id === suggestion.userId)?.name || "Usuari desconegut";
    const timestamp = getSuggestionTimestamp(suggestion);
    const dateLabel = timestamp
      ? new Intl.DateTimeFormat("ca-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp))
      : "Data no disponible";
    const referencePath = typeof suggestion.reference?.path === "string"
      ? suggestion.reference.path
      : "";
    const screenshot = getSuggestionScreenshot(suggestion);
    document.getElementById("suggestion-detail-title").textContent = `Suggeriment de ${author}`;
    document.getElementById("suggestion-detail-content").innerHTML = `
      <div class="suggestion-detail-meta">
        <strong>${escapeHtml(author)}</strong> · <time>${escapeHtml(dateLabel)}</time>
        ${referencePath ? `<div class="suggestion-card-path">${escapeHtml(referencePath)}</div>` : ""}
      </div>
      <p class="suggestion-detail-message">${escapeHtml(suggestion.message || "")}</p>
      ${screenshot ? `<img class="suggestion-detail-image" src="${escapeHtml(screenshot)}" alt="Captura de pantalla adjunta al suggeriment de ${escapeHtml(author)}" />` : ""}
    `;
    openModal("modal-suggestion-detail");
  }

  function renderSuggestionsView() {
    if (!isSuggestionManager()) {
      document.getElementById("suggestions-list").innerHTML = "";
      return;
    }

    const container = document.getElementById("suggestions-list");
    const pageFilter = document.getElementById("suggestions-filter-page");
    const authorFilter = document.getElementById("suggestions-filter-author");
    const selectedPage = pageFilter.value;
    const selectedAuthor = authorFilter.value;
    const pages = [...new Set(
      state.suggestions
        .map((suggestion) => suggestion.reference?.path)
        .filter((path) => typeof path === "string" && path)
    )].sort((a, b) => a.localeCompare(b, "ca"));
    const authors = [...new Set(
      state.suggestions.map((suggestion) => suggestion.userId).filter(Boolean)
    )].map((userId) => ({
      id: userId,
      name: state.students.find((student) => student.id === userId)?.name || "Usuari desconegut"
    })).sort((a, b) => a.name.localeCompare(b.name, "ca"));

    pageFilter.innerHTML = `<option value="">Totes les pàgines</option>${pages
      .map((path) => `<option value="${escapeHtml(path)}">${escapeHtml(path)}</option>`)
      .join("")}`;
    authorFilter.innerHTML = `<option value="">Tots els usuaris</option>${authors
      .map((author) => `<option value="${escapeHtml(author.id)}">${escapeHtml(author.name)}</option>`)
      .join("")}`;
    if (pages.includes(selectedPage)) pageFilter.value = selectedPage;
    if (authors.some((author) => author.id === selectedAuthor)) authorFilter.value = selectedAuthor;

    if (state.suggestionsError) {
      container.innerHTML = `<div class="suggestions-list-state" role="alert">${escapeHtml(state.suggestionsError)}</div>`;
      return;
    }
    if (!state.suggestionsLoaded) {
      container.innerHTML = `<div class="suggestions-list-state">Carregant suggeriments...</div>`;
      return;
    }

    const selectedOrder = document.getElementById("suggestions-filter-order").value;
    const suggestions = state.suggestions
      .filter((suggestion) => !pageFilter.value || suggestion.reference?.path === pageFilter.value)
      .filter((suggestion) => !authorFilter.value || suggestion.userId === authorFilter.value)
      .sort((a, b) => {
        const difference = getSuggestionTimestamp(a) - getSuggestionTimestamp(b);
        return selectedOrder === "oldest" ? difference : -difference;
      });

    if (!suggestions.length) {
      container.innerHTML = `<div class="suggestions-list-state">No hi ha suggeriments amb aquests filtres.</div>`;
      return;
    }

    const dateFormatter = new Intl.DateTimeFormat("ca-ES", {
      dateStyle: "medium",
      timeStyle: "short"
    });
    container.innerHTML = suggestions.map((suggestion) => {
      const author = state.students.find((student) => student.id === suggestion.userId)?.name || "Usuari desconegut";
      const timestamp = getSuggestionTimestamp(suggestion);
      const dateLabel = timestamp
        ? dateFormatter.format(new Date(timestamp))
        : "Data no disponible";
      const referencePath = typeof suggestion.reference?.path === "string"
        ? suggestion.reference.path
        : "";
      const screenshot = getSuggestionScreenshot(suggestion);
      return `
        <article class="suggestion-card">
          <button type="button" class="suggestion-card-open" data-open-suggestion="${escapeHtml(suggestion.id)}" aria-label="Obrir suggeriment de ${escapeHtml(author)}">
            <span>
              <span class="suggestion-card-header">
                <strong class="suggestion-card-author">${escapeHtml(author)}</strong>
                <time class="suggestion-card-date" datetime="${timestamp ? new Date(timestamp).toISOString() : ""}">${escapeHtml(dateLabel)}</time>
              </span>
              ${referencePath ? `<span class="suggestion-card-path">${escapeHtml(referencePath)}</span>` : ""}
              <span class="suggestion-card-message">${escapeHtml(suggestion.message || "")}</span>
            </span>
            ${screenshot ? `<img class="suggestion-card-thumbnail" src="${escapeHtml(screenshot)}" alt="" loading="lazy" />` : ""}
          </button>
        </article>
      `;
    }).join("");
  }

  function renderProfileView() {
    const container = document.getElementById("view-profile");
    const student = getStudentById(ui.activeProfileId || state.currentUserId);
    const tier = getAchievementTier(student.points || 0);
    const studentProjects = state.projects.filter(
      (project) =>
        isProjectParticipant(project, student.id) &&
        !project.archived &&
        !isProjectHiddenFromPortfolio(project, student.id)
    );
    const studentSubjects = student.interests || [];
    const degreeLabel = REGISTRATION_PROGRAMS[student.degree]?.label || "";
    const nextProgress = tier.next
      ? Math.min(100, Math.round((((student.points || 0) - tier.min) / (tier.next - tier.min)) * 100))
      : 100;

    const sortedStudents = [...state.students].sort((a, b) => (b.points || 0) - (a.points || 0));
    const rank = sortedStudents.findIndex((s) => s.id === student.id) + 1;

    container.innerHTML = `
      <div class="page-container">
        <div class="profile-hero">
          <div class="profile-avatar-editor">
            <img src="${escapeHtml(student.avatar)}" alt="${escapeHtml(student.name)}" class="profile-hero-avatar" id="profile-avatar-preview" />
            ${
              student.id === state.currentUserId
                ? `<input type="file" id="profile-avatar-upload" accept="image/*" hidden />
                   <button type="button" class="profile-avatar-upload" id="profile-edit-pencil" title="Canviar fotografia" aria-label="Canviar fotografia">
                     <span>Canviar fotografia</span>
                   </button>`
                : ""
            }
          </div>

          <div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap:wrap;">
              <h1 class="page-title">${escapeHtml(student.name)}</h1>
              <button type="button" class="pill-tag profile-level-link" style="border:0;cursor:pointer;">Nivell ${tier.level}: ${tier.name}</button>
              <button type="button" class="pill-tag profile-ranking-link" data-route="leaderboard" style="border:0;cursor:pointer;">Rànquing #${rank || "-"}</button>
            </div>
            <p style="margin:4px 0 8px; color:var(--text-secondary);">${degreeLabel ? `${escapeHtml(degreeLabel)} · ` : ""}${escapeHtml(student.year)} · ${escapeHtml(student.email)}</p>
            <p style="margin:0 0 10px;font-size: 13.5px;">${userContentMarkup(student.bio || "")}</p>
            ${
              studentSubjects.length
                ? `<details class="profile-subjects-dropdown">
                    <summary>Assignatures seleccionades (${studentSubjects.length})</summary>
                    <div class="profile-subject-panel">
                      <div class="profile-subject-tags">
                        ${studentSubjects
                          .map(
                            (tag) =>
                              `<button type="button" class="pill-tag subject-tag" data-subject="${escapeHtml(tag)}" style="border:0;cursor:pointer;">${escapeHtml(tag)}</button>`
                          )
                          .join("")}
                      </div>
                    </div>
                  </details>`
                : ""
            }
            ${
              student.id === state.currentUserId
                ? `<div class="profile-edit-action">
                    <button type="button" class="profile-edit-link" id="open-profile-edit">Editar perfil</button>
                  </div>`
                : `<div class="profile-edit-action">
                    <button type="button" class="btn-primary" id="message-student-btn">Enviar missatge privat</button>
                  </div>`
            }
          </div>

          <div>
            <strong style="font-size:24px;display:block;">${student.points || 0} pts</strong>
            <span style="font-size:12px; color:var(--text-secondary);">
              ${tier.next ? `Falten ${tier.next - (student.points || 0)} pts per al següent nivell` : "Nivell màxim assolit"}
            </span>
            <div class="reputation-progress-bar">
              <div class="reputation-progress-fill" style="width:${nextProgress}%;"></div>
            </div>
          </div>
        </div>

        <div class="stats-strip">
          <div class="stat-box"><strong>${studentProjects.length}</strong><span>Projectes al portafoli</span></div>
          <div class="stat-box"><strong>${student.commentsCount || 0}</strong><span>Comentaris fets</span></div>
          <div class="stat-box"><strong>${student.usefulCommentsCount || 0}</strong><span>Valorats molt útils</span></div>
          <div class="stat-box"><strong>${student.secondedCount || 0}</strong><span>Cops secundat</span></div>
        </div>

        <h2 style="font-size:18px;margin-bottom:14px;">Portafoli de projectes</h2>
        <div class="masonry-container" style="padding:0;">
          ${studentProjects
            .map(
              (proj) => {
                const participantRole = (Array.isArray(proj.participantDetails) ? proj.participantDetails : [])
                  .filter((participant) => participant && typeof participant === "object")
                  .find(
                    (participant) =>
                      participant.id === student.id ||
                      (typeof participant.name === "string" &&
                        participant.name.trim().toLocaleLowerCase() ===
                          (student.name || "").trim().toLocaleLowerCase())
                  )?.role;
                return `
                  <article class="masonry-card ${proj.aspect || "span-portrait"} ${isProjectCoverFramed(proj) ? "framed-cover" : ""}" data-open-project="${escapeHtml(proj.id)}">
                    <img src="${escapeHtml(proj.cover)}" alt="${escapeHtml(proj.title)}" />
                    <div class="card-overlay" style="opacity:1;">
                      <div class="overlay-top"><span class="overlay-badge">${escapeHtml(proj.category)}</span></div>
                      <div class="overlay-bottom">
                        <h3>${userContentMarkup(proj.title)}</h3>
                        <div class="overlay-meta">
                          <span>${escapeHtml(proj.subject)}</span>
                          <span>${participantRole ? `Rol: ${userContentMarkup(participantRole)} · ` : ""}${escapeHtml(proj.status)}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                `;
              }
            )
            .join("")}
        </div>
      </div>
    `;

    const msgBtn = document.getElementById("message-student-btn");
    if (msgBtn) {
      msgBtn.addEventListener("click", () => startOrOpenConversation(student.id));
    }

    const levelLink = container.querySelector(".profile-level-link");
    if (levelLink) {
      levelLink.addEventListener("click", () => openLevelsModal(student));
    }

    const rankingLink = container.querySelector(".profile-ranking-link");
    if (rankingLink) {
      rankingLink.addEventListener("click", () => navigateTo("leaderboard"));
    }

    container.querySelectorAll(".subject-tag").forEach((tag) => {
      tag.addEventListener("click", () => openSubjectModal(tag.dataset.subject));
    });

    const editPencil = document.getElementById("profile-edit-pencil");
    const avatarInput = document.getElementById("profile-avatar-upload");
    if (editPencil && avatarInput) {
      editPencil.addEventListener("click", () => avatarInput.click());
      avatarInput.addEventListener("change", () => {
        const file = avatarInput.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = async () => {
          if (typeof reader.result === "string") {
            const uploadedUrl = await uploadDataUrlIfNeeded(reader.result, "avatars");
            await setDoc(doc(db, "students", student.id), { avatar: uploadedUrl }, { merge: true });
            showToast("Fotografia de perfil actualitzada.");
          }
        };
        reader.readAsDataURL(file);
      });
    }

    const openEditButton = document.getElementById("open-profile-edit");
    if (openEditButton) {
      openEditButton.addEventListener("click", () => openEditProfileModal(student));
    }
  }

  function renderLeaderboardView() {
    const container = document.getElementById("leaderboard-content");
    const currentUser = getCurrentUser();
    const sorted = [...state.students].sort((a, b) => (b.points || 0) - (a.points || 0));
    const recentLedger = state.pointsLedger.filter((l) => l.userId === currentUser.id).slice(-5).reverse();

    container.innerHTML = `
      <div class="stats-strip">
        <div class="stat-box"><strong>+15 pts</strong><span>Primer comentari útil en un projecte (+10 segon, +7 tercer, +5 següents)</span></div>
        <div class="stat-box"><strong>+5 pts</strong><span>Comentari valorat amb 4-5&#9733; per l'autor/a</span></div>
        <div class="stat-box"><strong>+2 pts</strong><span>Quan un altre estudiant secunda el teu feedback</span></div>
        <div class="stat-box"><strong>+10 / +5 pts</strong><span>Publicar projecte i marcar-lo com a entregat o resolt</span></div>
      </div>

      <div class="leaderboard-table-wrap">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Posició</th>
              <th>Estudiant</th>
              <th>Curs</th>
              <th>Nivell assoliment</th>
              <th>Feedback útil</th>
              <th>Punts</th>
            </tr>
          </thead>
          <tbody>
            ${sorted
              .map((s, idx) => {
                const tier = getAchievementTier(s.points || 0);
                return `
                  <tr style="cursor:pointer; ${s.id === currentUser.id ? "background:#f9f9f9;font-weight:600;" : ""}" data-open-profile="${s.id}">
                    <td>#${idx + 1}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px;">
                        <img src="${escapeHtml(s.avatar)}" alt="${escapeHtml(s.name)}" class="nav-avatar" />
                        <span>${escapeHtml(s.name)}</span>
                      </div>
                    </td>
                    <td>${escapeHtml(s.year)}</td>
                    <td><span class="pill-tag">Nivell ${tier.level} · ${tier.name}</span></td>
                    <td>${s.usefulCommentsCount || 0}</td>
                    <td><strong>${s.points || 0} pts</strong></td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>

      ${
        recentLedger.length
          ? `<h3 style="font-size:16px;margin:28px 0 12px;">El teu historial recent de punts</h3>
             <div class="leaderboard-table-wrap">
               ${recentLedger
                 .map(
                   (item) => `
                   <div style="display:flex;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border-light);font-size:13.5px;">
                     <span>${escapeHtml(item.label)}</span>
                     <strong style="color:var(--accent-success);">+${item.points} pts</strong>
                   </div>
                 `
                 )
                 .join("")}
             </div>`
          : ""
      }
    `;
  }

  // =========================================================================
  // 11. NOTIFICACIONS I POPOVERS
  // =========================================================================
  async function pushNotification(userId, text, linkType, linkId) {
    const id = "not-" + Date.now() + Math.random().toString(36).slice(2, 5);
    await setDoc(doc(db, "notifications", id), {
      id,
      userId,
      text,
      read: false,
      time: "Ara mateix",
      linkType,
      linkId
    });
  }

  const pendingMessageNotificationReads = new Set();

  async function markMessageNotificationsAsRead(conversationId, userId) {
    if (!conversationId || !userId) return;
    const notifications = state.notifications.filter(
      (notification) =>
        notification.userId === userId &&
        notification.linkType === "messages" &&
        notification.linkId === conversationId &&
        !notification.read &&
        !pendingMessageNotificationReads.has(notification.id)
    );
    if (!notifications.length) return;

    notifications.forEach((notification) => pendingMessageNotificationReads.add(notification.id));
    try {
      const results = await Promise.all(
        notifications.map(async (notification) => {
          try {
            await updateDoc(doc(db, "notifications", notification.id), { read: true });
            return true;
          } catch (error) {
            console.warn("Error marcant una notificació de missatge com a llegida:", error);
            return false;
          }
        })
      );
      if (results.includes(false)) {
        showToast("No s'han pogut actualitzar totes les notificacions del xat.");
      }
    } finally {
      notifications.forEach((notification) => pendingMessageNotificationReads.delete(notification.id));
    }
  }

  function hasUnreadMessagesForUser(conversation, userId) {
    if (!Array.isArray(conversation.participantIds) || !conversation.participantIds.includes(userId)) {
      return false;
    }
    const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    return messages.some(
      (message) =>
        message.senderId !== userId &&
        (!Array.isArray(message.readBy) || !message.readBy.includes(userId))
    );
  }

  function updateHeaderChrome() {
    const currentUser = getCurrentUser();
    const avatarEl = document.getElementById("nav-user-avatar");
    if (avatarEl) avatarEl.src = currentUser.avatar;

    const hasUnreadMessages = state.conversations.some((conversation) =>
      !conversation.hiddenFor?.includes(currentUser.id) &&
      !conversation.mutedFor?.includes(currentUser.id) &&
      hasUnreadMessagesForUser(conversation, currentUser.id)
    );
    document.getElementById("nav-msg-badge")?.classList.toggle("hidden", !hasUnreadMessages);

    const userInfo = document.getElementById("popover-user-info");
    if (userInfo) {
      const tier = getAchievementTier(currentUser.points || 0);
      userInfo.innerHTML = `
        <strong>${escapeHtml(currentUser.name)}</strong>
        <span>${escapeHtml(currentUser.year)} · ${currentUser.points || 0} pts (Nivell ${tier.level})</span>
      `;
    }

    const mutedConversations = new Set(
      state.conversations
        .filter((conversation) => conversation.mutedFor?.includes(currentUser.id))
        .map((conversation) => conversation.id)
    );
    const myNotifs = state.notifications.filter(
      (notification) =>
        notification.userId === currentUser.id &&
        !notification.read &&
        !(notification.linkType === "messages" && mutedConversations.has(notification.linkId))
    );
    const unreadCount = myNotifs.length;
    const badgeEl = document.getElementById("notif-unread-count");
    if (badgeEl) {
      badgeEl.textContent = unreadCount;
      badgeEl.classList.toggle("hidden", unreadCount === 0);
    }

    const listEl = document.getElementById("notif-list-container");
    if (listEl) {
      listEl.innerHTML =
        myNotifs.length === 0
          ? `<div style="padding:14px;color:var(--text-muted);font-size:12.5px;">Sense notificacions noves.</div>`
          : myNotifs
              .map(
                (n) => `
              <div class="notif-item unread" data-notif-id="${n.id}" data-link-type="${n.linkType}" data-link-id="${n.linkId}">
                <div>${escapeHtml(n.text)}</div>
                <span class="notif-time">${escapeHtml(n.time)}</span>
              </div>
            `
              )
              .join("");

      listEl.querySelectorAll(".notif-item").forEach((item) => {
        item.addEventListener("click", async () => {
          const notif = state.notifications.find((n) => n.id === item.dataset.notifId);
          if (notif && !notif.read) {
            try {
              await updateDoc(doc(db, "notifications", notif.id), { read: true });
            } catch (error) {
              console.warn("Error marcant la notificació com a llegida:", error);
              showToast("No s'ha pogut actualitzar la notificació.");
            }
          }
          closeAllPopovers();
          if (item.dataset.linkType === "project") navigateTo("project", item.dataset.linkId);
          else if (item.dataset.linkType === "messages") navigateTo("messages", item.dataset.linkId);
          else if (item.dataset.linkType === "positions") navigateTo("positions");
        });
      });
    }
    syncSuggestionAccess();
  }

  function closeAllPopovers() {
    document.querySelectorAll(".popover-menu").forEach((m) => m.classList.add("hidden"));
    document.getElementById("popover-underlay")?.classList.add("hidden");
    document.querySelectorAll("[aria-expanded]").forEach((btn) => {
      if (btn.id !== "toggle-advanced-filters") btn.setAttribute("aria-expanded", "false");
    });
  }

  function positionPopoverUnderlay() {
    const underlay = document.getElementById("popover-underlay");
    const menu = document.querySelector(".popover-menu:not(.hidden)");
    const trigger = menu && document.getElementById(menu.dataset.popoverTriggerId);
    const anchor = menu?.closest(".dropdown-anchor");
    if (!menu || !trigger || !anchor) return;

    menu.style.position = "absolute";
    menu.style.right = "auto";
    menu.style.left = "0px";
    menu.style.top = "0px";

    const menuRect = menu.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const margin = 12;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const maxLeft = Math.max(margin, viewportWidth - menuRect.width - margin);
    const preferredLeft =
      menu.id === "platform-dropdown"
        ? triggerRect.left
        : triggerRect.right - menuRect.width;
    const left = Math.max(margin, Math.min(preferredLeft, maxLeft));
    const maxTop = Math.max(margin, viewportHeight - menuRect.height - margin);
    const preferredTop = triggerRect.bottom + 10;
    const aboveTop = triggerRect.top - menuRect.height - 10;
    const top =
      preferredTop <= maxTop
        ? preferredTop
        : aboveTop >= margin
          ? aboveTop
          : maxTop;

    Object.assign(menu.style, {
      left: `${left - anchorRect.left}px`,
      top: `${top - anchorRect.top}px`
    });
    if (!underlay) return;

    const rect = menu.getBoundingClientRect();
    Object.assign(underlay.style, {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    });
  }

  function togglePopover(menuId, triggerId) {
    const menu = document.getElementById(menuId);
    const trigger = document.getElementById(triggerId);
    const underlay = document.getElementById("popover-underlay");
    const isHidden = menu.classList.contains("hidden");
    closeAllPopovers();
    if (isHidden) {
      menu.classList.remove("hidden");
      menu.dataset.popoverTriggerId = triggerId;
      ensurePopoverSuggestionButton(menu);
      trigger.setAttribute("aria-expanded", "true");
      if (underlay) {
        positionPopoverUnderlay();
        underlay.classList.remove("hidden");
      }
    }
    notifySuggestionPreviewRoute();
  }

  function ensurePopoverSuggestionButton(menu) {
    if (menu.id === "platform-dropdown" || menu.querySelector(".popover-suggestion-item")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "popover-item popover-suggestion-item";
    button.textContent = "Fer un suggeriment sobre aquest menú";
    button.addEventListener("click", () => openSuggestionsModal({ type: "popover", id: menu.id }));
    menu.append(button);
  }

  function openModal(modalId) {
    closeAllPopovers();
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const activeModal = document.querySelector(".modal-backdrop:not(.hidden)");
    if (activeModal && activeModal.id !== modalId) modalBackHistory.push(activeModal.id);
    ensureModalBackButton(modal);
    ensureModalSuggestionButton(modal);
    ensureModalSuggestionOwl(modal);
    modal.classList.remove("hidden");
    updateBackButton();
    notifySuggestionPreviewRoute();
  }

  function ensureModalBackButton(modal) {
    if (modal.id === "modal-suggestions") return;
    const header = modal.querySelector(".modal-header, .create-modal-header");
    if (!header || header.querySelector(".modal-back-btn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "modal-back-btn";
    button.dataset.appBack = "";
    button.setAttribute("aria-label", "Tornar a l'acció anterior");
    button.title = "Tornar enrere";
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
    `;
    header.insertBefore(button, header.firstChild);
  }

  function ensureModalSuggestionButton(modal) {
    if (
      ["modal-publish-project", "modal-suggestions", "modal-suggestion-detail"].includes(modal.id)
    ) {
      return;
    }
    const header = modal.querySelector(".modal-header, .create-modal-header");
    if (!header || header.querySelector(".modal-suggestion-btn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "modal-suggestion-btn";
    button.setAttribute("aria-label", "Fer un suggeriment sobre aquesta pantalla");
    button.title = "Fer un suggeriment sobre aquesta pantalla";
    button.innerHTML = `
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8v.5Z" />
        <path d="M8 12h8M8 15h5" />
      </svg>
    `;
    button.addEventListener("click", () => openSuggestionsModal(getSuggestionPreviewOverlay()));
    header.insertBefore(button, header.querySelector(".modal-close-btn") || null);
  }

  function ensureModalSuggestionOwl(modal) {
    if (modal.id !== "modal-publish-project" || modal.querySelector(".modal-suggestion-owl")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "modal-suggestion-owl";
    button.setAttribute("aria-label", "Fer un suggeriment sobre aquesta finestra");
    button.title = "Fer un suggeriment sobre aquesta finestra";
    button.innerHTML = '<img src="Mussol eram.png" alt="" aria-hidden="true" />';
    button.addEventListener("click", () => openSuggestionsModal(getSuggestionPreviewOverlay()));
    modal.append(button);

    modal.addEventListener("pointermove", (event) => {
      if (event.target === modal) {
        button.style.left = `${event.clientX}px`;
        button.style.top = `${event.clientY}px`;
        button.classList.add("is-visible");
      } else if (!button.contains(event.target)) {
        button.classList.remove("is-visible");
      }
    });
    modal.addEventListener("pointerleave", () => button.classList.remove("is-visible"));
  }

  function openLevelsModal(student) {
    const currentTier = getAchievementTier(student.points || 0);
    const levels = [
      { level: 1, name: "Iniciació", range: "0 - 49 punts", description: "Primers passos a la comunitat ERAM, publicant projectes i començant a participar." },
      { level: 2, name: "Col·laborador", range: "50 - 119 punts", description: "Participació constant amb comentaris constructius i suport als companys." },
      { level: 3, name: "Col·laborador avançat", range: "120 - 199 punts", description: "Referent actiu de feedback útil i col·laboració entre cursos." },
      { level: 4, name: "Expert", range: "200 punts o més", description: "Màxim reconeixement de la comunitat per aportacions de gran valor." }
    ];

    document.getElementById("levels-content").innerHTML = `
      <p style="margin-top:0;color:var(--text-secondary);">Els punts reflecteixen la participació i la qualitat del feedback compartit amb altres estudiants.</p>
      <div style="display:grid;gap:10px;">
        ${levels
          .map(
            (lvl) => `
          <div style="padding:14px;border-radius:14px;border:1px solid ${
            lvl.level === currentTier.level ? "var(--border-strong)" : "var(--border-light)"
          };background:${lvl.level === currentTier.level ? "var(--bg-subtle)" : "#fff"};">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
              <strong>Nivell ${lvl.level} - ${lvl.name}</strong>
              <span class="pill-tag">${lvl.range}</span>
            </div>
            <p style="margin:6px 0 0;color:var(--text-secondary);font-size:13px;">${lvl.description}</p>
          </div>
        `
          )
          .join("")}
      </div>
    `;
    openModal("modal-levels");
  }

  function openSubjectModal(subject) {
    const matchingProjects = state.projects.filter((project) => project.subject === subject);
    const enrolledStudents = state.students.filter((student) => (student.interests || []).includes(subject));

    document.getElementById("modal-subject-title").textContent = subject;
    document.getElementById("subject-content").innerHTML = `
      <p style="margin-top:0;color:var(--text-secondary);">Assignatura del Grau en Comunicació Audiovisual i Multimèdia.</p>
      <div style="display:grid;gap:12px;">
        <div>
          <strong style="display:block;margin-bottom:6px;">Estudiants amb aquesta assignatura (${enrolledStudents.length})</strong>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${
              enrolledStudents.length
                ? enrolledStudents
                    .map(
                      (student) =>
                        `<button type="button" class="pill-tag" data-open-profile="${student.id}" data-close-modal="modal-subject" style="border:0;cursor:pointer;">${escapeHtml(student.name)}</button>`
                    )
                    .join("")
                : `<span style="color:var(--text-secondary);font-size:13px;">Encara no hi ha estudiants registrats en aquesta assignatura.</span>`
            }
          </div>
        </div>
        <div>
          <strong style="display:block;margin-bottom:6px;">Projectes relacionats (${matchingProjects.length})</strong>
          <div style="display:grid;gap:8px;">
            ${
              matchingProjects.length
                ? matchingProjects
                    .map(
                      (project) =>
                        `<button type="button" class="popover-item" data-open-project="${project.id}" data-close-modal="modal-subject" style="border:1px solid var(--border-light);">${escapeHtml(project.title)} · ${escapeHtml(getStudentById(project.ownerId).name)}</button>`
                    )
                    .join("")
                : `<span style="color:var(--text-secondary);font-size:13px;">Encara no hi ha projectes publicats d'aquesta assignatura.</span>`
            }
          </div>
        </div>
      </div>
    `;
    openModal("modal-subject");
  }

  function openAboutModal() {
    document.getElementById("modal-subject-title").textContent = "About Us";
    document.getElementById("subject-content").innerHTML = `
      <p style="margin-top:0;color:var(--text-secondary);line-height:1.6;">
        Intreramer neix com un punt de trobada digital per als estudiants de l'Escola Universitària ERAM. És una plataforma pensada per compartir projectes acadèmics, demanar i oferir feedback creatiu i trobar col·laboradors per a produccions audiovisuals, interactives o de disseny.
      </p>
      <p style="margin-bottom:0;color:var(--text-secondary);line-height:1.6;">
        El projecte fomenta el treball en xarxa entre cursos i graus per ajudar cada estudiant a millorar la qualitat dels seus treballs abans del lliurament final.
      </p>
      <p style="margin:14px 0 0;color:var(--text-secondary);line-height:1.6;">
        Aquest projecte es va iniciar en el marc de l'assignatura Creació d'empreses l'any 2026.
      </p>
      <p style="margin:12px 0 4px;color:var(--text-secondary);line-height:1.6;">
        Aquest treball l'hem fet els següents alumnes de GCAM:
      </p>
      <div class="about-contributors">
        ${["Aina Padrosa", "Fabià Pérez", "Judit Delicado", "Queralt Costa", "Saaddin Alonso"]
          .map(
            (name, index) =>
              `${index ? ", " : ""}<button type="button" class="about-contributor-link" data-open-profile-name="${escapeHtml(name)}" data-close-modal="modal-subject" data-i18n-ignore>${escapeHtml(name)}</button>`
          )
          .join("")}
      </div>
    `;
    openModal("modal-subject");
  }

  function makeSuggestionReference(route, routeId, overlay = null) {
    const routePath = {
      discover: "projectes",
      project: "projectes",
      positions: "posicions",
      messages: "missatges",
      profile: "perfils",
      leaderboard: "rànquing"
    }[route] || "projectes";
    const pathId = ["project", "profile"].includes(route) && routeId
      ? `/${encodeURIComponent(routeId)}`
      : "";
    const normalizedOverlay = normalizeSuggestionOverlay(overlay);
    let overlayPath = "";
    if (normalizedOverlay?.type === "about") overlayPath = "about-us";
    else if (normalizedOverlay?.type === "project-wizard") {
      overlayPath = `projectes/crear/pas-${normalizedOverlay.stepId}`;
    } else if (normalizedOverlay?.type === "profile-edit") overlayPath = "perfils/editar";
    else if (normalizedOverlay?.type === "subject") {
      overlayPath = `assignatures/${encodeURIComponent(normalizedOverlay.subject)}`;
    } else if (normalizedOverlay?.type === "create-menu") overlayPath = "menús/crear";
    else if (normalizedOverlay?.type === "popover") {
      overlayPath = `menús/${normalizedOverlay.id.replace("-dropdown", "")}`;
    } else if (normalizedOverlay?.type === "modal") {
      overlayPath = `finestres/${normalizedOverlay.id.replace(/^modal-/, "")}`;
    }
    return {
      route,
      routeId: routeId || "",
      path: `Intreramers/${overlayPath || `${routePath}${pathId}`}`,
      overlay: normalizedOverlay
    };
  }

  function getSuggestionPreviewUrl(reference) {
    const url = new URL(window.location.pathname, window.location.origin);
    url.searchParams.set("feedback-preview", "1");
    url.searchParams.set("feedback-route", reference.route);
    if (reference.routeId) url.searchParams.set("feedback-route-id", reference.routeId);
    if (reference.overlay) url.searchParams.set("feedback-overlay", JSON.stringify(reference.overlay));
    return url.toString();
  }

  function isSuggestionPreviewRatioAltered() {
    const originalRatioToggle = document.getElementById("suggestion-original-ratio");
    const frameWidth = originalRatioToggle.checked
      ? suggestionPreviewOriginalSize.width
      : window.innerWidth;
    const frameHeight = originalRatioToggle.checked
      ? suggestionPreviewOriginalSize.height
      : window.innerHeight;
    const originalRatio =
      suggestionPreviewOriginalSize.width / suggestionPreviewOriginalSize.height;
    return Math.abs(frameWidth / frameHeight - originalRatio) > 0.01;
  }

  function fitSuggestionPreview() {
    const container = document.querySelector(".suggestion-replica");
    const frame = document.getElementById("suggestion-preview-frame");
    const originalRatioToggle = document.getElementById("suggestion-original-ratio");
    const originalRatioOption = document.getElementById("suggestion-original-ratio-option");
    const infoTooltip = document.getElementById("suggestion-preview-info-tooltip");
    const frameWidth = originalRatioToggle.checked
      ? suggestionPreviewOriginalSize.width
      : window.innerWidth;
    const frameHeight = originalRatioToggle.checked
      ? suggestionPreviewOriginalSize.height
      : window.innerHeight;
    if (!frameWidth || !frameHeight || !container.clientHeight) return;

    container.style.width = "";
    container.style.marginInline = "";
    container.style.height = "";
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const fitScale = Math.min(1, containerWidth / frameWidth, containerHeight / frameHeight);
    const scale = fitScale * suggestionPreviewZoom;
    suggestionPreviewScale = scale;
    frame.style.width = `${frameWidth}px`;
    frame.style.height = `${frameHeight}px`;
    frame.style.transform = `scale(${scale})`;
    frame.style.left = `${(containerWidth - frameWidth * scale) / 2}px`;
    frame.style.top = `${(containerHeight - frameHeight * scale) / 2}px`;

    const originalRatio =
      suggestionPreviewOriginalSize.width / suggestionPreviewOriginalSize.height;
    const responsiveRatioIsAltered =
      Math.abs(window.innerWidth / window.innerHeight - originalRatio) > 0.01;
    const previewRatioIsAltered = isSuggestionPreviewRatioAltered();
    originalRatioOption.hidden = !responsiveRatioIsAltered && !originalRatioToggle.checked;
    const popupOnlyCapture =
      activeSuggestionReference?.overlay &&
      !document.getElementById("suggestion-full-page").checked;
    const captureDescription = popupOnlyCapture
      ? "En enviar, s'adjuntarà només la captura del popup. Activa «Veure tota la pàgina» per incloure el fons."
      : "En enviar, s'adjuntarà una captura de la pàgina seleccionada.";
    infoTooltip.textContent = previewRatioIsAltered
      ? `Desplaça amb dos dits o arrossega per navegar; fes pinça per ampliar o reduir. ${captureDescription}`
      : `Desplaça amb dos dits o arrossega per navegar. ${captureDescription}`;
  }

  function setSuggestionReference(reference) {
    activeSuggestionReference = reference;
  }

  function clearSuggestionPreview() {
    document.getElementById("suggestion-preview-frame").src = "about:blank";
    activeSuggestionReference = null;
  }

  function openSuggestionsModal(overlay = getSuggestionPreviewOverlay()) {
    const form = document.getElementById("suggestion-form");
    form.reset();
    document.getElementById("suggestion-error").classList.add("hidden");
    suggestionPreviewZoom = 1;
    const reference = makeSuggestionReference(ui.route, getCurrentRouteId(), overlay);
    setSuggestionReference(reference);
    document.getElementById("suggestion-full-page-option").hidden = !reference.overlay;
    document.getElementById("suggestion-reference").hidden = false;
    document.getElementById("suggestion-preview-frame").src = getSuggestionPreviewUrl(reference);
    openModal("modal-suggestions");
    requestAnimationFrame(fitSuggestionPreview);
  }

  let html2CanvasLoader = null;
  async function captureSuggestionPreview() {
    const frame = document.getElementById("suggestion-preview-frame");
    const previewWindow = frame.contentWindow;
    const previewDocument = frame.contentDocument;
    if (!previewWindow || !previewDocument?.documentElement || previewDocument.readyState !== "complete") {
      throw new Error("La rèplica encara no està preparada per capturar-la.");
    }

    html2CanvasLoader ||= import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm")
      .then((module) => module.default)
      .catch((error) => {
        html2CanvasLoader = null;
        throw error;
      });
    const html2canvas = await html2CanvasLoader;
      const showFullPage = document.getElementById("suggestion-full-page").checked;
      const overlay = activeSuggestionReference?.overlay;
      const overlayElementIdByType = {
        about: "modal-subject",
        subject: "modal-subject",
        "project-wizard": "modal-publish-project",
        "profile-edit": "modal-edit-profile",
        "create-menu": "modal-create"
      };
      const overlayElementId = overlayElementIdByType[overlay?.type] || overlay?.id;
      const overlayTarget = overlay && !showFullPage
        ? overlay.type === "popover"
          ? previewDocument.getElementById(overlay.id)
          : previewDocument.getElementById(overlayElementId)?.querySelector(".modal-card, .create-modal-card")
        : null;
      if (overlay && !showFullPage && !overlayTarget) {
        throw new Error("No s'ha trobat el popup seleccionat a la rèplica.");
      }
      const captureTarget = overlayTarget || previewDocument.documentElement;
      const bounds = overlayTarget?.getBoundingClientRect();
      const width = Math.round(bounds?.width || previewWindow.innerWidth);
      const height = Math.round(bounds?.height || previewWindow.innerHeight);
    if (!width || !height) throw new Error("La rèplica no té una mida vàlida.");
    const scale = Math.min(1, 1280 / width, 720 / height);
      const canvas = await html2canvas(captureTarget, {
      allowTaint: false,
      backgroundColor: "#ffffff",
      height,
      imageTimeout: 4000,
      logging: false,
      scale,
      useCORS: true,
      width,
        windowHeight: previewWindow.innerHeight,
        windowWidth: previewWindow.innerWidth,
        ...(overlayTarget ? {} : { x: previewWindow.scrollX, y: previewWindow.scrollY })
    });
    return canvas.toDataURL("image/jpeg", 0.76);
  }

  function initializeSuggestionBox() {
    const form = document.getElementById("suggestion-form");
    const textOnlyToggle = document.getElementById("suggestion-text-only");
      const fullPageToggle = document.getElementById("suggestion-full-page");
      const fullPageOption = document.getElementById("suggestion-full-page-option");
    const originalRatioToggle = document.getElementById("suggestion-original-ratio");
    const referenceSection = document.getElementById("suggestion-reference");
    const previewFrame = document.getElementById("suggestion-preview-frame");
    const previewContainer = document.querySelector(".suggestion-replica");
    const errorElement = document.getElementById("suggestion-error");
    const submitButton = document.getElementById("suggestion-submit");
    let gestureZoomStart = 1;
    let previewDrag = null;
    let suppressPreviewClick = false;
    const findPreviewScrollTarget = (previewWindow, target) => {
      const previewDocument = previewWindow.document;
      const root = previewDocument.documentElement;
      let scrollTarget =
        target instanceof previewWindow.Element ? target : null;
      while (scrollTarget && scrollTarget !== root) {
        const style = previewWindow.getComputedStyle(scrollTarget);
        const canScroll =
          /(auto|scroll)/.test(`${style.overflowX} ${style.overflowY}`) &&
          (scrollTarget.scrollHeight > scrollTarget.clientHeight ||
            scrollTarget.scrollWidth > scrollTarget.clientWidth);
        if (canScroll) break;
        scrollTarget = scrollTarget.parentElement;
      }
      return scrollTarget || previewDocument.scrollingElement || root;
    };
    const scrollPreview = (previewWindow, target, deltaX, deltaY) => {
      const scrollTarget = findPreviewScrollTarget(previewWindow, target);
      scrollTarget.scrollLeft += deltaX;
      scrollTarget.scrollTop += deltaY;
    };
    const zoomPreview = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isSuggestionPreviewRatioAltered()) return;
      suggestionPreviewZoom = Math.max(
        0.5,
        Math.min(3, suggestionPreviewZoom * Math.exp(-event.deltaY * 0.002))
      );
      fitSuggestionPreview();
    };
    const handlePreviewWheel = (event) => {
      if (event.ctrlKey || event.metaKey) zoomPreview(event);
    };
    const handleDisplayWheel = (event) => {
      const frameRect = previewFrame.getBoundingClientRect();
      const pointerOverFrame =
        event.target === previewFrame ||
        (event.clientX >= frameRect.left &&
          event.clientX <= frameRect.right &&
          event.clientY >= frameRect.top &&
          event.clientY <= frameRect.bottom);
      if (pointerOverFrame) return;
      if (event.ctrlKey || event.metaKey) {
        zoomPreview(event);
        return;
      }

      event.preventDefault();
      const previewWindow = previewFrame.contentWindow;
      const deltaMultiplier =
        event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? previewWindow.innerHeight : 1;
      const displayScale = Math.max(suggestionPreviewScale, 0.01);
      scrollPreview(
        previewWindow,
        null,
        (event.deltaX * deltaMultiplier) / displayScale,
        (event.deltaY * deltaMultiplier) / displayScale
      );
    };

    const attachPreviewInteractions = () => {
      const previewWindow = previewFrame.contentWindow;
      const previewDocument = previewWindow.document;
      const root = previewDocument.documentElement;
      if (root.dataset.suggestionInteractionsAttached === "true") return;
      root.dataset.suggestionInteractionsAttached = "true";
      const cursorStyle = previewDocument.createElement("style");
      cursorStyle.textContent = "html, body { cursor: grab; }";
      previewDocument.head.append(cursorStyle);
      previewDocument.addEventListener("wheel", handlePreviewWheel, { capture: true, passive: false });
      previewDocument.addEventListener(
        "gesturestart",
        (event) => {
          event.preventDefault();
          if (!isSuggestionPreviewRatioAltered()) return;
          gestureZoomStart = suggestionPreviewZoom;
        },
        { passive: false }
      );
      previewDocument.addEventListener(
        "gesturechange",
        (event) => {
          event.preventDefault();
          if (!isSuggestionPreviewRatioAltered()) return;
          suggestionPreviewZoom = Math.max(
            0.5,
            Math.min(3, gestureZoomStart * event.scale)
          );
          fitSuggestionPreview();
        },
        { passive: false }
      );
      previewDocument.addEventListener(
        "pointerdown",
        (event) => {
          if (event.button !== 0 || event.isPrimary === false) return;
          previewDrag = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            lastX: event.clientX,
            lastY: event.clientY,
            moved: false,
            scrollTarget: findPreviewScrollTarget(previewWindow, event.target)
          };
          if (event.target instanceof previewWindow.Element) {
            event.target.setPointerCapture?.(event.pointerId);
          }
        },
        { capture: true }
      );
      previewDocument.addEventListener(
        "pointermove",
        (event) => {
          if (!previewDrag || event.pointerId !== previewDrag.pointerId) return;
          const deltaX = event.clientX - previewDrag.lastX;
          const deltaY = event.clientY - previewDrag.lastY;
          previewDrag.lastX = event.clientX;
          previewDrag.lastY = event.clientY;
          if (
            !previewDrag.moved &&
            Math.hypot(event.clientX - previewDrag.startX, event.clientY - previewDrag.startY) > 4
          ) {
            previewDrag.moved = true;
          }
          if (!previewDrag.moved) return;
          event.preventDefault();
          event.stopPropagation();
          previewDrag.scrollTarget.scrollLeft -= deltaX;
          previewDrag.scrollTarget.scrollTop -= deltaY;
          root.style.cursor = "grabbing";
        },
        { capture: true, passive: false }
      );
      const endPreviewDrag = () => {
        if (previewDrag?.moved) {
          suppressPreviewClick = true;
          setTimeout(() => {
            suppressPreviewClick = false;
          }, 0);
        }
        previewDrag = null;
        root.style.cursor = "";
      };
      previewDocument.addEventListener("pointerup", endPreviewDrag, { capture: true });
      previewDocument.addEventListener("pointercancel", endPreviewDrag, { capture: true });
      previewDocument.addEventListener(
        "click",
        (event) => {
          if (!suppressPreviewClick) return;
          suppressPreviewClick = false;
          event.preventDefault();
          event.stopImmediatePropagation();
        },
        { capture: true }
      );
    };

    textOnlyToggle.addEventListener("change", () => {
      referenceSection.hidden = textOnlyToggle.checked;
      if (textOnlyToggle.checked) {
        previewFrame.src = "about:blank";
      } else if (activeSuggestionReference) {
        previewFrame.src = getSuggestionPreviewUrl(activeSuggestionReference);
        requestAnimationFrame(fitSuggestionPreview);
      }
    });
    originalRatioToggle.addEventListener("change", () => {
      if (originalRatioToggle.checked) suggestionPreviewZoom = 1;
      fitSuggestionPreview();
    });
    fullPageToggle.addEventListener("change", fitSuggestionPreview);
    previewContainer.addEventListener("wheel", handleDisplayWheel, { passive: false });
    previewFrame.addEventListener("load", attachPreviewInteractions);
    window.addEventListener("resize", fitSuggestionPreview);
    document.addEventListener("fullscreenchange", fitSuggestionPreview);

    window.addEventListener("message", (event) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== previewFrame.contentWindow ||
        event.data?.type !== "suggestion-preview-route" ||
        !validRoutes.has(event.data.route) ||
        document.getElementById("modal-suggestions").classList.contains("hidden")
      ) {
        return;
      }
      const previousOverlay = activeSuggestionReference?.overlay || null;
      const reference = makeSuggestionReference(
        event.data.route,
        event.data.routeId,
        normalizeSuggestionOverlay(event.data.overlay)
      );
      if (JSON.stringify(previousOverlay) !== JSON.stringify(reference.overlay)) {
        fullPageToggle.checked = false;
      }
      fullPageOption.hidden = !reference.overlay;
      setSuggestionReference(reference);
      requestAnimationFrame(fitSuggestionPreview);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const message = document.getElementById("suggestion-message").value.trim();
      if (!message) {
        errorElement.textContent = "Escriu el suggeriment abans d'enviar-lo.";
        errorElement.classList.remove("hidden");
        return;
      }
      const userId = state.currentUserId || auth.currentUser?.uid;
      if (!userId) {
        errorElement.textContent = "Has d'iniciar sessió per enviar un suggeriment.";
        errorElement.classList.remove("hidden");
        return;
      }

      const reference = textOnlyToggle.checked ? null : activeSuggestionReference;
      submitButton.disabled = true;
      errorElement.classList.add("hidden");
      try {
        let screenshot = null;
        if (reference) {
          try {
            const screenshotData = await captureSuggestionPreview();
            screenshot = await uploadDataUrlIfNeeded(screenshotData, "suggestion-screenshots");
          } catch (error) {
            console.error("No s'ha pogut capturar la pàgina del suggeriment:", error);
            errorElement.textContent =
              "No s'ha pogut crear la captura de la pàgina. Torna-ho a provar o selecciona l'opció d'enviar només el text.";
            errorElement.classList.remove("hidden");
            return;
          }
        }
        await setDoc(doc(collection(db, "suggestions")), {
          userId,
          message,
          screenshot,
          reference: reference
            ? {
                path: reference.path,
                route: reference.route,
                routeId: reference.routeId,
                overlay: reference.overlay,
                showFullPage: reference.overlay ? fullPageToggle.checked : false
              }
            : null,
          createdAt: serverTimestamp()
        });
        form.reset();
        closeModal("modal-suggestions");
        showToast("Gràcies pel teu suggeriment!");
      } catch (error) {
        console.error("No s'ha pogut desar el suggeriment:", error);
        errorElement.textContent = "No s'ha pogut enviar el suggeriment. Torna-ho a provar.";
        errorElement.classList.remove("hidden");
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  function initializeSuggestionPreviewMode() {
    if (!isFeedbackPreview) return;
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const navigationElement = target?.closest(
        "[data-route], [data-open-project], [data-open-profile], [data-open-profile-name]"
      );
      const interactiveElement = target?.closest("button, a, input, select, textarea, [role='button']");
      const forbiddenAction = interactiveElement?.matches(
        "[data-action='open-suggestions'], [data-route='suggestions'], #logout-btn, button[type='submit'], input[type='submit'], input[type='image']"
      );
      const safeControl = target?.closest(
        "#platform-menu-trigger, #create-menu-trigger, #notif-menu-trigger, #profile-menu-trigger, #open-profile-edit, #proj-wizard-next, #proj-wizard-back, [data-action='open-about'], [data-action='open-publish-project'], [data-close-modal], [data-app-back]"
      );
      const editablePreviewForm = target?.closest("#modal-publish-project");
      if (
        !forbiddenAction &&
        ((navigationElement && (!interactiveElement || interactiveElement === navigationElement)) ||
          safeControl ||
          (editablePreviewForm && interactiveElement))
      ) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    document.addEventListener("submit", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  }

  function restoreSuggestionPreviewOverlay() {
    if (!isFeedbackPreview) return;
    const overlayText = previewParams.get("feedback-overlay");
    if (!overlayText) return;

    let overlay;
    try {
      overlay = normalizeSuggestionOverlay(JSON.parse(overlayText));
    } catch (error) {
      console.warn("S'ha ignorat el popup de referència perquè no té un format vàlid.", error);
      return;
    }
    if (!overlay) return;

    if (overlay.type === "about") {
      openAboutModal();
    } else if (overlay.type === "subject") {
      openSubjectModal(overlay.subject);
    } else if (overlay.type === "project-wizard") {
      openNewProjectModal();
      if (overlay.seekingCollaborator) {
        document.getElementById("proj-team-type").value = "group";
        document.getElementById("proj-seeking-collaborator").checked = true;
        syncProjectTeamFields();
      }
      const stepIndex = getProjectWizardSteps().findIndex((step) => step.id === overlay.stepId) + 1;
      setProjectWizardStep(stepIndex > 0 ? stepIndex : 1);
    } else if (overlay.type === "profile-edit") {
      openEditProfileModal(getCurrentUser());
    } else if (overlay.type === "create-menu") {
      openModal("modal-create");
    } else if (overlay.type === "popover") {
      const triggerByMenu = {
        "platform-dropdown": "platform-menu-trigger",
        "notif-dropdown": "notif-menu-trigger",
        "profile-dropdown": "profile-menu-trigger"
      };
      togglePopover(overlay.id, triggerByMenu[overlay.id]);
    } else if (overlay.type === "modal") {
      openModal(overlay.id);
    }
  }

  const PROJECT_PARTICIPANT_ROLES = [
    "Disseny sonor",
    "Direcció de fotografia",
    "Direcció",
    "Muntatge / Edició",
    "Interpretació / Actors",
    "Fotografia",
    "Disseny gràfic",
    "Animació / 3D",
    "Guió",
    "Producció",
    "UI/UX",
    "Altres perfils"
  ];

  function getProjectParticipantRows() {
    const seenNames = new Set();
    return [...document.querySelectorAll("#proj-participant-rows .project-participant-row")]
      .map((row) => {
        const name = row.querySelector(".project-participant-name").value.trim();
        const normalizedName = name.toLocaleLowerCase();
        if (!name || seenNames.has(normalizedName)) return null;
        seenNames.add(normalizedName);
        const student =
          state.students.find((candidate) => candidate.id === row.dataset.participantId) ||
          getStudentByName(name);
        return {
          id: student?.id || "",
          name,
          role: row.querySelector(".project-participant-role").value
        };
      })
      .filter(Boolean);
  }

  function getProjectParticipantRowMarkup(participant = {}) {
    const selectedRole = typeof participant.role === "string" ? participant.role : "";
    const roleChoices =
      selectedRole && !PROJECT_PARTICIPANT_ROLES.includes(selectedRole)
        ? [selectedRole, ...PROJECT_PARTICIPANT_ROLES]
        : PROJECT_PARTICIPANT_ROLES;
    const roleOptions = [
      `<option value="">Rol opcional</option>`,
      ...roleChoices.map(
        (role) => `<option value="${escapeHtml(role)}" ${selectedRole === role ? "selected" : ""}>${escapeHtml(role)}</option>`
      )
    ].join("");
    const participantName = typeof participant.name === "string" ? participant.name : "";
    return `
      <div class="project-participant-row" data-participant-id="${escapeHtml(participant.id || "")}">
        <input type="text" class="project-participant-name" value="${escapeHtml(participantName)}" placeholder="Nom i cognoms" aria-label="Nom del participant" />
        <select class="project-participant-role" aria-label="Rol del participant">${roleOptions}</select>
        <button type="button" class="project-participant-remove" data-remove-project-participant aria-label="Eliminar participant">&times;</button>
      </div>
    `;
  }

  function addProjectParticipantRow(participant = {}) {
    document
      .getElementById("proj-participant-rows")
      .insertAdjacentHTML("beforeend", getProjectParticipantRowMarkup(participant));
    const addedRow = document.querySelector("#proj-participant-rows .project-participant-row:last-child");
    if (!participant.name) addedRow.querySelector(".project-participant-name").focus();
    populateParticipantSearch();
  }

  function renderProjectParticipantRows(project) {
    document.getElementById("proj-participant-search").value = "";
    const participantDetails = Array.isArray(project.participantDetails)
      ? project.participantDetails.filter((participant) => participant && typeof participant === "object")
      : [];
    const names = new Set([
      ...(Array.isArray(project.participants) ? project.participants : []),
      ...participantDetails.map((participant) => participant.name),
      ...getProjectParticipantIds(project).map((id) => getStudentById(id).name)
    ]);
    const participants = [...names]
      .filter((name) => typeof name === "string" && name.trim())
      .map((name) => {
        const detail = participantDetails.find(
          (participant) =>
            (typeof participant.name === "string" &&
              participant.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase()) ||
            (participant.id && getStudentById(participant.id).name === name)
        );
        const student = getStudentByName(name);
        return {
          id: detail?.id || student?.id || "",
          name,
          role: detail?.role || ""
        };
      });
    document.getElementById("proj-participant-rows").innerHTML = participants
      .map(getProjectParticipantRowMarkup)
      .join("");
    populateParticipantSearch();
  }

  function populateParticipantSearch() {
    const input = document.getElementById("proj-participant-search");
    const suggestions = document.getElementById("proj-participant-suggestions");
    if (!input || !suggestions) return;
    const query = input.value.trim().toLocaleLowerCase();
    if (!query) {
      suggestions.innerHTML = "";
      suggestions.classList.add("hidden");
      input.setAttribute("aria-expanded", "false");
      return;
    }

    const currentUser = getCurrentUser();
    const selectedParticipants = getProjectParticipantRows();
    const selectedIds = new Set(selectedParticipants.map((participant) => participant.id).filter(Boolean));
    const selectedNames = new Set(
      selectedParticipants.map((participant) => participant.name.trim().toLocaleLowerCase())
    );
    const candidates = state.students.filter(
      (student) =>
        student.id !== currentUser.id &&
        !selectedIds.has(student.id) &&
        typeof student.name === "string" &&
        !selectedNames.has(student.name.trim().toLocaleLowerCase()) &&
        `${student.name} ${student.year || ""}`.toLocaleLowerCase().includes(query)
    );
    suggestions.innerHTML = candidates.length
      ? candidates
          .slice(0, 12)
          .map(
            (student) => `
              <button type="button" class="subject-suggestion-item" data-add-registered-participant="${escapeHtml(student.id)}" role="option">
                <span>${escapeHtml(student.name)}</span>
                <small>${escapeHtml(student.year || "")}</small>
              </button>`
          )
          .join("")
      : `<div class="subject-suggestion-empty">Cap coincidència. Prem Retorn per afegir «${escapeHtml(input.value.trim())}».</div>`;
    suggestions.classList.remove("hidden");
    input.setAttribute("aria-expanded", "true");
  }

  function openNewProjectModal() {
    document.getElementById("modal-project-title").textContent = "Publicar nou projecte";
    document.getElementById("publish-project-form").reset();
    document.getElementById("proj-edit-id").value = "";
    document.getElementById("proj-participants-can-manage").disabled = false;
    document.getElementById("proj-deadline").value = daysFromNow(7);
    document.getElementById("proj-collab-start").value = daysFromNow(3);
    document.getElementById("proj-collab-end").value = daysFromNow(20);
    syncProjectAspectButtons("portrait");
    uploadedProjectCover = "";
    uploadedProjectMediaImages = [];
    projectMediaUploadPending = false;
    projectMediaUploadGeneration += 1;
    setProjectCropSource("");
    renderProjectMediaPreview();
    populateParticipantSearch();
    syncProjectTeamFields();
    setProjectWizardStep(1);
    openModal("modal-publish-project");
  }

  function openEditProjectModal(project) {
    document.getElementById("modal-project-title").textContent = "Editar projecte";
    document.getElementById("proj-edit-id").value = project.id;
    document.getElementById("proj-title").value = project.title || "";
    document.getElementById("proj-category").value = project.category || "Disseny gràfic";
    const normAspect = (project.aspect || "portrait").replace(/^span-/, "");
    syncProjectAspectButtons(normAspect === "tall" ? "portrait" : normAspect === "landscape" ? "wide" : normAspect);
    document.getElementById("proj-cover-file").value = "";
    uploadedProjectCover = project.cover || "";
    setProjectCropSource(project.cover || "", {
      dirty: false,
      framed: isProjectCoverFramed(project)
    });
    document.getElementById("proj-description").value = project.description || "";
    document.getElementById("proj-briefing").value = project.briefing || "";
    document.getElementById("proj-subject").value = project.subject || "";
    document.getElementById("proj-professor").value = project.professor || "";
    document.getElementById("proj-year").value = project.year || "1r Curs";
    document.getElementById("proj-stage").value = project.stage || "";
    document.getElementById("proj-deadline").value = project.deadline || daysFromNow(7);
    document.getElementById("proj-team-type").value = project.teamType || "individual";
    document.getElementById("proj-participant-search").value = "";
    document.getElementById("proj-seeking-collaborator").checked = Boolean(project.seekingCollaborator);
    document.getElementById("proj-collab-role").value = project.collaboratorRole || "Dissenyador/a gràfic/a";
    document.getElementById("proj-collab-start").value = project.collaborationStartDate || daysFromNow(3);
    document.getElementById("proj-collab-end").value = project.collaborationEndDate || daysFromNow(20);
    document.getElementById("proj-collab-compensation").value = project.collaborationCompensation || "Academic collaboration";
    document.getElementById("proj-collab-location").value = project.collaborationLocation || "Hybrid";
    document.getElementById("proj-collab-place").value = project.collaborationPlace || "";
    document.getElementById("proj-collab-transport").value = project.collaborationTransport || "";
    document.getElementById("proj-collab-expenses").value = project.collaborationExpenses || "No incloses";
    document.getElementById("proj-collab-details").value = project.collaborationDetails || "";
    syncProjectTeamFields();
    if (project.teamType === "group") renderProjectParticipantRows(project);
    const participantsCanManage = document.getElementById("proj-participants-can-manage");
    participantsCanManage.checked = Boolean(project.participantsCanManage);
    participantsCanManage.disabled = project.ownerId !== getCurrentUser().id;
    document.getElementById("proj-media-url").value = project.mediaUrl || "";
    document.getElementById("proj-media-images").value = "";
    uploadedProjectMediaImages = Array.isArray(project.mediaImages) ? project.mediaImages.map((image) => ({ ...image })) : [];
    projectMediaUploadPending = false;
    projectMediaUploadGeneration += 1;
    renderProjectMediaPreview();
    document.getElementById("proj-feedback-type").value = project.feedbackType || "";
    setProjectWizardStep(1);
    openModal("modal-publish-project");
  }

  let editProfileSubjects = [];

  function renderEditProfileSubjects() {
    const selectedContainer = document.getElementById("edit-profile-subject-list");
    const optionsContainer = document.getElementById("edit-profile-subject-options");
    const filter = (document.getElementById("edit-profile-subject-input")?.value || "").trim().toLowerCase();
    if (!selectedContainer || !optionsContainer) return;

    selectedContainer.innerHTML = editProfileSubjects.length
      ? editProfileSubjects
          .map(
            (subject) => `
            <span class="edit-profile-subject-item">
              ${escapeHtml(subject)}
              <button type="button" data-remove-edit-subject="${escapeHtml(subject)}" aria-label="Treure ${escapeHtml(subject)}">&times;</button>
            </span>`
          )
          .join("")
      : `<p class="edit-profile-subject-empty">Cap assignatura seleccionada.</p>`;

    const groupsHtml = SUBJECT_GROUPS.map((group) => {
      const available = group.subjects.filter(
        (subject) =>
          !editProfileSubjects.includes(subject) &&
          (!filter || subject.toLowerCase().includes(filter) || group.label.toLowerCase().includes(filter))
      );
      if (!available.length) return "";
      return `
        <div>
          <p class="edit-profile-subject-group-title">${escapeHtml(group.label)}</p>
          <div class="edit-profile-subject-group-list">
            ${available
              .map(
                (subject) =>
                  `<button type="button" class="edit-profile-subject-option" data-add-edit-subject="${escapeHtml(subject)}">+ ${escapeHtml(subject)}</button>`
              )
              .join("")}
          </div>
        </div>`;
    })
      .filter(Boolean)
      .join("");

    optionsContainer.innerHTML = groupsHtml || `<p class="edit-profile-subject-empty">No s'han trobat assignatures.</p>`;
  }

  function openEditProfileModal(student) {
    const [firstName, ...lastNameParts] = (student.name || "").trim().split(/\s+/);
    document.getElementById("edit-profile-name").value = firstName || "";
    document.getElementById("edit-profile-surname").value = lastNameParts.join(" ");
    document.getElementById("edit-profile-email").value = student.email || "";
    document.getElementById("edit-profile-avatar").value = "";
    document.getElementById("edit-profile-avatar-color").value = student.avatarColor || "#8f7cf6";
    document.getElementById("edit-profile-subject-input").value = "";
    document.getElementById("edit-profile-password").value = "";
    document.getElementById("edit-profile-password-confirm").value = "";
    document.getElementById("edit-profile-error").classList.add("hidden");
    editProfileSubjects = [...new Set(student.interests || [])];
    renderEditProfileSubjects();
    openModal("modal-edit-profile");
  }

  function closeModal(modalId, { keepForBack = false, preserveHistory = false } = {}) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("hidden");
    if (modalId === "modal-suggestions") clearSuggestionPreview();
    if (keepForBack) {
      modalBackHistory.push(modalId);
    } else if (!preserveHistory) {
      modalBackHistory.length = 0;
    }
    updateBackButton();
    notifySuggestionPreviewRoute();
  }

  function restoreNavigationEntry(entry) {
    ui.selectedCategory = typeof entry.selectedCategory === "string" ? entry.selectedCategory : "General";
    ui.searchQuery = typeof entry.searchQuery === "string" ? entry.searchQuery : "";
    ui.sortBy = typeof entry.sortBy === "string" ? entry.sortBy : "recent";
    ui.visibleCount = Number.isFinite(entry.visibleCount) && entry.visibleCount >= 15 ? entry.visibleCount : 15;
    ui.advancedFiltersOpen = entry.advancedFiltersOpen === true;
    ui.filters = {
      subject: typeof entry.filters?.subject === "string" ? entry.filters.subject : "",
      professor: typeof entry.filters?.professor === "string" ? entry.filters.professor : "",
      year: typeof entry.filters?.year === "string" ? entry.filters.year : "",
      stage: typeof entry.filters?.stage === "string" ? entry.filters.stage : "",
      teamType: typeof entry.filters?.teamType === "string" ? entry.filters.teamType : "",
      status: typeof entry.filters?.status === "string" ? entry.filters.status : "active",
      urgentOnly: entry.filters?.urgentOnly === true
    };
    ui.posFilters = {
      role: typeof entry.posFilters?.role === "string" ? entry.posFilters.role : "",
      compensation: typeof entry.posFilters?.compensation === "string" ? entry.posFilters.compensation : "",
      projectType: typeof entry.posFilters?.projectType === "string" ? entry.posFilters.projectType : "",
      location: typeof entry.posFilters?.location === "string" ? entry.posFilters.location : ""
    };
    ui.activeProjectId = entry.route === "project" ? entry.routeId : null;
    ui.activeProfileId = entry.route === "profile" ? entry.routeId : null;
    ui.activeConversationId = entry.route === "messages" ? entry.routeId : null;

    navigateTo(entry.route, entry.routeId || null, {
      restore: true,
      skipHistory: true,
      scrollX: Number.isFinite(entry.scrollX) ? entry.scrollX : 0,
      scrollY: Number.isFinite(entry.scrollY) ? entry.scrollY : 0
    });
  }

  function handleAppBack() {
    const activeModal = [...document.querySelectorAll(".modal-backdrop:not(.hidden)")].at(-1);
    if (activeModal) {
      if (activeModal.id === "modal-suggestions") {
        updateBackButton();
        return;
      }
      if (activeModal.id === "modal-publish-project" && projectWizardStep > 1) {
        goBackProjectWizardStep();
        return;
      }

      const previousModal = modalBackHistory.pop();
      closeModal(activeModal.id, { preserveHistory: true });
      if (previousModal) openModal(previousModal);
      return;
    }

    const previousScreen = navigationHistory.pop();
    if (!previousScreen) {
      updateBackButton();
      return;
    }
    persistNavigationHistory();
    restoreNavigationEntry(previousScreen);
  }

  function showToast(message) {
    const container = document.getElementById("toast-container");
    const el = document.createElement("div");
    el.className = "toast-msg";
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 3400);
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // =========================================================================
  // 12. AUTENTICACIÓ AMB FIREBASE AUTH + FIRESTORE
  // =========================================================================
  function getRegistrationProgram(degreeCode = document.getElementById("auth-degree")?.value) {
    return REGISTRATION_PROGRAMS[degreeCode] || null;
  }

  function getSelectedRegistrationRole() {
    return document.querySelector('input[name="auth-role"]:checked')?.value || "student";
  }

  function getRegistrationTotalSteps(role = getSelectedRegistrationRole()) {
    return role === "alumni" ? 2 : 3;
  }

  let authRegisterStep = 1;

  function setAuthRegisterStep(step) {
    const role = getSelectedRegistrationRole();
    const totalSteps = getRegistrationTotalSteps(role);
    const personalDetailsTitle = document.querySelector(".auth-personal-details-title");
    const alumniAcademicHeading = document.getElementById("auth-alumni-academic-heading");
    const alumniAcademicTarget = document.getElementById("auth-alumni-academic-target");
    const studentAcademicTarget = document.getElementById("auth-student-academic-target");
    const academicFields = document.getElementById("auth-academic-fields");
    const stepLabels =
      role === "alumni"
        ? ["Pas 1 de 2 · Perfil", "Pas 2 de 2 · Dades personals"]
        : ["Pas 1 de 3 · Perfil", "Pas 2 de 3 · Dades personals", "Pas 3 de 3 · Grau i assignatures"];
    authRegisterStep = Math.max(1, Math.min(totalSteps, step));

    if (personalDetailsTitle) {
      personalDetailsTitle.textContent = role === "alumni" ? "2. Dades personals i perfil" : "Dades personals i perfil";
    }
    if (alumniAcademicHeading && alumniAcademicTarget && studentAcademicTarget && academicFields) {
      alumniAcademicHeading.classList.toggle("hidden", role !== "alumni");
      (role === "alumni" ? alumniAcademicTarget : studentAcademicTarget).prepend(academicFields);
    }

    document.querySelectorAll("[data-auth-register-step]").forEach((section) => {
      const sectionStep = Number(section.dataset.authRegisterStep);
      section.hidden = sectionStep !== authRegisterStep || sectionStep > totalSteps;
    });

    document.querySelectorAll("[data-auth-register-progress]").forEach((indicator) => {
      const indicatorStep = Number(indicator.dataset.authRegisterProgress);
      indicator.hidden = indicatorStep > totalSteps;
      indicator.classList.toggle("is-active", indicatorStep <= authRegisterStep && indicatorStep <= totalSteps);
    });

    document.getElementById("auth-register-step-label").textContent = stepLabels[authRegisterStep - 1];
    document.getElementById("auth-register-back").classList.toggle("hidden", authRegisterStep === 1);
    document.getElementById("auth-register-next").classList.toggle("hidden", authRegisterStep === totalSteps);
    document.getElementById("auth-register-submit").classList.toggle("hidden", authRegisterStep !== totalSteps);
    document.getElementById("auth-form-error").classList.add("hidden");
  }

  function advanceAuthRegisterStep() {
    const errorEl = document.getElementById("auth-form-error");
    errorEl.classList.add("hidden");

    if (authRegisterStep === 2) {
      const firstName = document.getElementById("auth-first-name").value.trim();
      const lastName = document.getElementById("auth-last-name").value.trim();
      const email = document.getElementById("auth-email").value.trim();
      const password = document.getElementById("auth-password").value;
      const passwordConfirm = document.getElementById("auth-password-confirm").value;

      if (!firstName || !lastName) {
        errorEl.textContent = "Introdueix el teu nom i cognoms.";
        errorEl.classList.remove("hidden");
        return;
      }
      if (!email || !email.includes("@")) {
        errorEl.textContent = "Introdueix un correu electrònic vàlid.";
        errorEl.classList.remove("hidden");
        return;
      }
      if (password.length < 8) {
        errorEl.textContent = "La contrasenya ha de tenir almenys 8 caràcters.";
        errorEl.classList.remove("hidden");
        return;
      }
      if (password !== passwordConfirm) {
        errorEl.textContent = "Les contrasenyes no coincideixen.";
        errorEl.classList.remove("hidden");
        return;
      }
    }

    setAuthRegisterStep(authRegisterStep + 1);
  }

  function renderAuthSubjectOptions(selectedSubjects = new Set()) {
    const degreeCode = document.getElementById("auth-degree")?.value || "";
    const year = document.getElementById("auth-year")?.value || "";
    const role = getSelectedRegistrationRole();
    const program = getRegistrationProgram(degreeCode);
    const picker = document.getElementById("auth-subject-picker");
    const emptyMessage = document.getElementById("auth-subjects-empty");
    const suggestedTitle = document.getElementById("auth-suggested-subjects-title");
    const suggestedContainer = document.getElementById("auth-suggested-subject-options");
    const searchInput = document.getElementById("auth-subject-search-input");
    const searchHelp = document.getElementById("auth-subject-search-help");
    const searchResultsContainer = document.getElementById("auth-subject-search-results");
    const selectedContainer = document.getElementById("auth-selected-subject-options");
    if (!picker || !suggestedContainer || !searchResultsContainer || !selectedContainer) return;

    if (role !== "student" || !program || !year) {
      picker.hidden = true;
      if (emptyMessage) {
        emptyMessage.hidden = role !== "student";
        emptyMessage.textContent = !program
          ? "Tria primer el grau i el curs per veure les assignatures del pla d'estudis."
          : "Tria el curs per veure les assignatures matriculades d'aquest grau.";
      }
      suggestedContainer.innerHTML = "";
      searchResultsContainer.innerHTML = "";
      selectedContainer.innerHTML = "";
      return;
    }

    picker.hidden = false;
    if (emptyMessage) emptyMessage.hidden = true;

    const yearSubjects = program.years[year] || [];
    const allProgramSubjects = [
      ...new Set([...Object.values(program.years).flat(), ...(program.electives || [])])
    ];
    const validSelected = new Set(
      [...selectedSubjects].filter((subject) => allProgramSubjects.includes(subject))
    );
    const query = (searchInput?.value || "").trim().toLowerCase();

    if (suggestedTitle) {
      suggestedTitle.textContent = `Suggerides pel curs (${year})`;
    }

    const createSubjectLabel = (subject) => `
      <label class="pill-tag auth-subject-pill ${validSelected.has(subject) ? "selected" : ""}">
        <input type="checkbox" name="auth-subjects" value="${escapeHtml(subject)}" ${validSelected.has(subject) ? "checked" : ""} />
        <span>${escapeHtml(subject)}</span>
      </label>
    `;

    suggestedContainer.innerHTML = yearSubjects.map(createSubjectLabel).join("");

    const otherSubjects = allProgramSubjects.filter(
      (subject) => !yearSubjects.includes(subject) && (!query || subject.toLowerCase().includes(query))
    );
    if (searchHelp) {
      searchHelp.textContent = query
        ? `Resultats per "${searchInput.value.trim()}":`
        : "Escriu o tria altres assignatures i optatives d'aquest grau:";
    }
    searchResultsContainer.innerHTML = otherSubjects.length
      ? otherSubjects.map(createSubjectLabel).join("")
      : `<small class="auth-subject-search-help">Cap assignatura coincideix amb aquesta cerca.</small>`;

    const selectedList = [...validSelected];
    selectedContainer.innerHTML = selectedList.length
      ? selectedList.map(createSubjectLabel).join("")
      : `<small class="auth-subject-search-help">Encara no has seleccionat cap assignatura.</small>`;
  }

  function makeInitialAvatar(name, color) {
    const initials =
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "IE";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <rect width="240" height="240" rx="120" fill="${color}" />
      <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="88" font-weight="700">${initials}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function enterApp() {
    document.body.classList.add("authenticated");
    const authPage = document.getElementById("auth-page");
    if (authPage) authPage.classList.add("hidden");
    document.body.classList.remove("auth-loading");
    navigateTo(
      ui.route,
      ui.route === "project"
        ? ui.activeProjectId
        : ui.route === "profile"
          ? ui.activeProfileId
          : ui.route === "messages"
            ? ui.activeConversationId
            : null,
      { restore: restoreSavedViewOnEntry }
    );
    restoreSuggestionPreviewOverlay();
  }

  function setupAuthFlow() {
    const authPage = document.getElementById("auth-page");
    const startView = document.getElementById("auth-start-view");
    const loginView = document.getElementById("auth-login-view");
    const recoveryView = document.getElementById("auth-recovery-view");
    const registerView = document.getElementById("auth-register-view");
    const loginForm = document.getElementById("auth-login-form");
    const recoveryForm = document.getElementById("auth-recovery-form");
    const form = document.getElementById("auth-register-form");
    if (!authPage || !form || !loginForm || !recoveryForm) return;

    let uploadedAvatar = "";
    const firstNameInput = document.getElementById("auth-first-name");
    const lastNameInput = document.getElementById("auth-last-name");
    const colorInput = document.getElementById("auth-avatar-color");
    const colorValue = document.getElementById("auth-avatar-color-value");
    const avatarPreview = document.getElementById("auth-avatar-preview");
    const avatarInitials = document.getElementById("auth-avatar-initials");
    const avatarImage = document.getElementById("auth-avatar-image");
    const avatarUpload = document.getElementById("auth-avatar-upload");
    const degreeSelect = document.getElementById("auth-degree");
    const yearSelect = document.getElementById("auth-year");
    const yearLabel = document.getElementById("auth-year-label");

    const showAuthStep = (step) => {
      document.getElementById("auth-login-error").classList.add("hidden");
      document.getElementById("auth-recovery-error").classList.add("hidden");
      document.getElementById("auth-form-error").classList.add("hidden");
      startView.classList.toggle("hidden", step !== "start");
      loginView.classList.toggle("hidden", step !== "login");
      recoveryView.classList.toggle("hidden", step !== "recovery");
      registerView.classList.toggle("hidden", step !== "register");
      if (step === "register") {
        setAuthRegisterStep(1);
      }
    };

    document.getElementById("auth-login-option").addEventListener("click", () => {
      loginForm.reset();
      showAuthStep("login");
    });
    document.getElementById("auth-create-option").addEventListener("click", () => showAuthStep("register"));
    document.getElementById("auth-register-next").addEventListener("click", advanceAuthRegisterStep);
    document.getElementById("auth-register-back").addEventListener("click", () => setAuthRegisterStep(authRegisterStep - 1));
    document.getElementById("auth-forgot-password").addEventListener("click", () => {
      document.getElementById("auth-recovery-email").value = document.getElementById("auth-login-email").value.trim();
      showAuthStep("recovery");
    });
    document.querySelectorAll("[data-auth-back]").forEach((btn) => {
      btn.addEventListener("click", () => showAuthStep("start"));
    });

    // INICI DE SESSIÓ AMB FIREBASE AUTH
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("auth-login-email").value.trim().toLowerCase();
      const password = document.getElementById("auth-login-password").value;
      const errorEl = document.getElementById("auth-login-error");
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      submitBtn.textContent = "Iniciant sessió...";
      errorEl.classList.add("hidden");

      try {
        await signInWithEmailAndPassword(auth, email, password);
        loginForm.reset();
      } catch (err) {
        errorEl.textContent = "El correu o la contrasenya no són correctes. Comprova les credencials.";
        errorEl.classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Iniciar sessió";
      }
    });

    // RECUPERACIÓ DE CONTRASENYA AMB FIREBASE AUTH
    recoveryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("auth-recovery-email").value.trim().toLowerCase();
      const errorEl = document.getElementById("auth-recovery-error");
      try {
        await sendPasswordResetEmail(auth, email);
        showToast("S'ha enviat un correu de recuperació a " + email);
        showAuthStep("login");
      } catch (err) {
        errorEl.textContent = "No s'ha pogut enviar el correu. Comprova que l'adreça estigui registrada.";
        errorEl.classList.remove("hidden");
      }
    });

    const updateAvatarPreview = () => {
      const fullName = `${firstNameInput.value} ${lastNameInput.value}`.trim();
      const initials =
        fullName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0].toUpperCase())
          .join("") || "IE";
      const color = colorInput.value;
      colorValue.textContent = color.toUpperCase();
      avatarPreview.style.background = color;
      avatarInitials.textContent = initials;
      if (uploadedAvatar) {
        avatarImage.src = uploadedAvatar;
        avatarImage.hidden = false;
        avatarInitials.hidden = true;
      } else {
        avatarImage.hidden = true;
        avatarInitials.hidden = false;
      }
    };

    const syncRoleFields = () => {
      const role = getSelectedRegistrationRole();
      const program = getRegistrationProgram();
      const previousYear = yearSelect.value;

      if (!program) {
        yearLabel.textContent = role === "alumni" ? "Any de graduació *" : "Curs actual *";
        yearSelect.disabled = true;
        yearSelect.innerHTML = `<option value="" selected>Selecciona primer el grau</option>`;
        renderAuthSubjectOptions(new Set());
        if (registerView && !registerView.classList.contains("hidden")) {
          setAuthRegisterStep(authRegisterStep);
        }
        return;
      }

      yearSelect.disabled = false;
      if (role === "alumni") {
        yearLabel.textContent = "Any de graduació *";
        const currentYear = new Date().getFullYear();
        const options = [`<option value="" disabled ${previousYear ? "" : "selected"}>Selecciona l'any de graduació</option>`];
        for (let year = currentYear; year >= 2005; year--) {
          const value = `Promoció ${year}`;
          options.push(`<option value="${value}" ${previousYear === value ? "selected" : ""}>${year}</option>`);
        }
        yearSelect.innerHTML = options.join("");
        renderAuthSubjectOptions(new Set());
      } else {
        yearLabel.textContent = "Curs actual *";
        const courses = ["1r Curs", "2n Curs", "3r Curs", "4t Curs (TFG)"];
        yearSelect.innerHTML =
          `<option value="" disabled ${courses.includes(previousYear) ? "" : "selected"}>Selecciona el curs</option>` +
          courses.map((course) => `<option value="${course}" ${previousYear === course ? "selected" : ""}>${course}</option>`).join("");
        renderAuthSubjectOptions(new Set());
      }

      if (registerView && !registerView.classList.contains("hidden")) {
        setAuthRegisterStep(authRegisterStep);
      }
    };

    firstNameInput.addEventListener("input", updateAvatarPreview);
    lastNameInput.addEventListener("input", updateAvatarPreview);
    colorInput.addEventListener("input", updateAvatarPreview);
    document.querySelectorAll('input[name="auth-role"]').forEach((radio) => {
      radio.addEventListener("change", syncRoleFields);
    });
    degreeSelect.addEventListener("change", syncRoleFields);
    yearSelect.addEventListener("change", () => renderAuthSubjectOptions(new Set()));
    document.getElementById("auth-subject-search-input").addEventListener("input", () => {
      const checked = new Set(
        [...document.querySelectorAll('input[name="auth-subjects"]:checked')].map((input) => input.value)
      );
      renderAuthSubjectOptions(checked);
    });
    document.getElementById("auth-subject-picker").addEventListener("change", (e) => {
      if (e.target.name !== "auth-subjects") return;
      const checked = new Set(
        [...document.querySelectorAll('input[name="auth-subjects"]:checked')].map((input) => input.value)
      );
      if (e.target.checked) checked.add(e.target.value);
      else checked.delete(e.target.value);
      renderAuthSubjectOptions(checked);
    });

    avatarUpload.addEventListener("change", () => {
      const file = avatarUpload.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        uploadedAvatar = typeof reader.result === "string" ? reader.result : "";
        updateAvatarPreview();
      };
      reader.readAsDataURL(file);
    });

    // REGISTRE DE NOU USUARI AMB FIREBASE AUTH + FIRESTORE
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const firstName = firstNameInput.value.trim();
      const lastName = lastNameInput.value.trim();
      const fullName = `${firstName} ${lastName}`.trim();
      const email = document.getElementById("auth-email").value.trim().toLowerCase();
      const password = document.getElementById("auth-password").value;
      const role = getSelectedRegistrationRole();
      const degree = degreeSelect.value;
      const program = getRegistrationProgram(degree);
      const year = yearSelect.value;
      const selectedSubjects = [...new Set([...document.querySelectorAll('input[name="auth-subjects"]:checked')].map((el) => el.value))];
      const errorEl = document.getElementById("auth-form-error");
      const submitBtn = document.getElementById("auth-register-submit");

      if (!program) {
        errorEl.textContent = "Selecciona el teu grau.";
        errorEl.classList.remove("hidden");
        return;
      }
      if (!year) {
        errorEl.textContent = role === "alumni" ? "Selecciona l'any de graduació." : "Selecciona el teu curs actual.";
        errorEl.classList.remove("hidden");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Creant compte...";
      errorEl.classList.add("hidden");

      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;
        let finalAvatar = uploadedAvatar || makeInitialAvatar(fullName, colorInput.value);
        if (uploadedAvatar) {
          finalAvatar = await uploadDataUrlIfNeeded(uploadedAvatar, "avatars");
        }

        const newStudent = {
          id: uid,
          name: fullName,
          email,
          role,
          degree,
          year,
          avatarColor: colorInput.value,
          avatar: finalAvatar,
          bio:
            role === "alumni"
              ? `Alumni ERAM (${program.shortName}, ${year}).`
              : `Estudiant de ${year} de ${program.shortName} a l'ERAM.`,
          interests: role === "student" ? selectedSubjects : [],
          points: 0,
          projectsCount: 0,
          commentsCount: 0,
          usefulCommentsCount: 0,
          secondedCount: 0
        };

        await setDoc(doc(db, "students", uid), newStudent);
        showToast(`Benvingut/da a Intreramer, ${firstName}!`);
      } catch (err) {
        console.error(err);
        errorEl.textContent =
          err.code === "auth/email-already-in-use"
            ? "Aquest correu ja té un compte creat."
            : "Error en crear el compte: " + (err.message || "torna-ho a provar.");
        errorEl.classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Crear compte i iniciar sessió";
      }
    });

    updateAvatarPreview();
    syncRoleFields();
    showAuthStep("start");
  }

  // =========================================================================
  // 13. INICIALITZACIÓ I LISTENERS GLOBALS
  // =========================================================================
  function bindEvents() {
    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const backButton = event.target.closest("[data-app-back]");
      if (!backButton) return;
      event.preventDefault();
      event.stopPropagation();
      handleAppBack();
    });

    document.querySelectorAll(".nav-icon-btn").forEach((btn) => {
      if (btn.dataset.route) btn.addEventListener("click", () => navigateTo(btn.dataset.route));
    });

    [
      "suggestions-filter-page",
      "suggestions-filter-author",
      "suggestions-filter-order"
    ].forEach((filterId) => {
      document.getElementById(filterId).addEventListener("change", renderSuggestionsView);
    });

    document.getElementById("platform-menu-trigger").addEventListener("click", (e) => {
      e.stopPropagation();
      togglePopover("platform-dropdown", "platform-menu-trigger");
    });

    document.getElementById("create-menu-trigger").addEventListener("click", (e) => {
      e.stopPropagation();
      openModal("modal-create");
    });
    document.getElementById("notif-menu-trigger").addEventListener("click", (e) => {
      e.stopPropagation();
      togglePopover("notif-dropdown", "notif-menu-trigger");
    });
    document.getElementById("profile-menu-trigger").addEventListener("click", (e) => {
      e.stopPropagation();
      togglePopover("profile-dropdown", "profile-menu-trigger");
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".dropdown-anchor")) closeAllPopovers();
    });

    document.getElementById("logout-btn").addEventListener("click", async () => {
      closeAllPopovers();
      await signOut(auth);
      showToast("Has tancat la sessió.");
    });

    document.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        const suggestionOverlay = action === "open-suggestions" ? getSuggestionPreviewOverlay() : null;
        closeAllPopovers();
        const opensNewModal = action === "open-publish-project" || action === "open-publish-position";
        const createModal = document.getElementById("modal-create");
        const cameFromCreateMenu = createModal && !createModal.classList.contains("hidden");
        closeModal("modal-create", { keepForBack: opensNewModal && cameFromCreateMenu });
        if (action === "open-publish-project") {
          openNewProjectModal();
        }
        if (action === "open-publish-position") {
          document.getElementById("publish-position-form").reset();
          document.getElementById("pos-start").value = daysFromNow(3);
          document.getElementById("pos-end").value = daysFromNow(20);
          openModal("modal-publish-position");
        }
        if (action === "open-about") {
          openAboutModal();
        }
        if (action === "open-suggestions") {
          openSuggestionsModal(suggestionOverlay);
        }
      });
    });

    document.querySelectorAll(".popover-item[data-route]").forEach((btn) => {
      btn.addEventListener("click", () => navigateTo(btn.dataset.route));
    });

    document.getElementById("mark-all-read-btn").addEventListener("click", async () => {
      const currentUser = getCurrentUser();
      const unread = state.notifications.filter((n) => n.userId === currentUser.id && !n.read);
      for (const n of unread) {
        await updateDoc(doc(db, "notifications", n.id), { read: true });
      }
    });

    const searchInput = document.getElementById("global-search-input");
    const searchClear = document.getElementById("search-clear-btn");
    searchInput.addEventListener("input", () => {
      ui.searchQuery = searchInput.value;
      searchClear.classList.toggle("hidden", !ui.searchQuery);
      if (ui.route === "discover") renderDiscoverView();
      if (ui.route === "positions") renderPositionsView();
    });
    searchClear.addEventListener("click", () => {
      searchInput.value = "";
      ui.searchQuery = "";
      searchClear.classList.add("hidden");
      if (ui.route === "discover") renderDiscoverView();
      if (ui.route === "positions") renderPositionsView();
    });

    document.querySelectorAll("[data-category]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const clickedCategory = btn.dataset.category;
        ui.selectedCategory = clickedCategory === ui.selectedCategory ? "General" : clickedCategory;
        ui.visibleCount = 15;
        document.querySelectorAll("[data-category]").forEach((b) => {
          const active = b.dataset.category === ui.selectedCategory;
          b.classList.toggle("active", active);
          b.setAttribute("aria-selected", String(active));
        });
        renderDiscoverView({ animateCategory: true });
      });
    });

    document.getElementById("toggle-advanced-filters").addEventListener("click", (e) => {
      const panel = document.getElementById("advanced-filters-panel");
      const open = panel.classList.toggle("hidden");
      ui.advancedFiltersOpen = !open;
      e.currentTarget.setAttribute("aria-expanded", String(ui.advancedFiltersOpen));
    });

    [
      ["filter-subject", "subject"],
      ["filter-professor", "professor"],
      ["filter-year", "year"],
      ["filter-stage", "stage"],
      ["filter-team", "teamType"],
      ["filter-status", "status"]
    ].forEach(([elId, key]) => {
      document.getElementById(elId).addEventListener("change", (e) => {
        ui.filters[key] = e.target.value;
        renderDiscoverView();
      });
    });

    document.getElementById("filter-urgent-only").addEventListener("change", (e) => {
      ui.filters.urgentOnly = e.target.checked;
      renderDiscoverView();
    });

    const resetAllFilters = () => {
      resetDiscoveryFilters();
      renderDiscoverView();
    };
    document.getElementById("clear-all-filters-btn").addEventListener("click", resetAllFilters);
    document.getElementById("empty-reset-btn").addEventListener("click", resetAllFilters);

    document.getElementById("load-more-projects-btn").addEventListener("click", () => {
      ui.visibleCount += 12;
      renderDiscoverView();
    });

    // Selector de format (ràtio) amb botons circulars (3:4, 1:1, 16:9)
    document.querySelectorAll("[data-aspect-choice]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const aspect = btn.dataset.aspectChoice;
        syncProjectAspectButtons(aspect);
        if (projectCrop.image) {
          projectCrop.dirty = true;
          drawProjectCrop();
        }
      });
    });

    // Autocompletat d'assignatures al camp de creació/edició de projecte
    const projSubjectInput = document.getElementById("proj-subject");
    const projSubjectSuggestions = document.getElementById("proj-subject-suggestions");

    const renderSubjectSuggestions = (queryText = "") => {
      if (!projSubjectSuggestions) return;
      const q = queryText.trim().toLowerCase();
      const matches = ALL_STUDY_SUBJECTS.filter((sub) => !q || sub.toLowerCase().includes(q)).slice(0, 12);
      if (!matches.length) {
        projSubjectSuggestions.classList.add("hidden");
        return;
      }
      projSubjectSuggestions.innerHTML = matches
        .map((sub) => {
          const group = SUBJECT_GROUPS.find((g) => g.subjects.includes(sub))?.label || "Grau";
          return `<button type="button" class="subject-suggestion-item" data-pick-subject="${escapeHtml(sub)}">
            <span>${escapeHtml(sub)}</span>
            <small>${escapeHtml(group)}</small>
          </button>`;
        })
        .join("");
      projSubjectSuggestions.classList.remove("hidden");
    };

    projSubjectInput?.addEventListener("focus", () => renderSubjectSuggestions(projSubjectInput.value));
    projSubjectInput?.addEventListener("input", () => renderSubjectSuggestions(projSubjectInput.value));
    projSubjectSuggestions?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-pick-subject]");
      if (!btn) return;
      projSubjectInput.value = btn.dataset.pickSubject;
      projSubjectSuggestions.classList.add("hidden");
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".subject-autocomplete-wrap")) {
        projSubjectSuggestions?.classList.add("hidden");
      }
    });

    document.getElementById("proj-wizard-next").addEventListener("click", advanceProjectWizard);
    document.getElementById("proj-wizard-back").addEventListener("click", goBackProjectWizardStep);
    document.getElementById("proj-team-type").addEventListener("change", syncProjectTeamFields);
    document.getElementById("proj-seeking-collaborator").addEventListener("change", syncProjectTeamFields);
    document.getElementById("proj-participant-rows").addEventListener("input", (e) => {
      const nameInput = e.target.closest(".project-participant-name");
      if (!nameInput) return;
      nameInput.closest(".project-participant-row").dataset.participantId = "";
      populateParticipantSearch();
    });
    document.getElementById("proj-participant-rows").addEventListener("click", (e) => {
      const removeButton = e.target.closest("[data-remove-project-participant]");
      if (!removeButton) return;
      removeButton.closest(".project-participant-row").remove();
      populateParticipantSearch();
    });
    const participantSearchInput = document.getElementById("proj-participant-search");
    participantSearchInput.addEventListener("input", populateParticipantSearch);
    participantSearchInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const name = participantSearchInput.value.trim();
      if (!name) return;

      const normalizedName = name.toLocaleLowerCase();
      const existingParticipants = getProjectParticipantRows();
      if (existingParticipants.some((participant) => participant.name.toLocaleLowerCase() === normalizedName)) {
        participantSearchInput.value = "";
        populateParticipantSearch();
        return;
      }

      const currentUser = getCurrentUser();
      const registeredParticipant = state.students.find(
        (student) =>
          student.id !== currentUser.id &&
          typeof student.name === "string" &&
          student.name.trim().toLocaleLowerCase() === normalizedName
      );
      if (registeredParticipant) {
        addProjectParticipantRow({ id: registeredParticipant.id, name: registeredParticipant.name });
      } else {
        addProjectParticipantRow({ name });
      }
      participantSearchInput.value = "";
      populateParticipantSearch();
      participantSearchInput.focus();
    });
    document.getElementById("proj-participant-suggestions").addEventListener("click", (e) => {
      const option = e.target.closest("[data-add-registered-participant]");
      if (!option) return;
      const student = state.students.find((candidate) => candidate.id === option.dataset.addRegisteredParticipant);
      if (!student) return;
      const alreadyAdded = getProjectParticipantRows().some((participant) => participant.id === student.id);
      const searchInput = document.getElementById("proj-participant-search");
      searchInput.value = "";
      if (!alreadyAdded) addProjectParticipantRow({ id: student.id, name: student.name });
      populateParticipantSearch();
      searchInput.focus();
    });
    document.addEventListener("click", (e) => {
      if (e.target.closest(".participant-autocomplete-wrap")) return;
      const suggestions = document.getElementById("proj-participant-suggestions");
      const input = document.getElementById("proj-participant-search");
      suggestions.classList.add("hidden");
      input.setAttribute("aria-expanded", "false");
    });

    document.getElementById("proj-media-images").addEventListener("change", async (e) => {
      const files = [...(e.target.files || [])].filter((file) => file.type.startsWith("image/"));
      if (!files.length) return;
      const generation = ++projectMediaUploadGeneration;
      projectMediaUploadPending = true;
      try {
        const readImages = await Promise.all(files.map(readProjectMediaImage));
        if (generation !== projectMediaUploadGeneration) return;
        uploadedProjectMediaImages = [...uploadedProjectMediaImages, ...readImages];
        renderProjectMediaPreview();
      } catch (err) {
        if (generation === projectMediaUploadGeneration) {
          showToast(err instanceof Error ? err.message : "No s'han pogut afegir les imatges.");
        }
      } finally {
        if (generation === projectMediaUploadGeneration) {
          projectMediaUploadPending = false;
        }
        e.target.value = "";
      }
    });

    document.getElementById("proj-cover-file").addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      uploadedProjectCover = "";
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setProjectCropSource(reader.result);
        }
      };
      reader.readAsDataURL(file);
    });

    document.getElementById("proj-crop-zoom").addEventListener("input", (e) => {
      projectCrop.zoom = Number(e.target.value) || 1;
      projectCrop.dirty = true;
      drawProjectCrop();
    });

    document.getElementById("proj-crop-reset").addEventListener("click", () => {
      projectCrop.zoom = 1;
      projectCrop.offsetX = 0;
      projectCrop.offsetY = 0;
      projectCrop.dirty = true;
      document.getElementById("proj-crop-zoom").value = "1";
      drawProjectCrop();
    });

    document.getElementById("proj-cover-remove").addEventListener("click", () => {
      uploadedProjectCover = "";
      document.getElementById("proj-cover-file").value = "";
      setProjectCropSource("");
    });

    const cropCanvas = document.getElementById("proj-crop-canvas");
    cropCanvas.addEventListener("pointerdown", (e) => {
      if (!projectCrop.image) return;
      projectCrop.dragging = true;
      projectCrop.lastX = e.clientX;
      projectCrop.lastY = e.clientY;
      cropCanvas.setPointerCapture(e.pointerId);
    });
    cropCanvas.addEventListener("pointermove", (e) => {
      if (!projectCrop.dragging || !projectCrop.image) return;
      const rect = cropCanvas.getBoundingClientRect();
      projectCrop.offsetX += (e.clientX - projectCrop.lastX) * (cropCanvas.width / Math.max(1, rect.width));
      projectCrop.offsetY += (e.clientY - projectCrop.lastY) * (cropCanvas.height / Math.max(1, rect.height));
      projectCrop.lastX = e.clientX;
      projectCrop.lastY = e.clientY;
      projectCrop.dirty = true;
      drawProjectCrop();
    });
    const endCropDrag = () => {
      projectCrop.dragging = false;
    };
    cropCanvas.addEventListener("pointerup", endCropDrag);
    cropCanvas.addEventListener("pointercancel", endCropDrag);

    // PUBLICAR / EDITAR PROJECTE AL NÚVOL (FIRESTORE + STORAGE)
    document.getElementById("publish-project-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (projectWizardStep < getProjectWizardSteps().length) {
        advanceProjectWizard();
        return;
      }
      if (projectMediaUploadPending) {
        showToast("Espera que s'acabin de processar les imatges seleccionades.");
        return;
      }

      const currentUser = getCurrentUser();
      const editId = document.getElementById("proj-edit-id").value;
      const existingProject = editId ? state.projects.find((project) => project.id === editId) : null;
      if (editId && (!existingProject || !canManageProject(existingProject, currentUser.id))) {
        showToast("No tens permís per editar aquest projecte.");
        return;
      }

      const submitBtn = document.getElementById("proj-wizard-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "Publicant...";

      try {
        const category = document.getElementById("proj-category").value;
        const aspect = document.getElementById("proj-aspect").value || "portrait";

        if (projectCrop.image && projectCrop.dirty) {
          try {
            uploadedProjectCover = document.getElementById("proj-crop-canvas").toDataURL("image/jpeg", 0.85);
            projectCrop.dirty = false;
            projectCrop.framed = true;
          } catch (err) {
            if (err.name === "SecurityError") {
              showProjectCropError("Aquest servidor no permet desar l'enquadrament. Selecciona el fitxer des del teu ordinador.");
              return;
            }
          }
        }

        let coverInput = uploadedProjectCover;
        if (coverInput.startsWith("data:image")) {
          coverInput = await uploadDataUrlIfNeeded(coverInput, "covers");
        }
        const coverFramed = Boolean(uploadedProjectCover && projectCrop.framed);

        const uploadedGallery = [];
        for (const img of uploadedProjectMediaImages) {
          const finalSrc = img.src.startsWith("data:image")
            ? await uploadDataUrlIfNeeded(img.src, "gallery")
            : img.src;
          uploadedGallery.push({ ...img, src: finalSrc });
        }

        const teamType = document.getElementById("proj-team-type").value;
        const seekingCollaborator =
          teamType === "group" && document.getElementById("proj-seeking-collaborator").checked;
        const participantEntries = teamType === "group" ? getProjectParticipantRows() : [];
        const participants =
          teamType === "group" && participantEntries.length
            ? participantEntries.map((participant) => participant.name)
            : [currentUser.name];
        const participantDetails = participantEntries.map((participant) => ({
          id: participant.id,
          name: participant.name,
          role: participant.role
        }));
        const participantIds = [
          ...new Set(
            participantEntries.length
              ? participantEntries.map((participant) => participant.id).filter(Boolean)
              : [currentUser.id]
          )
        ];
        const canParticipantsManage =
          teamType === "group" &&
          (existingProject && existingProject.ownerId !== currentUser.id
            ? Boolean(existingProject.participantsCanManage)
            : document.getElementById("proj-participants-can-manage").checked);

        const projectData = {
          title: document.getElementById("proj-title").value.trim(),
          category,
          aspect: `span-${aspect}`,
          cover: coverInput || "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80",
          coverFramed,
          description: document.getElementById("proj-description").value.trim(),
          briefing: document.getElementById("proj-briefing").value.trim(),
          subject: document.getElementById("proj-subject").value.trim(),
          professor: document.getElementById("proj-professor").value.trim(),
          year: document.getElementById("proj-year").value,
          deadline: document.getElementById("proj-deadline").value,
          stage: document.getElementById("proj-stage").value,
          teamType,
          participants,
          participantIds,
          participantDetails,
          participantsCanManage: canParticipantsManage,
          seekingCollaborator,
          collaboratorRole: seekingCollaborator ? document.getElementById("proj-collab-role").value : "",
          collaborationStartDate: seekingCollaborator ? document.getElementById("proj-collab-start").value : "",
          collaborationEndDate: seekingCollaborator ? document.getElementById("proj-collab-end").value : "",
          collaborationCompensation: seekingCollaborator
            ? document.getElementById("proj-collab-compensation").value
            : "",
          collaborationLocation: seekingCollaborator ? document.getElementById("proj-collab-location").value : "",
          collaborationPlace: seekingCollaborator ? document.getElementById("proj-collab-place").value.trim() : "",
          collaborationTransport: seekingCollaborator ? document.getElementById("proj-collab-transport").value : "",
          collaborationExpenses: seekingCollaborator ? document.getElementById("proj-collab-expenses").value : "",
          collaborationDetails: seekingCollaborator
            ? document.getElementById("proj-collab-details").value.trim()
            : "",
          mediaUrl: document.getElementById("proj-media-url").value.trim(),
          mediaImages: uploadedGallery,
          feedbackType: document.getElementById("proj-feedback-type").value.trim()
        };

        if (existingProject) {
          await updateDoc(doc(db, "projects", existingProject.id), projectData);
          uploadedProjectCover = "";
          uploadedProjectMediaImages = [];
          setProjectCropSource("");
          closeModal("modal-publish-project");
          navigateTo("project", existingProject.id);
          showToast("Projecte actualitzat correctament.");
          return;
        }

        const newId = "proj-" + Date.now();
        const newProj = {
          id: newId,
          ...projectData,
          createdAt: new Date().toISOString().split("T")[0],
          createdTimestamp: Date.now(),
          ownerId: currentUser.id,
          status: "In progress"
        };

        await setDoc(doc(db, "projects", newId), newProj);
        await setDoc(
          doc(db, "students", currentUser.id),
          { projectsCount: (currentUser.projectsCount || 0) + 1 },
          { merge: true }
        );
        await awardPoints(currentUser.id, `publish-${newId}`, 10, `Nou projecte publicat: "${newProj.title}"`);
        uploadedProjectCover = "";
        uploadedProjectMediaImages = [];
        setProjectCropSource("");
        closeModal("modal-publish-project");
        navigateTo("project", newId);
        showToast("Projecte publicat per a tota la comunitat ERAM!");
      } catch (err) {
        console.error(err);
        showToast("Error en publicar el projecte: " + (err.message || "torna-ho a provar."));
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Publicar projecte";
      }
    });

    // EDITAR PERFIL
    document.getElementById("edit-profile-subject-input").addEventListener("input", renderEditProfileSubjects);
    document.getElementById("edit-profile-subject-list").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove-edit-subject]");
      if (!btn) return;
      editProfileSubjects = editProfileSubjects.filter((subject) => subject !== btn.dataset.removeEditSubject);
      renderEditProfileSubjects();
    });
    document.getElementById("edit-profile-subject-options").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add-edit-subject]");
      if (!btn) return;
      const subject = btn.dataset.addEditSubject;
      if (subject && !editProfileSubjects.includes(subject)) {
        editProfileSubjects.push(subject);
        renderEditProfileSubjects();
      }
    });

    document.getElementById("edit-profile-remove-avatar").addEventListener("click", async () => {
      const student = getCurrentUser();
      const color = document.getElementById("edit-profile-avatar-color").value;
      const avatar = makeInitialAvatar(student.name, color);
      await setDoc(doc(db, "students", student.id), { avatarColor: color, avatar }, { merge: true });
      showToast("Fotografia substituïda per les inicials.");
    });

    document.getElementById("edit-profile-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const student = getCurrentUser();
      const name = document.getElementById("edit-profile-name").value.trim();
      const surname = document.getElementById("edit-profile-surname").value.trim();
      const email = document.getElementById("edit-profile-email").value.trim().toLowerCase();
      const color = document.getElementById("edit-profile-avatar-color").value;
      const avatarFile = document.getElementById("edit-profile-avatar").files?.[0];
      const errorEl = document.getElementById("edit-profile-error");

      if (!name || !surname || !email) {
        errorEl.textContent = "Omple el nom, cognoms i correu.";
        errorEl.classList.remove("hidden");
        return;
      }

      const fullName = `${name} ${surname}`;
      let avatar = student.avatar;
      if (avatarFile && avatarFile.type.startsWith("image/")) {
        const reader = new FileReader();
        avatar = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(avatarFile);
        });
        avatar = await uploadDataUrlIfNeeded(avatar, "avatars");
      } else if (avatar?.startsWith("data:image/svg+xml")) {
        avatar = makeInitialAvatar(fullName, color);
      }

      await setDoc(
        doc(db, "students", student.id),
        { name: fullName, email, avatarColor: color, avatar, interests: [...editProfileSubjects] },
        { merge: true }
      );
      closeModal("modal-edit-profile");
      showToast("Perfil actualitzat.");
    });

    // PUBLICAR POSICIÓ OBERTA
    document.getElementById("publish-position-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentUser = getCurrentUser();
      const posId = "pos-" + Date.now();
      const newPos = {
        id: posId,
        title: document.getElementById("pos-title").value.trim(),
        projectTitle: document.getElementById("pos-project-name").value.trim(),
        role: document.getElementById("pos-role").value,
        spots: Number(document.getElementById("pos-spots").value) || 1,
        compensation: document.getElementById("pos-compensation").value,
        startDate: document.getElementById("pos-start").value,
        endDate: document.getElementById("pos-end").value,
        location: document.getElementById("pos-location").value,
        projectType: document.getElementById("pos-project-type").value,
        subject: document.getElementById("pos-subject").value.trim(),
        year: document.getElementById("pos-year").value,
        description: document.getElementById("pos-description").value.trim(),
        ownerId: currentUser.id,
        createdAt: "Ara mateix",
        status: "Open",
        applications: []
      };

      await setDoc(doc(db, "positions", posId), newPos);
      closeModal("modal-publish-position");
      navigateTo("positions");
      showToast("Posició oberta publicada!");
    });

    // CANDIDATURA A POSICIÓ OBERTA
    document.getElementById("apply-position-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentUser = getCurrentUser();
      const posId = document.getElementById("apply-pos-id").value;
      const pos = state.positions.find((p) => p.id === posId);
      if (!pos) return;

      const updatedApps = [
        ...(pos.applications || []),
        {
          id: "app-" + Date.now(),
          applicantId: currentUser.id,
          intro: document.getElementById("apply-intro").value.trim(),
          skills: document.getElementById("apply-skills").value.trim(),
          portfolioProjectId: document.getElementById("apply-portfolio-project").value,
          status: "Pending"
        }
      ];

      await updateDoc(doc(db, "positions", pos.id), { applications: updatedApps });
      await pushNotification(pos.ownerId, `${currentUser.name} s'ha presentat a "${pos.title}"`, "positions", pos.id);
      closeModal("modal-apply-position");
      showToast("Candidatura enviada correctament.");
    });

    [
      ["pos-filter-role", "role"],
      ["pos-filter-comp", "compensation"],
      ["pos-filter-type", "projectType"],
      ["pos-filter-location", "location"]
    ].forEach(([elId, key]) => {
      document.getElementById(elId).addEventListener("change", (e) => {
        ui.posFilters[key] = e.target.value;
        renderPositionsView();
      });
    });

    const chatSearchInput = document.getElementById("chat-search-input");
    chatSearchInput.addEventListener("input", () => {
      renderMessagesView();
      renderChatUserSearchResults();
    });
    document.getElementById("chat-archive-toggle").addEventListener("click", () => {
      showArchivedConversations = !showArchivedConversations;
      ui.activeConversationId = null;
      document.getElementById("chat-shell").classList.remove("mobile-thread-open");
      renderMessagesView();
    });
    const chatShell = document.getElementById("chat-shell");
    const conversationList = document.getElementById("conversation-list");
    chatShell.addEventListener("click", (event) => {
      const target = event.target;
      const menuTrigger = target.closest("[data-chat-menu-trigger]");
      if (menuTrigger) {
        event.stopPropagation();
        const menu = menuTrigger.parentElement.querySelector(".chat-conversation-menu");
        const shouldOpen = menu.classList.contains("hidden");
        closeConversationMenu(conversationList);
        if (shouldOpen) {
          menu.classList.remove("hidden");
          menuTrigger.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const actionButton = target.closest("[data-conversation-action]");
      if (actionButton) {
        closeConversationMenu(conversationList);
        void applyConversationMenuAction(
          actionButton.dataset.conversationId,
          actionButton.dataset.conversationAction
        );
        return;
      }

      if (!target.closest(".chat-conversation-menu-wrap")) {
        closeConversationMenu(conversationList);
      }
    });
    document.getElementById("chat-user-search-results").addEventListener("click", (e) => {
      const userButton = e.target.closest("[data-start-chat-user]");
      if (!userButton) return;
      const userId = userButton.dataset.startChatUser;
      chatSearchInput.value = "";
      renderChatUserSearchResults();
      void startOrOpenConversation(userId);
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#chat-shell")) {
        closeConversationMenu(conversationList);
      }
      if (e.target.closest(".chat-sidebar-header")) return;
      document.getElementById("chat-user-search-results").classList.add("hidden");
      chatSearchInput.setAttribute("aria-expanded", "false");
    });

    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
    });

    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop && backdrop.id !== "modal-suggestions") closeModal(backdrop.id);
      });
    });

    document.addEventListener("click", (e) => {
      const closeModalEl = e.target.closest("[data-close-modal]");
      if (closeModalEl) closeModal(closeModalEl.dataset.closeModal);

      const suggestionCard = e.target.closest("[data-open-suggestion]");
      if (suggestionCard) {
        openSuggestionDetail(suggestionCard.dataset.openSuggestion);
        return;
      }

      const photoBtn = e.target.closest("[data-open-project-photo]");
      if (photoBtn) {
        const photoId = photoBtn.dataset.openProjectPhoto;
        const projectId = photoBtn.dataset.projectId;
        if (projectId && ui.activeProjectId !== projectId) navigateTo("project", projectId);
        requestAnimationFrame(() => {
          const photoEl = document.getElementById(`project-media-${photoId}`);
          if (photoEl) {
            photoEl.scrollIntoView({ behavior: "smooth", block: "center" });
            photoEl.classList.add("reference-highlight");
            setTimeout(() => photoEl.classList.remove("reference-highlight"), 2200);
          }
        });
        return;
      }

      const projCard = e.target.closest("[data-open-project]");
      if (projCard) {
        const commentId = projCard.dataset.openProjectComment;
        navigateTo("project", projCard.dataset.openProject);
        if (commentId) {
          requestAnimationFrame(() => {
            const commentEl = document.getElementById(`project-comment-${commentId}`);
            if (commentEl) {
              commentEl.scrollIntoView({ behavior: "smooth", block: "center" });
              commentEl.classList.add("reference-highlight");
              setTimeout(() => commentEl.classList.remove("reference-highlight"), 2200);
            }
          });
        }
        return;
      }

      const profileEl = e.target.closest("[data-open-profile]");
      if (profileEl) {
        navigateTo("profile", profileEl.dataset.openProfile);
        return;
      }

      const namedProfileEl = e.target.closest("[data-open-profile-name]");
      if (namedProfileEl) {
        const student = getStudentByDisplayName(namedProfileEl.dataset.openProfileName);
        if (student) {
          navigateTo("profile", student.id);
        } else {
          showToast("Aquest perfil encara no està disponible.");
        }
        return;
      }

      const contactOwner = e.target.closest("[data-contact-owner]");
      if (contactOwner) {
        startOrOpenConversation(contactOwner.dataset.contactOwner);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches(".masonry-card[data-open-project]")) {
        navigateTo("project", e.target.dataset.openProject);
      }
      if (e.key === "Escape") {
        const chatMenu = document.querySelector("#conversation-list .chat-conversation-menu:not(.hidden)");
        const menuTrigger = chatMenu?.parentElement.querySelector("[data-chat-menu-trigger]");
        closeConversationMenu(document.getElementById("conversation-list"));
        if (menuTrigger) {
          menuTrigger.focus();
        }
        closeAllPopovers();
        const activeModals = [...document.querySelectorAll(".modal-backdrop:not(.hidden)")];
        if (activeModals.at(-1)?.id !== "modal-suggestions") {
          activeModals.forEach((modal) => closeModal(modal.id));
        }
      }
    });
    updateBackButton();
  }

  window.addEventListener("resize", updateProjectDetailStickyTop);
  const repositionPopover = () => requestAnimationFrame(positionPopoverUnderlay);
  window.addEventListener("resize", repositionPopover);
  window.addEventListener("orientationchange", repositionPopover);
  window.visualViewport?.addEventListener("resize", repositionPopover);
  window.visualViewport?.addEventListener("scroll", repositionPopover);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) repositionPopover();
  });

  // =========================================================================
  // 14. PUNT D'ENTRADA PRINCIPAL
  // =========================================================================
  function init() {
    setupAuthFlow();
    initializeSuggestionBox();
    initializeSuggestionPreviewMode();
    bindEvents();

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        state.currentUserId = user.uid;
        if (!isFeedbackPreview) await seedInitialDataIfNeeded();
        const userSnap = await getDoc(doc(db, "students", user.uid));
        const fallbackName = user.displayName || user.email?.split("@")[0] || "Estudiant ERAM";
        const currentUserProfile = userSnap.exists()
          ? { ...userSnap.data(), id: user.uid }
          : {
            id: user.uid,
            name: fallbackName,
            email: user.email || "",
            role: "student",
            year: "1r Curs",
            avatarColor: "#8f7cf6",
            avatar: makeInitialAvatar(fallbackName, "#8f7cf6"),
            bio: "Estudiant a l'ERAM.",
            interests: [],
            points: 0,
            projectsCount: 0,
            commentsCount: 0,
            usefulCommentsCount: 0,
            secondedCount: 0
          };
        state.currentUserProfile = currentUserProfile;
        if (!userSnap.exists() && !isFeedbackPreview) {
          await setDoc(doc(db, "students", user.uid), currentUserProfile);
        }

        startRealtimeSync();
        syncSuggestionAccess();
        enterApp();
      } else {
        state.currentUserId = null;
        state.currentUserProfile = null;
        syncSuggestionAccess();
        document.body.classList.remove("authenticated");
        const authPage = document.getElementById("auth-page");
        if (authPage) authPage.classList.remove("hidden");
      }
      document.body.classList.remove("auth-loading");
      document.getElementById("auth-loading-overlay")?.classList.add("hidden");
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();