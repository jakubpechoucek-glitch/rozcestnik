# Globální pravidla pro Claude Code

Platí pro všechny moje projekty. Projektové `CLAUDE.md` mají přednost, pokud si protiřečí.

## 1. Komunikace
- Odpovídej česky, stručně a srozumitelně. Programovat neumím, takže nevysvětluj žargonem a shrň, co se změnilo a co mám zkontrolovat.
- Často píšu z mobilu krátkými zprávami. Pokud je zadání nejasné, polož jednu konkrétní otázku.
- Když se ptám „jak to funguje“ nebo „co je to“, jen vysvětli. Nic neměň, dokud neřeknu „uprav to“ nebo „ano“.
- Při více možnostech je očísluj, doporuč jednu a stručně napiš proč. Odpovídám typicky „ano, udělej 1 + 2“.
- Ptej se na účel („k čemu to bude“), pokud ho neznáš. Podle něj navrhni lepší řešení, než zadám.
- Nevymýšlej si. Co jsi neověřil, označ jako předpoklad.

## 2. Pracovní postup
- Dělej malé kroky a po každém ukaž výsledek. Změnu si sám otevři v prohlížeči (Playwright), udělej screenshot a pusť testy.
- Větší věci nejdřív rozepiš (zadání, datový model, otevřené otázky do `docs/`) a nech mě rozhodnout sporné body. Až potom stav.
- Stav projektu veď v repu (`PROGRESS.md` nebo roadmapa). Na začátku sezení si ho přečti, na konci aktualizuj.
- Pracuj na přidělené větvi. Commity piš česky, popisně, ve tvaru „co a proč“.
- PR, merge a sledování PR dělej jen na vyžádání („udělej PR do mainu“, „mergni to“, „sleduj PR“). Po merge ověř nasazení (GitHub Pages, Render logy) a řekni mi, co mám zkontrolovat.
- Dočasné soubory (skripty, screenshoty, `ui-test*.js`) dávej mimo repo, do scratchpadu, a nekomituj je.

## 3. Ověřuj, nepředpokládej
- Když opravuješ chybu, projdi i sourozenecká místa se stejným vzorcem (např. další sekce, jiný pohled).
- Pochybuju-li o faktech (pravidla škol, formáty, API), ověř je u zdroje. Vzorek stačí, ale řekni, co jsi zkontroloval.
- Při divném chování se podívej na skutečná data a logy (databáze, Render, konzole), než začneš hádat.
- Před „hotovo“ spusť testy a prokliknutí na mobilní i desktopové šířce. Pokud něco nejde ověřit, napiš to.
- Chyby externích služeb (403, 401, timeout) nesmí selhat potichu. Ukaž srozumitelný stav v UI a v logu.

## 4. Soukromí (nejdůležitější)
- Repozitáře jsou veřejné. Do gitu nikdy nepatří osobní, zdravotní, finanční ani školní data, klíče, tokeny, zdrojové Excely ani PDF.
- Skutečná data žijí v databázi za přihlášením, lokální kopie v ignorované složce, v `.gitignore`.
- Ukázky a testy používej se smyšlenými daty (`?demo`) a neutrálními jmény.
- Před každým pushem proveď kontrolu repa na osobní údaje a tajné hodnoty (`git diff`, grep na jména, e-maily, klíče). Řekni mi, že proběhla.
- Tajné klíče patří do proměnných prostředí služby, nikdy do kódu ani commitu.

## 5. Výchozí technologie
- Nejdřív nejjednodušší řešení: statická stránka (HTML, CSS, vanilla JS) na GitHub Pages, bez buildu. Server přidej, až je opravdu potřeba.
- Data a přihlášení: Supabase s Row Level Security, přihlášení přes Google (společné SSO s Rozcestníkem).
- Vlastní backend (API, plánované úlohy, SQLite): Render. Free tarif usíná, první načtení trvá asi minutu. SQLite pouštěj ve WAL režimu.
- Plánované úlohy bez serveru: GitHub Actions cron.
- Excel → aplikace: projdi list po listu, sepiš datový model a vzorce, najdi chyby v datech, pak stav. Excel slouží jen k jednorázovému importu.
- Výpočty drž v samostatném souboru bez práce se stránkou, aby šly testovat.
- Přidávej verzi k JS/CSS (`app.js?v=abc123`), protože mobilní prohlížeče drží starou mezipaměť.
- Každá aplikace má režim `?demo` s paměťovým úložištěm a smyšlenými daty.

## 6. Standardy UI/UX
- Mobile first. Ověř i desktop.
- Dlaždice a seznamy drž kompaktní, ať se nemusí dlouho scrollovat. Přidej vyhledávání, filtry a „sbalit/rozbalit vše“, kde je obsahu hodně.
- Stav je vidět na první pohled: barevné rozlišení (OK / k ověření / k dořešení), výrazné nadpisy, zřetelná navigace. Vyhýbej se jednotvárným stránkám.
- Důležité pohledy mají sdílitelný odkaz (např. `#nakup/tyden`), který přežije přihlášení.
- Kde jsou data po osobách, přidej přepínač osob.
- Výchozí zobrazení má odpovídat reálnému použití (např. aktuální týden až do pondělka).
- Data, která zadávám z jiného zařízení, ukládej do databáze, ne do lokálního stavu prohlížeče.

## 7. Známé pasti
- Editační nástroj selže, pokud se soubor změnil mimo něj. Před úpravou ho načti znovu.
- Zkontroluj, že odkazy mezi aplikacemi a Rozcestníkem po změně URL stále fungují.
- Odhlášení má smazat lokální relaci vždy, i když server selže.
- Po nasazení na Render sleduj logy, ať vidíš, že služba opravdu naběhla.
