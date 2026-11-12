# BRIEF – AI-ansøgning som webside

Du skal bygge og udgive en webside, der er Joel Jürgensens jobansøgning, lavet med AI.
Den sendes som et link sammen med en håndskrevet ansøgning og et CV (begge i `materiale/`).
Formålet er at vise, at Joel kan bruge AI til at sætte noget gennemført op, der ligner noget, et menneske har lavet.
Siden er samtidig et udstillingsvindue: den skal vise, hvor professionel, interaktiv og flot en brugerflade kan blive. Kvalitetsniveauet er en produktside fra Apple, Linear eller Stripe. Bevægelsen skal være flydende og gennemtænkt, aldrig gimmicky, og indholdet skal altid kunne læses.

## 0. Arbejdsregler (læs først)

1. **Stil ikke spørgsmål undervejs.** Alt, du skal bruge, står i denne brief. Hvis noget er uklart, så træf det mest fornuftige valg, skriv det i `BESLUTNINGER.md` med én linje begrundelse, og fortsæt.
2. **Skriv frit, men opfind aldrig fakta.** Du må gerne skrive ny tekst: overskrifter, mellemrubrikker, korte slogans, knaptekster og formuleringer i andre ord. Men alt, der påstår noget om Joel, skal kunne føres tilbage til afsnit 3. Ingen tal, citater, anbefalinger, kunder, resultater, projekter eller år, der ikke står der. Mangler du noget, så udelad det.
3. **Hold dig til omfanget.** Byg de sektioner, interaktioner og animationer, der står i afsnit 4 og 5, og byg dem godt. Tilføj ikke ekstra sektioner, sprogvalg, mørkt tema-skifter, preloader-skærm, custom cursor, lyd, cookiebanner, analytics eller kontaktformular.
4. **Commit med git efter hver milepæl** (opsætning, indhold, 3D, finpudsning, udgivelse), så alt kan rulles tilbage.
5. **Du er først færdig, når hele tjeklisten i afsnit 7 er bestået,** og du selv har set screenshots af siden. Ret selv fejl og tjek igen. Spørg ikke, om du skal rette noget.
6. Til sidst skriver du en kort rapport: link til siden, hvad der blev lavet, og indholdet af `BESLUTNINGER.md`.

## 1. Indstillinger (det eneste, Joel skal kunne ændre senere)

Læg disse værdier øverst i `index.html` i ét `CONFIG`-objekt. Al tekst, der bruger dem, skal hente dem derfra:

```js
const CONFIG = {
  virksomhed: "XXX",          // fx "AFRY"
  stilling: "XXX",            // fx "IKT-projektkoordinator"
  navn: "Joel Jürgensen",
  email: "joeljurgensen@gmail.com",
  telefon: "+45 51 21 56 41",
  by: "Holstebro",
  foto: "materiale/foto.jpg", // vis en neutral cirkel med initialerne "JJ", hvis filen ikke findes
  pdfAnsoegning: "materiale/Ansoegning.pdf",
  pdfCV: "materiale/CV.pdf"
};
```

Er `virksomhed` eller `stilling` stadig "XXX", så skriv sætningerne neutralt i stedet for at vise "XXX" på siden. Fx "Jeg søger en stilling inden for IKT og BIM-koordinering".

Gadeadressen skal ikke med på siden, kun byen. Siden er offentlig.

## 2. Tone og sprog

- Dansk. Jeg-form. Varm, jordnær og konkret, som en tømrer, der er blevet computernørd.
- **Siden er ikke en ansøgning, der er sat på en webside.** Teksten skal ikke være ét sammenhængende brev. Skriv den som en god produktside: korte, slagkraftige bidder fordelt der, hvor de giver mening, fx en stor sætning alene, en kort mellemrubrik over et kort eller to linjer under en demo. Brug gerne små formuleringer fra Joels håndskrevne ansøgning og CV i `materiale/`, men skriv det meste nyt.
- Find gerne på rubrikker med lidt personlighed, der spiller på byggeri og BIM, fx "Bygget lag for lag" eller "Fra hammer til model". Hold dem korte, og lad være med at gøre det til en rim- eller ordspilsfest.
- Brødtekst i alt højst cirka 500 ord. Ingen tekstbid over 3 sætninger. Korte sætninger.
- **Undgå typiske AI-træk:** ingen "passioneret", "dynamisk", "brænder for", "i en verden hvor", "ikke kun … men også". Ingen opremsninger med tre tillægsord. Ingen tankestreger som pynt og ingen emojis.
- Vis i stedet for at påstå. Skriv fx ikke "jeg er struktureret". Fortæl i stedet, hvad han byggede, og hvorfor.
- Overdriv ikke Joels rolle over for kollegerne. Skriv ikke, at "alle går til ham".
- Korrekt dansk retskrivning med bindestreger: Revit-families, MEP- og ING-modeller, LCA-beregninger. Skriv "fx", ikke "f.eks".

