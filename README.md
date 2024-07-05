# Skärmteaterns Channelle - scen / mötesrum

### [Planering](https://docs.google.com/spreadsheets/d/1VxNay7jHiwGuvopK9huBMex3ONTnylXZ8f2xlVaVSyI/edit#gid=2100598513)

- Lookup: https://github.com/daily-co/mediasoup-sandbox/blob/master/single-page/server.js

 - Prisma ORM: https://www.prisma.io/orm
 - Bulma: https://bulma.io/
 - Ionicons: https://ionic.io/ionicons
 - https://sveltelegos.com/guides/
  
  Underlag	
  SFU Gränsvärden	https://dolby.io/blog/breaking-point-webrtc-sfu-load-testing/
  
      
  - Nice Lego:	
  * https://sveltelegos.com/guides/watchers/watch/	
  * https://sveltelegos.com/guides/middlewares/history/	
  * Utilities, för data från enheten	
  * Stores, för data från enheten, nätverk, mus, fönster mm	
  
  
  ### Media Soup
  
  - Few to many (one to many) broadcasting and group video conferencing
  - Real-time Transport (RTP) Media Streaming
  
  Krav:
  
  - Node.js version >= v16.0.0
  - Python version >= 3.7 with PIP
  

  
  ## Ej upphämtade anteckningar:
  
  Arkitektur/designspråk:
  
  En ruta är video/skärmdelning/bild mm
  Rutor kan vara livevideo
  Rutor tillhör publiken, skådespelare, tekniker mm
  
  Vision:
  Att kunna starta upp en teater på nätet. Mötet mellan material och publik via skärmen står i centrum.
  Plattformen ska bli ett sammanhang där konstskapare som inte är i stånd att visa på en fysisk teater och som har idéer för att göra live konst genom skärmen kan få till publikmöten med en mindre men engagerad publik snabbt.
  Det är också en plats där publik kan se experimentell scenkonst utan att ta sig en fysisk kvarterteater. Plattformen kommer således specifikt vända sig till publik och skapare på landsbygd nationellt såväl som internationellt och ha ett särskilt öga för grupper och individer som har svårt att befinna sig i de “stora” sammanhangen.
  
  Avgränsningar:
  Inte en streamingtjänst för ursprunlig icke-digital konst
  
  Användarkrav:
  Kunna koppla upp sig enkelt utan att vara tekniskt skillad
  Inte veta exakt innehållsmässigt - kreatörer ska kunna jobba på en show innan den är klar.
  Plattformen ska skapar relation med publiken genom all sin kommunikation
  
  Produktkrav:
  Plattformen är ett alternativ till etablerade kommersiella digitala plattformar,
  
  Funktionskrav:
  Internationellt språk (svenska och engelska)
  Tillgänglig för besökare utan app
  Enbart stream/live
  Kunna hålla föreställningar
  Fri tillgång eller med biljett
  Planeringsverktyg för skådesplare med översikt
  Foton på ensamblen
  Beskrivning, kontakt mm
  Kunna arkivera och spara ner foton/video med mera
  Blogg funktion
  Foaljé med chattfunktion (se inspiration i projektpresentationen)
  Betalmöjlighet för biljetter (se frågor)
  
  ## Server
  
  SFU: Selective Forwarding Unit
  https://bloggeek.me/webrtcglossary/sfu/
  
  - Receives media streams and forwards them to everyone else
  
  ## Deployment
  
  Enligt driftsättningsplan på DO
  Droplet: 1-2kr/timmen (16gb, 4tb transfer)
  Transfer bör räcka för 4h (3000 tittare)
  Tittare kan vara tusentals
  
  https://mediasoup.discourse.group/t/experience-with-mediasoup/1578/19
  
  - Media soup kräver en c++ binär som fetchas vid npm i, kan disablas med
  `MEDIASOUP_SKIP_WORKER_PREBUILT_DOWNLOAD="true"`
  
  https://mediasoup.org/documentation/v3/mediasoup/installation/
  

  https://drive.google.com/drive/u/0/folders/1IGvUmZ_BV2lnH8xwlYpB1FkVgGohCiBG
  
  ————————————————————————————————————————————————————
  
  https://github.com/lyret/iia
  
  https://drive.google.com/drive/u/0/folders/1IGvUmZ_BV2lnH8xwlYpB1FkVgGohCiBG
  
  Slutsatser:
  
  MiroTalk är för svårt att modifera för att användas till ändamålet
  
  Mediasoup verkar ge bättre prestanda än Jitsi
  
  
  Inspiration och källor:
  
  https://github.com/mkhahani/mediasoup-sample-app/blob/master/server.js
  
  https://github.com/edumeet/edumeet/tree/master/server
  
  https://github.com/versatica/mediasoup-demo
  
  ————————————————————————————————————————————————————
  
  Om Jitsi blir aktuellt:
  
  https://www.thecodingartist.com/blogs/creating-custom-jitsi-ui-using-vuejs/
  
  
  
  
  
