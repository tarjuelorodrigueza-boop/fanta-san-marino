import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./styles.css";

/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL = "https://larnilxinubegpvuddgs.supabase.co";
const SUPABASE_KEY = "sb_publishable_NvE3GTkC0hmlBdyM3pouZg_Yu-STMt-";

const supabase =
  SUPABASE_URL && SUPABASE_KEY && SUPABASE_KEY !== "sb_publishable_NvE3GTkC0hmlBdyM3pouZg_Yu-STMt-"
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

/* =========================================================
   FUENTES OFICIALES
   ========================================================= */

const OFFICIAL =
  "https://www.fsgc.sm/it/campionato/campionato-sammarinese/1";

const FIXTURES =
  "https://www.fsgc.sm/it/notizia/fixtures-tonights-draw-kicks-off-2026-27-season/2283";

/* =========================================================
   EQUIPOS 2026/27
   ========================================================= */

const teams = [
  "Virtus",
  "La Fiorita",
  "Tre Fiori",
  "Tre Penne",
  "Folgore/Falciano",
  "Murata",
  "Cailungo",
  "Domagnano",
  "San Marino Academy U22",
  "Fiorentino",
  "Juvenes/Dogana",
  "Faetano",
  "Cosmos",
  "Libertas",
  "Pennarossa",
  "San Giovanni",
];

/* =========================================================
   JUGADORES DE RESPALDO
   ========================================================= */

const demoPlayers = [
  ["828", "Manuel Ferrani", "Tre Penne", "DEF", 8.0],
  ["1036", "Marco Andretta", "Cosmos", "MED", 7.0],
  ["1046", "Giacomo Greco", "Domagnano", "MED", 7.0],
  ["1049", "Benjamin Serifoski", "La Fiorita", "DEL", 10.0],
  ["419", "Tommaso Guidi", "La Fiorita", "DEL", 11.0],
  ["543", "Alex Ambrosini", "Cosmos", "DEL", 9.0],
  ["1034", "Gianmario Piscitella", "Virtus", "DEL", 10.0],
  ["120", "Matteo Vitaioli", "La Fiorita", "DEL", 11.0],
  ["901", "Marseljan Mema", "Tre Fiori", "DEL", 8.5],
  ["429", "Tommaso Leon Bernardi", "Tre Fiori", "DEL", 10.5],
  ["176", "Nicko Sensoli", "Tre Fiori", "DEL", 8.5],
  ["731", "Marco Gasperoni", "Virtus", "DEL", 7.0],
].map(([id, name, team, pos, price]) => ({
  id: String(id),
  name,
  team,
  pos,
  price: Number(price),
}));

/* =========================================================
   CALENDARIO
   ========================================================= */

const fixtures = [
  ["28 AGO", "Virtus", "La Fiorita"],
  ["28 AGO", "Tre Fiori", "Pennarossa"],
  ["29 AGO", "Tre Penne", "San Giovanni"],
  ["29 AGO", "Folgore/Falciano", "Murata"],
  ["30 AGO", "Cailungo", "Domagnano"],
  ["30 AGO", "San Marino Academy U22", "Fiorentino"],
  ["30 AGO", "Juvenes/Dogana", "Faetano"],
  ["30 AGO", "Cosmos", "Libertas"],
];

/* =========================================================
   NAVEGACIÓN
   ========================================================= */

const nav = [
  ["home", "Inicio", "⌂"],
  ["team", "Mi equipo", "⚽"],
  ["market", "Mercado", "↗"],
  ["leagues", "Ligas", "♛"],
  ["players", "Jugadores", "♙"],
  ["calendar", "Calendario", "▣"],
];

/* =========================================================
   UTILIDADES
   ========================================================= */

function euro(value) {
  return `${Number(value || 0).toFixed(1)} M€`;
}

function safeJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

/* =========================================================
   APP PRINCIPAL
   ========================================================= */