## 3. Fakta (den eneste kilde til påstande om Joel)

Det her er råmaterialet, ikke færdig tekst. Formulér det, som det passer bedst på siden, men lad indholdet være som det står.

**Joels egen overskrift (kan bruges eller erstattes):** Problemløser med blik for digitalt byggeri
**Undertitel (kan bruges eller erstattes):** Bygningskonstruktør med håndværksmæssig erfaring
**Kernen:** En computernørd med byggefaglig viden og håndværksmæssig erfaring. Han kender byggeriet både fra byggepladsen og fra projekteringen. Han motiveres af at forbedre digitale arbejdsgange, både for at spare tid og for at sikre sammenhæng i projektet. Han synes, det kan være lige så tilfredsstillende at løse et teknisk problem som at lave selve modellen.

**Erfaring**
- Bygningskonstruktør, Arkitec as, jan. 2024 – nu (praktik feb. 2023 – sep. 2023)
  - Projektering og projektledelse af byggesager, fra byggeansøgning og udbud til færdigmelding
  - Modelhåndtering af fagmodeller, fx koordinering af spærleverandørens model med arkitektmodellen
  - Daglig projektering i Revit. Udvikler parametriske families med indbyrdes afhængigheder
  - Ansvarlig for LCA-beregninger (RealtimeLCA, LCAbyg, LCCbyg)
  - Bruger BIM-modellen til mængdeudtræk, identifikation af bygningsdele og kvalitetssikring
  - Optegning af MEP- og ING-modeller ud fra skitser
  - Punktskyer til registrering og optegning af eksisterende bygninger
- Bygningskonstruktørstuderende (deltid), 3P Technology, maj 2022 – jan. 2024
  - Flowdiagrammer til programmører, der udviklede software til de danske brandregler
  - 3D-scanning af bygninger med Matterport, bl.a. en komplet scanning af Holbæk Sportsby
- Tømrersvend (udlægger), Lund og Refsgaard, okt. 2019 – maj 2020: større byggerier som uddannelsesinstitutioner og hoteller
- Tømrerlærling, Byggefirmaet Halkjær og Nr. Felding Tømrer og Snedker, apr. 2016 – okt. 2019: arkitekttegnede huse fra start til slut, nybyggeri og renovering

**Uddannelse og kurser**
- Bygningskonstruktør, VIA University College, sep. 2020 – jan. 2024. Valgfag inden for BIM og digitalisering. Mentor for medstuderende.
  - Valgfag: Dynamo til automatisk oprettelse og navngivning af sheets og opsætning af views
  - Regnsimulering i Blender til analyse af tagrender med stort fald
- Svendebrev som tømrer, 2019
- Revit Koter og Koordinator, NTI
- LCA og bæredygtighed, Grønne kompetencer

**Egne værktøjer** (udviklet i fritiden med Claude Code. Joel kan ikke selv kode, og det må gerne stå som en styrke)
- **KNtool:** brugerflade til at oprette og vedligeholde keynotes i Revit
- **RFAtool:** indekserer Revit-families i en eksisterende mappestruktur og gør dem søgbare

**Software:** Revit (avanceret, dagligt), RealtimeLCA, LCAbyg, LCCbyg, Autodesk Forma/ACC (terræn og omkringliggende bygninger, ACC som projektplatform på ét projekt), Dynamo (grundlæggende), Blender, Fusion 360, Matterport, Claude Code

