# Beslutninger

Valg, der afviger fra eller præciserer `BRIEF.md`. Én linje begrundelse pr. valg.

## Aftalt med Joel

- **Ingen PDF'er på siden.** Den eneste PDF i mappen viser gadeadresse og "XXX", og siden er offentlig. "Download CV" i hero er erstattet af "Læs ansøgningen", som fører til næste fokuspunkt. En knap til værktøjerne som det første forvirrede.
- **Siden er den samme til alle modtagere.** Den nævner ikke en bestemt virksomhed eller stilling. Felterne i `CONFIG` og `?v=`/`?s=` i linket er fjernet igen, så der ikke er noget, der skal udfyldes pr. ansøgning.
- **Siden er udgivet på GitHub Pages.** Den blev bygget og godkendt lokalt først. Linket er https://kludensvogter.github.io/ansoegning/, og koden ligger offentligt i https://github.com/KludensVogter/ansoegning. Joel valgte selv, at kode, brief, beslutningslog og historik må være offentlige.
- **Siden er fokuspunkter, ikke en lang side.** Hvert fokuspunkt fylder én skærm, zoomer i fokus ved scroll, og de fleste detaljer ligger bag en knap eller hover. Det erstatter briefens opbygning med almindelig scroll, fastgjort vandret tidslinje og afsløringer ved scroll.
- **Fokuspunkt 2 har Joels egen sætning som overskrift.** "Jeg vil arbejde med det, jeg interesserer mig for: de digitale processer bag projekteringen." Den tidligere overskrift står nu i teksten under.
- **Der står ikke, at Joel ikke kan kode.** Teksten siger kun, at værktøjerne bygges med Claude Code.
- **Fokuspunkt 8 er kort og neutralt.** Det siger, at siden og værktøjerne er udviklet med Claude Code i en iterativ proces med mange runder. Det forklarer ikke, hvordan Joel gør.
- **Joel og hans kolleger bruger værktøjerne i dag.** Oplyst af Joel. Det står ved værktøjerne.
- **Demoerne er kopier af appernes brugerflade med eksempeldata.** En illustration, der ikke ligner appen, er forkert at vise. Kopierne følger skærmbillederne og er mærket "Kopi · eksempeldata". Det erstatter briefens mærkat "Illustration".
- **Skærmbilleder af de rigtige apps er med.** I KNtool-billedet er kundenavne, adresse og filsti sløret direkte i billedfilen. Teksten bruger de funktioner, billederne viser, men ingen tal eller versionsnumre.
- **Fusion 360 bruges til funktionelle 3D-print i fritiden.** Oplyst af Joel, står ikke i briefen.
- **3D-huset er et parcelhus i ét plan.** Det er bygget om i en separat session og godkendt af Joel: stribefundament og terrændæk, hulmur med vinduer og døre, gitterspær og tagsten, og ventilation som MEP. Briefens beskrivelse af huset (gulv, etageadskillelse, ét rør) gælder ikke længere.
- **`Start siden.bat` starter siden lokalt.** Den åbner siden med `?motion=1`, så animationerne kører.

## Egne valg undervejs

