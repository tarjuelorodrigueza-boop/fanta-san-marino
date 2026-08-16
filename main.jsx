```jsx
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./styles.css";

const SUPABASE_URL = "https://larnilxinubegpvuddgs.supabase.co";
const SUPABASE_KEY = "sb_publishable_NvE3GTkC0hmlBdyM3pouZg_Yu-STMt-";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

const fallbackPlayers = [
  ["828", "Manuel Ferrani", "Tre Penne", "DEF", 8],
  ["1036", "Marco Andretta", "Cosmos", "MED", 7],
  ["1046", "Giacomo Greco", "Domagnano", "MED", 7],
  ["1049", "Benjamin Serifoski", "La Fiorita", "DEL", 10],
  ["419", "Tommaso Guidi", "La Fiorita", "DEL", 11],
  ["543", "Alex Ambrosini", "Cosmos", "DEL", 9],
  ["1034", "Gianmario Piscitella", "Virtus", "DEL", 10],
  ["120", "Matteo Vitaioli", "La Fiorita", "DEL", 11],
  ["901", "Marseljan Mema", "Tre Fiori", "DEL", 8.5],
  ["429", "Tommaso Leon Bernardi", "Tre Fiori", "DEL", 10.5],
  ["176", "Nicko Sensoli", "Tre Fiori", "DEL", 8.5],
  ["731", "Marco Gasperoni", "Virtus", "DEL", 7]
].map(([id, name, team, pos, price]) => ({
  id,
  name,
  team,
  pos,
  price
}));

function money(value) {
  return `${Number(value || 0).toFixed(1)} M€`;
}

function normalizePlayer(player, index) {
  const position = String(
    player.position ||
      player.pos ||
      player.role ||
      "DEL"
  ).toUpperCase();

  let price = Number(
    player.price ||
      player.value ||
      player.market_value ||
      0
  );

  if (!price || Number.isNaN(price)) {
    if (
      position.includes("POR") ||
      position.includes("GK")
    ) {
      price = 5;
    } else if (
      position.includes("DEF") ||
      position.includes("DIF")
    ) {
      price = 7;
    } else if (
      position.includes("MED") ||
      position.includes("MID")
    ) {
      price = 8;
    } else {
      price = 9;
    }
  }

  if (price > 1000) {
    price = price / 1000000;
  }

  let pos = "DEL";

  if (
    position.includes("GK") ||
    position.includes("POR")
  ) {
    pos = "POR";
  } else if (
    position.includes("DEF") ||
    position.includes("DIF")
  ) {
    pos = "DEF";
  } else if (
    position.includes("MED") ||
    position.includes("MID")
  ) {
    pos = "MED";
  }

  return {
    id: String(
      player.external_id ||
        player.id ||
        index
    ),
    dbId: player.id,
    name: player.name || "Jugador",
    team:
      player.club ||
      player.team ||
      player.club_name ||
      "Sin equipo",
    pos,
    price,
    officialUrl:
      player.official_url ||
      player.fsgc_url ||
      player.url ||
      null
  };
}

function App() {
  const [tab, setTab] = useState("home");
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [dataStatus, setDataStatus] = useState(
    "Conectando con Supabase..."
  );

  const [squad, setSquad] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("fsm_squad") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] =
    useState("Todos");
  const [formation, setFormation] =
    useState("4-3-3");
  const [toast, setToast] = useState("");

  const budget = 100;

  useEffect(() => {
    localStorage.setItem(
      "fsm_squad",
      JSON.stringify(squad)
    );
  }, [squad]);

  useEffect(() => {
    async function loadPlayers() {
      setLoadingPlayers(true);
      setDataStatus(
        "Cargando jugadores desde Supabase..."
      );

      const result = await supabase
        .from("players")
        .select(
          "id,external_id,name,position,club"
        )
        .order("name");

      if (result.error) {
        console.error(
          "Supabase players error:",
          result.error
        );

        setPlayers(fallbackPlayers);
        setDataStatus(
          "Error de Supabase · usando respaldo"
        );
        setLoadingPlayers(false);
        return;
      }

      if (
        !result.data ||
        result.data.length === 0
      ) {
        setPlayers(fallbackPlayers);
        setDataStatus(
          "Sin jugadores · usando respaldo"
        );
        setLoadingPlayers(false);
        return;
      }

      const converted =
        result.data.map(normalizePlayer);

      setPlayers(converted);
      setDataStatus(
        `Supabase · ${converted.length} jugadores`
      );
      setLoadingPlayers(false);
    }

    loadPlayers();
  }, []);

  const spent = squad.reduce(
    (total, id) => {
      const player = players.find(
        p => String(p.id) === String(id)
      );

      return total + (player?.price || 0);
    },
    0
  );

  const available = budget - spent;

  const filteredPlayers = players.filter(
    player => {
      const teamOK =
        teamFilter === "Todos" ||
        player.team === teamFilter;

      const text =
        `${player.name} ${player.team} ${player.pos}`
          .toLowerCase();

      return (
        teamOK &&
        text.includes(search.toLowerCase())
      );
    }
  );

  function flash(message) {
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2200);
  }

  function buy(player) {
    if (
      squad.some(
        id => String(id) === String(player.id)
      )
    ) {
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

    setSquad(current => [
      ...current,
      player.id
    ]);

    flash(`${player.name} fichado.`);
  }

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
          <div className="logo-mark">
            SM
          </div>

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
          A
        </div>
      </header>

      <div className="layout">

        <aside>

          <div className="season">
            TEMPORADA ACTIVA
            <strong>2026/27</strong>
          </div>

          <button
            className={
              tab === "home"
                ? "nav active"
                : "nav"
            }
            onClick={() => setTab("home")}
          >
            <i>⌂</i>
            Inicio
          </button>

          <button
            className={
              tab === "team"
                ? "nav active"
                : "nav"
            }
            onClick={() => setTab("team")}
          >
            <i>⚽</i>
            Mi equipo
          </button>

          <button
            className={
              tab === "market"
                ? "nav active"
                : "nav"
            }
            onClick={() => setTab("market")}
          >
            <i>↗</i>
            Mercado
          </button>

          <button
            className={
              tab === "leagues"
                ? "nav active"
                : "nav"
            }
            onClick={() => setTab("leagues")}
          >
            <i>♛</i>
            Ligas
          </button>

          <button
            className={
              tab === "players"
                ? "nav active"
                : "nav"
            }
            onClick={() => setTab("players")}
          >
            <i>♙</i>
            Jugadores
          </button>

          <button
            className={
              tab === "calendar"
                ? "nav active"
                : "nav"
            }
            onClick={() => setTab("calendar")}
          >
            <i>▣</i>
            Calendario
          </button>

          <div className="sync-card">
            <div className="sync-dot" />
            <b>Datos trazables</b>

            <p>
              Los resultados oficiales se
              consultan tomando la FSGC como
              fuente principal.
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
            />
          )}

          {tab === "team" && (
            <Team
              squad={squad}
              players={players}
              formation={formation}
              setFormation={setFormation}
            />
          )}

          {tab === "market" && (
            <Market
              players={filteredPlayers}
              search={search}
              setSearch={setSearch}
              teamFilter={teamFilter}
              setTeamFilter={setTeamFilter}
              buy={buy}
              available={available}
              loading={loadingPlayers}
              status={dataStatus}
            />
          )}

          {tab === "players" && (
            <Players
              players={filteredPlayers}
              search={search}
              setSearch={setSearch}
            />
          )}

          {tab === "leagues" && (
            <Leagues
              flash={flash}
            />
          )}

          {tab === "calendar" && (
            <Calendar />
          )}

        </main>

      </div>

      <footer>
        <span>
          Fanta San Marino
        </span>

        <span>
          Datos: <b>{dataStatus}</b>
        </span>

        <span>
          2026
        </span>
      </footer>

    </div>
  );
}

function Home({
  setTab,
  squad,
  available
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
            <em>
              fútbol de San Marino.
            </em>
          </h1>

          <p>
            Construye tu equipo, ficha
            jugadores y compite con tus
            amigos.
          </p>

          <div className="hero-actions">

            <button
              className="primary"
              onClick={() =>
                setTab("market")
              }
            >
              Empezar a fichar →
            </button>

            <button
              className="ghost"
              onClick={() =>
                setTab("calendar")
              }
            >
              Ver calendario
            </button>

          </div>

        </div>

        <div className="hero-panel">

          <span>
            JORNADA 1
          </span>

          <b>
            28–30
          </b>

          <strong>
            AGO 2026
          </strong>

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
              <b>
                {available.toFixed(1)}
              </b>
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
          n={money(available)}
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

        <Card title="Primera jornada">

          <div className="fixture-list">

            {fixtures
              .slice(0, 5)
              .map((fixture, i) => (
                <Fixture
                  key={i}
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
            d="Los resultados y estadísticas oficiales servirán para calcular los puntos."
          />

          <Rule
            n="03"
            t="Compites"
            d="Crea ligas privadas y compite con tus amigos."
          />

        </Card>

      </div>

      <div className="source-banner">

        <div className="source-icon">
          ✓
        </div>

        <div>
          <b>
            Fuente oficial: FSGC
          </b>

          <p>
            La primera jornada 2026/27
            está prevista para el
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

function Stat({
  n,
  l,
  s
}) {
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
  children
}) {
  return (
    <section className="card">

      <div className="card-title">
        <h2>{title}</h2>
      </div>

      {children}

    </section>
  );
}

function Rule({
  n,
  t,
  d
}) {
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
  available,
  loading,
  status
}) {
  return (
    <>

      <PageHead
        tag="MERCADO"
        title="Fichajes"
        text="Encuentra jugadores y controla tu presupuesto."
        right={
          <div className="money-box">
            <small>
              DISPONIBLE
            </small>

            <b>
              {money(available)}
            </b>
          </div>
        }
      />

      <div className="filters">

        <input
          value={search}
          onChange={e =>
            setSearch(e.target.value)
          }
          placeholder="Buscar jugador o equipo..."
        />

        <select
          value={teamFilter}
          onChange={e =>
            setTeamFilter(e.target.value)
          }
        >

          <option>
            Todos
          </option>

          {teams.map(team => (
            <option
              key={team}
              value={team}
            >
              {team}
            </option>
          ))}

        </select>

      </div>

      <div className="demo-warning">

        {loading
          ? "⏳ Cargando jugadores desde Supabase..."
          : `✓ ${status}`}

      </div>

      <div className="player-grid">

        {players.map(player => (

          <article
            className="player-card"
            key={player.id}
          >

            <div className="player-meta">
              <span>
                {player.pos}
              </span>

              <small>
                {player.team}
              </small>
            </div>

            <div className="avatar-ball">
              ⚽
            </div>

            <h3>
              {player.name}
            </h3>

            <p>
              {player.team}
            </p>

            <div className="player-price">

              <b>
                {money(player.price)}
              </b>

              <button
                className="primary small"
                onClick={() =>
                  buy(player)
                }
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
        text="Jugadores disponibles en la base de datos."
      />

      <div className="filters">

        <input
          value={search}
          onChange={e =>
            setSearch(e.target.value)
          }
          placeholder="Buscar jugador..."
        />

      </div>

      <Card title="Jugadores">

        <div className="table table-head">
          <span>
            Jugador
          </span>

          <span>
            Equipo
          </span>

          <span>
            Posición
          </span>

          <span>
            Valor
          </span>
        </div>

        {players.map(
          (player, index) => (

            <div
              className="table-row"
              key={player.id}
            >

              <b>
                #{index + 1} ·{" "}
                {player.name}
              </b>

              <span>
                {player.team}
              </span>

              <span>
                {player.pos}
              </span>

              <strong>
                {money(player.price)}
              </strong>

            </div>

          )
        )}

      </Card>

    </>
  );
}

function Team({
  squad,
  players,
  formation,
  setFormation
}) {
  const selected =
    squad
      .map(id =>
        players.find(
          p =>
            String(p.id) ===
            String(id)
        )
      )
      .filter(Boolean);

  const formations = {
    "4-3-3": [1, 4, 3, 3],
    "3-5-2": [1, 3, 5, 2],
    "4-4-2": [1, 4, 4, 2],
    "3-4-3": [1, 3, 4, 3]
  };

  return (
    <>

      <PageHead
        tag="MI EQUIPO"
        title="Mi plantilla"
        text="Prepara tu equipo para la jornada."
        right={
          <div className="money-box">
            <small>
              DISPONIBLE
            </small>

            <b>
              {money(
                100 -
                  selected.reduce(
                    (sum, p) =>
                      sum + p.price,
                    0
                  )
              )}
            </b>
          </div>
        }
      />

      <div className="formations">

        {Object.keys(
          formations
        ).map(f => (

          <button
            key={f}
            className={
              f === formation
                ? "selected"
                : ""
            }
            onClick={() =>
              setFormation(f)
            }
          >
            {f}
          </button>

        ))}

      </div>

      <div className="pitch">

        {formations[
          formation
        ].map((count, row) => (

          <div
            className="pitch-row"
            key={row}
          >

            {Array.from(
              { length: count },
              (_, index) => {

                const player =
                  selected[
                    index % 
                    Math.max(
                      selected.length,
                      1
                    )
                  ];

                return (

                  <div
                    className="pitch-player"
                    key={index}
                  >

                    <div className="player-circle">
                      {player
                        ? "⚽"
                        : "+"}
                    </div>

                    <b>
                      {player
                        ? player.name
                            .split(" ")[0]
                        : "Vacío"}
                    </b>

                    <small>
                      {player?.pos ||
                        "POS"}
                    </small>

                  </div>

                );
              }
            )}

          </div>

        ))}

      </div>

      <Card
        title={`Plantilla · ${selected.length}/14`}
      >

        {selected.length === 0 ? (

          <div className="empty">
            No tienes jugadores.
            Ve a Mercado para fichar.
          </div>

        ) : (

          <div className="table">

            {selected.map(player => (

              <div
                className="table-row"
                key={player.id}
              >

                <b>
                  {player.name}
                </b>

                <span>
                  {player.team}
                </span>

                <span>
                  {player.pos}
                </span>

                <strong>
                  {money(
                    player.price
                  )}
                </strong>

              </div>

            ))}

          </div>

        )}

      </Card>

    </>
  );
}

function Leagues({ flash }) {
  function createLeague() {
    const code =
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    flash(
      `Liga creada: ${code}`
    );
  }

  return (
    <>

      <PageHead
        tag="COMPETICIÓN"
        title="Mis ligas"
        text="Compite con tus amigos."
        right={
          <button
            className="primary"
            onClick={
              createLeague
            }
          >
            Crear liga
          </button>
        }
      />

      <div className="empty big">

        <b>
          Crea tu primera liga
        </b>

        <p>
          Comparte el código con
          tus amigos y competid.
        </p>

        <button
          className="primary"
          onClick={
            createLeague
          }
        >
          Crear mi liga
        </button>

      </div>

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

          {fixtures.map(
            (fixture, index) => (
              <Fixture
                key={index}
                f={fixture}
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
            La FSGC es la fuente
            principal de resultados
            oficiales.
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
```