**Sprog:** Dansk (modersmål). Engelsk (stærkt skriftligt, sikkert mundtligt)
**Personligt:** Nysgerrig, ihærdig og lærenem. Lærer ofte nye Revit-funktioner tidligt.
**Fritid:** 3D-print og funktionelle 3D-print, udvikling af værktøjer og computerspil, guitar

## 4. Siden – opbygning

Én side, der scroller. Sektionerne kommer i denne rækkefølge. Den gennemgående idé er, at siden er bygget "lag for lag", ligesom en BIM-model.

1. **Topbjælke** (fast): navn til venstre og et mærkat "Lavet med AI". Til højre står links til sektionerne og "Håndskrevet ansøgning (PDF)". Bjælken er gennemsigtig over hero og får en blød, sløret baggrund, når man scroller. Den skjules, når man scroller ned, og kommer igen, når man scroller op. En tynd grøn statuslinje i bunden viser, hvor langt man er på siden. Aktivt menupunkt følger sektionen. På mobil er der en burgermenu med en animeret fuldskærmsmenu.
2. **Hero:** foto i cirkel, overskrift, undertitel, 2–3 linjer om kernen og knapperne "Kontakt mig" og "Download CV". Til højre er den interaktive 3D-model (afsnit 5) med lag-knapper under. En lille "Scroll"-indikator i bunden.
3. **Derfor søger jeg:** motivation med `CONFIG.virksomhed` og `CONFIG.stilling`. Kobl hans erfaring til IKT-koordinering: modelkoordinering, kvalitetssikring, data fra modellen og bedre digitale arbejdsgange. Ét nøgleudsagn vises stort, og dets ord lyser op ét ad gangen, mens man scroller.
4. **Fra byggeplads til BIM-model:** tidslinje fra 2016 til nu med de fire roller og uddannelsen. På desktop er sektionen fastgjort, og man scroller vandret gennem stationerne, mens en grøn linje tegnes. På mobil er tidslinjen lodret, og linjen tegnes i takt med scroll. Hver station har en lille ikonstreg (hammer, tegning, 3D-scanner, model) tegnet som SVG, der "tegnes op".
5. **Det kan jeg bidrage med:** tre kort: *Modelkoordinering og kvalitetssikring*, *Data fra BIM-modellen* og *Punktskyer og 3D-scanning*. Hvert kort har 2–3 konkrete eksempler fra afsnit 3. Kortene vipper let mod musen (højst 6°) med et blødt lysskær, der følger markøren. Et klik åbner kortet med en glidende animation og viser eksemplerne.
6. **Værktøjer, jeg har bygget:** KNtool og RFAtool med opbygningen *Problemet → Løsningen*. Hvert værktøj vises med en **levende, interaktiv mini-demo bygget i HTML/CSS/JS**, der tydeligt er mærket "Illustration":
   - **RFAtool-demo:** et søgefelt over en liste med cirka 30 opdigtede, men realistiske family-navne (fx "Dør_Enkel_90x210", "Vindue_Fast_120x120"). Når sektionen kommer frem, skriver demoen selv "dør 9", og listen filtreres animeret. Bagefter kan brugeren selv skrive og filtrere.
   - **KNtool-demo:** en keynote-liste i træstruktur (fx "21 Ydervægge > 21.1 Bagmur"), hvor man kan folde grupper ud og ind, og hvor en ny keynote animeres ind.
   - Hvis `materiale/kntool.png` eller `materiale/rfatool.png` findes, vises det rigtige skærmbillede ved siden af demoen. Det kan forstørres med en glidende lightbox.
7. **Kompetencer:** software som tags med filterknapper for *Alle*, *Projektering*, *LCA*, *3D og scanning* og *AI*. Når man filtrerer, glider tags på plads med en FLIP-animation. Sprog og fritid står som små linjer under.
8. **Sådan er siden lavet:** kort og ærligt. Joel skrev en brief med fakta, krav og en tjekliste, og Claude Code byggede, testede og udgav siden. Vis det som et animeret terminalvindue, der "afspiller" forløbet. Linjerne skal være **de rigtige commit-beskeder fra repoets git-historik**, som indsættes ved udgivelsen. Opfind ingen. Nævn, at Joel bruger samme arbejdsmetode til sine Revit-værktøjer, og link til GitHub-repoet.
9. **Kontakt:** stor overskrift og knapper til e-mail (mailto) og telefon (tel:). En "Kopiér e-mail"-knap viser en lille bekræftelse. Under står by og knapper til begge PDF'er. Knapperne er let magnetiske på desktop.

