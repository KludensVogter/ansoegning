# Beslutninger

Valg, der afviger fra eller præciserer `BRIEF.md`. Én linje begrundelse pr. valg.

## Aftalt med Joel før start

- **Ingen PDF'er på siden.** Den eneste PDF i mappen viser gadeadresse og "XXX", og siden er offentlig. Knapperne "Download CV", "Håndskrevet ansøgning (PDF)" og PDF-knapperne under kontakt er derfor udeladt. I hero er "Download CV" erstattet af "Se mine værktøjer".
- **Virksomhed og stilling sættes via linket.** `?v=AFRY&s=IKT-projektkoordinator` udfylder teksten, så samme udgivne side kan sendes til flere. `CONFIG` gælder stadig som standard, og uden nogen af delene står teksten neutralt.
- **Byg lokalt, udgiv bagefter.** GitHub CLI (`gh`) er ikke installeret, og Joel vil se siden først. Udgivelse, `og:image` med fuld adresse og GitHub-linket i "Sådan er siden lavet" venter til da.
- **Foto og skærmbilleder tilføjes senere.** Indtil da vises en cirkel med "JJ" og kun de interaktive demoer.

## Egne valg undervejs

- **Billedstier står tomme i `CONFIG` i stedet for at blive gættet.** At lede efter filer, der ikke findes, giver 404-fejl i konsollen. Skriv stien (fx `"Materiale/foto.jpg"`), når filen ligger i mappen.
- **PDF'en er udelukket fra git (`.gitignore`).** Den indeholder gadeadressen og må ikke ende i et offentligt repo.
- **Mappen hedder `Materiale` med stort M i stierne.** Sådan hedder den på disken, og GitHub Pages skelner mellem store og små bogstaver.
- **Ekstra felter i `CONFIG`: `skaermKNtool`, `skaermRFAtool`, `github`.** Så kan skærmbilleder og repo-link slås til uden at røre resten af koden.
- **Mørkere grøn (#3F6A2E) til små tekster.** Accentfarven #4E7D3A giver kun 4,1:1 på den grågrønne flade. Linjer, knapper og ikoner bruger stadig #4E7D3A.
- **Kortene åbner ved, at eksemplerne glider op over kortet.** Så ændrer kortet ikke højde, og intet i layoutet rykker sig.
- **Demoerne scroller ikke indvendigt.** RFAtool viser højst 9 træffere, og KNtool har én gruppe åben ad gangen. Så sidder musehjulet aldrig fast i en liste midt på siden.
- **RFAtool-demoen søger også i mappenavnet.** "dør" finder derfor også porten i mappen Døre, ligesom et rigtigt indeks ville.
- **Tidslinjen har fem stationer.** De fire roller plus uddannelsen, som briefen beder om. Uddannelse og studiejob overlapper i tid og står i den rækkefølge, de begyndte.
- **Vandret tidslinje kræver mindst 960 px bredde og 620 px højde.** På lave vinduer ville indholdet ikke kunne være i den fastgjorte flade.
- **3D-huset skaleres ned, når lagene adskilles.** Ellers ville taget ryge ud af billedet.
- **Lodret swipe på 3D-modellen scroller siden på mobil.** Vandret træk drejer huset. Så sidder man ikke fast på modellen.
- **Gulvgitteret toner ud mod kanten med en maske.** Det er ikke en farvegradient i designet, kun en blød afslutning i stedet for en skåret kant.
- **Sløret baggrund på topbjælken og et blødt lysskær på kortene er beholdt.** Briefen beder om begge, selvom den også fravælger glasmorfisme. De er holdt diskrete.
- **`?motion=1` tvinger animationer til.** Kun til test på maskiner, hvor styresystemet har "reducér bevægelse" slået til. Ellers respekteres indstillingen fuldt ud.
- **Git-forfatter er sat lokalt til Joels navn og e-mail.** Der var ingen git-identitet på maskinen. E-mailen står i forvejen på siden.
- **Terminalen viser historikken til og med næstsidste commit.** En commit kan ikke indeholde sin egen besked på forhånd.

## Designgennemgang

**Runde 1 (desktop 1440, mobil 390 og 360)**
- Skjulte skærmbillede-knapper blev vist som tomme rammer. Rettet (`[hidden]` vinder nu altid).
- KNtool-demoen var smallere end RFAtool-demoen. Rettet, så begge demoer har samme bredde.
- Tidslinjens første station flugtede ikke med overskriften (8 px). Rettet.
- Tagget "Autodesk Forma/ACC" gav 6 px vandret scroll på mobil. Rettet, tags kan nu bryde linje.
- Demoerne havde for meget tom plads i bunden. Listen er kortet fra 10 til 9 rækker.

**Runde 2**
- Gulvgitteret blev skåret hårdt af i kanten af 3D-feltet. Kameraet er trukket tilbage, og kanten toner ud.
- Den adskilte model stod for småt. Skaleret op.
- Kortene var for høje og tomme på mobil. Højde og luft følger nu skærmbredden.
- Terminalvinduet var for højt i forhold til indholdet. Justeret.

## Kontrol

- Tekst: 426 ord brødtekst, ingen tekstbid over 3 sætninger, ingen forbudte ord, "XXX" vises ikke. Hver påstand er holdt op mod briefens afsnit 3.
- Ingen vandret scroll ved 360, 390, 768 og 1440 px. Ingen fejl i konsollen.
- Lighthouse (mobil): Performance 91, Accessibility 100, layout-skift 0.
- Reduceret bevægelse: alt indhold synligt, lodret tidslinje, 3D-modellen står stille og adskilt.
- **Ikke lavet endnu:** udgivelse, test på en rigtig telefon, video af scroll og Playwright-trace for lange opgaver.
