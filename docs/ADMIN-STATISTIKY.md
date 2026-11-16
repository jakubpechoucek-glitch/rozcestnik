# Přístupy rodiny a stránka pro správce (návrh)

Stav: **návrh k odsouhlasení, nic z toho zatím není v databázi ani v kódu.**
Rozhodnuto: sledovat kliknutí na dlaždici i vstup do chráněné aplikace; ukládat přesný seznam (kdo, co, kdy); držet 1 rok; členové rodiny se o sledování dozvědí.

## K čemu to je
Zjistit, které projekty rodina skutečně používá, kdo co otevírá a jak to roste v čase. Podle toho se rozhodne, co vylepšit a co zrušit.

## Co se zaznamenává
Jeden řádek při:
1. **Kliknutí na dlaždici** v Rozcestníku (`zdroj = dlazdice`).
2. **Vstupu do chráněné aplikace** po úspěšném přihlášení (`zdroj = aplikace`). Zapisuje to společný `auth.js`, takže stačí jedna úprava pro všechny aplikace včetně přímých vstupů ze záložky nebo z plochy telefonu.

Nezaznamenává se: čas strávený v aplikaci, IP adresa, obsah stránek, nic z `?demo` a nic z aplikací bez přihlášení.

## Datový model
Tabulka `pristupy`:

| Sloupec | Typ | Poznámka |
|---|---|---|
| `id` | bigint, identity | |
| `cas` | timestamptz, výchozí `now()` | |
| `email` | text | doplní databáze z přihlášení, klient ho poslat nemůže |
| `projekt` | text | krátký název z adresy (např. `rodinne-cesty`); název dlaždice se mapuje na stránce správce |
| `zdroj` | text | `dlazdice` nebo `aplikace` |
| `zarizeni` | text | `mobil` / `pocitac` / `neznamo` (hrubě podle šířky obrazovky) |

Tabulka `clenove` dostane sloupec `spravce boolean not null default false`. Nastaví se jen u jednoho člena přímo v databázi (e-mail se nedostane do repozitáře).

## Oprávnění (Row Level Security)
- **Zápis:** jen přihlášený člen rodiny a jen za sebe (`email` musí odpovídat přihlášení). Žádné úpravy ani mazání ze stránky.
- **Čtení:** jen správce (`je_spravce()`, stejný vzor jako existující `je_clen()`). Ostatní členové svoje záznamy ani cizí nevidí.
- Stránka `/admin/` se schová i ostatním, ale hlavní ochrana je v databázi, ne v kódu stránky.

## Stránka pro správce (`/admin/`)
Mobile first, bez knihoven (jednoduché SVG/CSS grafy):
- Ukazatele: vstupy za 7 a 30 dní, počet aktivních osob, nejoblíbenější projekt.
- Pořadí projektů (sloupce), kdo × projekt (tabulka s barevnou intenzitou), vývoj po dnech a týdnech.
- Seznam posledních záznamů s filtry (osoba, projekt, období), přepínač osob.
- Barevné stavy: kdo se dlouho neukázal, projekt bez návštěv za 90 dní.
- Sdílitelný odkaz `#admin/...`, režim `?demo` se smyšlenými daty a jmény.
- Nemá-li člen oprávnění, uvidí srozumitelné „Nemáte přístup“, ne prázdnou stránku.

## Chování při chybě
Zápis přístupu nesmí zpomalit ani rozbít aplikaci: odešle se na pozadí s krátkým limitem a chyba se jen zapíše do konzole. Je to záměrná výjimka z pravidla „chyby nesmí selhat potichu“, protože jde o vedlejší měření, ne o data uživatele.

## Soukromí
- Záznamy jsou jen v databázi za přihlášením, v repozitáři nic osobního.
- Na Rozcestníku bude jedna věta o tom, co se zaznamenává a kdo to vidí.
- Záznamy starší než 1 rok se mažou (viz otevřená otázka 2).

## Postup po odsouhlasení
1. Migrace: tabulka `pristupy`, sloupec `spravce`, funkce `je_spravce()`, pravidla, indexy. Testy: správce čte, jiný člen nečte, nečlen nezapíše, cizí e-mail se nepřijme.
2. Zápis přístupů: kliknutí na dlaždici v `index.html`, vstup do aplikace v `auth.js`.
3. Stránka `/admin/` s demem, test na mobilu i počítači.
4. Věta o sledování na Rozcestníku, karta v Dokumentaci (sekce Jak je to postavené) a odkaz zpět do Rozcestníku.
5. Kontrola nasazení a první skutečná data.

## Otevřené otázky
1. Který člen (jméno v tabulce `clenove`) má být správce? Doporučení: ten, kdo se přihlašuje jako vy.
2. Jak mazat po roce: doporučuju denní úklid přímo v databázi, pokud je dostupný (ověřím), jinak plánovaná úloha na GitHubu.
3. Mají se počítat i vaše vlastní vstupy? Doporučení: ano, s možností je ve stránce skrýt.
4. Znění věty pro rodinu. Návrh: „Rozcestník si zaznamenává, kdo a kdy otevřel kterou aplikaci. Záznamy vidí jen správce a po roce se mažou.“
