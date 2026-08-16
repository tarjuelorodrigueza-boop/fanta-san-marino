import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";import { createClient } from "@supabase/supabase-js";

const OFFICIAL =
  "https://www.fsgc.sm/it/campionato/campionato-sammarinese/1";

const FIXTURES =
  "https://www.fsgc.sm/it/notizia/fixtures-tonights-draw-kicks-off-2026-27-season/2283";

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
  "San Giovanni"
];

const playersData = [
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
  ["731", "Marco Gasperoni", "Virtus", "DEL", 7.0]
].map(([id, name, team, pos, price]) => ({
  id,
  name,
  team,
  pos,
  price
}));

const fixtures = [
  ["28 AGO", "Virtus", "La Fiorita"],
  ["28 AGO", "Tre Fiori", "Pennarossa"],
  ["29 AGO", "Tre Penne", "San Giovanni"],
  ["29 AGO", "Folgore/Falciano", "Murata"],
  ["30 AGO", "Cailungo", "Domagnano"],
  ["30 AGO", "San Marino Academy U22", "Fiorentino"],
  ["30 AGO", "Juvenes/Dogana", "Faetano"],
  ["30 AGO", "Cosmos", "Libertas"]
];

const nav = [
  ["home", "Inicio", "⌂"],
  ["team", "Mi equipo", "⚽"],
  ["market", "Mercado", "↗"],
  ["leagues", "Ligas", "♛"],
  ["players", "Jugadores", "♙"],
  ["calendar", "Calendario", "▣"]
];

function euro(n) {
  return `${Number(n).toFixed(1)} M€`;
}

function App() {
  const [tab, setTab] = useState("home");

  const [squad, setSquad] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fsm_squad") || "[]");
    } catch {
      return [];
    }
  });

  const [league, setLeague] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fsm_league") || "null");
    } catch {
      return null;
    }
  });

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("Todos");
  const [toast, setToast] = useState("");
  const [formation, setFormation] = useState("4-3-3");

  const budget = 100;

  useEffect(() => {
    localStorage.setItem("fsm_squad", JSON.stringify(squad));
  }, [squad]);

  useEffect(() => {
    if (league) {
      localStorage.setItem("fsm_league", JSON.stringify(league));
    }
  }, [league]);

  const spent = squad.reduce((sum, id) => {
    const player = playersData.find((p) => p.id === id);
    return sum + (player?.price || 0);
  }, 0);

  const available = budget - spent;

  const players = playersData.filter((p) => {
    const matchesTeam =
      teamFilter === "Todos" || p.team === teamFilter;

    const text = `${p.name} ${p.team} ${p.pos}`.toLowerCase();

    return matchesTeam && text.includes(search.toLowerCase());
  });

  const flash = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2200);
  };

  const buy = (player) => {
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

    setSquad([...squad, player.id]);
    flash(`${player.name} fichado.`);
  };

  const createLeague = () => {
    const code = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    const newLeague = {
      name: "Liga de amigos",
      code,
      members: [
        {
          name: "Tú",
          points: 0
        }
      ]
    };

    setLeague(newLeague);
    flash(`Liga creada: ${code}`);
  };

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
          <span></span>
          Fuente principal: FSGC
          <a
            href={OFFICIAL}
            target="_blank"
            rel="noreferrer"
          >
            ver
          </a>
        </div>

        <div className="user">A</div>
      </header>

      <div className="layout">

        <aside>

          <div className="season">
            TEMPORADA ACTIVA
            <strong>2026/27</strong>
          </div>

          {nav.map(([id, label, icon]) => (
            <button
              key={id}
              className={tab === id ? "nav active" : "nav"}
              onClick={() => setTab(id)}
            >
              <i>{icon}</i>
              {label}
            </button>
          ))}

          <div className="sync-card">
            <div className="sync-dot"></div>

            <b>Datos trazables</b>

            <p>
              Los resultados oficiales se guardan
              tomando como referencia la FSGC.
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
              players={playersData}
              formation={formation}
              setFormation={setFormation}
            />
          )}

          {tab === "market" && (
            <Market
              players={players}
              search={search}
              setSearch={setSearch}
              teamFilter={teamFilter}
              setTeamFilter={setTeamFilter}
              buy={buy}
              available={available}
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
              players={players}
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
          Datos: <b>Base fantasy local</b>
        </span>
        <span>2026</span>
      </footer>

    </div>
  );
}