## 5. Design

- Følg Joels egne dokumenter, så siden ligner resten af pakken:
  - Lys, rolig baggrund (#FAFAF7)
  - Grågrøn flade til sidepaneler og kort (#E8ECE4)
  - Grøn accent (#4E7D3A) til overskrifter, mærkater og linjer
  - Mørk tekst (#1E241C)
  - Overskrifter er store og fede. Etiketter står med VERSALER og spredte bogstaver, som "UDDANNELSE" i hans PDF.
- Skrifttyper fra Google Fonts: **Inter Tight** til overskrifter og **Inter** til brødtekst.
- Masser af luft. Maks. tekstbredde 68 tegn. Ingen gradienter, glasmorfisme eller neon.
- Mobil først. Ingen vandret scroll ved 360 px bredde.
- Respektér `prefers-reduced-motion`: ingen scroll-animationer, intet fastgjort scroll og ingen tilt. Indholdet vises med det samme, og 3D-modellen står stille i adskilt tilstand.

**Bevægelsessystem** (skal bruges konsekvent):
- Biblioteker: GSAP 3.12.5 med ScrollTrigger (`https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` og `.../ScrollTrigger.min.js`) og Lenis 1.1.13 til blød scroll (`https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js`), koblet til ScrollTrigger.
- Faste varigheder: 0,2 s (hover), 0,6 s (afsløring af elementer) og 0,9–1,2 s (store overgange). Faste easings: `power3.out` som standard og `expo.out` til store elementer. Brug ingen andre.
- **Intro ved indlæsning** (højst 1,6 s, og teksten kan læses fra første frame): overskriftens linjer glider op bag en maske, linje for linje. Foto og knapper toner ind forskudt. 3D-huset bygger sig selv op nedefra, lag for lag: fundament, vægge, dæk og til sidst taget.
- **Afsløringer ved scroll:** overskrifter glider op bag en maske. Brødtekst og kort toner ind med 24 px bevægelse og 0,08 s forskydning. Hvert element animeres kun én gang.
- **Mikrointeraktioner:** knapper har hover med en fyld-animation og et let tryk ved klik. Links har en understregning, der tegnes fra venstre. Alle klikbare elementer har synligt fokus.
- Animer kun `transform` og `opacity` (og `clip-path` til masker). Der må ikke være layout-skift.

**3D-modellen i hero (Three.js):**
- Et lavpolygonalt hus bygget af kasser i koden, ikke en downloadet model. Det består af fundament, gulv, vægge med vindueshuller, etageadskillelse, saddeltag og et tyndt "MEP"-rør. Bløde skygger og et diskret gulvgitter som i en modelvisning.
- Lagene er farvet som fagmodeller i BIM: konstruktion i grå, arkitekt i hvid/beige, tag i den grønne accent og MEP i orange.
- **Interaktion:**
  - Man kan trække for at dreje huset (OrbitControls med dæmpning). Zoom og panorering er slået fra. Huset drejer langsomt, når brugeren ikke rører det.
  - Holder man musen over et lag, lyser det op, og en lille etiket viser lagets navn ("Konstruktion", "Arkitekt", "MEP", "Tag").
  - Under modellen er der fire knapper som en BIM-lagliste. De slår lagene til og fra med en glidende animation.
  - En knap "Adskil / Saml" og scroll gennem hero glider lagene lodret fra hinanden, så det bliver en "exploded view".
- Brug Three.js r160 via import map fra `https://cdn.jsdelivr.net/npm/three@0.160.0/`. Der må ikke være noget build-trin.
- Renderingen pauser, når hero er ude af syne. Pixel ratio er højst 2.
- Hvis WebGL ikke virker, vises en statisk SVG-tegning af det samme hus. Modellen må ikke forsinke teksten. Indlæs den efter siden.

## 6. Teknik og udgivelse

- Rene filer: `index.html`, `style.css`, `main.js` (animationer og interaktioner), `house.js` (3D), `demos.js` (værktøjsdemoer) og mappen `materiale/`. Ingen frameworks og intet build-trin. De eneste biblioteker er Three.js, GSAP/ScrollTrigger og Lenis fra de faste CDN-adresser ovenfor.
- `<meta name="robots" content="noindex">`, da siden kun er til modtageren. Tilføj en ordentlig `<title>`, `description`, `og:title`, `og:description` og et `og:image` (lav `og.png` på 1200×630 ud fra hero med Playwright).
- Udgiv på **GitHub Pages**:
  1. `git init`, commit og derefter `gh repo create ansoegning --public --source . --push`
  2. Slå Pages til fra `main` / rod: `gh api -X POST repos/{owner}/ansoegning/pages -f "source[branch]=main" -f "source[path]=/"`
  3. Vent, til `https://{owner}.github.io/ansoegning/` svarer 200, og tjek den udgivne side med samme tjekliste.
- Hvis `gh` ikke er logget ind, så stop først her og bed Joel køre `gh auth login`. Det er det eneste, du må spørge om.

## 7. Tjekliste – færdig betyder alle punkter er sande

Brug Playwright (`npx playwright`) til at tage screenshots ved 1440×900 og 390×844. Tag et screenshot for hver sektion, efter dens animationer er færdige. Optag desuden en video af en langsom scroll fra top til bund på desktop og på mobil, og gennemgå udvalgte frames. Se på det hele selv, før du skriver en rapport.

**Designgennemgang:** Når første version virker, så bedøm den hårdt, som en senior UI-designer ville, mod spørgsmålene herunder. Ret alt, der får et nej, og gennemgå igen. Lav mindst to runder.
- Ville den kunne stå som en case på en professionel designers portfolio?
- Er afstande, linjer og typografi helt konsekvente fra sektion til sektion?
- Føles hver animation flydende og meningsfuld, og er der intet, der hakker, blinker eller hopper?
- Er der én tydelig visuel rytme, og ser mobilversionen lige så gennemarbejdet ud som desktop?

- [ ] Ingen fejl i browserkonsollen. Ingen links eller billeder, der giver 404.
- [ ] Ingen vandret scroll ved 360, 390, 768 og 1440 px.
- [ ] Al tekst kan læses uden 3D (tjek med WebGL slået fra).
- [ ] Hver påstand om Joel på siden kan føres tilbage til afsnit 3. Ny tekst er fin, men nye fakta er ikke. Gennemgå teksten linje for linje, og skriv i rapporten, at du har gjort det.
- [ ] Teksten læses som en produktside i korte bidder, ikke som et brev, der er delt op.
- [ ] Ingen forbudte ord fra afsnit 2. Søg efter dem i koden.
- [ ] "XXX" vises ingen steder på siden.
- [ ] Stavning og bindestreger er tjekket i al tekst.
- [ ] Kontrastforhold på mindst 4,5:1 for brødtekst. Alle knapper kan nås med tastaturet og har synligt fokus.
- [ ] Lighthouse (mobil): Performance ≥ 80, Accessibility ≥ 95.
- [ ] Alle interaktioner i afsnit 4 og 5 virker: lagknapper, træk-for-at-dreje, hover-etiketter, adskil/saml, tidslinje, kort, demoer (både automatisk og egen indtastning), filter, kopiér e-mail og mobilmenu.
- [ ] Animationerne kører flydende. Der er ingen lange opgaver over 50 ms under scroll i Playwright-tracen.
- [ ] Med `prefers-reduced-motion: reduce` er alt indhold synligt, og intet bevæger sig.
- [ ] Fastgjort scroll og blød scroll virker også med touch på mobil, og man sidder aldrig fast.
- [ ] Demoerne er tydeligt mærket "Illustration".
- [ ] Mindst to runder designgennemgang er lavet og noteret i `BESLUTNINGER.md`.
- [ ] Den udgivne URL virker, og PDF-links åbner.
- [ ] `BESLUTNINGER.md` findes og er opdateret.
