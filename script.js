import { auth, db, functions, storage } from "./firebase.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";
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
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref,
  uploadString,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

(() => {
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

  const translateText = httpsCallable(functions, "translateUserContent");
  const userContentState = new WeakMap();
  const textNodeState = new WeakMap();
  const attributeState = new WeakMap();
  const memoryTranslationCache = new Map();
  const failedTranslationKeys = new Set();
  const staticTranslationCache = new Map();
  const STATIC_TRANSLATION_CACHE_KEY = "eram-static-translations-v1";
  const MAX_TRANSLATION_BATCH_CODEPOINTS = 23000;
  const MAX_TRANSLATION_BATCH_ITEMS = 50;
  let translationObserver;
  let translationTimer;
  let translationInProgress = false;
  let translationRequested = false;
  let translationErrorNotified = false;

  try {
    const savedTranslations = JSON.parse(localStorage.getItem(STATIC_TRANSLATION_CACHE_KEY) || "[]");
    if (Array.isArray(savedTranslations)) {
      savedTranslations.slice(-1500).forEach(([key, value]) => {
        if (typeof key === "string" && value && typeof value.text === "string") {
          staticTranslationCache.set(key, value);
        }
      });
    }
  } catch (error) {
    console.warn("No s'ha pogut recuperar la memòria cau de traduccions:", error);
  }

  function translationKey(language, text) {
    return `${language}\u0000${text}`;
  }

  function persistStaticTranslationCache() {
    try {
      const entries = [...staticTranslationCache.entries()].slice(-1500);
      localStorage.setItem(STATIC_TRANSLATION_CACHE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.warn("No s'ha pogut desar la memòria cau de traduccions:", error);
    }
  }

  function userContentMarkup(value, extraClass = "") {
    const text = value == null ? "" : String(value);
    return `<span class="user-content-translation-wrap ${extraClass}">
      <span class="user-generated-content" data-user-content>${escapeHtml(text)}</span>
      <button type="button" class="user-content-translation-toggle" data-user-content-toggle data-i18n-ignore hidden></button>
    </span>`;
  }

  function getUserContentToggle(element) {
    return element.closest(".user-content-translation-wrap")?.querySelector("[data-user-content-toggle]");
  }

  function isTranslatableTextNode(node) {
    const parent = node.parentElement;
    if (!parent || !node.nodeValue?.trim() || !/\p{L}/u.test(node.nodeValue)) return false;
    if (parent.closest("[data-user-content], [data-i18n-ignore], script, style, noscript, textarea, option")) {
      return false;
    }
    return true;
  }

  function getNodeTranslationRecord(node) {
    const currentText = node.nodeValue || "";
    let record = textNodeState.get(node);
    if (!record) {
      record = { original: currentText, rendered: currentText };
      textNodeState.set(node, record);
    } else if (currentText !== record.rendered && currentText !== record.original) {
      record.original = currentText;
      record.rendered = currentText;
    }
    return record;
  }

  function getAttributeTranslationRecord(element, attribute) {
    let records = attributeState.get(element);
    if (!records) {
      records = new Map();
      attributeState.set(element, records);
    }

    const currentValue = element.getAttribute(attribute) || "";
    let record = records.get(attribute);
    if (!record) {
      record = { original: currentValue, rendered: currentValue };
      records.set(attribute, record);
    } else if (currentValue !== record.rendered && currentValue !== record.original) {
      record.original = currentValue;
      record.rendered = currentValue;
    }
    return record;
  }

  function updateUserContentDisplay(element, record, targetLanguage, result) {
    const toggle = getUserContentToggle(element);
    const isTranslated = result.detectedLanguage !== targetLanguage && result.text !== record.original;
    const showOriginal = record.showingOriginal && isTranslated;
    const visibleText = showOriginal ? record.original : result.text;

    if (element.textContent !== visibleText) {
      record.rendered = visibleText;
      element.textContent = visibleText;
    } else {
      record.rendered = visibleText;
    }
    record.showingOriginal = showOriginal;
    record.displayLanguage = targetLanguage;
    record.result = result;
    if (toggle) {
      toggle.removeAttribute("data-translation-retry");
      toggle.disabled = false;
      toggle.hidden = !isTranslated;
      toggle.textContent = showOriginal
        ? targetLanguage === "en" ? "See translation" : "Veure la traducció"
        : targetLanguage === "en" ? "See original" : "Veure l'original";
      toggle.setAttribute("aria-label", toggle.textContent);
    }
  }

  function getTranslationFailureText() {
    return ui.language === "en"
      ? "Translation is unavailable. Please try again."
      : "La traducció no està disponible. Torna-ho a provar.";
  }

  function applyTranslationFailure(job, tooLarge = false) {
    if (job.kind !== "user") return;
    const toggle = getUserContentToggle(job.element);
    if (toggle) {
      toggle.hidden = false;
      toggle.disabled = tooLarge;
      toggle.textContent = tooLarge
        ? ui.language === "en" ? "Text too long to translate" : "Text massa llarg per traduir"
        : ui.language === "en" ? "Retry translation" : "Reintentar traducció";
      if (tooLarge) toggle.removeAttribute("data-translation-retry");
      else toggle.dataset.translationRetry = "";
      toggle.setAttribute("aria-label", toggle.textContent);
    }
  }

  function applyTranslationResult(job, result, targetLanguage) {
    if (job.kind === "user") {
      const record = userContentState.get(job.element);
      if (!record) return;
      record.translations.set(targetLanguage, result);
      updateUserContentDisplay(job.element, record, targetLanguage, result);
      return;
    }

    const record = job.record;
    if (job.kind === "text") {
      record.rendered = result.text;
      if (job.node.nodeValue !== result.text) job.node.nodeValue = result.text;
    } else {
      record.rendered = result.text;
      if (job.element.getAttribute(job.attribute) !== result.text) {
        job.element.setAttribute(job.attribute, result.text);
      }
    }
    memoryTranslationCache.set(job.key, result);
    staticTranslationCache.set(job.key, result);
  }

  async function processPageTranslations() {
    const targetLanguage = ui.language;
    document.documentElement.lang = targetLanguage;

    const jobs = [];
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    let textNode;
    while ((textNode = walker.nextNode())) {
      if (!isTranslatableTextNode(textNode)) continue;
      const record = getNodeTranslationRecord(textNode);
      if (!record.original.trim()) continue;
      const key = translationKey(targetLanguage, record.original);
      const cached = memoryTranslationCache.get(key) || staticTranslationCache.get(key);
      if (cached) {
        applyTranslationResult({ kind: "text", node: textNode, record, key }, cached, targetLanguage);
      } else {
        jobs.push({ kind: "text", node: textNode, record, key, text: record.original });
      }
    }

    document.querySelectorAll("[placeholder], [aria-label], [title]").forEach((element) => {
      if (element.closest("[data-user-content], [data-i18n-ignore]")) return;
      ["placeholder", "aria-label", "title"].forEach((attribute) => {
        if (!element.hasAttribute(attribute)) return;
        const record = getAttributeTranslationRecord(element, attribute);
        if (!record.original.trim() || !/\p{L}/u.test(record.original)) return;
        const key = translationKey(targetLanguage, record.original);
        const cached = memoryTranslationCache.get(key) || staticTranslationCache.get(key);
        if (cached) {
          applyTranslationResult({ kind: "attribute", element, attribute, record, key }, cached, targetLanguage);
        } else {
          jobs.push({ kind: "attribute", element, attribute, record, key, text: record.original });
        }
      });
    });

    document.querySelectorAll("[data-user-content]").forEach((element) => {
      const currentText = element.textContent || "";
      let record = userContentState.get(element);
      if (!record) {
        record = { original: currentText, rendered: currentText, translations: new Map(), showingOriginal: false };
        userContentState.set(element, record);
      } else if (currentText !== record.rendered && currentText !== record.original) {
        record.original = currentText;
        record.rendered = currentText;
        record.translations.clear();
        record.showingOriginal = false;
      }
      if (record.displayLanguage && record.displayLanguage !== targetLanguage) {
        record.showingOriginal = false;
      }
      if (!record.original.trim()) return;

      const key = translationKey(targetLanguage, record.original);
      const cached = record.translations.get(targetLanguage) || memoryTranslationCache.get(key);
      if (cached) {
        applyTranslationResult({ kind: "user", element, key }, cached, targetLanguage);
      } else {
        jobs.push({ kind: "user", element, key, text: record.original });
      }
    });

    if (!jobs.length || !state.currentUserId || !auth.currentUser) return;

    const uniqueJobs = new Map();
    jobs.forEach((job) => {
      if (!failedTranslationKeys.has(job.key)) {
        if (!uniqueJobs.has(job.key)) uniqueJobs.set(job.key, []);
        uniqueJobs.get(job.key).push(job);
      } else {
        applyTranslationFailure(job);
      }
    });
    const pending = [...uniqueJobs.entries()];
    const batches = [];
    let batch = [];
    let batchCodepoints = 0;
    for (const [key, relatedJobs] of pending) {
      const text = relatedJobs[0].text;
      const codepoints = Array.from(text).length;
      if (codepoints > MAX_TRANSLATION_BATCH_CODEPOINTS) {
        failedTranslationKeys.add(key);
        relatedJobs.forEach((job) => applyTranslationFailure(job, true));
        console.error("S'ha omès una traducció perquè el text supera el límit permès.");
        continue;
      }
      if (
        batch.length >= MAX_TRANSLATION_BATCH_ITEMS ||
        batchCodepoints + codepoints > MAX_TRANSLATION_BATCH_CODEPOINTS
      ) {
        batches.push(batch);
        batch = [];
        batchCodepoints = 0;
      }
      batch.push([key, relatedJobs]);
      batchCodepoints += codepoints;
    }
    if (batch.length) batches.push(batch);

    let hadError = false;
    for (const requestBatch of batches) {
      const requestItems = requestBatch.map(([, relatedJobs]) => relatedJobs[0].text);
      try {
        const response = await translateText({
          contents: requestItems,
          targetLanguage
        });
        const translations = response.data?.translations;
        if (!Array.isArray(translations) || translations.length !== requestBatch.length) {
          throw new Error("La funció de traducció ha retornat una resposta invàlida.");
        }
        if (targetLanguage !== ui.language) {
          translationRequested = true;
          continue;
        }
        translations.forEach((translation, index) => {
          const [key, relatedJobs] = requestBatch[index];
          const result = {
            text: typeof translation.text === "string" ? translation.text : "",
            detectedLanguage: typeof translation.detectedLanguage === "string"
              ? translation.detectedLanguage.split("-")[0].toLowerCase()
              : ""
          };
          if (!result.text) throw new Error("La funció de traducció ha retornat un text buit.");
          memoryTranslationCache.set(key, result);
          relatedJobs.forEach((job) => applyTranslationResult(job, result, targetLanguage));
        });
      } catch (error) {
        hadError = true;
        console.error("No s'ha pogut traduir el contingut:", error);
        requestBatch.forEach(([key, relatedJobs]) => {
          failedTranslationKeys.add(key);
          relatedJobs.forEach(applyTranslationFailure);
        });
      }
    }
    if (staticTranslationCache.size) persistStaticTranslationCache();
    if (hadError && !translationErrorNotified) {
      translationErrorNotified = true;
      showToast(getTranslationFailureText());
    }
  }

  async function translatePageContent() {
    translationRequested = true;
    if (translationInProgress) return;
    translationInProgress = true;
    try {
      while (translationRequested) {
        translationRequested = false;
        await processPageTranslations();
      }
    } finally {
      translationInProgress = false;
    }
  }

  function initializeTranslation() {
    document.addEventListener("click", async (event) => {
      const toggle = event.target.closest("[data-user-content-toggle]");
      if (!toggle) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const element = toggle.closest(".user-content-translation-wrap")?.querySelector("[data-user-content]");
      if (!element) return;

      if (toggle.hasAttribute("data-translation-retry")) {
        const record = userContentState.get(element);
        if (!record) return;
        const key = translationKey(ui.language, record.original);
        failedTranslationKeys.delete(key);
        toggle.removeAttribute("data-translation-retry");
        toggle.hidden = true;
        await translatePageContent();
        return;
      }

      const record = userContentState.get(element);
      if (!record?.result) return;
      record.showingOriginal = !record.showingOriginal;
      updateUserContentDisplay(element, record, ui.language, record.result);
    }, true);

    document.getElementById("language-select")?.addEventListener("change", async (event) => {
      const selectedLanguage = event.target.value === "en" ? "en" : "ca";
      const previousLanguage = ui.language;
      const currentUserId = state.currentUserId;
      try {
        if (currentUserId) {
          await setDoc(doc(db, "students", currentUserId), { language: selectedLanguage }, { merge: true });
        }
        localStorage.setItem("eram-language", selectedLanguage);
        ui.language = selectedLanguage;
        failedTranslationKeys.clear();
        translationErrorNotified = false;
        await translatePageContent();
      } catch (error) {
        console.error("No s'ha pogut desar l'idioma seleccionat:", error);
        event.target.value = previousLanguage;
        showToast(selectedLanguage === "en"
          ? "Could not save your language preference."
          : "No s'ha pogut desar la preferència d'idioma.");
      }
    });

    translationObserver = new MutationObserver(() => {
      clearTimeout(translationTimer);
      translationTimer = setTimeout(() => void translatePageContent(), 120);
    });
    translationObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title"]
    });
    void translatePageContent();
  }

  // Estat reactiu en memòria sincronitzat amb Firestore
  const state = {
    currentUserId: null,
    students: [],
    projects: [],
    projectsLoaded: false,
    comments: [],
    positions: [],
    conversations: [],
    notifications: [],
    pointsLedger: []
  };

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

  const savedRoute = sessionStorage.getItem("eram-active-route");
  const savedRouteId = sessionStorage.getItem("eram-active-route-id");
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
  const validRoutes = new Set(["discover", "project", "positions", "messages", "profile", "leaderboard"]);
  const initialRoute =
    validRoutes.has(savedRoute) && (savedRoute !== "project" || savedRouteId) ? savedRoute : "discover";

  const ui = {
    route: initialRoute,
    language: localStorage.getItem("eram-language") === "en" ? "en" : "ca",
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
      state.students.find((s) => s.id === state.currentUserId) || {
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
      route === "leaderboard" || route === "messages" || route === "profile"
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
    sessionStorage.setItem("eram-active-route", route);
    sessionStorage.setItem("eram-active-route-id", routeId || "");

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
    if (route === "profile") renderProfileView();
    if (route === "leaderboard") renderLeaderboardView();
    if (restore) {
      window.scrollTo(scrollX, scrollY);
      restoreSavedViewOnEntry = false;
    }
    updateBackButton();
    persistNavigationHistory();
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
    }

    pendingMessageReference = contextRef;
    ui.activeConversationId = conv.id;
    navigateTo("messages", conv.id);
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
              <strong>${escapeHtml(other.name)}</strong>
              <p>${lastMessage ? userContentMarkup(lastMessage.text) : "Inicia la conversa..."}</p>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function bindConversationList(listContainer) {
    listContainer.querySelectorAll("[data-select-conv]").forEach((item) => {
      item.addEventListener("click", () => {
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

    const myConvs = state.conversations.filter(
      (conversation) =>
        Array.isArray(conversation.participantIds) &&
        conversation.participantIds.includes(currentUser.id)
    );
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

    const myConvs = state.conversations.filter(
      (c) => Array.isArray(c.participantIds) && c.participantIds.includes(currentUser.id)
    );

    listContainer.innerHTML = getConversationListMarkup(myConvs, currentUser, filterQ);
    bindConversationList(listContainer);

    const selectedConversationId = ui.activeConversationId;
    const activeConv = myConvs.find((c) => c.id === selectedConversationId) || myConvs[0];
    if (!activeConv) {
      mainPane.innerHTML = `<div class="chat-empty-placeholder"><p>Encara no tens converses actives. Pots obrir un xat des de qualsevol projecte o posició oberta.</p></div>`;
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
        <div style="display: flex; align-items:center; gap:10px;">
          <button type="button" class="chip-action-btn mobile-chat-back" id="mobile-chat-back-btn">&larr;</button>
          <img src="${escapeHtml(other.avatar)}" alt="${escapeHtml(other.name)}" class="nav-avatar" />
          <div>
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
      try {
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(conversationRef);
          if (!snapshot.exists()) {
            throw new Error(`No s'ha trobat la conversa ${activeConv.id}.`);
          }
          const currentMessages = Array.isArray(snapshot.data().messages) ? snapshot.data().messages : [];
          transaction.update(conversationRef, {
            messages: [...currentMessages, newMessage],
            [`typingUsers.${currentUser.id}`]: deleteField()
          });
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
      try {
        await pushNotification(other.id, `Nou missatge privat de ${currentUser.name}`, "messages", activeConv.id);
      } catch (error) {
        console.warn("Error creant la notificació del missatge privat:", error);
        showToast("El missatge s'ha enviat, però no s'ha pogut crear la notificació.");
      }
    });
  }

  // =========================================================================
  // 10. PERFIL D'ESTUDIANT I RÀNQUING
  // =========================================================================
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

    const myNotifs = state.notifications.filter((n) => n.userId === currentUser.id && !n.read);
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
      trigger.setAttribute("aria-expanded", "true");
      if (underlay) {
        positionPopoverUnderlay();
        underlay.classList.remove("hidden");
      }
    }
  }

  function openModal(modalId) {
    closeAllPopovers();
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const activeModal = document.querySelector(".modal-backdrop:not(.hidden)");
    if (activeModal && activeModal.id !== modalId) modalBackHistory.push(activeModal.id);
    ensureModalBackButton(modal);
    modal.classList.remove("hidden");
    updateBackButton();
  }

  function ensureModalBackButton(modal) {
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

  function openSettingsModal() {
    const languageSelect = document.getElementById("language-select");
    if (languageSelect) languageSelect.value = ui.language;
    openModal("modal-settings");
  }

  function closeModal(modalId, { keepForBack = false, preserveHistory = false } = {}) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("hidden");
    if (keepForBack) {
      modalBackHistory.push(modalId);
    } else if (!preserveHistory) {
      modalBackHistory.length = 0;
    }
    updateBackButton();
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
        if (action === "open-settings") {
          openSettingsModal();
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

    document.getElementById("chat-search-input").addEventListener("input", renderMessagesView);

    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
    });

    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) closeModal(backdrop.id);
      });
    });

    document.addEventListener("click", (e) => {
      const closeModalEl = e.target.closest("[data-close-modal]");
      if (closeModalEl) closeModal(closeModalEl.dataset.closeModal);

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
          showToast(ui.language === "en" ? "This student profile is not available yet." : "Aquest perfil encara no està disponible.");
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
        closeAllPopovers();
        document.querySelectorAll(".modal-backdrop:not(.hidden)").forEach((modal) => closeModal(modal.id));
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
    initializeTranslation();
    bindEvents();

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        state.currentUserId = user.uid;
        await seedInitialDataIfNeeded();
        startRealtimeSync();

        const userSnap = await getDoc(doc(db, "students", user.uid));
        if (userSnap.exists() && (userSnap.data().language === "ca" || userSnap.data().language === "en")) {
          ui.language = userSnap.data().language;
          localStorage.setItem("eram-language", ui.language);
          const languageSelect = document.getElementById("language-select");
          if (languageSelect) languageSelect.value = ui.language;
          failedTranslationKeys.clear();
          translationErrorNotified = false;
          void translatePageContent();
        }
        if (!userSnap.exists()) {
          const fallbackName = user.displayName || user.email?.split("@")[0] || "Estudiant ERAM";
          await setDoc(doc(db, "students", user.uid), {
            id: user.uid,
            name: fallbackName,
            email: user.email || "",
            role: "student",
            year: "1r Curs",
            avatarColor: "#8f7cf6",
            avatar: makeInitialAvatar(fallbackName, "#8f7cf6"),
            bio: "Estudiant a l'ERAM.",
            language: ui.language,
            interests: [],
            points: 0,
            projectsCount: 0,
            commentsCount: 0,
            usefulCommentsCount: 0,
            secondedCount: 0
          });
        }

        enterApp();
        void translatePageContent();
      } else {
        state.currentUserId = null;
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