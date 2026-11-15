// Společné přihlášení rodiny pro všechny weby na jakubpechoucek-glitch.github.io.
//
// Weby sdílejí jeden origin, takže přihlášení uložené tady (localStorage)
// vidí všechny. Chráněný web načte:
//   <script src="/rozcestnik/vendor/supabase-js-2.45.4.js"></script>
//   <script src="/rozcestnik/auth.js"></script>
// a zavolá  await RodinaAuth.vyzadujPrihlaseni()  – nepřihlášeného pošle na
// Rozcestník a po přihlášení ho vrátí zpět.
//
// Klíč níže je veřejný „anon/publishable" klíč Supabase – smí být v kódu,
// data chrání pravidla v databázi (jen členové rodiny z tabulky clenove).
(function () {
  "use strict";

  const SUPABASE_URL = "https://unoefgbzymlwwehgzusf.supabase.co";
  const SUPABASE_KEY = "sb_publishable_0slnWPDezyFgiOmUGDal4Q_B5ZGz7i_";  // veřejný publishable klíč

  const LOGIN_URL = "/rozcestnik/";
  // Přišel uživatel z e-mailového odkazu na obnovu hesla? (zjistit dřív,
  // než klient Supabase token z adresy zpracuje a smaže)
  const zOdkazuNaObnovu = /type=recovery/.test(location.hash);
  const nastaveno = Boolean(SUPABASE_URL && SUPABASE_KEY && window.supabase);
  const client = nastaveno
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "rodina-auth" },
      })
    : null;

  // { session, clen, jmeno, email } – clen = je e-mail v tabulce clenove
  async function stav() {
    if (!client) return { session: null, clen: false };
    const { data } = await client.auth.getSession();
    const session = data.session;
    if (!session) return { session: null, clen: false };
    const [c, j] = await Promise.all([client.rpc("je_clen"), client.rpc("moje_jmeno")]);
    return { session, clen: c.data === true, jmeno: j.data || session.user.email, email: session.user.email };
  }

  async function prihlasit(email, heslo) {
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password: heslo });
    if (error) throw new Error(error.message === "Invalid login credentials" ? "Špatný e-mail nebo heslo." : error.message);
  }

  // Přihlášení Google účtem; po návratu z Googlu se pokračuje na téže adrese
  // (včetně ?next=). Pustí jen e-maily z tabulky clenove.
  async function prihlasitGoogle() {
    const { error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.href } });
    if (error) throw error;
  }

  // Smaže přihlášení jen v tomto prohlížeči. Nespoléháme na odpověď serveru: relace tam už nemusí existovat
  // (zrušilo ji odhlášení jinde) a server pak odpoví 403, po kterém knihovna lokální relaci nesmaže.
  async function zrusMistniRelaci() {
    try { if (client) await client.auth.signOut({ scope: "local" }); } catch (e) {}
    try { localStorage.removeItem("rodina-auth"); } catch (e) {}
  }

  // Odhlášení jen na tomto zařízení. Dřívější „global“ rušilo relace na všech zařízeních a na ostatních zůstávaly
  // neplatné relace, ze kterých se pak nešlo odhlásit ani se přihlásit k webům na jiné doméně.
  async function odhlasit() {
    await zrusMistniRelaci();
    location.href = LOGIN_URL;
  }

  // Přístupový token bývá časově platný i po zrušení relace na serveru (odhlášení na jiném zařízení): server
  // pak odpovídá 403 session_not_found. Relaci proto ověříme dotazem na server a neplatnou smažeme.
  // Při síťové chybě nic nerušíme (nejsme si jisti). Vrací true, pokud je relace v pořádku.
  async function platnaRelace() {
    if (!client) return false;
    const { data } = await client.auth.getSession();
    if (!data.session) return false;
    try {
      const { error } = await client.auth.getUser();
      if (error && (error.status === 401 || error.status === 403)) { await zrusMistniRelaci(); return false; }
    } catch (e) { /* bez spojení */ }
    return true;
  }

  async function obnovaHesla(email) {
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + LOGIN_URL });
    if (error) throw error;
  }

  async function noveHeslo(heslo) {
    const { error } = await client.auth.updateUser({ password: heslo });
    if (error) throw error;
  }

  // Bezpečný návrat jen na stránku ve stejném originu (žádný open redirect)
  function bezpecnyNavrat(next) {
    if (!next) return null;
    try {
      const u = new URL(next, location.origin);
      return u.origin === location.origin ? u.href : null;
    } catch (e) {
      return null;
    }
  }

  // Weby na jiné doméně (nevidí náš localStorage), kterým smíme předat
  // přihlášení. Jen tyto pevné adresy – token nikdy nepošleme jinam.
  const SSO_CILE = {
    lukas: "https://lukas-university.onrender.com/",
    zdravi: "https://health-dashboard-5621.onrender.com/",
  };

  // Adresa cílového webu s aktuálním přístupovým tokenem v části za #
  // (cíl si ho ověří u Supabase a z adresy ho hned smaže). Bez přihlášení null.
  async function odkazSPrihlasenim(cil) {
    const url = SSO_CILE[cil];
    if (!url || !client) return null;
    if (!(await platnaRelace())) return null;          // nikdy nepředat token zrušené relace
    const { data } = await client.auth.getSession();
    const token = data.session?.access_token;
    return token ? url + "#sso=" + encodeURIComponent(token) : null;
  }

  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // Celostránkové hlášení místo obsahu (nenastaveno / bez oprávnění)
  function hlaska(nadpis, text, tlacitka) {
    document.documentElement.classList.remove("auth-ceka");
    document.body.innerHTML = `
      <div style="min-height:100vh;display:grid;place-items:center;padding:16px;font:16px/1.5 Inter,system-ui,sans-serif;background:#f4f2ee;color:#1c1c1e">
        <div style="max-width:420px;text-align:center">
          <div style="font-size:2.4rem">🔒</div>
          <h1 style="font:600 1.6rem Fraunces,Georgia,serif;margin:8px 0">${nadpis}</h1>
          <p style="color:#66656b">${text}</p>
          <p>${tlacitka || `<a href="${LOGIN_URL}" style="color:inherit">Na Rozcestník</a>`}</p>
        </div>
      </div>`;
  }

  // Strážce chráněné stránky. Vrací stav přihlášení, nebo přesměruje.
  async function vyzadujPrihlaseni() {
    if (!nastaveno) {
      hlaska("Přihlášení není nastavené", "Chybí připojení k Supabase (soubor rozcestnik/auth.js).");
      return null;
    }
    const s = await stav();
    if (!s.session) {
      location.replace(LOGIN_URL + "?next=" + encodeURIComponent(location.href));
      return null;
    }
    if (!s.clen) {
      hlaska("Nemáte přístup", `Účet ${esc(s.email)} není mezi členy rodiny.`,
        `<button onclick="RodinaAuth.odhlasit()" style="font:inherit;padding:8px 16px;border-radius:999px;border:0;background:#1c1c1e;color:#fff;cursor:pointer">Odhlásit</button>`);
      return null;
    }
    document.documentElement.classList.remove("auth-ceka");
    return s;
  }

  window.RodinaAuth = {
    client, nastaveno, LOGIN_URL, zOdkazuNaObnovu,
    stav, platnaRelace, prihlasit, prihlasitGoogle, odhlasit, obnovaHesla, noveHeslo, bezpecnyNavrat, vyzadujPrihlaseni,
    SSO_CILE, odkazSPrihlasenim,
  };
})();