function Home({ setTab, squad, available, league }) {
  return (
    <>
      <section className="hero">

        <div>
          <span className="eyebrow">
            FANTASY DE SAN MARINO
          </span>

          <h1>
            El fantasy del
            <br />
            <em>fútbol de San Marino.</em>
          </h1>

          <p>
            Construye tu equipo, ficha jugadores
            y compite con tus amigos.
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
              {league ? "Ver mi liga" : "Crear una liga"}
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
          n={league ? "1" : "0"}
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
            {fixtures.slice(0, 5).map((f, i) => (
              <Fixture key={i} f={f} />
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
            d="Los jugadores generan puntos según sus actuaciones."
          />

          <Rule
            n="03"
            t="Compites"
            d="Crea una liga privada y comparte un código con tus amigos."
          />

        </Card>

      </div>

      <div className="source-banner">

        <div className="source-icon">
          ✓
        </div>

        <div>
          <b>
            Fuente de resultados: FSGC
          </b>

          <p>
            Consulta el calendario oficial de la
            temporada 2026/27.
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

function Stat({ n, l, s }) {
  return (
    <div className="stat">
      <span>{l}</span>
      <b>{n}</b>
      <small>{s}</small>
    </div>
  );
}

function Card({ title, action, onAction, children }) {
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

function Team({
  squad,
  players,
  formation,
  setFormation
}) {
  const picked = squad
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean);

  const rows = {
    "4-3-3": [1, 4, 3, 3],
    "3-5-2": [1, 3, 5, 2],
    "4-4-2": [1, 4, 4, 2],
    "3-4-3": [1, 3, 4, 3]
  };

  const spent = picked.reduce(
    (sum, p) => sum + p.price,
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

        {Object.keys(rows).map((x) => (
          <button
            key={x}
            className={
              x === formation ? "selected" : ""
            }
            onClick={() => setFormation(x)}
          >
            {x}
          </button>
        ))}

      </div>

      <div className="pitch">

        {rows[formation].map((count, r) => (
          <div className="pitch-row" key={r}>

            {Array.from({ length: count }).map(
              (_, i) => {

                const index = r * 3 + i;

                const p =
                  picked.length > 0
                    ? picked[index % picked.length]
                    : null;

                return (
                  <div
                    className="pitch-player"
                    key={i}
                  >

                    <div className="player-circle">
                      {p ? "⚽" : "+"}
                    </div>

                    <b>
                      {p
                        ? p.name.split(" ").slice(-1)[0]
                        : "Vacío"}
                    </b>

                    <small>
                      {p?.pos || "POS"}
                    </small>

                  </div>
                );
              }
            )}

          </div>
        ))}

      </div>

      <Card title={`Plantilla · ${picked.length}/14`}>

        <div className="table">

          {picked.length ? (
            picked.map((p) => (
              <div
                className="table-row"
                key={p.id}
              >
                <b>{p.name}</b>
                <span>{p.team}</span>
                <span>{p.pos}</span>
                <strong>{euro(p.price)}</strong>
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

function PageHead({
  tag,
  title,
  text,
  right
}) {
  return (
    <div className="page-head">

      <div>

        <span className="eyebrow">
          {tag}
        </span>

        <h1>{title}</h1>

        <p>{text}</p>

      </div>

      {right}

    </div>
  );
}

function Market({
  players,
  search,
  setSearch,
  teamFilter,
  setTeamFilter,
  buy,
  available
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
          onChange={(e) => setSearch(e.target.value)}
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
            <option key={team}>
              {team}
            </option>
          ))}

        </select>

      </div>

      <div className="demo-warning">
        ⚠ Datos iniciales cargados. La conexión
        automática con FSGC/Supabase la añadiremos
        en el siguiente paso.
      </div>

      <div className="player-grid">

        {players.map((p) => (
          <article
            className="player-card"
            key={p.id}
          >

            <div className="player-meta">
              <span>{p.pos}</span>
              <small>{p.team}</small>
            </div>

            <div className="avatar-ball">
              ⚽
            </div>

            <h3>{p.name}</h3>

            <p>{p.team}</p>

            <div className="player-price">

              <b>{euro(p.price)}</b>

              <button
                className="primary small"
                onClick={() => buy(p)}
              >
                Fichar
              </button>

            </div>

          </article>
        ))}

      </div>
    </>
  );
}

function Players({
  players,
  search,
  setSearch
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

        <div className="table">

          <div className="table-row table-head">
            <span>Jugador</span>
            <span>Equipo</span>
            <span>Posición</span>
            <span>Valor</span>
          </div>

          {players.map((p, i) => (
            <div
              className="table-row"
              key={p.id}
            >
              <b>
                #{i + 1} · {p.name}
              </b>

              <span>{p.team}</span>

              <span>{p.pos}</span>

              <strong>{euro(p.price)}</strong>
            </div>
          ))}

        </div>

      </Card>
    </>
  );
}

function Leagues({
  league,
  create,
  flash
}) {
  const join = () => {
    const code = prompt(
      "Introduce el código de invitación"
    );

    if (!code) return;

    if (
      code.trim().toUpperCase() ===
      league?.code
    ) {
      flash("Ya estás en esta liga.");
    } else {
      flash(
        "Código preparado para conexión online."
      );
    }
  };

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
              onClick={join}
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

              {league.members.map((m, i) => (
                <div
                  className="standing"
                  key={i}
                >

                  <b>{i + 1}</b>

                  <span>{m.name}</span>

                  <strong>
                    {m.points} pts
                  </strong>

                </div>
              ))}

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

          {fixtures.map((f, i) => (
            <Fixture
              f={f}
              key={i}
            />
          ))}

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
            La FSGC será la fuente principal
            para comprobar los resultados.
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

createRoot(
  document.getElementById("root")
).render(
  <App />
);
