import { useEffect, useMemo, useState } from "react";
import { ACTIONS } from "./data/actions.js";
import { GRADUATE_ROUTES } from "./data/graduateRoutes.js";
import { STAGES } from "./data/stages.js";
import { STAT_LABELS } from "./data/stats.js";
import {
  canPerformAction,
  chooseEvent as resolveEventChoice,
  chooseGraduateRoute as resolveGraduateRouteChoice,
  performAction as resolveAction,
} from "./game/engine.js";
import {
  clamp,
  getGraduateRouteChance,
  getRequirementValue,
  meetsGraduateRequirement,
} from "./game/formulas.js";
import { describeRequirements } from "./game/requirements.js";
import { createInitialGame, LEGACY_SAVE_KEYS, normalizeSavedGame, SAVE_KEY, shouldShowEnding } from "./game/state.js";
import "./App.css";

function App() {
  const [game, setGame] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) return normalizeSavedGame(JSON.parse(saved));

      for (const key of LEGACY_SAVE_KEYS) {
        const legacy = localStorage.getItem(key);
        if (legacy) return normalizeSavedGame(JSON.parse(legacy));
      }

      return createInitialGame();
    } catch {
      return createInitialGame();
    }
  });

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  }, [game]);

  const stage = STAGES[game.stageIndex];
  const actions = ACTIONS[stage.id] ?? [];
  const statGroups = useMemo(
    () => [
      ["knowledge", "perseverance", "focus", "health", "pressure", "eq", "money", "reputation"],
      ["literature", "experiment", "writing", "innovation", "network", "contribution"],
    ],
    [],
  );

  function startGame() {
    setGame({ ...createInitialGame(), screen: "play" });
  }

  function resetGame() {
    localStorage.removeItem(SAVE_KEY);
    LEGACY_SAVE_KEYS.forEach((key) => localStorage.removeItem(key));
    setGame(createInitialGame());
  }

  function handleAction(item) {
    setGame((current) => resolveAction(current, item));
  }

  function handleEventChoice(option) {
    setGame((current) => resolveEventChoice(current, option));
  }

  function handleGraduateRoute(route) {
    setGame((current) => resolveGraduateRouteChoice(current, route));
  }

  if (game.screen === "intro") {
    return (
      <main className="intro">
        <section className="intro-hero">
          <div>
            <p className="eyebrow">模拟经营 / 科研成长 / 回合制选择</p>
            <h1>科研之路</h1>
            <p className="intro-copy">
              从高中开始，在考试、专业选择、实验室、论文、基金和学术声望之间做长期取舍，最终目标是成为院士。
            </p>
            <div className="intro-actions">
              <button className="primary" onClick={startGame}>开始新游戏</button>
              <button className="secondary" onClick={() => setGame((current) => ({ ...current, screen: "play" }))}>
                继续存档
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{stage.subtitle}</p>
          <h1>科研之路</h1>
        </div>
        <div className="top-actions">
          <button className="secondary" onClick={resetGame}>重新开始</button>
        </div>
      </header>

      <section className="status-band">
        <div>
          <span>阶段</span>
          <strong>{stage.name}</strong>
        </div>
        <div>
          <span>回合</span>
          <strong>{game.turn} / {stage.turns}</strong>
        </div>
        <div>
          <span>行动点</span>
          <strong>{game.ap}</strong>
        </div>
        <div className="goal">
          <span>阶段目标</span>
          <strong>{stage.goal}</strong>
        </div>
      </section>

      <div className="game-grid">
        <aside className="panel stats-panel">
          <h2>角色状态</h2>
          {statGroups.map((group, index) => (
            <div className="stat-group" key={index}>
              {group.map((key) => (
                <StatBar key={key} label={STAT_LABELS[key]} value={game.stats[key]} danger={key === "pressure"} />
              ))}
            </div>
          ))}
        </aside>

        <section className="main-column">
          <div className="panel progress-panel">
            <h2>阶段进度</h2>
            <div className="progress-list">
              {Object.entries(stage.progress).map(([key, label]) => (
                <ProgressBar key={key} label={label} value={game.progress[key]} />
              ))}
            </div>
          </div>

          <div className="panel action-panel">
            <div className="panel-heading">
              <h2>本回合行动</h2>
              <p className="turn-hint">行动点不足以执行任何行动时，将自动进入下一回合。</p>
            </div>
            <div className="actions-grid">
              {actions.map((item) => (
                <button
                  className="action-card"
                  key={item.id}
                  disabled={!canPerformAction(game, item)}
                  onClick={() => handleAction(item)}
                >
                  <div className="action-title">
                    <strong>{item.name}</strong>
                    <span>{item.cost} AP</span>
                  </div>
                  <p>{item.desc}</p>
                  {item.requirements?.length > 0 && (
                    <p className="requirements">条件：{describeRequirements(item.requirements).join("，")}</p>
                  )}
                  {item.risk && (
                    <p className="risk-note">风险：{Math.round(item.risk.chance * 100)}% 可能出现负面结果</p>
                  )}
                  <EffectChips effects={item.effects} progress={item.progress} />
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="panel log-panel">
          <h2>记录</h2>
          <div className="log-list">
            {game.logs.map((item, index) => (
              <p key={`${item}-${index}`}>{item}</p>
            ))}
          </div>
        </aside>
      </div>

      {game.activeEvent && (
        <EventModal event={game.activeEvent} onChoose={handleEventChoice} />
      )}

      {game.pendingGraduateChoice && (
        <GraduateRouteModal game={game} routes={GRADUATE_ROUTES} onChoose={handleGraduateRoute} />
      )}

      {shouldShowEnding(game) && (
        <div className="modal-backdrop">
          <section className="modal">
            <p className="eyebrow">当前版本结局</p>
            <h2>{game.ending.title}</h2>
            <p>{game.ending.text}</p>
            <button className="primary" onClick={resetGame}>再走一次</button>
          </section>
        </div>
      )}
    </main>
  );
}

function StatBar({ label, value, danger }) {
  const pct = clamp(value);
  const alert = danger ? value >= 75 : value <= 18;
  return (
    <div className="stat-row">
      <div className="stat-meta">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="meter">
        <div
          className={danger ? "meter-fill pressure" : alert ? "meter-fill alert" : "meter-fill"}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ProgressBar({ label, value }) {
  return (
    <div className="progress-row">
      <div className="stat-meta">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="meter large">
        <div className="meter-fill progress" style={{ width: `${clamp(value)}%` }} />
      </div>
    </div>
  );
}

function EffectChips({ effects, progress }) {
  return (
    <div className="chips">
      {Object.entries({ ...effects, ...progress }).map(([key, value]) => (
        <span className={value >= 0 ? "chip up" : "chip down"} key={key}>
          {STAT_LABELS[key] ?? key}{value > 0 ? "+" : ""}{value}
        </span>
      ))}
    </div>
  );
}

function EventModal({ event, onChoose }) {
  return (
    <div className="modal-backdrop">
      <section className="modal">
        <p className="eyebrow">突发事件</p>
        <h2>{event.title}</h2>
        <p>{event.desc}</p>
        <div className="choice-list">
          {event.choices.map((item) => (
            <button className="choice-button" key={item.label} onClick={() => onChoose(item)}>
              <span>{item.label}</span>
              <EffectChips effects={item.effects} progress={item.progress} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function GraduateRouteModal({ game, routes, onChoose }) {
  return (
    <div className="modal-backdrop">
      <section className="modal route-modal">
        <p className="eyebrow">本科毕业去向</p>
        <h2>选择读研路径</h2>
        <p>
          从这里开始，科研不再只是考试题。保研、考研、直博、海外申请和产业研发都不是单纯的优劣选项，
          它们会改变你的训练节奏、资源网络和后续压力。
        </p>
        <div className="route-list">
          {routes.map((route) => {
            const chance = getGraduateRouteChance(game, route);
            return (
              <button className="route-card" key={route.id} onClick={() => onChoose(route)}>
                <div className="route-card-header">
                  <div>
                    <strong>{route.name}</strong>
                    <span>{route.track}</span>
                  </div>
                  <b>{route.ending ? "确定" : `${Math.round(chance * 100)}%`}</b>
                </div>
                <p>{route.desc}</p>
                {route.requirements.length > 0 && (
                  <div className="route-requirements">
                    {route.requirements.map((requirement) => {
                      const met = meetsGraduateRequirement(game, requirement);
                      return (
                        <span className={met ? "route-req met" : "route-req"} key={`${route.id}-${requirement.key}`}>
                          {requirement.label} {getRequirementValue(game, requirement)} / {requirement.min}
                        </span>
                      );
                    })}
                  </div>
                )}
                <EffectChips effects={route.successEffects} progress={route.successProgress} />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default App;