function App() {
  const [tab, setTab] = useState("home");

  const [squad, setSquad] = useState(() =>
    safeJSON("fsm_squad", [])
  );

  const [league, setLeague] = useState(() =>
    safeJSON("fsm_league", null)
  );

  const [formation, setFormation] = useState(
    () => localStorage.getItem("fsm_formation") || "4-3-3"
  );

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("Todos");

  const [realPlayers, setRealPlayers] = useState([]);

  const [dataStatus, setDataStatus] = useState(
    supabase ? "Conectando con Supabase..." : "Modo local"
  );

  const [toast, setToast] = useState("");

  const [session, setSession] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loadingPlayers, setLoadingPlayers] = useState(true);

  const budget = 100;

  /* -------------------------------------------------------
     LOCAL STORAGE
     ------------------------------------------------------- */

  useEffect(() => {
    localStorage.setItem("fsm_squad", JSON.stringify(squad));
  }, [squad]);

  useEffect(() => {
    if (league) {
      localStorage.setItem("fsm_league", JSON.stringify(league));
    }
  }, [league]);

  useEffect(() => {
    localStorage.setItem("fsm_formation", formation);
  }, [formation]);

  /* -------------------------------------------------------
     AUTENTICACIÓN
     ------------------------------------------------------- */

  useEffect(() => {
    if (!supabase) {
      setDataStatus("Modo local · Supabase no configurado");
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          console.error(error);
          setDataStatus("Supabase conectado · sesión no disponible");
          return;
        }

        setSession(data.session || null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession || null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* -------------------------------------------------------
     CARGAR JUGADORES DESDE SUPABASE
     ------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function loadPlayers() {
      if (!supabase) {
        setRealPlayers([]);
        setLoadingPlayers(false);
        setDataStatus("Modo local · Supabase no configurado");
        return;
      }

      setLoadingPlayers(true);

      try {
        const { data, error } = await supabase
          .from("players")
          .select("id,name,club,position,price,official_url")
          .eq("active", true)
          .order("name", { ascending: true });

        if (cancelled) return;

        if (error) {
          console.error("Error cargando players:", error);
          setRealPlayers([]);
          setDataStatus("Supabase conectado · error leyendo jugadores");
          return;
        }

        const mapped = (data || []).map((player) => ({
          id: String(player.id),
          name: player.name || "Jugador",
          team: player.club || "Sin equipo",
          pos: player.position || "POS",
          price: Number(player.price || 0) / 1000000,
          fsgc_url: player.official_url || null,
        }));

        setRealPlayers(mapped);
        setDataStatus(`Supabase · ${mapped.length} jugadores`);
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setRealPlayers([]);
          setDataStatus("Supabase conectado · error de conexión");
        }
      } finally {
        if (!cancelled) {
          setLoadingPlayers(false);
        }
      }
    }

    loadPlayers();

    return () => {
      cancelled = true;
    };
  }, []);

  /* -------------------------------------------------------
     JUGADORES
     ------------------------------------------------------- */

  const sourcePlayers = useMemo(() => {
    return realPlayers.length > 0 ? realPlayers : demoPlayers;
  }, [realPlayers]);

  const spent = useMemo(() => {
    return squad.reduce((sum, id) => {
      const player = sourcePlayers.find(
        (p) => String(p.id) === String(id)
      );

      return sum + Number(player?.price || 0);
    }, 0);
  }, [squad, sourcePlayers]);

  const available = Math.max(0, budget - spent);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sourcePlayers.filter((player) => {
      const matchesTeam =
        teamFilter === "Todos" || player.team === teamFilter;

      const searchable =
        `${player.name} ${player.team} ${player.pos}`.toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

      return matchesTeam && matchesSearch;
    });
  }, [sourcePlayers, search, teamFilter]);

  /* -------------------------------------------------------
     TOAST
     ------------------------------------------------------- */

  const flash = (message) => {
    setToast(message);

    window.clearTimeout(window.__fsmToast);

    window.__fsmToast = window.setTimeout(() => {
      setToast("");
    }, 2500);
  };

  /* -------------------------------------------------------
     CREAR / CONSEGUIR EQUIPO SUPABASE
     ------------------------------------------------------- */

  async function getOrCreateRemoteTeam() {
    if (!supabase || !session?.user?.id) {
      return null;
    }

    const userId = session.user.id;

    const existing = await supabase
      .from("teams")
      .select("id,name,budget,formation")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (existing.error) {
      console.error(existing.error);
      throw existing.error;
    }

    if (existing.data) {
      return existing.data;
    }

    const created = await supabase
      .from("teams")
      .insert({
        user_id: userId,
        name: "Mi Fantasy",
        budget: budget,
        formation,
      })
      .select("id,name,budget,formation")
      .single();

    if (created.error) {
      console.error(created.error);
      throw created.error;
    }

    return created.data;
  }

  /* -------------------------------------------------------
     FICHAR
     ------------------------------------------------------- */

  async function buyPlayer(player) {
    if (!player) return;

    if (squad.includes(player.id)) {
      flash("Ya tienes este jugador.");
      return;
    }

    if (squad.length >= 14) {
      flash("Máximo 14 jugadores.");
      return;
    }

    if (available < player.price) {
      flash("No tienes presupuesto suficiente.");
      return;
    }

    try {
      if (supabase && session?.user?.id) {
        const remoteTeam = await getOrCreateRemoteTeam();

        if (remoteTeam) {
          const { error } = await supabase
            .from("team_players")
            .insert({
              team_id: remoteTeam.id,
              player_id: player.id,
              bought_for: player.price * 1000000,
            });

          if (error) {
            console.error(error);
            flash("No se pudo guardar el fichaje.");
            return;
          }
        }
      }

      setSquad((current) => [...current, player.id]);

      flash(`${player.name} fichado.`);
    } catch (error) {
      console.error(error);
      flash("Error al guardar el fichaje.");
    }
  }

  /* -------------------------------------------------------
     VENDER / QUITAR JUGADOR
     ------------------------------------------------------- */

  async function removePlayer(player) {
    if (!player) return;

    try {
      if (supabase && session?.user?.id) {
        const remoteTeam = await getOrCreateRemoteTeam();

        if (remoteTeam) {
          await supabase
            .from("team_players")
            .delete()
            .eq("team_id", remoteTeam.id)
            .eq("player_id", player.id);
        }
      }
    } catch (error) {
      console.error(error);
    }

    setSquad((current) =>
      current.filter((id) => String(id) !== String(player.id))
    );

    flash(`${player.name} eliminado.`);
  }

  /* -------------------------------------------------------
     AUTENTICACIÓN
     ------------------------------------------------------- */

  async function signUp() {
    if (!supabase) {
      flash("Supabase no está configurado.");
      return;
    }

    if (!email || !password) {
      flash("Introduce email y contraseña.");
      return;
    }

    if (password.length < 6) {
      flash("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      flash(error.message);
      return;
    }

    flash("Cuenta creada. Revisa tu correo si pide confirmación.");
  }

  async function signIn() {
    if (!supabase) {
      flash("Supabase no está configurado.");
      return;
    }

    if (!email || !password) {
      flash("Introduce email y contraseña.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      flash(error.message);
      return;
    }

    flash("Sesión iniciada.");
  }

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setSession(null);
    flash("Sesión cerrada.");
  }

  /* -------------------------------------------------------
     CREAR LIGA
     ------------------------------------------------------- */

  async function createLeague() {
    const code = Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase();

    try {
      if (supabase && session?.user?.id) {
        const { data, error } = await supabase
          .from("leagues")
          .insert({
            name: "Liga de amigos",
            invite_code: code,
            owner_id: session.user.id,
          })
          .select("id,name,invite_code")
          .single();

        if (error) {
          console.error(error);
          flash("No se pudo crear la liga.");
          return;
        }

        const memberInsert = await supabase
          .from("league_members")
          .insert({
            league_id: data.id,
            user_id: session.user.id,
          });

        if (memberInsert.error) {
          console.error(memberInsert.error);
        }

        setLeague({
          id: data.id,
          name: data.name,
          code: data.invite_code,
          members: [
            {
              name: email || "Tú",
              points: 0,
            },
          ],
        });

        flash(`Liga creada: ${data.invite_code}`);
        return;
      }

      setLeague({
        name: "Liga local",
        code,
        members: [
          {
            name: "Tú",
            points: 0,
          },
        ],
      });

      flash(`Liga creada: ${code}`);
    } catch (error) {
      console.error(error);
      flash("No se pudo crear la liga.");
    }
  }

  /* -------------------------------------------------------
     RENDER
     ------------------------------------------------------- */

  return (
    <div className="app">
      <header>
        <button
          className="mobile-logo"
          onClick={() => setTab("home")}
        >
          🇸🇲
        </button>

        <div className="logo">
          <div className="logo-mark">SM</div>

          <div>
            <b>FANTA SAN MARINO</b>
            <small>
              Campionato Sammarinese · 2026/27
            </small>
          </div>
        </div>

        <div className="verified">
          <span />
          Fuente principal: FSGC{" "}
          <a
            href={OFFICIAL}
            target="_blank"
            rel="noreferrer"
          >
            ver
          </a>
        </div>

        <div className="user">
          {session ? "✓" : "A"}
        </div>
      </header>

      {!session && (
        <div className="auth-strip">
          <span>
            Conecta tu cuenta para guardar tu equipo y ligas
            online.
          </span>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            type="email"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="contraseña"
            type="password"
          />

          <button
            className="ghost small"
            onClick={signIn}
          >
            Entrar
          </button>

          <button
            className="primary small"
            onClick={signUp}
          >
            Crear cuenta
          </button>
        </div>
      )}

      {session && (
        <div className="auth-strip">
          <span>
            ✓ Sesión iniciada
          </span>

          <button
            className="ghost small"
            onClick={signOut}
          >
            Cerrar sesión
          </button>
        </div>
      )}

      <div className="layout">
        <aside>
          <div className="season">
            TEMPORADA ACTIVA
            <strong>2026/27</strong>
          </div>

          {nav.map(([id, label, icon]) => (
            <button
              key={id}
              className={
                tab === id
                  ? "nav active"
                  : "nav"
              }
              onClick={() => setTab(id)}
            >
              <i>{icon}</i>
              {label}
            </button>
          ))}

          <div className="sync-card">
            <div className="sync-dot" />

            <b>Datos trazables</b>

            <p>
              Los resultados oficiales se guardan con
              fuente, fecha y estado de confirmación.
            </p>

            <a
              href={OFFICIAL}
              target="_blank"
              rel="noreferrer"
            >
              FSGC oficial ↗
            </a>
          </div>
        </aside>

        <main>
          {toast && (
            <div className="toast">
              ✓ {toast}
            </div>
          )}

          {tab === "home" && (
            <Home
              setTab={setTab}
              squad={squad}
              available={available}
              league={league}
            />
          )}

          {tab === "team" && (
            <Team
              squad={squad}
              players={sourcePlayers}
              formation={formation}
              setFormation={setFormation}
              removePlayer={removePlayer}
            />
          )}

          {tab === "market" && (
            <Market
              players={filteredPlayers}
              search={search}
              setSearch={setSearch}
              teamFilter={teamFilter}
              setTeamFilter={setTeamFilter}
              buy={buyPlayer}
              available={available}
              loading={loadingPlayers}
              realPlayers={realPlayers}
            />
          )}

          {tab === "leagues" && (
            <Leagues
              league={league}
              create={createLeague}
              flash={flash}
            />
          )}

          {tab === "players" && (
            <Players
              players={filteredPlayers}
              search={search}
              setSearch={setSearch}
            />
          )}

          {tab === "calendar" && <Calendar />}
        </main>
      </div>

      <footer>
        <span>Fanta San Marino</span>

        <span>
          Datos: <b>{dataStatus}</b>
        </span>

        <span>2026</span>
      </footer>
    </div>
  );
}

