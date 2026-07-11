# PresseSjekk – Operative agenter

## Formål med mappen

Denne mappen inneholder den prosjektspesifikke, operative agentstrukturen for **PresseSjekk.no** i Remøy AI OS. Dokumentene her gjør en generell rolle fra Remøy AI OS om til en konkret, styrbar arbeidsagent for PresseSjekk – med tydelige regler, forbud, godkjenningsflyt og loggføring.

Første agent i mappen er **PresseSjekk Markedsføringsagent v1**.

## Dokumenter i mappen

- **`README.md`** (dette dokumentet) – forklarer formål, innhold, konfliktrekkefølge og bruk.
- **`markedsforingsagent-v1.md`** – agentens operative instruks (rolle, oppgaver, arbeidsflyt, kanalregler, leveranseformat).
- **`merkevare-og-sikkerhetsregler.md`** – stabil fasit for merkevare, tone, tillatte/forbudte formuleringer og juridiske/etiske grenser.
- **`kampanjelogg.md`** – enkel mal for å registrere kampanjer, resultater og læring.

## Hvilken fil som er styrende ved konflikt

Ved uenighet eller motstrid gjelder denne rekkefølgen (øverst vinner):

1. **Godkjente beslutninger fra Øystein** (siste gjeldende beslutning).
2. **Merkevare- og sikkerhetsreglene** (`merkevare-og-sikkerhetsregler.md`).
3. **Markedsføringsagentens operative instruks** (`markedsforingsagent-v1.md`).
4. **Enkeltstående kampanjeoppgaver** (oppdrag gitt til agenten).
5. **Kampanjeloggen** (`kampanjelogg.md`).

## Hvordan agenten brukes manuelt

1. Øystein (eller ChatGPT på vegne av Øystein) gir agenten et konkret oppdrag.
2. Agenten lager et publiseringsklart **utkast** i standard leveranseformat.
3. ChatGPT kan strukturere og kvalitetssikre utkastet.
4. **Øystein godkjenner alt** før noe brukes.
5. Publisering og utsending skjer **manuelt** av mennesker.
6. Resultater og tilbakemeldinger registreres i kampanjeloggen.

Agenten leverer altså ferdige utkast, men publiserer aldri selv.

## Godkjenning før publisering

Ingenting fra denne agenten skal publiseres, sendes ut eller annonseres uten at **Øystein har godkjent det**. Claude skal ikke publisere markedsføring automatisk, og skal ikke koble agenten til annonse- eller publiseringsverktøy.

## Plass i Remøy AI OS

Denne agenten er **prosjektspesifikk** og ligger **under** den generelle **Marketing Agent**-rollen i Remøy AI OS. Den generelle rollen er dokumentert i `03-ai-agents.md` i Remøy AI OS-kunnskapslageret, som ligger **utenfor dette repoet** (skrivebeskyttet). Den generelle rollen beskriver ansvarsområdet på OS-nivå; dokumentene i denne mappen er den operative konfigurasjonen for PresseSjekk.
