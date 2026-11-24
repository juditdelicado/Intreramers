/* ==========================================================================
   ERAM CREATIVE NETWORK — FULL APPLICATION LOGIC
   State, Visibility Algorithm, Reputation Engine, Feedback, Positions & Chat
   ========================================================================== */

(() => {
  const STORAGE_KEY = "eram_creative_network_v1";
  const SESSION_KEY = "eram_creative_network_session";

  // Helper to generate relative ISO dates so deadlines stay realistic
  const daysFromNow = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  };

  // ========================================================================
  // 1. INITIAL REALISTIC SEED DATA (ERAM Students, Projects, Positions, Chat)
  // ========================================================================
  const INITIAL_STATE = {
    currentUserId: "stu-1",
    students: [
      {
        id: "stu-1",
        name: "Laia Puig",
        email: "laia.puig@campus.eram.cat",
        year: "3r Curs",
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
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
        bio: "Fotografia analògica, retrat documental i exploració de llum natural.",
        interests: ["Fotografia", "Analògic", "Retrat"],
        points: 34,
        projectsCount: 1,
        commentsCount: 4,
        usefulCommentsCount: 2,
        secondedCount: 4
      },
      {
        id: "stu-6",
        name: "Marc Solà",
        email: "marc.sola@campus.eram.cat",
        year: "4t Curs (TFG)",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
        bio: "Dissenyador gràfic i director d'art. Especialitzat en identitat visual i publicitat.",
        interests: ["Disseny gràfic", "Branding", "Direcció d'art"],
        points: 284,
        projectsCount: 18,
        commentsCount: 52,
        usefulCommentsCount: 39,
        secondedCount: 67,
        activeSince: "2022"
      },
      {
        id: "stu-7",
        name: "Aina Roca",
        email: "aina.roca@campus.eram.cat",
        year: "4t Curs (TFG)",
        avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80",
        bio: "Realitzadora i editora amb trajectòria en curtmetratges i vídeo musical.",
        interests: ["Audiovisuals", "Muntatge", "Realització"],
        points: 267,
        projectsCount: 16,
        commentsCount: 48,
        usefulCommentsCount: 35,
        secondedCount: 59,
        activeSince: "2022"
      },
      {
        id: "stu-8",
        name: "Oriol Ferrer",
        email: "oriol.ferrer@campus.eram.cat",
        year: "3r Curs",
        avatar: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=200&q=80",
        bio: "Creative coder i dissenyador interactiu. Desenvolupa instal·lacions i experiències digitals.",
        interests: ["UI/UX", "Creative Coding", "TouchDesigner"],
        points: 192,
        projectsCount: 11,
        commentsCount: 34,
        usefulCommentsCount: 24,
        secondedCount: 42,
        activeSince: "2023"
      },
      {
        id: "stu-9",
        name: "Ivet Torres",
        email: "ivet.torres@campus.eram.cat",
        year: "3r Curs",
        avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
        bio: "Fotògrafa documental i directora de fotografia de produccions independents.",
        interests: ["Fotografia", "Documental", "Direcció de fotografia"],
        points: 176,
        projectsCount: 9,
        commentsCount: 29,
        usefulCommentsCount: 21,
        secondedCount: 38,
        activeSince: "2023"
      },
      {
        id: "stu-10",
        name: "Èric Vidal",
        email: "eric.vidal@campus.eram.cat",
        year: "2n Curs",
        avatar: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=200&q=80",
        bio: "Artista 3D i generalista digital centrat en animació i entorns virtuals.",
        interests: ["3D", "Animació", "VFX"],
        points: 121,
        projectsCount: 7,
        commentsCount: 20,
        usefulCommentsCount: 13,
        secondedCount: 26,
        activeSince: "2024"
      },
      {
        id: "stu-11",
        name: "Laura Martí",
        email: "laura.marti@campus.eram.cat",
        year: "2n Curs",
        avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
        bio: "Il·lustradora i dissenyadora editorial amb experiència en identitats culturals.",
        interests: ["Il·lustració", "Editorial", "Tipografia"],
        points: 98,
        projectsCount: 6,
        commentsCount: 17,
        usefulCommentsCount: 10,
        secondedCount: 19,
        activeSince: "2024"
      },
      {
        id: "stu-12",
        name: "Pau Almendros",
        email: "pau.almendros@campus.eram.cat",
        year: "1r Curs",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        bio: "Muntador i dissenyador sonor interessat en narrativa experimental i vídeo.",
        interests: ["Muntatge", "So", "Vídeo experimental"],
        points: 72,
        projectsCount: 4,
        commentsCount: 12,
        usefulCommentsCount: 8,
        secondedCount: 14,
        activeSince: "2025"
      },
      {
        id: "stu-13",
        name: "Marta Cuscó",
        email: "marta.cusco@campus.eram.cat",
        year: "1r Curs",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
        bio: "Estudiant de fotografia i disseny gràfic centrada en retrat i cultura visual.",
        interests: ["Fotografia", "Retrat", "Disseny gràfic"],
        points: 58,
        projectsCount: 3,
        commentsCount: 9,
        usefulCommentsCount: 6,
        secondedCount: 11,
        activeSince: "2025"
      },
      {
        id: "stu-14",
        name: "Jan Pujol",
        email: "jan.pujol@campus.eram.cat",
        year: "Alumni",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        bio: "Alumni ERAM i productor audiovisual independent especialitzat en formats documentals.",
        interests: ["Producció", "Documental", "Gestió creativa"],
        points: 231,
        projectsCount: 14,
        commentsCount: 41,
        usefulCommentsCount: 31,
        secondedCount: 52,
        activeSince: "2021"
      },
      {
        id: "stu-15",
        name: "Clàudia Valls",
        email: "claudia.valls@campus.eram.cat",
        year: "Alumni",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        bio: "Alumni ERAM i dissenyadora UX treballant en productes culturals i educatius.",
        interests: ["UX", "Producte digital", "Accessibilitat"],
        points: 204,
        projectsCount: 12,
        commentsCount: 37,
        usefulCommentsCount: 28,
        secondedCount: 46,
        activeSince: "2022"
      }
    ],
    projects: [
      {
        id: "proj-1",
        title: "Ecos del Ter — Curtmetratge Documental",
        category: "Audiovisuals",
        aspect: "span-tall",
        cover: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80",
        description: "Peça documental observacional sobre els antics molins industrials a la vora del riu Ter i la memòria sonora dels seus treballadors.",
        briefing: "Estètica de 16mm amb llum natural freda, plans fixos llargs i paisatge sonor immersiu enregistrat in situ.",
        subject: "Direcció Cinematogràfica",
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
        feedbackType: "Ritme del primer muntatge (rough cut) i transicions sonores",
        questions: "El pròleg de 90 segons manté la tensió abans de la primera entrevista?"
      },
      {
        id: "proj-2",
        title: "Tipografia Cinètica — Festival Temporada Alta",
        category: "Disseny gràfic",
        aspect: "span-portrait",
        cover: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80",
        description: "Sistema d'identitat visual modular i cartelleria en moviment per a la secció d'arts escèniques contemporànies.",
        briefing: "Contrast tipogràfic suís combinat amb deformacions reactives al so de l'escenari.",
        subject: "Disseny Editorial i Tipografia",
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
        feedbackType: "Llegibilitat a distància i jerarquia de la graella",
        questions: "Funciona millor la versió monocroma o amb accent vermell?"
      },
      {
        id: "proj-3",
        title: "Llum de Tramuntana — Sèrie Retrat Analògic",
        category: "Fotografia",
        aspect: "span-square",
        cover: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
        description: "Sèrie de 12 retrats en format mitjà (Kodak Portra 400) explorant l'impacte del vent de tramuntana en espais costaners de l'Empordà.",
        briefing: "Sense il·luminació artificial; aprofitar l'hora blava i el gra natural del negatiu escanejat.",
        subject: "Fotografia Documental",
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
        feedbackType: "Selecció i seqüenciació de les 8 fotografies finals",
        questions: "Quina imatge creieu que hauria d'obrir l'exposició?"
      },
      {
        id: "proj-4",
        title: "Kinetik Synth — Interfície Tàctil WebAudio",
        category: "UI/UX",
        aspect: "span-square",
        cover: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=900&q=80",
        description: "Prototip interactiu d'un sintetitzador granular per a navegador dissenyat per a pantalles tàctils i controladors MIDI.",
        briefing: "Minimitzar la càrrega cognitiva amb feedback visual immediat de les ones sonores.",
        subject: "Disseny d'Interfícies Interactives",
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
        feedbackType: "Usabilitat dels controls circulars en iPad i mòbil",
        questions: "És intuïtiu el gest per modular el filtre passa-baixos?"
      },
      {
        id: "proj-5",
        title: "Arquitectura Brutalista Submergida",
        category: "3D",
        aspect: "span-tall",
        cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80",
        description: "Escenari 3D en temps real creat amb Blender i Unreal Engine 5 que imagina un museu submergit a la Costa Brava.",
        briefing: "Estudi d'il·luminació volumètrica submarina (caustics) i textures de formigó erosionat.",
        subject: "Creació d'Entorns 3D",
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
        feedbackType: "Il·luminació atmosfèrica i escala arquitectònica",
        questions: "Es percep bé la profunditat de la sala principal?"
      },
      {
        id: "proj-6",
        title: "Memòria de la Fàbrica — Instal·lació Multisala",
        category: "Audiovisuals",
        aspect: "span-portrait",
        cover: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=900&q=80",
        description: "Videoinstal·lació de tres canals sincronitzats sobre el patrimoni tèxtil de Salt per a la mostra anual d'ERAM.",
        briefing: "Sincronia rítmica entre projeccions i espai sonor quadrafònic.",
        subject: "Projectes Multimèdia",
        professor: "Dra. Anna Rovira",
        year: "4t Curs (TFG)",
        deadline: daysFromNow(14),
        createdAt: daysFromNow(-5),
        stage: "Pre-production",
        teamType: "group",
        participants: ["Pol Vila", "Laia Puig"],
        ownerId: "stu-2",
        status: "In progress",
        mediaUrl: "",
        feedbackType: "Plantejament espacial de les tres pantalles",
        questions: "Creieu que l'espectador pot seguir les tres narratives alhora?"
      },
      {
        id: "proj-7",
        title: "Nocturns a Girona — Fotografia Urbana",
        category: "Fotografia",
        aspect: "span-landscape",
        cover: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1100&q=80",
        description: "Exploració cromàtica dels reflexos de neó i vapor d'aigua al Barri Vell durant les nits d'hivern.",
        briefing: "Composicions geomètriques inspirades en el cinema neo-noir asiàtic.",
        subject: "Il·luminació Fotogràfica",
        professor: "Prof. Jordi Casals",
        year: "2n Curs",
        deadline: daysFromNow(2),
        createdAt: daysFromNow(-7),
        stage: "Final review",
        teamType: "individual",
        participants: ["Laia Puig"],
        ownerId: "stu-1",
        status: "In progress",
        mediaUrl: "",
        feedbackType: "Coherència de color entre les 6 làmines finals",
        questions: "Sobresurt massa el blau a la quarta fotografia?"
      },
      {
        id: "proj-8",
        title: "Revista Monogràfica 'Codi Obert'",
        category: "Disseny gràfic",
        aspect: "span-wide",
        cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1100&q=80",
        description: "Publicació impresa de 64 pàgines sobre cultura digital, programari lliure i art generatiu.",
        briefing: "Enquadernació japonesa vista, paper reciclat de 110g i sistema de notes al marge.",
        subject: "Disseny Editorial i Tipografia",
        professor: "Dra. Anna Rovira",
        year: "2n Curs",
        deadline: daysFromNow(16),
        createdAt: daysFromNow(-2),
        stage: "Research and references",
        teamType: "group",
        participants: ["Clara Mas", "Núria Bosch"],
        ownerId: "stu-3",
        status: "In progress",
        mediaUrl: "",
        feedbackType: "Proposta de retícula i elecció de papers",
        questions: "El cos de lletra de 8.5pt resulta còmode per a articles llargs?"
      },
      {
        id: "proj-9",
        title: "EcoTrack Campus — App Mobilitat Sostenible",
        category: "UI/UX",
        aspect: "span-tall",
        cover: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=80",
        description: "Aplicació mòbil per coordinar trajectes compartits entre estudiants que viatgen diàriament al campus de Salt.",
        briefing: "Flux d'usuari en menys de 3 clics per publicar o reservar plaça.",
        subject: "Disseny d'Interfícies Interactives",
        professor: "Prof. Oriol Soler",
        year: "3r Curs",
        deadline: daysFromNow(8),
        createdAt: daysFromNow(-3),
        stage: "Production",
        teamType: "group",
        participants: ["Pol Vila", "Clara Mas"],
        ownerId: "stu-2",
        status: "In progress",
        mediaUrl: "",
        feedbackType: "Arquitectura d'informació i claredat del mapa",
        questions: "Falta algun filtre essencial per horaris de classe?"
      },
      {
        id: "proj-10",
        title: "Escultura Orgànica — Simulació de Fluids",
        category: "3D",
        aspect: "span-portrait",
        cover: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=900&q=80",
        description: "Peces visuals abstractes generades amb Houdini per a la capçalera d'un programa cultural.",
        briefing: "Moviment lent, materials translúcids i renderitzat físicament realista.",
        subject: "Animació i Simulació 3D",
        professor: "Prof. Sergi Pujol",
        year: "3r Curs",
        deadline: daysFromNow(12),
        createdAt: daysFromNow(-1),
        stage: "Production",
        teamType: "individual",
        participants: ["Martí Serra"],
        ownerId: "stu-4",
        status: "In progress",
        mediaUrl: "",
        feedbackType: "Velocitat de simulació i shaders translúcids",
        questions: "El moviment sembla prou orgànic o massa viscos?"
      },
      {
        id: "proj-11",
        title: "Videoclip 'Horitzó de Sucesos'",
        category: "Audiovisuals",
        aspect: "span-square",
        cover: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80",
        description: "Videoclip musical rodat amb òptiques anamòrfiques per a una banda emergent de l'escena independent gironina.",
        briefing: "Narrativa fragmentada i coreografia de càmera en pla seqüència.",
        subject: "Realització Audiovisual",
        professor: "Dr. Marc Ferrer",
        year: "3r Curs",
        deadline: daysFromNow(5),
        createdAt: daysFromNow(-4),
        stage: "Pre-production",
        teamType: "group",
        participants: ["Laia Puig", "Martí Serra", "Núria Bosch"],
        ownerId: "stu-1",
        status: "In progress",
        mediaUrl: "",
        feedbackType: "Storyboard tècnic i esquema d'il·luminació",
        questions: "Veieu viable el canvi de localització en una sola jornada?"
      },
      {
        id: "proj-12",
        title: "Cartelleria Exposició 'Llenguatges del Cos'",
        category: "Disseny gràfic",
        aspect: "span-landscape",
        cover: "https://images.unsplash.com/photo-1509343256512-d77a5cb3791b?auto=format&fit=crop&w=1100&q=80",
        description: "Identitat visual i senyalètica per a una exposició de dansa contemporània i fotografia escènica.",
        briefing: "Combinar fotografia d'alt contrast amb tipografia grotesca condensada.",
        subject: "Identitat Visual",
        professor: "Dra. Anna Rovira",
        year: "2n Curs",
        deadline: daysFromNow(-2),
        createdAt: daysFromNow(-15),
        stage: "Final review",
        teamType: "individual",
        participants: ["Clara Mas"],
        ownerId: "stu-3",
        status: "Submitted",
        mediaUrl: "",
        feedbackType: "Valoració global del sistema gràfic",
        questions: ""
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
      },
      {
        id: "com-2",
        projectId: "proj-1",
        authorId: "stu-3",
        text: "M'encanta la paleta freda de l'etalonatge. Potser pujaria lleugerament el nivell del so ambient de les turbines per donar més textura.",
        createdAt: "Fa 1 hora",
        secondedBy: ["stu-2"],
        usefulnessRating: 4
      },
      {
        id: "com-3",
        projectId: "proj-4",
        authorId: "stu-1",
        text: "En pantalla tàctil els dials responen genial, però recomano augmentar l'àrea de toc dels botons d'octava per evitar pulsacions accidentals.",
        createdAt: "Ahir",
        secondedBy: ["stu-4", "stu-5"],
        usefulnessRating: 5
      }
    ],
    positions: [
      {
        id: "pos-1",
        title: "Dissenyador/a Sonor i Perxista",
        projectTitle: "Ecos del Ter — Curtmetratge Documental",
        role: "Disseny sonor",
        spots: 1,
        compensation: "Academic collaboration",
        startDate: daysFromNow(4),
        endDate: daysFromNow(25),
        duration: "3 setmanes (2 dies de rodatge + mescla)",
        location: "In person",
        projectType: "Academic",
        subject: "Direcció Cinematogràfica",
        year: "3r Curs",
        description: "Busquem un/a estudiant amb interès en enregistrament de camp (Zoom F6 / micròfon direccional) i postproducció sonora en Pro Tools o Reaper.",
        ownerId: "stu-1",
        createdAt: "Fa 2 dies",
        status: "Open",
        applications: [
          {
            id: "app-1",
            applicantId: "stu-4",
            intro: "Tinc experiència enregistrant amb Zoom H6 i muntatge sonor per a documentals de 2n curs.",
            skills: "Reaper, Pro Tools, enregistrament exterior",
            portfolioProjectId: "proj-5",
            status: "Pending"
          }
        ]
      },
      {
        id: "pos-2",
        title: "Director/a de Fotografia (Óptiques Anamòrfiques)",
        projectTitle: "Videoclip 'Horitzó de Sucesos'",
        role: "Direcció de fotografia",
        spots: 1,
        compensation: "Negotiable",
        startDate: daysFromNow(7),
        endDate: daysFromNow(18),
        duration: "2 jornades de rodatge nocturn a Girona",
        location: "In person",
        projectType: "Personal",
        subject: "",
        year: "3r Curs",
        description: "Cerquem DoP per dissenyar l'esquema de llum amb tubs LED Astera i rodar amb Sony FX6.",
        ownerId: "stu-1",
        createdAt: "Fa 1 dia",
        status: "Open",
        applications: []
      },
      {
        id: "pos-3",
        title: "Desenvolupador/a Frontend o Creative Coder",
        projectTitle: "Memòria de la Fàbrica — Instal·lació Multisala",
        role: "Animació / 3D",
        spots: 1,
        compensation: "Academic collaboration",
        startDate: daysFromNow(5),
        endDate: daysFromNow(35),
        duration: "1 mes",
        location: "Hybrid",
        projectType: "Academic",
        subject: "Projectes Multimèdia",
        year: "4t Curs (TFG)",
        description: "Col·laboració per sincronitzar projeccions amb TouchDesigner o WebGL per a l'exposició final de TFG.",
        ownerId: "stu-2",
        createdAt: "Fa 4 hores",
        status: "Open",
        applications: []
      }
    ],
    conversations: [
      {
        id: "conv-1",
        participantIds: ["stu-1", "stu-2"],
        messages: [
          {
            id: "m-1",
            senderId: "stu-2",
            text: "Hola Laia! Acabo de comentar el muntatge d'Ecos del Ter. Si vols demà a l'aula de muntatge 2 ho mirem amb auriculars.",
            ref: { type: "project", id: "proj-1", label: "Projecte: Ecos del Ter" },
            timestamp: "10:14"
          },
          {
            id: "m-2",
            senderId: "stu-1",
            text: "Hola Pol! Moltes gràcies pel feedback sobre el pròleg, tens tota la raó. Ens veiem demà a les 12h!",
            ref: null,
            timestamp: "10:19"
          }
        ]
      }
    ],
    notifications: [
      {
        id: "notif-1",
        userId: "stu-1",
        text: "Pol Vila ha comentat el teu projecte 'Ecos del Ter'",
        time: "Fa 3 hores",
        read: false,
        targetRoute: "project",
        targetId: "proj-1"
      },
      {
        id: "notif-2",
        userId: "stu-1",
        text: "Martí Serra s'ha postulat a 'Dissenyador/a Sonor i Perxista'",
        time: "Fa 2 hores",
        read: false,
        targetRoute: "positions",
        targetId: "pos-1"
      },
      {
        id: "notif-3",
        userId: "stu-1",
        text: "Has guanyat +5 punts per rebre una valoració d'utilitat de 5 estrelles",
        time: "Ahir",
        read: false,
        targetRoute: "leaderboard",
        targetId: ""
      }
    ],
    pointsLedger: [
      { id: "pt-1", userId: "stu-1", action: "Publicació de projecte: Ecos del Ter", points: 10, date: daysFromNow(-4) },
      { id: "pt-2", userId: "stu-1", action: "Feedback constructiu a Kinetik Synth", points: 5, date: daysFromNow(-1) },
      { id: "pt-3", userId: "stu-1", action: "Comentari secundat per 2 companys", points: 4, date: daysFromNow(-1) }
    ]
  };

  // Load or initialize state
  let state = loadState();
  if (!state || !Array.isArray(state.students) || !Array.isArray(state.projects)) {
    state = structuredClone(INITIAL_STATE);
  }
  const initialStudentIds = new Set(state.students.map((student) => student.id));
  INITIAL_STATE.students.forEach((student) => {
    if (!initialStudentIds.has(student.id)) state.students.push(student);
  });

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("No s'ha pogut llegir localStorage, usant dades inicials.", e);
    }
    return structuredClone(INITIAL_STATE);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Error desant estat:", e);
    }
  }

  // ========================================================================
  // 2. UI FILTERS & ROUTING STATE
  // ========================================================================
  const ui = {
    route: "discover",
    selectedCategory: "General",
    searchQuery: "",
    sortBy: "recommended",
    visibleCount: 12,
    filters: {
      subject: "",
      professor: "",
      year: "",
      stage: "",
      teamType: "",
      status: "active",
      urgentOnly: false
    },
    activeProjectId: null,
    activeProfileId: null,
    activeConversationId: "conv-1",
    posFilters: {
      role: "",
      compensation: "",
      projectType: "",
      location: ""
    }
  };

  // ========================================================================
  // 3. REPUTATION, ACHIEVEMENT TIERS & VISIBILITY ALGORITHM
  // ========================================================================
  function getCurrentUser() {
    return state.students.find((s) => s.id === state.currentUserId) || state.students[0];
  }

  function getStudentById(id) {
    return state.students.find((s) => s.id === id) || state.students[0];
  }

  function getAchievementTier(points) {
    if (points >= 200) return { level: 5, name: "Community Expert", next: null, min: 200 };
    if (points >= 130) return { level: 4, name: "Creative Mind", next: 200, min: 130 };
    if (points >= 75) return { level: 3, name: "Collaborator", next: 130, min: 75 };
    if (points >= 30) return { level: 2, name: "Contributor", next: 75, min: 30 };
    return { level: 1, name: "Newcomer", next: 30, min: 0 };
  }

  function awardPoints(userId, actionKey, points, description) {
    // Anti-abuse: prevent duplicate identical single-action rewards
    const alreadyAwarded = state.pointsLedger.some(
      (entry) => entry.userId === userId && entry.action === actionKey
    );
    if (alreadyAwarded) return false;

    const student = getStudentById(userId);
    if (!student) return false;

    student.points += points;
    state.pointsLedger.unshift({
      id: "pt-" + Date.now() + Math.random().toString(36).slice(2, 6),
      userId,
      action: actionKey,
      label: description,
      points,
      date: new Date().toISOString().split("T")[0]
    });

    if (userId === state.currentUserId) {
      showToast(`+${points} punts: ${description}`);
    }
    saveState();
    return true;
  }

  function getDaysUntilDeadline(deadlineStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(deadlineStr);
    const diffMs = target - today;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Normalized Project Visibility Ranking Algorithm:
   * - Deadline urgency: 40%
   * - Student contribution score: 30%
   * - Feedback still needed: 20%
   * - Publication freshness: 10%
   */
  function computeProjectVisibilityScore(project) {
    const owner = getStudentById(project.ownerId);
    const commentsCount = state.comments.filter((c) => c.projectId === project.id).length;
    const daysLeft = getDaysUntilDeadline(project.deadline);

    // 1. Deadline urgency (0 to 1)
    let urgencyScore = 0.2;
    if (daysLeft <= 0) urgencyScore = 0.95;
    else if (daysLeft <= 3) urgencyScore = 1.0;
    else if (daysLeft <= 7) urgencyScore = 0.78;
    else if (daysLeft <= 14) urgencyScore = 0.45;

    // 2. Student contribution score (0 to 1, capped at 250 pts to avoid dominance)
    const repScore = Math.min((owner?.points || 0) / 250, 1);

    // 3. Feedback still needed (0 to 1 — fewer comments = higher priority)
    const feedbackNeedScore = Math.max(0, 1 - commentsCount / 5);

    // 4. Publication freshness (0 to 1)
    const ageDays = Math.max(0, -getDaysUntilDeadline(project.createdAt));
    const freshnessScore = Math.max(0, 1 - ageDays / 21);

    return (
      urgencyScore * 0.4 +
      repScore * 0.3 +
      feedbackNeedScore * 0.2 +
      freshnessScore * 0.1
    );
  }

  // ========================================================================
  // 4. NAVIGATION & VIEW ROUTER
  // ========================================================================
  function resetDiscoveryFilters() {
    ui.selectedCategory = "General";
    ui.searchQuery = "";
    ui.visibleCount = 12;
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

    document.querySelectorAll("[data-category]").forEach((button) => {
      const isGeneral = button.dataset.category === "General";
      button.classList.toggle("active", isGeneral);
      button.setAttribute("aria-selected", String(isGeneral));
    });
  }

  function navigateTo(route, payloadId = null) {
    ui.route = route;
    if (route === "discover") resetDiscoveryFilters();
    if (route === "project" && payloadId) ui.activeProjectId = payloadId;
    if (route === "profile") ui.activeProfileId = payloadId || state.currentUserId;
    if (route === "messages" && payloadId) ui.activeConversationId = payloadId;

    // Update top nav active state
    document.querySelectorAll(".nav-icon-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.route === route);
    });

    // Toggle sections
    document.querySelectorAll(".view-section").forEach((sec) => sec.classList.add("hidden"));
    const targetSection = document.getElementById(`view-${route === "project" ? "project-detail" : route}`);
    if (targetSection) targetSection.classList.remove("hidden");

    closeAllPopovers();
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (route === "discover") renderDiscoverView();
    if (route === "project") renderProjectDetailView();
    if (route === "positions") renderPositionsView();
    if (route === "messages") renderMessagesView();
    if (route === "profile") renderProfileView();
    if (route === "leaderboard") renderLeaderboardView();
  }

  // ========================================================================
  // 5. HOMEPAGE — DISCOVERY, FILTERS & MASONRY RENDERING
  // ========================================================================
  function populateDynamicFilterOptions() {
    const subjects = [...new Set(state.projects.map((p) => p.subject).filter(Boolean))];
    const professors = [...new Set(state.projects.map((p) => p.professor).filter(Boolean))];

    const subSel = document.getElementById("filter-subject");
    const profSel = document.getElementById("filter-professor");
    if (subSel) {
      subSel.innerHTML =
        `<option value="">Totes les assignatures</option>` +
        subjects.map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
    }
    if (profSel) {
      profSel.innerHTML =
        `<option value="">Tots els professors</option>` +
        professors.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
    }
  }

  function getFilteredProjects() {
    const q = ui.searchQuery.trim().toLowerCase();

    let list = state.projects.filter((proj) => {
      const owner = getStudentById(proj.ownerId);

      // Category check
      if (ui.selectedCategory !== "General" && proj.category !== ui.selectedCategory) {
        return false;
      }

      // Status check (Submitted/Resolved hidden from active feed unless requested)
      if (ui.filters.status === "active" && proj.status !== "In progress") return false;
      if (ui.filters.status !== "active" && ui.filters.status !== "all" && proj.status !== ui.filters.status) {
        return false;
      }

      // Academic & Project filters
      if (ui.filters.subject && proj.subject !== ui.filters.subject) return false;
      if (ui.filters.professor && proj.professor !== ui.filters.professor) return false;
      if (ui.filters.year && proj.year !== ui.filters.year) return false;
      if (ui.filters.stage && proj.stage !== ui.filters.stage) return false;
      if (ui.filters.teamType && proj.teamType !== ui.filters.teamType) return false;
      if (ui.filters.urgentOnly && getDaysUntilDeadline(proj.deadline) > 7) return false;

      // Global search query
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

    // Sorting
    list.sort((a, b) => {
      if (ui.sortBy === "deadline") {
        return getDaysUntilDeadline(a.deadline) - getDaysUntilDeadline(b.deadline);
      }
      if (ui.sortBy === "recent") {
        return new Date(b.createdAt) - new Date(a.createdAt);
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
      // Default: "recommended" normalized algorithm
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

  function renderDiscoverView() {
    updateActiveFilterBadge();
    const activeCategoryLabel = document.getElementById("active-category-label");
    if (activeCategoryLabel) {
      activeCategoryLabel.textContent = ui.filters.urgentOnly
        ? "Prioritaris"
        : ui.selectedCategory;
    }
    const grid = document.getElementById("projects-masonry-grid");
    const empty = document.getElementById("projects-empty-state");
    const loadMoreWrap = document.getElementById("load-more-container");

    const filtered = getFilteredProjects();
    const slice = filtered.slice(0, ui.visibleCount);

    if (filtered.length === 0) {
      grid.innerHTML = "";
      empty.classList.remove("hidden");
      loadMoreWrap.classList.add("hidden");
      return;
    }

    empty.classList.add("hidden");
    loadMoreWrap.classList.toggle("hidden", filtered.length <= ui.visibleCount);

    grid.innerHTML = slice
      .map((proj) => {
        const owner = getStudentById(proj.ownerId);
        const commentsCount = state.comments.filter((c) => c.projectId === proj.id).length;
        const daysLeft = getDaysUntilDeadline(proj.deadline);
        const isUrgent = daysLeft >= 0 && daysLeft <= 5 && proj.status === "In progress";
        const deadlineLabel =
          daysLeft < 0 ? "Entregat" : daysLeft === 0 ? "Avui" : `Entrega en ${daysLeft}d`;

        return `
          <article class="masonry-card ${proj.aspect || "span-portrait"}" tabindex="0" role="button" aria-label="Obrir projecte ${escapeHtml(proj.title)}" data-open-project="${proj.id}">
            <img src="${escapeHtml(proj.cover)}" alt="${escapeHtml(proj.title)}" loading="lazy" />
            <div class="card-overlay">
              <div class="overlay-top">
                <span class="overlay-badge">${escapeHtml(proj.category)}</span>
                ${isUrgent ? `<span class="overlay-urgent">Feedback urgent</span>` : ""}
              </div>
              <div class="overlay-bottom">
                <h3>${escapeHtml(proj.title)}</h3>
                <div class="overlay-meta">
                  <span>${escapeHtml(owner.name)}</span>
                  <span>${deadlineLabel} · ${commentsCount} comentaris</span>
                </div>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  // ========================================================================
  // 6. PROJECT DETAIL PAGE & PEER FEEDBACK SYSTEM
  // ========================================================================
  const STAGE_LABELS = {
    "Initial idea": "1. Idea inicial",
    "Research and references": "2. Recerca i referències",
    "Pre-production": "3. Preproducció",
    "Production": "4. Producció",
    "Post-production": "5. Postproducció",
    "Final review": "6. Revisió final"
  };

  function renderProjectDetailView() {
    const container = document.getElementById("view-project-detail");
    const proj = state.projects.find((p) => p.id === ui.activeProjectId);
    if (!proj) {
      navigateTo("discover");
      return;
    }

    const owner = getStudentById(proj.ownerId);
    const currentUser = getCurrentUser();
    const isOwner = proj.ownerId === currentUser.id;
    const daysLeft = getDaysUntilDeadline(proj.deadline);

    const projectComments = state.comments.filter((c) => c.projectId === proj.id);

    container.innerHTML = `
      <div class="page-container">
        <div class="detail-back-bar">
          <button type="button" class="btn-secondary-pill" id="detail-back-btn">&larr; Tornar a projectes</button>
          ${
            isOwner
              ? `<div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button type="button" class="btn-secondary-pill" id="edit-project-btn">Editar projecte</button>
                  <select id="owner-status-select" class="pill-select" aria-label="Canviar estat del projecte">
                    <option value="In progress" ${proj.status === "In progress" ? "selected" : ""}>En curs (Actiu)</option>
                    <option value="Submitted" ${proj.status === "Submitted" ? "selected" : ""}>Entregat (+5 pts)</option>
                    <option value="Resolved" ${proj.status === "Resolved" ? "selected" : ""}>Resolt / Completat (+5 pts)</option>
                  </select>
                </div>`
              : `<span class="pill-tag ${proj.status === "In progress" ? "" : "success"}">${escapeHtml(proj.status)}</span>`
          }
        </div>

        <div class="detail-layout">
          <div>
            <div class="detail-media-stage">
              <img src="${escapeHtml(proj.cover)}" alt="${escapeHtml(proj.title)}" />
            </div>
            ${
              proj.mediaUrl
                ? `<div class="detail-external-media">
                    <div>
                      <strong>Material multimèdia adjunt</strong>
                      <div style="font-size:12px;color:var(--text-secondary);">${escapeHtml(proj.mediaUrl)}</div>
                    </div>
                    <a href="${escapeHtml(proj.mediaUrl)}" target="_blank" rel="noopener" class="btn-primary">Obrir enllaç</a>
                  </div>`
                : ""
            }
          </div>

          <div class="detail-info-card">
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
              <span class="pill-tag">${escapeHtml(proj.category)}</span>
              <span class="pill-tag">${STAGE_LABELS[proj.stage] || proj.stage}</span>
              ${daysLeft <= 5 && daysLeft >= 0 ? `<span class="pill-tag urgent">Entrega en ${daysLeft} dies</span>` : ""}
            </div>

            <h1 class="page-title" style="margin-bottom:8px;">${escapeHtml(proj.title)}</h1>
            <p style="color:var(--text-secondary);margin-top:0;">${escapeHtml(proj.description)}</p>

            <div style="display:flex;align-items:center;gap:10px;margin-top:14px;cursor:pointer;" data-open-profile="${owner.id}">
              <img src="${escapeHtml(owner.avatar)}" alt="${escapeHtml(owner.name)}" class="nav-avatar" />
              <div>
                <strong style="display:block;font-size:13.5px;">${escapeHtml(owner.name)} <span style="font-weight:400;color:var(--text-muted);">(Autor/a)</span></strong>
                <span style="font-size:12px;color:var(--text-secondary);">${escapeHtml(owner.year)} · ${owner.points} pts</span>
              </div>
            </div>

            <div class="detail-meta-grid">
              <div class="meta-item"><span>Assignatura</span><strong>${escapeHtml(proj.subject)}</strong></div>
              <div class="meta-item"><span>Professor/a</span><strong>${escapeHtml(proj.professor)}</strong></div>
              <div class="meta-item"><span>Curs acadèmic</span><strong>${escapeHtml(proj.year)}</strong></div>
              <div class="meta-item"><span>Data límit</span><strong>${escapeHtml(proj.deadline)}</strong></div>
              <div class="meta-item"><span>Modalitat</span><strong>${proj.teamType === "group" ? "Projecte en grup" : "Individual"}</strong></div>
              <div class="meta-item"><span>Participants</span><strong>${escapeHtml((proj.participants || [owner.name]).join(", "))}</strong></div>
            </div>

            <div>
              <strong style="font-size:13px;">Briefing creatiu</strong>
              <p style="font-size:13px;color:var(--text-secondary);margin:4px 0 0;">${escapeHtml(proj.briefing)}</p>
            </div>

            <div class="feedback-request-box">
              <h4>Feedback sol·licitat per l'equip</h4>
              <p style="margin:0 0 6px;font-size:13px;"><strong>Focus:</strong> ${escapeHtml(proj.feedbackType)}</p>
              ${proj.questions ? `<p style="margin:0;font-size:12.5px;color:var(--text-secondary);"><strong>Pregunta clau:</strong> "${escapeHtml(proj.questions)}"</p>` : ""}
            </div>
          </div>
        </div>

        <!-- PEER FEEDBACK SECTION -->
        <div class="feedback-section">
          <div class="feedback-header">
            <h2 style="margin:0;font-size:19px;">Feedback constructiu (${projectComments.length})</h2>
            <select id="comment-sort-select" class="pill-select" aria-label="Ordenar comentaris">
              <option value="useful">Més útils (valoració autor)</option>
              <option value="seconded">Més secundats</option>
              <option value="recent">Més recents</option>
            </select>
          </div>

          <form id="add-comment-form" class="comment-composer">
            <textarea id="new-comment-text" rows="3" placeholder="Escriu una crítica constructiva, suggeriment tècnic o referència útil (mínim 20 caràcters per obtenir punts)..." required></textarea>
            <div class="composer-footer">
              <span style="font-size:12px;color:var(--text-secondary);">
                ${isOwner ? "Ets l'autor/a d'aquest projecte (pots valorar la utilitat dels comentaris d'1 a 5 estrelles)." : "Guanya +5 punts per aportar feedback constructiu (+3 extra si té pocs comentaris)."}
              </span>
              <button type="submit" class="btn-primary">Publicar feedback</button>
            </div>
          </form>

          <div class="comment-list" id="project-comments-list"></div>
        </div>
      </div>
    `;

    document.getElementById("detail-back-btn").addEventListener("click", () => navigateTo("discover"));

    const editBtn = document.getElementById("edit-project-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => openEditProjectModal(proj));
    }

    const statusSel = document.getElementById("owner-status-select");
    if (statusSel) {
      statusSel.addEventListener("change", (e) => {
        proj.status = e.target.value;
        if (proj.status === "Submitted") {
          awardPoints(currentUser.id, `submit-${proj.id}`, 5, `Projecte entregat: ${proj.title}`);
        } else if (proj.status === "Resolved") {
          awardPoints(currentUser.id, `resolve-${proj.id}`, 5, `Projecte resolt: ${proj.title}`);
        }
        saveState();
        renderProjectDetailView();
      });
    }

    document.getElementById("comment-sort-select").addEventListener("change", (e) => {
      renderCommentsList(proj, e.target.value);
    });

    document.getElementById("add-comment-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const textarea = document.getElementById("new-comment-text");
      const text = textarea.value.trim();
      if (text.length < 10) {
        showToast("Escriu un comentari més detallat (mínim 10 caràcters).");
        return;
      }

      const priorCount = state.comments.filter((c) => c.projectId === proj.id).length;
      const newComment = {
        id: "com-" + Date.now(),
        projectId: proj.id,
        authorId: currentUser.id,
        text,
        createdAt: "Ara mateix",
        secondedBy: [],
        usefulnessRating: 0
      };

      state.comments.unshift(newComment);

      // Award points only if commenting on another student's project and meeting quality threshold
      if (!isOwner && text.length >= 20) {
        currentUser.commentsCount += 1;
        awardPoints(currentUser.id, `comment-${proj.id}-${currentUser.id}`, 5, `Feedback a "${proj.title}"`);
        if (priorCount < 2) {
          awardPoints(currentUser.id, `low-fb-${proj.id}-${currentUser.id}`, 3, "Bonus per ajudar un projecte amb poc feedback");
        }
        pushNotification(proj.ownerId, `${currentUser.name} ha deixat feedback al teu projecte "${proj.title}"`, "project", proj.id);
      }

      saveState();
      textarea.value = "";
      renderProjectDetailView();
    });

    renderCommentsList(proj, "useful");
  }

  function renderCommentsList(proj, sortBy) {
    const listEl = document.getElementById("project-comments-list");
    if (!listEl) return;

    const currentUser = getCurrentUser();
    const isProjectOwner = proj.ownerId === currentUser.id;
    let comments = state.comments.filter((c) => c.projectId === proj.id);

    comments.sort((a, b) => {
      if (sortBy === "useful") return (b.usefulnessRating || 0) - (a.usefulnessRating || 0);
      if (sortBy === "seconded") return b.secondedBy.length - a.secondedBy.length;
      return 0;
    });

    if (comments.length === 0) {
      listEl.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:24px;">Encara no hi ha comentaris. Sigues el primer a ajudar aquest projecte!</p>`;
      return;
    }

    listEl.innerHTML = comments
      .map((c) => {
        const author = getStudentById(c.authorId);
        const isSeconded = c.secondedBy.includes(currentUser.id);
        const canRate = isProjectOwner && c.authorId !== currentUser.id;

        const starsHtml = [1, 2, 3, 4, 5]
          .map((star) => {
            const filled = star <= (c.usefulnessRating || 0);
            return `<button type="button" class="star-btn ${filled ? "filled" : ""}" ${canRate ? `data-rate-comment="${c.id}" data-star="${star}"` : "disabled"} title="${star} estrelles">&#9733;</button>`;
          })
          .join("");

        return `
          <div class="comment-card">
            <div class="comment-top">
              <div class="comment-author" style="cursor:pointer;" data-open-profile="${author.id}">
                <img src="${escapeHtml(author.avatar)}" alt="${escapeHtml(author.name)}" />
                <div>
                  <strong style="font-size:13.5px;">${escapeHtml(author.name)}</strong>
                  <span style="display:block;font-size:11.5px;color:var(--text-muted);">${escapeHtml(author.year)} · ${escapeHtml(c.createdAt)}</span>
                </div>
              </div>
              <div class="star-rating-bar" title="Valoració d'utilitat per l'autor del projecte">
                <span>Utilitat:</span>
                ${starsHtml}
              </div>
            </div>
            <p style="margin:0;font-size:13.5px;line-height:1.55;">${escapeHtml(c.text)}</p>
            <div class="comment-actions">
              <div class="comment-btn-group">
                <button type="button" class="chip-action-btn ${isSeconded ? "active" : ""}" data-second-comment="${c.id}">
                  &#9650; Secundo (${c.secondedBy.length})
                </button>
                ${
                  c.authorId !== currentUser.id
                    ? `<button type="button" class="chip-action-btn" data-private-reply="${c.authorId}" data-ref-project="${proj.id}" data-ref-label="Comentari a: ${escapeHtml(proj.title)}">
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

    // Bind Seconding / Likes
    listEl.querySelectorAll("[data-second-comment]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const com = state.comments.find((item) => item.id === btn.dataset.secondComment);
        if (!com) return;
        if (com.authorId === currentUser.id) {
          showToast("No pots secundar el teu propi comentari.");
          return;
        }
        const idx = com.secondedBy.indexOf(currentUser.id);
        if (idx === -1) {
          com.secondedBy.push(currentUser.id);
          const author = getStudentById(com.authorId);
          author.secondedCount += 1;
          awardPoints(com.authorId, `second-${com.id}-${currentUser.id}`, 2, `Comentari secundat per ${currentUser.name}`);
          pushNotification(com.authorId, `${currentUser.name} ha secundat el teu comentari a "${proj.title}"`, "project", proj.id);
        } else {
          com.secondedBy.splice(idx, 1);
        }
        saveState();
        renderCommentsList(proj, sortBy);
      });
    });

    // Bind Owner 1-5 Star Usefulness Rating
    listEl.querySelectorAll("[data-rate-comment]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const com = state.comments.find((item) => item.id === btn.dataset.rateComment);
        const stars = Number(btn.dataset.star);
        if (!com || !isProjectOwner) return;

        com.usefulnessRating = stars;
        if (stars >= 4) {
          const author = getStudentById(com.authorId);
          author.usefulCommentsCount += 1;
          awardPoints(com.authorId, `useful-${com.id}`, 5, `Comentari valorat amb ${stars}★ per ${currentUser.name}`);
          pushNotification(com.authorId, `${currentUser.name} ha valorat el teu feedback amb ${stars} estrelles`, "project", proj.id);
        }
        saveState();
        renderCommentsList(proj, sortBy);
      });
    });

    // Bind Private Reply -> Opens/Creates Single 1-on-1 Conversation with Reference
    listEl.querySelectorAll("[data-private-reply]").forEach((btn) => {
      btn.addEventListener("click", () => {
        startOrOpenConversation(btn.dataset.privateReply, {
          type: "project",
          id: btn.dataset.refProject,
          label: btn.dataset.refLabel
        });
      });
    });
  }

  // ========================================================================
  // 7. OPEN POSITIONS & COLLABORATOR RECRUITMENT
  // ========================================================================
  function renderPositionsView() {
    const grid = document.getElementById("positions-list-grid");
    const currentUser = getCurrentUser();

    const filtered = state.positions.filter((pos) => {
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
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p class="empty-title">No hi ha posicions obertes amb aquests filtres</p></div>`;
      return;
    }

    grid.innerHTML = filtered
      .map((pos) => {
        const owner = getStudentById(pos.ownerId);
        const isOwner = pos.ownerId === currentUser.id;
        const myApp = pos.applications.find((a) => a.applicantId === currentUser.id);

        return `
          <article class="position-card">
            <div>
              <div class="position-card-header">
                <span class="pill-tag">${escapeHtml(pos.role)}</span>
                <span class="pill-tag ${pos.status === "Open" ? "success" : ""}">${pos.status === "Open" ? `${pos.spots} plaça/es` : "Tancada"}</span>
              </div>
              <h3>${escapeHtml(pos.title)}</h3>
              <div style="font-size:13px;color:var(--text-secondary);font-weight:500;">Projecte: ${escapeHtml(pos.projectTitle)}</div>
              <div class="position-meta-pills">
                <span class="pill-tag">${escapeHtml(pos.compensation)}</span>
                <span class="pill-tag">${escapeHtml(pos.location)}</span>
                <span class="pill-tag">${escapeHtml(pos.projectType)} · ${escapeHtml(pos.year)}</span>
                <span class="pill-tag">${escapeHtml(pos.startDate)} &rarr; ${escapeHtml(pos.endDate)}</span>
              </div>
              <p style="font-size:13.5px;color:var(--text-secondary);margin:8px 0 0;">${escapeHtml(pos.description)}</p>
            </div>

            <div>
              <div class="position-card-footer">
                <div style="display:flex;align-items:center;gap:8px;cursor:pointer;" data-open-profile="${owner.id}">
                  <img src="${escapeHtml(owner.avatar)}" alt="${escapeHtml(owner.name)}" class="nav-avatar" />
                  <div>
                    <strong style="font-size:13px;display:block;">${escapeHtml(owner.name)}</strong>
                    <span style="font-size:11.5px;color:var(--text-muted);">${escapeHtml(pos.createdAt)}</span>
                  </div>
                </div>
                <div>
                  ${
                    isOwner
                      ? `<span class="pill-tag">${pos.applications.length} candidatures</span>`
                      : myApp
                      ? `<span class="pill-tag success">Candidatura: ${escapeHtml(myApp.status)}</span>`
                      : `<button type="button" class="btn-primary" data-apply-pos="${pos.id}">Presentar-me</button>`
                  }
                </div>
              </div>

              ${
                isOwner && pos.applications.length > 0
                  ? `<div class="applicant-drawer">
                      <strong style="font-size:12px;">Candidatures rebudes:</strong>
                      ${pos.applications
                        .map((app) => {
                          const candidate = getStudentById(app.applicantId);
                          return `
                            <div class="applicant-item">
                              <div>
                                <strong>${escapeHtml(candidate.name)}</strong> (${escapeHtml(candidate.year)})
                                <div style="font-size:12px;color:var(--text-secondary);">${escapeHtml(app.intro)}</div>
                                <div style="font-size:11.5px;color:var(--text-muted);">Habilitats: ${escapeHtml(app.skills || "No especificat")}</div>
                              </div>
                              <div style="display:flex;gap:6px;align-items:center;">
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

    // Bind Apply buttons
    grid.querySelectorAll("[data-apply-pos]").forEach((btn) => {
      btn.addEventListener("click", () => openApplyModal(btn.dataset.applyPos));
    });

    // Bind Accept / Reject applications
    grid.querySelectorAll("[data-app-decision]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pos = state.positions.find((p) => p.id === btn.dataset.posId);
        const app = pos?.applications.find((a) => a.id === btn.dataset.appId);
        if (!app) return;
        app.status = btn.dataset.appDecision;
        pushNotification(
          app.applicantId,
          `La teva candidatura a "${pos.title}" ha estat marcada com: ${app.status}`,
          "positions",
          pos.id
        );
        saveState();
        renderPositionsView();
        showToast(`Candidatura actualitzada: ${app.status}`);
      });
    });

    // Bind Private chat buttons
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
    document.getElementById("apply-pos-summary").textContent = `${pos.title} — ${pos.projectTitle}`;
    document.getElementById("apply-portfolio-project").innerHTML =
      `<option value="">Cap projecte seleccionat</option>` +
      myProjects.map((p) => `<option value="${p.id}">${escapeHtml(p.title)}</option>`).join("");

    openModal("modal-apply-position");
  }

  // ========================================================================
  // 8. UNIFIED PRIVATE MESSAGING SYSTEM (Single 1-to-1 Thread per Pair)
  // ========================================================================
  let pendingMessageReference = null;

  function startOrOpenConversation(otherStudentId, contextRef = null) {
    const currentUser = getCurrentUser();
    if (otherStudentId === currentUser.id) return;

    // Look for existing 1-to-1 conversation between the exact two students
    let conv = state.conversations.find(
      (c) => c.participantIds.includes(currentUser.id) && c.participantIds.includes(otherStudentId)
    );

    if (!conv) {
      conv = {
        id: "conv-" + Date.now(),
        participantIds: [currentUser.id, otherStudentId],
        messages: []
      };
      state.conversations.unshift(conv);
      saveState();
    }

    pendingMessageReference = contextRef;
    ui.activeConversationId = conv.id;
    navigateTo("messages", conv.id);

    const shell = document.getElementById("chat-shell");
    if (shell) shell.classList.add("mobile-thread-open");
  }

  function renderMessagesView() {
    const currentUser = getCurrentUser();
    const listContainer = document.getElementById("conversation-list");
    const mainPane = document.getElementById("chat-main-pane");
    const filterQ = (document.getElementById("chat-search-input")?.value || "").toLowerCase();

    const myConvs = state.conversations.filter((c) => c.participantIds.includes(currentUser.id));

    listContainer.innerHTML = myConvs
      .map((conv) => {
        const otherId = conv.participantIds.find((id) => id !== currentUser.id);
        const other = getStudentById(otherId);
        if (filterQ && !other.name.toLowerCase().includes(filterQ)) return "";

        const lastMsg = conv.messages[conv.messages.length - 1];
        return `
          <div class="conv-item ${conv.id === ui.activeConversationId ? "active" : ""}" data-select-conv="${conv.id}">
            <img src="${escapeHtml(other.avatar)}" alt="${escapeHtml(other.name)}" />
            <div class="conv-info">
              <strong>${escapeHtml(other.name)}</strong>
              <p>${lastMsg ? escapeHtml(lastMsg.text) : "Inicia la conversa..."}</p>
            </div>
          </div>
        `;
      })
      .join("");

    listContainer.querySelectorAll("[data-select-conv]").forEach((item) => {
      item.addEventListener("click", () => {
        ui.activeConversationId = item.dataset.selectConv;
        document.getElementById("chat-shell").classList.add("mobile-thread-open");
        renderMessagesView();
      });
    });

    const activeConv = myConvs.find((c) => c.id === ui.activeConversationId) || myConvs[0];
    if (!activeConv) {
      mainPane.innerHTML = `<div class="chat-empty-placeholder"><p>Encara no tens converses actives.</p></div>`;
      return;
    }

    const otherId = activeConv.participantIds.find((id) => id !== currentUser.id);
    const other = getStudentById(otherId);

    mainPane.innerHTML = `
      <div class="chat-header">
        <div style="display:flex;align-items:center;gap:10px;">
          <button type="button" class="chip-action-btn mobile-chat-back" id="mobile-chat-back-btn">&larr;</button>
          <img src="${escapeHtml(other.avatar)}" alt="${escapeHtml(other.name)}" class="nav-avatar" />
          <div>
            <strong style="display:block;font-size:14px;">${escapeHtml(other.name)}</strong>
            <span style="font-size:11.5px;color:var(--text-secondary);">${escapeHtml(other.year)} · ${escapeHtml(other.email)}</span>
          </div>
        </div>
        <button type="button" class="chip-action-btn" data-open-profile="${other.id}">Veure portafoli</button>
      </div>

      <div class="chat-messages-scroll" id="chat-messages-scroll">
        ${activeConv.messages
          .map((m) => {
            const isOut = m.senderId === currentUser.id;
            return `
              <div class="msg-bubble ${isOut ? "outgoing" : "incoming"}">
                ${m.ref ? `<div class="msg-context-ref" ${m.ref.id ? `data-open-project="${m.ref.id}"` : ""}>&#128206; ${escapeHtml(m.ref.label)}</div>` : ""}
                <div>${escapeHtml(m.text)}</div>
                <span class="msg-time">${escapeHtml(m.timestamp)}</span>
              </div>
            `;
          })
          .join("")}
      </div>

      ${
        pendingMessageReference
          ? `<div style="padding:8px 16px;background:var(--bg-subtle);font-size:12px;display:flex;justify-content:space-between;align-items:center;">
              <span>Referència adjunta: <strong>${escapeHtml(pendingMessageReference.label)}</strong></span>
              <button type="button" class="text-link-btn" id="clear-msg-ref">Treure</button>
            </div>`
          : ""
      }

      <form class="chat-input-bar" id="send-chat-form">
        <input type="text" id="chat-message-input" placeholder="Escriu un missatge a ${escapeHtml(other.name)}..." required autocomplete="off" />
        <button type="submit" class="btn-primary">Enviar</button>
      </form>
    `;

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
    if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;

    document.getElementById("send-chat-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("chat-message-input");
      const text = input.value.trim();
      if (!text) return;

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      activeConv.messages.push({
        id: "m-" + Date.now(),
        senderId: currentUser.id,
        text,
        ref: pendingMessageReference,
        timestamp: timeStr
      });

      pendingMessageReference = null;
      pushNotification(other.id, `Nou missatge privat de ${currentUser.name}`, "messages", activeConv.id);
      saveState();
      renderMessagesView();
    });
  }

  // ========================================================================
  // 9. STUDENT PROFILES & REPUTATION LEADERBOARD
  // ========================================================================
  function renderProfileView() {
    const container = document.getElementById("view-profile");
    const student = getStudentById(ui.activeProfileId || state.currentUserId);
    const tier = getAchievementTier(student.points);
    const studentProjects = state.projects.filter((p) => p.ownerId === student.id);

    const nextProgress = tier.next
      ? Math.min(100, Math.round(((student.points - tier.min) / (tier.next - tier.min)) * 100))
      : 100;

    // Rank calculation
    const sortedStudents = [...state.students].sort((a, b) => b.points - a.points);
    const rank = sortedStudents.findIndex((s) => s.id === student.id) + 1;

    container.innerHTML = `
      <div class="page-container">
        <div class="profile-hero">
          <div class="profile-avatar-editor">
            <img src="${escapeHtml(student.avatar)}" alt="${escapeHtml(student.name)}" class="profile-hero-avatar" id="profile-avatar-preview" />
            ${student.id === state.currentUserId ? `
              <label class="profile-avatar-upload" for="profile-avatar-upload" title="Canviar fotografia">
                <input type="file" id="profile-avatar-upload" accept="image/*" />
                <span>Canviar</span>
              </label>
            ` : ""}
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <h1 class="page-title">${escapeHtml(student.name)}</h1>
              <span class="pill-tag">Nivell ${tier.level}: ${tier.name}</span>
              <button type="button" class="pill-tag profile-ranking-link" data-route="leaderboard" style="border:0;cursor:pointer;">Rànquing #${rank}</button>
            </div>
            <p style="margin:4px 0 8px;color:var(--text-secondary);">${escapeHtml(student.year)} · ${escapeHtml(student.email)}</p>
            <p style="margin:0 0 10px;font-size:13.5px;">${escapeHtml(student.bio || "")}</p>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${(student.interests || []).map((tag) => `<span class="pill-tag">${escapeHtml(tag)}</span>`).join("")}
            </div>
          </div>
          <div>
            <strong style="font-size:24px;display:block;">${student.points} pts</strong>
            <span style="font-size:12px;color:var(--text-secondary);">
              ${tier.next ? `Falten ${tier.next - student.points} pts per al següent nivell` : "Nivell màxim assolit"}
            </span>
            <div class="reputation-progress-bar">
              <div class="reputation-progress-fill" style="width:${nextProgress}%;"></div>
            </div>
          </div>
        </div>

        <div class="stats-strip">
          <div class="stat-box"><strong>${studentProjects.length}</strong><span>Projectes publicats</span></div>
          <div class="stat-box"><strong>${student.commentsCount}</strong><span>Feedbacks aportats</span></div>
          <div class="stat-box"><strong>${student.usefulCommentsCount}</strong><span>Comentaris molt útils (4-5★)</span></div>
          <div class="stat-box"><strong>${student.secondedCount}</strong><span>Vegades secundat</span></div>
        </div>

        <h2 style="font-size:18px;margin-bottom:16px;">Portafoli acadèmic (${studentProjects.length})</h2>
        <div class="masonry-container" style="padding:0;">
          ${studentProjects
            .map(
              (proj) => `
              <article class="masonry-card ${proj.aspect || "span-portrait"}" data-open-project="${proj.id}">
                <img src="${escapeHtml(proj.cover)}" alt="${escapeHtml(proj.title)}" loading="lazy" />
                <div class="card-overlay">
                  <div class="overlay-top">
                    <span class="overlay-badge">${escapeHtml(proj.year)}</span>
                    <span class="overlay-badge">${escapeHtml(proj.status)}</span>
                  </div>
                  <div class="overlay-bottom">
                    <h3>${escapeHtml(proj.title)}</h3>
                    <div class="overlay-meta"><span>${escapeHtml(proj.subject)}</span></div>
                  </div>
                </div>
              </article>
            `
            )
            .join("")}
        </div>
      </div>
    `;

    const rankingLink = container.querySelector(".profile-ranking-link");
    if (rankingLink) {
      rankingLink.addEventListener("click", () => navigateTo("leaderboard"));
    }

    const avatarUpload = container.querySelector("#profile-avatar-upload");
    if (avatarUpload) {
      avatarUpload.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          student.avatar = reader.result;
          saveState();
          const preview = container.querySelector("#profile-avatar-preview");
          if (preview) preview.src = reader.result;
          updateHeaderChrome();
          showToast("Fotografia de perfil actualitzada.");
        };
        reader.readAsDataURL(file);
      });
    }
  }

  function renderLeaderboardView() {
    const container = document.getElementById("leaderboard-content");
    const sorted = [...state.students].sort((a, b) => b.points - a.points);
    const currentUser = getCurrentUser();
    const myLedger = state.pointsLedger.filter((item) => item.userId === currentUser.id).slice(0, 6);

    container.innerHTML = `
      <div class="leaderboard-table-wrap">
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Posició</th>
              <th>Estudiant</th>
              <th>Curs</th>
              <th>Nivell d'assoliment</th>
              <th>Projectes</th>
              <th>Feedbacks</th>
              <th>Punts</th>
            </tr>
          </thead>
          <tbody>
            ${sorted
              .map((stu, index) => {
                const tier = getAchievementTier(stu.points);
                return `
                  <tr style="cursor:pointer;" data-open-profile="${stu.id}">
                    <td><strong>#${index + 1}</strong></td>
                    <td style="display:flex;align-items:center;gap:10px;">
                      <img src="${escapeHtml(stu.avatar)}" alt="${escapeHtml(stu.name)}" class="nav-avatar" />
                      <strong>${escapeHtml(stu.name)}</strong>
                    </td>
                    <td>${escapeHtml(stu.year)}</td>
                    <td><span class="pill-tag">Nivell ${tier.level} · ${tier.name}</span></td>
                    <td>${state.projects.filter((p) => p.ownerId === stu.id).length}</td>
                    <td>${stu.commentsCount}</td>
                    <td><strong>${stu.points} pts</strong></td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>

      <h3 style="margin:28px 0 12px;font-size:16px;">Historial recent de punts (${escapeHtml(currentUser.name)})</h3>
      <div class="leaderboard-table-wrap">
        ${
          myLedger.length
            ? myLedger
                .map(
                  (entry) => `
                  <div style="display:flex;justify-content:space-between;padding:8px 6px;border-bottom:1px solid var(--border-light);">
                    <span>${escapeHtml(entry.label || entry.action)}</span>
                    <strong>+${entry.points} pts</strong>
                  </div>
                `
                )
                .join("")
            : `<p style="color:var(--text-muted);margin:0;">Encara no hi ha moviments registrats.</p>`
        }
      </div>
    `;
  }

  // ========================================================================
  // 10. NOTIFICATIONS, MODALS & FORM SUBMISSIONS
  // ========================================================================
  function pushNotification(userId, text, targetRoute, targetId) {
    state.notifications.unshift({
      id: "notif-" + Date.now() + Math.random().toString(36).slice(2, 5),
      userId,
      text,
      time: "Ara mateix",
      read: false,
      targetRoute,
      targetId
    });
    updateHeaderChrome();
  }

  function updateHeaderChrome() {
    const currentUser = getCurrentUser();
    const avatarEl = document.getElementById("nav-user-avatar");
    if (avatarEl) avatarEl.src = currentUser.avatar;

    const tier = getAchievementTier(currentUser.points);
    const infoEl = document.getElementById("popover-user-info");
    if (infoEl) {
      infoEl.innerHTML = `
        <strong>${escapeHtml(currentUser.name)}</strong>
        <span>${escapeHtml(currentUser.year)} · ${currentUser.points} pts (${tier.name})</span>
      `;
    }

    const userNotifs = state.notifications.filter((n) => n.userId === currentUser.id);
    const unreadCount = userNotifs.filter((n) => !n.read).length;
    const badgeEl = document.getElementById("notif-unread-count");
    if (badgeEl) {
      badgeEl.textContent = unreadCount;
      badgeEl.classList.toggle("hidden", unreadCount === 0);
    }

    const notifListEl = document.getElementById("notif-list-container");
    if (notifListEl) {
      notifListEl.innerHTML = userNotifs.length
        ? userNotifs
            .slice(0, 10)
            .map(
              (n) => `
              <div class="notif-item ${n.read ? "" : "unread"}" data-notif-id="${n.id}">
                <div>${escapeHtml(n.text)}</div>
                <span class="notif-time">${escapeHtml(n.time)}</span>
              </div>
            `
            )
            .join("")
        : `<div style="padding:12px;color:var(--text-muted);font-size:12.5px;">Sense notificacions noves.</div>`;

      notifListEl.querySelectorAll("[data-notif-id]").forEach((el) => {
        el.addEventListener("click", () => {
          const notif = state.notifications.find((item) => item.id === el.dataset.notifId);
          if (notif) {
            notif.read = true;
            saveState();
            updateHeaderChrome();
            if (notif.targetRoute) navigateTo(notif.targetRoute, notif.targetId);
          }
        });
      });
    }
  }

  function openEditProjectModal(proj) {
    document.getElementById("modal-project-title").textContent = "Editar projecte";
    document.getElementById("proj-edit-id").value = proj.id;
    document.getElementById("proj-title").value = proj.title;
    document.getElementById("proj-category").value = proj.category;
    document.getElementById("proj-description").value = proj.description;
    document.getElementById("proj-briefing").value = proj.briefing;
    document.getElementById("proj-cover").value = proj.cover;
    document.getElementById("proj-subject").value = proj.subject;
    document.getElementById("proj-professor").value = proj.professor;
    document.getElementById("proj-year").value = proj.year;
    document.getElementById("proj-deadline").value = proj.deadline;
    document.getElementById("proj-stage").value = proj.stage;
    document.getElementById("proj-team-type").value = proj.teamType;
    document.getElementById("proj-participants").value = (proj.participants || []).join(", ");
    document.getElementById("proj-media-url").value = proj.mediaUrl || "";
    document.getElementById("proj-feedback-type").value = proj.feedbackType;
    document.getElementById("proj-questions").value = proj.questions || "";
    openModal("modal-publish-project");
  }

  // Modal & Popover Utilities
  function openModal(id) {
    closeAllPopovers();
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  }

  function closeAllPopovers() {
    document.querySelectorAll(".popover-menu").forEach((m) => m.classList.add("hidden"));
  }

  function showToast(message) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3400);
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ========================================================================
  // 11. EVENT LISTENERS BOOTSTRAP
  // ========================================================================
  function bindGlobalEvents() {
    // Top Navigation Route Buttons
    document.querySelectorAll("[data-route]").forEach((btn) => {
      btn.addEventListener("click", () => navigateTo(btn.dataset.route));
    });

    // Global Search Bar
    const searchInput = document.getElementById("global-search-input");
    const searchClear = document.getElementById("search-clear-btn");

    searchInput.addEventListener("input", (e) => {
      ui.searchQuery = e.target.value;
      if (searchClear) searchClear.classList.toggle("hidden", !ui.searchQuery);
      if (ui.route === "discover") renderDiscoverView();
      if (ui.route === "positions") renderPositionsView();
    });

    if (searchClear) {
      searchClear.addEventListener("click", () => {
        searchInput.value = "";
        ui.searchQuery = "";
        searchClear.classList.add("hidden");
        if (ui.route === "discover") renderDiscoverView();
        if (ui.route === "positions") renderPositionsView();
      });
    }

    // Dropdown Toggles (+ Create, Notifications, Profile)
    const toggleDropdown = (triggerId, menuId) => {
      const trigger = document.getElementById(triggerId);
      const menu = document.getElementById(menuId);
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        const wasHidden = menu.classList.contains("hidden");
        closeAllPopovers();
        if (wasHidden) menu.classList.remove("hidden");
      });
    };

    toggleDropdown("create-menu-trigger", "create-dropdown");
    toggleDropdown("notif-menu-trigger", "notif-dropdown");
    toggleDropdown("profile-menu-trigger", "profile-dropdown");
    toggleDropdown("platform-menu-trigger", "platform-dropdown");

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".dropdown-anchor")) closeAllPopovers();
    });

    // Mark notifications as read
    document.getElementById("mark-all-read-btn").addEventListener("click", () => {
      const currentUser = getCurrentUser();
      state.notifications.forEach((n) => {
        if (n.userId === currentUser.id) n.read = true;
      });
      saveState();
      updateHeaderChrome();
    });

    // Action triggers (Modals)
    document.querySelectorAll("[data-action='open-publish-project']").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById("modal-project-title").textContent = "Publicar nou projecte";
        document.getElementById("publish-project-form").reset();
        document.getElementById("proj-edit-id").value = "";
        document.getElementById("proj-deadline").value = daysFromNow(10);
        openModal("modal-publish-project");
      });
    });

    document.querySelectorAll("[data-action='open-publish-position']").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById("publish-position-form").reset();
        document.getElementById("pos-start").value = daysFromNow(3);
        document.getElementById("pos-end").value = daysFromNow(20);
        openModal("modal-publish-position");
      });
    });

    document.querySelectorAll("[data-action='open-settings']").forEach((btn) => {
      btn.addEventListener("click", () => {
        closeAllPopovers();
        showToast("Configuració disponible des del teu perfil.");
      });
    });

    document.querySelectorAll("[data-action='open-about']").forEach((btn) => {
      btn.addEventListener("click", () => {
        closeAllPopovers();
        showToast("ERAM Creative Network — Escola ERAM.");
      });
    });

    document.querySelectorAll("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
    });

    const projectAspect = document.getElementById("proj-aspect");
    if (projectAspect) {
      projectAspect.addEventListener("change", () => {
        document.getElementById("proj-custom-size").classList.toggle("hidden", projectAspect.value !== "custom");
      });
    }

    // Category Filter Buttons ("General" + Pills)
    document.querySelectorAll("[data-category]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const isActiveCategory = ui.selectedCategory === btn.dataset.category;
        if (btn.dataset.category === "General" && ui.filters.urgentOnly) {
          ui.filters.urgentOnly = false;
          const urgentFilter = document.getElementById("filter-urgent-only");
          if (urgentFilter) urgentFilter.checked = false;
        } else if (isActiveCategory && btn.dataset.category !== "General") {
          ui.selectedCategory = "General";
        } else {
          ui.selectedCategory = btn.dataset.category;
          if (ui.filters.urgentOnly) {
            ui.filters.urgentOnly = false;
            const urgentFilter = document.getElementById("filter-urgent-only");
            if (urgentFilter) urgentFilter.checked = false;
          }
        }
        document.querySelectorAll("[data-category]").forEach((b) => {
          const isMatch = b.dataset.category === ui.selectedCategory;
          b.classList.toggle("active", isMatch);
          b.setAttribute("aria-selected", String(isMatch));
        });
        renderDiscoverView();
      });
    });

    // Advanced Filters Toggle & Controls
    document.getElementById("toggle-advanced-filters").addEventListener("click", () => {
      document.getElementById("advanced-filters-panel").classList.toggle("hidden");
    });

    document.getElementById("sort-projects-select").addEventListener("change", (e) => {
      ui.sortBy = e.target.value;
      renderDiscoverView();
    });

    const filterBindings = [
      ["filter-subject", "subject"],
      ["filter-professor", "professor"],
      ["filter-year", "year"],
      ["filter-stage", "stage"],
      ["filter-team", "teamType"],
      ["filter-status", "status"]
    ];

    filterBindings.forEach(([elId, key]) => {
      document.getElementById(elId).addEventListener("change", (e) => {
        ui.filters[key] = e.target.value;
        renderDiscoverView();
      });
    });

    document.getElementById("filter-urgent-only").addEventListener("change", (e) => {
      ui.filters.urgentOnly = e.target.checked;
      if (e.target.checked) {
        ui.selectedCategory = "General";
        document.querySelectorAll("[data-category]").forEach((b) => {
          const isGeneral = b.dataset.category === "General";
          b.classList.toggle("active", isGeneral);
          b.setAttribute("aria-selected", String(isGeneral));
        });
      }
      renderDiscoverView();
    });

    const resetFilters = () => {
      ui.selectedCategory = "General";
      ui.searchQuery = "";
      document.getElementById("global-search-input").value = "";
      ui.filters = { subject: "", professor: "", year: "", stage: "", teamType: "", status: "active", urgentOnly: false };
      filterBindings.forEach(([elId, key]) => (document.getElementById(elId).value = ui.filters[key]));
      document.getElementById("filter-urgent-only").checked = false;
      document.getElementById("advanced-filters-panel").classList.add("hidden");
      document.querySelectorAll("[data-category]").forEach((b) => {
        const isGeneral = b.dataset.category === "General";
        b.classList.toggle("active", isGeneral);
        b.setAttribute("aria-selected", String(isGeneral));
      });
      renderDiscoverView();
    };

    document.getElementById("clear-all-filters-btn").addEventListener("click", resetFilters);
    document.getElementById("empty-reset-btn").addEventListener("click", resetFilters);

    document.getElementById("load-more-projects-btn").addEventListener("click", () => {
      ui.visibleCount += 8;
      renderDiscoverView();
    });

    // Delegated clicks for Project Cards & Student Profiles
    document.addEventListener("click", (e) => {
      const projTrigger = e.target.closest("[data-open-project]");
      if (projTrigger) {
        navigateTo("project", projTrigger.dataset.openProject);
        return;
      }
      const profTrigger = e.target.closest("[data-open-profile]");
      if (profTrigger) {
        navigateTo("profile", profTrigger.dataset.openProfile);
      }
    });

    // Publish / Edit Project Form Submission
    document.getElementById("publish-project-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const errBox = document.getElementById("proj-form-error");
      const title = document.getElementById("proj-title").value.trim();
      const description = document.getElementById("proj-description").value.trim();
      const briefing = document.getElementById("proj-briefing").value.trim();
      const subject = document.getElementById("proj-subject").value.trim();
      const professor = document.getElementById("proj-professor").value.trim();
      const deadline = document.getElementById("proj-deadline").value;
      const feedbackType = document.getElementById("proj-feedback-type").value.trim();

      if (!title || !description || !briefing || !subject || !professor || !deadline || !feedbackType) {
        errBox.textContent = "Completa tots els camps obligatoris marcats amb *.";
        errBox.classList.remove("hidden");
        return;
      }
      errBox.classList.add("hidden");

      const currentUser = getCurrentUser();
      const editId = document.getElementById("proj-edit-id").value;
      const aspectMap = {
        portrait: "span-portrait",
        tall: "span-tall",
        square: "span-square",
        landscape: "span-landscape",
        wide: "span-wide"
      };

      const defaultCovers = {
        Audiovisuals: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=900&q=80",
        "Disseny gràfic": "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?auto=format&fit=crop&w=900&q=80",
        Fotografia: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=900&q=80",
        "UI/UX": "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=900&q=80",
        "3D": "https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=900&q=80"
      };

      let aspect = aspectMap[document.getElementById("proj-aspect").value] || "span-portrait";
      if (document.getElementById("proj-aspect").value === "custom") {
        const width = document.getElementById("proj-custom-width").value;
        const height = document.getElementById("proj-custom-height").value;
        aspect = `span-custom span-custom-w${width} span-custom-h${height}`;
      }

      const category = document.getElementById("proj-category").value;
      const coverInput = document.getElementById("proj-cover").value.trim();
      const participantsRaw = document.getElementById("proj-participants").value.trim();
      const participants = participantsRaw
        ? participantsRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : [currentUser.name];

      if (editId) {
        const existing = state.projects.find((p) => p.id === editId);
        if (existing) {
          const stageChanged = existing.stage !== document.getElementById("proj-stage").value;
          Object.assign(existing, {
            title,
            category,
            aspect,
            description,
            briefing,
            cover: coverInput || existing.cover,
            subject,
            professor,
            year: document.getElementById("proj-year").value,
            deadline,
            stage: document.getElementById("proj-stage").value,
            teamType: document.getElementById("proj-team-type").value,
            participants,
            mediaUrl: document.getElementById("proj-media-url").value.trim(),
            feedbackType,
            questions: document.getElementById("proj-questions").value.trim()
          });
          if (stageChanged) {
            awardPoints(currentUser.id, `stage-${existing.id}-${existing.stage}`, 2, "Actualització de fase del projecte");
          }
        }
        saveState();
        closeModal("modal-publish-project");
        renderProjectDetailView();
        showToast("Projecte actualitzat correctament.");
        return;
      }

      const newProject = {
        id: "proj-" + Date.now(),
        title,
        category,
        aspect,
        cover: coverInput || defaultCovers[category],
        description,
        briefing,
        subject,
        professor,
        year: document.getElementById("proj-year").value,
        deadline,
        createdAt: new Date().toISOString().split("T")[0],
        stage: document.getElementById("proj-stage").value,
        teamType: document.getElementById("proj-team-type").value,
        participants,
        ownerId: currentUser.id,
        status: "In progress",
        mediaUrl: document.getElementById("proj-media-url").value.trim(),
        feedbackType,
        questions: document.getElementById("proj-questions").value.trim()
      };

      state.projects.unshift(newProject);
      currentUser.projectsCount += 1;
      awardPoints(currentUser.id, `publish-${newProject.id}`, 10, `Nou projecte publicat: ${title}`);
      if (newProject.questions && newProject.mediaUrl) {
        awardPoints(currentUser.id, `complete-${newProject.id}`, 5, "Briefing i material multimèdia complets");
      }

      saveState();
      populateDynamicFilterOptions();
      closeModal("modal-publish-project");
      navigateTo("project", newProject.id);
    });

    // Publish Open Position Form
    document.getElementById("publish-position-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const currentUser = getCurrentUser();
      const newPos = {
        id: "pos-" + Date.now(),
        title: document.getElementById("pos-title").value.trim(),
        projectTitle: document.getElementById("pos-project-name").value.trim(),
        role: document.getElementById("pos-role").value,
        spots: Number(document.getElementById("pos-spots").value) || 1,
        compensation: document.getElementById("pos-compensation").value,
        startDate: document.getElementById("pos-start").value,
        endDate: document.getElementById("pos-end").value,
        duration: "Segons calendari de producció",
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

      state.positions.unshift(newPos);
      saveState();
      closeModal("modal-publish-position");
      navigateTo("positions");
      showToast("Posició oberta publicada!");
    });

    // Apply to Position Form
    document.getElementById("apply-position-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const posId = document.getElementById("apply-pos-id").value;
      const pos = state.positions.find((p) => p.id === posId);
      const currentUser = getCurrentUser();
      if (!pos) return;

      pos.applications.push({
        id: "app-" + Date.now(),
        applicantId: currentUser.id,
        intro: document.getElementById("apply-intro").value.trim(),
        skills: document.getElementById("apply-skills").value.trim(),
        portfolioProjectId: document.getElementById("apply-portfolio-project").value,
        status: "Pending"
      });

      pushNotification(
        pos.ownerId,
        `${currentUser.name} s'ha postulat a "${pos.title}"`,
        "positions",
        pos.id
      );

      saveState();
      closeModal("modal-apply-position");
      renderPositionsView();
      showToast("Candidatura enviada correctament!");
    });

    // Position Filters
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

    // Chat Search Filter
    document.getElementById("chat-search-input").addEventListener("input", () => renderMessagesView());

  }

  function getInitials(name) {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  function makeInitialAvatar(name, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 82px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(getInitials(name), 120, 126);
    return canvas.toDataURL("image/png");
  }

  function showAuthPage() {
    document.body.classList.remove("authenticated");
    document.getElementById("auth-page").classList.remove("hidden");
    document.getElementById("auth-start-view").classList.remove("hidden");
    document.getElementById("auth-login-view").classList.add("hidden");
    document.getElementById("auth-register-view").classList.add("hidden");
  }

  function enterAuthenticatedSession(userId) {
    state.currentUserId = userId;
    saveState();
    localStorage.setItem(SESSION_KEY, userId);
    document.body.classList.add("authenticated");
    document.getElementById("auth-page").classList.add("hidden");
    updateHeaderChrome();
    navigateTo("discover");
  }

  function renderAuthExistingProfiles() {
    const container = document.getElementById("auth-existing-list");
    if (!container) return;
    container.innerHTML = state.students
      .map((student) => {
        const isGenerated = student.avatar && student.avatar.startsWith("data:image");
        const avatarHtml = isGenerated
          ? `<span class="auth-existing-avatar" style="background:${escapeHtml(student.avatarColor || "#8f7cf6")}">${escapeHtml(getInitials(student.name))}</span>`
          : `<img src="${escapeHtml(student.avatar)}" alt="" />`;
        return `
          <button type="button" class="auth-existing-card" data-auth-user="${student.id}">
            ${avatarHtml}
            <span>
              <strong>${escapeHtml(student.name)}</strong>
              <span>${escapeHtml(student.email)}</span>
            </span>
          </button>
        `;
      })
      .join("");

    container.querySelectorAll("[data-auth-user]").forEach((button) => {
      button.addEventListener("click", () => enterAuthenticatedSession(button.dataset.authUser));
    });
  }

  function bindAuthPageEvents() {
    document.getElementById("auth-login-option").addEventListener("click", () => {
      document.getElementById("auth-start-view").classList.add("hidden");
      document.getElementById("auth-login-view").classList.remove("hidden");
    });

    document.getElementById("auth-create-option").addEventListener("click", () => {
      document.getElementById("auth-start-view").classList.add("hidden");
      document.getElementById("auth-register-view").classList.remove("hidden");
    });

    document.querySelectorAll("[data-auth-back]").forEach((button) => {
      button.addEventListener("click", showAuthPage);
    });

    document.getElementById("auth-login-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const email = document.getElementById("auth-login-email").value.trim().toLowerCase();
      const password = document.getElementById("auth-login-password").value;
      const error = document.getElementById("auth-login-error");
      if (!email.endsWith("@campus.eram.cat") || !password) {
        error.textContent = "Introdueix un correu @campus.eram.cat i la contrasenya.";
        error.classList.remove("hidden");
        return;
      }
      const existingUser = state.students.find((student) => student.email.toLowerCase() === email);
      if (existingUser) {
        enterAuthenticatedSession(existingUser.id);
        return;
      }
      error.textContent = "No existeix cap compte amb aquest correu.";
      error.classList.remove("hidden");
    });

    const firstName = document.getElementById("auth-first-name");
    const lastName = document.getElementById("auth-last-name");
    const colorInput = document.getElementById("auth-avatar-color");
    const initials = document.getElementById("auth-avatar-initials");
    const previewImage = document.getElementById("auth-avatar-image");
    let uploadedAvatar = "";

    const refreshPreview = () => {
      const name = `${firstName.value.trim()} ${lastName.value.trim()}`.trim();
      initials.textContent = name ? getInitials(name) : "IE";
      document.getElementById("auth-avatar-preview").style.background = colorInput.value;
      document.getElementById("auth-avatar-color-value").textContent = colorInput.value.toUpper();
    };

    firstName.addEventListener("input", refreshPreview);
    lastName.addEventListener("input", refreshPreview);
    colorInput.addEventListener("input", refreshPreview);

    document.getElementById("auth-avatar-upload").addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        uploadedAvatar = reader.result;
        previewImage.src = uploadedAvatar;
        previewImage.hidden = false;
        initials.hidden = true;
      };
      reader.readAsDataURL(file);
    });

    document.querySelectorAll("input[name='auth-role']").forEach((radio) => {
      radio.addEventListener("change", () => {
        const alumni = radio.value === "alumni" && radio.checked;
        document.getElementById("auth-year-label").textContent = alumni ? "Any de finalització *" : "Curs actual *";
        document.getElementById("auth-subjects-label").textContent = alumni ? "Assignatures cursades" : "Assignatures matriculades";
        if (alumni) {
          document.getElementById("auth-year").innerHTML =
            `<option value="Graduat 2026">Graduat 2026</option>` +
            `<option value="Graduat 2025">Graduat 2025</option>` +
            `<option value="Graduat 2024">Graduat 2024</option>` +
            `<option value="Graduat abans de 2024">Graduat abans de 2024</option>`;
        } else {
          document.getElementById("auth-year").innerHTML =
            `<option value="1r Curs">1r Curs</option>` +
            `<option value="2n Curs">2n Curs</option>` +
            `<option value="3r Curs">3r Curs</option>` +
            `<option value="4t Curs (TFG)">4t Curs (TFG)</option>`;
        }
      });
    });

    document.getElementById("auth-register-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const firstName = document.getElementById("auth-first-name").value.trim();
      const lastName = document.getElementById("auth-last-name").value.trim();
      const email = document.getElementById("auth-email").value.trim().toLowerCase();
      const errBox = document.getElementById("auth-form-error");
      const fullName = `${firstName} ${lastName}`.trim();

      if (!email.endsWith("@campus.eram.cat")) {
        errBox.textContent = "Només es permet el correu institucional @campus.eram.cat.";
        errBox.classList.remove("hidden");
        return;
      }

      errBox.classList.add("hidden");
      const role = document.querySelector("input[name='auth-role']:checked").value;
      const color = document.getElementById("auth-avatar-color").value;
      const subjects = Array.from(document.querySelectorAll(".auth-subject-options input:checked"))
        .map((input) => input.value);
      const avatar = uploadedAvatar || makeInitialAvatar(fullName, color);
      const newStudent = {
        id: "stu-" + Date.now(),
        name: fullName,
        email,
        role,
        year: document.getElementById("auth-year").value,
        avatar,
        avatarColor: color,
        subjects,
        bio: role === "alumni"
          ? "Alumni del Grau en Comunicació Audiovisual i Multimèdia a l'ERAM."
          : "Estudiant del Grau en Comunicació Audiovisual i Multimèdia a l'ERAM.",
        interests: subjects.length ? subjects : ["Audiovisuals"],
        points: 10,
        projectsCount: 0,
        commentsCount: 0,
        usefulCommentsCount: 0,
        secondedCount: 0
      };

      state.students.push(newStudent);
      enterAuthenticatedSession(newStudent.id);
      showToast(`Benvingut/da a ERAM Creative Network, ${fullName}!`);
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
      localStorage.removeItem(SESSION_KEY);
      closeAllPopovers();
      renderAuthExistingProfiles();
      showAuthPage();
    });
  }

  // Initialize Application
  const savedSession = localStorage.getItem(SESSION_KEY);
  const hasSavedSession = savedSession && state.students.some((student) => student.id === savedSession);
  renderAuthExistingProfiles();
  bindAuthPageEvents();
  if (!hasSavedSession) {
    showAuthPage();
  } else {
    state.currentUserId = savedSession;
    document.body.classList.add("authenticated");
    document.getElementById("auth-page").classList.add("hidden");
  }
  populateDynamicFilterOptions();
  updateHeaderChrome();
  bindGlobalEvents();
  renderDiscoverView();
})();