/* =========================================================
   HOME
   ========================================================= */

function Home({
  setTab,
  squad,
  available,
  league,
}) {
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">
            FANTASY OFICIALMENTE TRAZABLE
          </span>

          <h1>
            El fantasy del
            <br />
            <em>fútbol de San Marino.</em>
          </h1>

          <p>
            Construye tu equipo, ficha jugadores y
            compite con tus amigos. Los resultados de
            partido se validan primero contra la FSGC.
          </p>

          <div className="hero-actions">
            <button
              className="primary"
              onClick={() => setTab("market")}
            >
              Empezar a fichar →
            </button>

            <button
              className="ghost"
              onClick={() => setTab("leagues")}
            >
              {league
                ? "Ver mi liga"
                : "Crear una liga"}
            </button>
          </div>
        </div>

        <div className="hero-panel">
          <span>JORNADA 1</span>

          <b>28–30</b>

          <strong>AGO 2026</strong>

          <div className="hero-stats">
            <div>
              <b>100</b>
              <small>M€</small>
            </div>

            <div>
              <b>{squad.length}</b>
              <small>PLANTILLA</small>
            </div>

            <div>
              <b>{available.toFixed(1)}</b>
              <small>DISPONIBLE</small>
            </div>
          </div>
        </div>
      </section>

      <div className="stats">
        <Stat
          n="0"
          l="PUNTOS"
          s="Jornada 1"
        />

        <Stat
          n={`${squad.length}/14`}
          l="PLANTILLA"
          s="Jugadores"
        />

        <Stat
          n={euro(available)}
          l="PRESUPUESTO"
          s="Disponible"
        />

        <Stat
          n="0"
          l="LIGAS"
          s="Esta temporada"
        />
      </div>

      <div className="columns">
        <Card
          title="Primera jornada"
          action="Calendario →"
          onAction={() => setTab("calendar")}
        >
          <div className="fixture-list">
            {fixtures
              .slice(0, 5)
              .map((fixture, index) => (
                <Fixture
                  key={index}
                  f={fixture}
                />
              ))}
          </div>
        </Card>

        <Card title="Cómo funciona">
          <Rule
            n="01"
            t="Fichas"
            d="Empieza con 100 M€ y construye una plantilla de hasta 14 jugadores."
          />

          <Rule
            n="02"
            t="Puntúas"
            d="El motor convierte estadísticas de partido en puntos fantasy cuando la jornada se cierra."
          />

          <Rule
            n="03"
            t="Compites"
            d="Crea una liga privada y comparte un código con tus amigos."
          />
        </Card>
      </div>

      <div className="source-banner">
        <div className="source-icon">✓</div>

        <div>
          <b>
            Fuente de resultados: Federazione
            Sammarinese Giuoco Calcio
          </b>

          <p>
            La FSGC ha fijado la primera jornada
            2026/27 para el fin de semana del
            28–30 de agosto de 2026.
          </p>
        </div>

        <a
          href={FIXTURES}
          target="_blank"
          rel="noreferrer"
        >
          Comprobar fuente ↗
        </a>
      </div>
    </>
  );
}