- **Briefens grænser for tekstmængde er lempet.** Joel bad om mere tekst bag knapperne. Der er stadig ingen tekstbid over tre sætninger, og ingen nye fakta.
- **Er et fokuspunkt for højt til vinduet, skaleres det en anelse ned.** Så kan hvert fokuspunkt altid ses i sin helhed. På de testede størrelser er det ikke nødvendigt.
- **Lave vinduer får en almindelig side.** Under 560 px højde (620 px på brede skærme) kan indholdet ikke være på én skærm, så dér ruller man bare.
- **Scroll lander på nærmeste fokuspunkt i den retning, man bevægede sig.** Et lille ryk er nok til at komme videre, og man står aldrig mellem to punkter. Piletaster, PageUp/PageDown, mellemrum, Home og End virker også.
- **ScrollTrigger er fjernet.** Fokuspunkterne styres af en lille motor i `main.js`, så biblioteket blev ikke brugt længere. GSAP og Lenis bruges stadig.
- **Tidslinjen er fem stop i ét fokuspunkt.** Den aktive station står stor i midten med alle detaljer. De andre står små ved siden af og kan klikkes.
- **Kortene under Bidrag åbner sig ved hover eller klik.** Ét er altid åbent, og de andre viser kun titlen. Det erstatter kort, der vender sig.
- **Kompetencerne vokser til infovinduer.** Tagget bliver selv til vinduet. Vinduet fanger ikke musen, så man kan glide fra værktøj til værktøj.
- **På mobil ligger demoer og git-historik bag en knap.** De glider op over fokuspunktet og får hele skærmen. Skærmbilledet åbnes også fra en knap.
- **Kopierne fanger ikke musehjulet unødigt.** RFAtool viser de families, der er plads til. Træet i KNtool kan kun rulle, når indholdet er højere end feltet.
- **Kopierne viser kun det, skærmbillederne viser.** Klassifikationskoder og menupunkter er taget fra billederne. Knapper, hvis funktion ikke kan ses, er med som udseende, men gør ikke noget.
- **Fallback-tegningen følger det nye hus.** Gavlen hører til Tag, og MEP vises som kanal og taghætte.
- **Billedstier står i `CONFIG`.** Tom sti betyder, at billedet ikke vises. Så kommer der ingen 404-fejl i konsollen.
- **PDF'en er udelukket fra git (`.gitignore`).** Den indeholder gadeadressen.
- **Mappen hedder `Materiale` med stort M i stierne.** GitHub Pages skelner mellem store og små bogstaver.
- **Mørkere grøn (#3F6A2E) til små tekster.** Accentfarven #4E7D3A giver for lav kontrast på den grågrønne flade.
- **`?motion=1` og `?motion=0` tvinger animationer til og fra.** Kun til test. Joels Windows har "reducér bevægelse" slået til, så uden `?motion=1` ser han den rolige udgave.
- **Git-forfatter er sat lokalt til Joels navn og e-mail.** Der var ingen git-identitet på maskinen.
- **Terminalen viser historikken til og med næstsidste commit.** En commit kan ikke indeholde sin egen besked på forhånd. Commits, der kun opdaterer selve listen ("Terminal: …"), vises ikke.

## Designgennemgang

**Runde 1 og 2 (første version)**: skjulte knapper, demo-bredder, flugt på tidslinjen, vandret scroll på mobil, gulvgitterets kant og kortenes højde. Alt rettet.

**Runde 3 (fokuspunkter)**
- Tekst fra et fokuspunkt blev hængende i det næste. Rettet.
- Lange hop fra menuen blev afbrudt af snap-funktionen. Rettet.
- Teksten i de åbne kort ramte kanten. Bredderne er regnet om.
- Det åbne kort klippede sin sidste linje på mobil. Kortene er strammet op.

**Runde 4 (små telefoner og nye tekster)**
- Tre fokuspunkter var 25–80 px for høje ved 360×640. Typografi og luft er strammet på lave skærme, og alle ni passer nu.
- Git-historikken fyldte for meget på mobil. Den ligger nu bag en knap.

**Runde 5 (kopier af apperne)**
- Efter en ny keynote kunne toppen af træet ikke nås igen. Træet kan nu rulle.

## Kontrol

- Alle ni fokuspunkter passer på én skærm ved 1440×900, 390×760 og 360×640. Ingen vandret scroll.
- Ingen fejl i konsollen.
- Reduceret bevægelse: almindelig side, alt indhold synligt, 3D-modellen står stille og adskilt.
- Ingen forbudte ord, og "XXX" vises ikke. Nye tekster er holdt op mod briefens afsnit 3, Joels svar og skærmbillederne.
- Lighthouse (mobil) før udgivelse: Performance 97, Accessibility 97. De to fund (kontrast i KNtool-kopien og knapnavne) er rettet, men ikke målt igen.
- Den udgivne side: alle filer og billeder svarer, ingen fejl i konsollen, og alle ni fokuspunkter passer ved 1440×900 og 360×640. PDF'en og guiden til ChatGPT ligger ikke på nettet.
- **Ikke lavet endnu:** test på en rigtig telefon.