/* =========================================================
   COMPONENTES GENERALES
   ========================================================= */

function Stat({ n, l, s }) {
  return (
    <div className="stat">
      <span>{l}</span>
      <b>{n}</b>
      <small>{s}</small>
    </div>
  );
}

function Card({
  title,
  action,
  onAction,
  children,
}) {
  return (
    <section className="card">
      <div className="card-title">
        <h2>{title}</h2>

        {action && (
          <button onClick={onAction}>
            {action}
          </button>
        )}
      </div>

      {children}
    </section>
  );
}

function Rule({ n, t, d }) {
  return (
    <div className="rule">
      <b>{n}</b>

      <div>
        <strong>{t}</strong>
        <p>{d}</p>
      </div>
    </div>
  );
}

function Fixture({ f }) {
  return (
    <div className="fixture">
      <small>{f[0]}</small>
      <b>{f[1]}</b>
      <span>vs</span>
      <b>{f[2]}</b>
      <i>—</i>
    </div>
  );
}

function PageHead({
  tag,
  title,
  text,
  right,
}) {
  return (
    <div className="page-head">
      <div>
        <span className="eyebrow">{tag}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>

      {right}
    </div>
  );
}

/* =========================================================
   MI EQUIPO
   ========================================================= */

function Team({
  squad,
  players,
  formation,
  setFormation,
  removePlayer,
}) {
  const picked = squad
    .map((id) =>
      players.find(
        (p) => String(p.id) === String(id)
      )
    )
    .filter(Boolean);

  const rows = {
    "4-3-3": [1, 4, 3, 3],
    "3-5-2": [1, 3, 5, 2],
    "4-4-2": [1, 4, 4, 2],
    "3-4-3": [1, 3, 4, 3],
  };

  const spent = picked.reduce(
    (total, player) =>
      total + Number(player.price || 0),
    0
  );

  return (
    <>
      <PageHead
        tag="MI EQUIPO"
        title="Mi plantilla"
        text="Elige formación y prepara tu once."
        right={
          <div className="money-box">
            <small>DISPONIBLE</small>
            <b>{euro(100 - spent)}</b>
          </div>
        }
      />

      <div className="formations">
        {Object.keys(rows).map((value) => (
          <button
            key={value}
            className={
              value === formation
                ? "selected"
                : ""
            }
            onClick={() => setFormation(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="pitch">
        {rows[formation].map((count, row) => (
          <div
            className="pitch-row"
            key={row}
          >
            {Array.from(
              { length: count },
              (_, index) => {
                const player =
                  picked.length > 0
                    ? picked[
                        (row * 3 + index) %
                          picked.length
                      ]
                    : null;

                return (
                  <div
                    className="pitch-player"
                    key={index}
                  >
                    <div className="player-circle">
                      {player ? "⚽" : "+"}
                    </div>

                    <b>
                      {player
                        ? player.name.split(
                            " "
                          )[0]
                        : "Vacío"}
                    </b>

                    <small>
                      {player?.pos || "POS"}
                    </small>
                  </div>
                );
              }
            )}
          </div>
        ))}
      </div>

      <Card
        title={`Plantilla · ${picked.length}/14`}
      >
        <div className="table">
          {picked.length ? (
            picked.map((player) => (
              <div
                className="table-row"
                key={player.id}
              >
                <b>{player.name}</b>

                <span>{player.team}</span>

                <span>{player.pos}</span>

                <strong>
                  {euro(player.price)}
                </strong>

                <button
                  className="ghost small"
                  onClick={() =>
                    removePlayer(player)
                  }
                >
                  Quitar
                </button>
              </div>
            ))
          ) : (
            <div className="empty">
              No tienes jugadores todavía.
              Ve al Mercado para empezar.
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

/* =========================================================
   MERCADO
   ========================================================= */

function Market({
  players,
  search,
  setSearch,
  teamFilter,
  setTeamFilter,
  buy,
  available,
  loading,
  realPlayers,
}) {
  return (
    <>
      <PageHead
        tag="MERCADO"
        title="Fichajes"
        text="Encuentra jugadores y controla tu presupuesto."
        right={
          <div className="money-box">
            <small>DISPONIBLE</small>
            <b>{euro(available)}</b>
          </div>
        }
      />

      <div className="filters">
        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Buscar jugador o equipo..."
        />

        <select
          value={teamFilter}
          onChange={(e) =>
            setTeamFilter(e.target.value)
          }
        >
          <option>Todos</option>

          {teams.map((team) => (
            <option
              key={team}
              value={team}
            >
              {team}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="demo-warning">
          ⏳ Conectando con Supabase y cargando
          jugadores...
        </div>
      )}

      {!loading && !realPlayers.length && (
        <div className="demo-warning">
          ⚠ No se han podido cargar los jugadores
          de Supabase. Se está utilizando la
          lista de respaldo.
        </div>
      )}

      {!loading && realPlayers.length > 0 && (
        <div className="demo-warning">
          ✓ Supabase conectado ·{" "}
          {realPlayers.length} jugadores cargados
        </div>
      )}

      <div className="player-grid">
        {players.length ? (
          players.map((player) => (
            <article
              className="player-card"
              key={player.id}
            >
              <div className="player-meta">
                <span>{player.pos}</span>
                <small>{player.team}</small>
              </div>

              <div className="avatar-ball">
                ⚽
              </div>

              <h3>{player.name}</h3>

              <p>{player.team}</p>

              <div className="player-price">
                <b>{euro(player.price)}</b>

                <button
                  className="primary small"
                  onClick={() => buy(player)}
                >
                  Fichar
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty big">
            No se han encontrado jugadores.
          </div>
        )}
      </div>
    </>
  );
}

/* =========================================================
   JUGADORES
   ========================================================= */

function Players({
  players,
  search,
  setSearch,
}) {
  return (
    <>
      <PageHead
        tag="BASE DE DATOS"
        title="Jugadores"
        text="Ranking y valores fantasy."
      />

      <div className="filters">
        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Buscar..."
        />
      </div>

      <Card title="Ranking">
        <div className="table table-head">
          <span>Jugador</span>
          <span>Equipo</span>
          <span>Posición</span>
          <span>Valor</span>
        </div>

        {players.map((player, index) => (
          <div
            className="table-row"
            key={player.id}
          >
            <b>
              #{index + 1} · {player.name}
            </b>

            <span>{player.team}</span>

            <span>{player.pos}</span>

            <strong>
              {euro(player.price)}
            </strong>
          </div>
        ))}
      </Card>
    </>
  );
}

/* =========================================================
   LIGAS
   ========================================================= */

function Leagues({
  league,
  create,
  flash,
}) {
  function joinLeague() {
    const code = window.prompt(
      "Código de invitación"
    );

    if (!code) return;

    if (
      league &&
      code.trim().toUpperCase() ===
        league.code
    ) {
      flash("Ya estás en esta liga.");
      return;
    }

    flash(
      "La búsqueda de ligas por código se conectará con Supabase."
    );
  }

  return (
    <>
      <PageHead
        tag="COMPETICIÓN"
        title="Mis ligas"
        text="Ligas privadas para competir con tus amigos."
        right={
          <div className="hero-actions">
            <button
              className="ghost"
              onClick={joinLeague}
            >
              Unirme con código
            </button>

            <button
              className="primary"
              onClick={create}
            >
              Crear liga
            </button>
          </div>
        }
      />

      {league ? (
        <div className="columns">
          <Card title={league.name}>
            <div className="invite">
              <small>CÓDIGO</small>

              <b>{league.code}</b>

              <button
                onClick={() =>
                  navigator.clipboard?.writeText(
                    league.code
                  )
                }
              >
                Copiar código
              </button>
            </div>
          </Card>

          <Card title="Clasificación">
            <div className="standings">
              {league.members.map(
                (member, index) => (
                  <div
                    className="standing"
                    key={index}
                  >
                    <b>{index + 1}</b>

                    <span>
                      {member.name}
                    </span>

                    <strong>
                      {member.points} pts
                    </strong>
                  </div>
                )
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="empty big">
          <b>
            Aún no tienes ninguna liga
          </b>

          <p>
            Crea una y comparte el código
            con tus amigos.
          </p>

          <button
            className="primary"
            onClick={create}
          >
            Crear mi liga
          </button>
        </div>
      )}
    </>
  );
}

/* =========================================================
   CALENDARIO
   ========================================================= */

function Calendar() {
  return (
    <>
      <PageHead
        tag="FSGC · CALENDARIO"
        title="Campionato Sammarinese 2026/27"
        text="Primera jornada: 28–30 de agosto de 2026."
        right={
          <a
            className="source-btn"
            href={FIXTURES}
            target="_blank"
            rel="noreferrer"
          >
            Fuente oficial ↗
          </a>
        }
      />

      <Card title="Jornada 1">
        <div className="fixture-list">
          {fixtures.map(
            (fixture, index) => (
              <Fixture
                f={fixture}
                key={index}
              />
            )
          )}
        </div>
      </Card>

      <div className="source-banner">
        <div className="source-icon">
          F
        </div>

        <div>
          <b>
            Sincronización de resultados
          </b>

          <p>
            Prioridad: FSGC. Una segunda
            fuente puede servir para detectar
            discrepancias, pero el resultado
            oficial manda.
          </p>
        </div>

        <a
          href={OFFICIAL}
          target="_blank"
          rel="noreferrer"
        >
          Abrir FSGC ↗
        </a>
      </div>
    </>
  );
}

/* =========================================================
   ARRANQUE
   ========================================================= */

const rootElement =
  document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <App />
  );
}
