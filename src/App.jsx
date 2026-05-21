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
import {
  ACTIVE_SAVE_SLOT_KEY,
  clearSaveSlot,
  createEmptySaveSlots,
  createInitialGame,
  LEGACY_SAVE_KEYS,
  normalizeSavedGame,
  normalizeSaveSlots,
  SAVE_KEY,
  SAVE_SLOTS_KEY,
  saveGameToSlot,
  shouldShowEnding,
} from "./game/state.js";
import heroImage from "./assets/hero.png";
import "./App.css";

const STAGE_IMAGE_FILES = {
  high_school: "high-school.png",
  undergraduate: "undergraduate.png",
  master: "master.png",
  phd: "phd.png",
  young_faculty: "young-faculty.png",
  professor: "professor.png",
  academician_candidate: "academician-candidate.png",
};

function getStageImageSrc(stageId) {
  const file = STAGE_IMAGE_FILES[stageId];
  return file ? `${import.meta.env.BASE_URL}stages/${file}` : heroImage;
}

function loadLegacyGame() {
  const saved = parseStorageJson(SAVE_KEY, null);
  if (saved) return normalizeSavedGame(saved);

  for (const key of LEGACY_SAVE_KEYS) {
    const legacy = parseStorageJson(key, null);
    if (legacy) return normalizeSavedGame(legacy);
  }

  return null;
}

function parseStorageJson(key, fallback) {
  const value = localStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function loadSaveSlots() {
  const savedSlots = parseStorageJson(SAVE_SLOTS_KEY, null);
  if (savedSlots) return normalizeSaveSlots(savedSlots);

  const legacyGame = loadLegacyGame();
  if (!legacyGame) return createEmptySaveSlots();

  return saveGameToSlot(createEmptySaveSlots(), 1, { ...legacyGame, screen: "play" });
}

function App() {
  const [saveSlots, setSaveSlots] = useState(() => {
    try {
      return loadSaveSlots();
    } catch {
      return createEmptySaveSlots();
    }
  });
  const [activeSlotId, setActiveSlotId] = useState(() => {
    const saved = Number(localStorage.getItem(ACTIVE_SAVE_SLOT_KEY));
    return Number.isInteger(saved) && saved > 0 ? saved : null;
  });
  const [game, setGame] = useState(() => {
    try {
      const slots = loadSaveSlots();
      const savedActiveSlot = Number(localStorage.getItem(ACTIVE_SAVE_SLOT_KEY));
      const activeSlot = slots.find((slot) => slot.id === savedActiveSlot && slot.game);
      if (activeSlot) return normalizeSavedGame(activeSlot.game);
      return createInitialGame();
    } catch {
      return createInitialGame();
    }
  });

  useEffect(() => {
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(saveSlots));
  }, [saveSlots]);

  useEffect(() => {
    if (activeSlotId) {
      localStorage.setItem(ACTIVE_SAVE_SLOT_KEY, String(activeSlotId));
    } else {
      localStorage.removeItem(ACTIVE_SAVE_SLOT_KEY);
    }
  }, [activeSlotId]);

  useEffect(() => {
    if (!activeSlotId || game.screen === "intro") return;
    const currentSlots = normalizeSaveSlots(parseStorageJson(SAVE_SLOTS_KEY, []));
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(saveGameToSlot(currentSlots, activeSlotId, game)));
  }, [activeSlotId, game]);

  const stage = STAGES[game.stageIndex];
  const actions = ACTIONS[stage.id] ?? [];
  const statGroups = useMemo(
    () => [
      ["knowledge", "perseverance", "focus", "health", "pressure", "eq", "money", "reputation"],
      ["literature", "experiment", "writing", "innovation", "network", "contribution"],
    ],
    [],
  );

  function startGame(slotId, options = {}) {
    const { confirmOverwrite = true } = options;
    const slot = saveSlots.find((item) => item.id === slotId);
    if (confirmOverwrite && slot?.game && !window.confirm(`确定覆盖${slot.name}吗？当前进度会被新的科研人生替换。`)) {
      return;
    }

    const next = { ...createInitialGame(), screen: "play" };
    setActiveSlotId(slotId);
    setGame(next);
    setSaveSlots((current) => saveGameToSlot(current, slotId, next));
  }

  function continueGame(slot) {
    if (!slot.game) return;
    setActiveSlotId(slot.id);
    setGame({ ...normalizeSavedGame(slot.game), screen: "play" });
  }

  function resetGame() {
    if (activeSlotId) {
      startGame(activeSlotId, { confirmOverwrite: false });
      return;
    }
    setGame(createInitialGame());
  }

  function deleteSlot(slotId) {
    const slot = saveSlots.find((item) => item.id === slotId);
    if (slot?.game && !window.confirm(`确定删除${slot.name}吗？这个存档无法恢复。`)) {
      return;
    }

    if (activeSlotId === slotId) {
      setActiveSlotId(null);
      setGame(createInitialGame());
    }
    setSaveSlots((current) => clearSaveSlot(current, slotId));
  }

  function returnToSlots() {
    setSaveSlots(loadSaveSlots());
    setGame((current) => ({ ...current, screen: "intro" }));
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
            <SaveSlotList slots={saveSlots} onStart={startGame} onContinue={continueGame} onDelete={deleteSlot} />
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
          <button className="secondary" onClick={returnToSlots}>存档列表</button>
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
          <StageVisual stage={stage} />

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

function StageVisual({ stage }) {
  return (
    <figure className="stage-visual">
      <img
        src={getStageImageSrc(stage.id)}
        alt={`${stage.name}${stage.subtitle}`}
        onError={(event) => {
          if (event.currentTarget.src !== heroImage) {
            event.currentTarget.src = heroImage;
          }
        }}
      />
      <figcaption>
        <span>{stage.subtitle}</span>
        <strong>{stage.name}</strong>
      </figcaption>
    </figure>
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

function SaveSlotList({ slots, onStart, onContinue, onDelete }) {
  return (
    <div className="save-slots">
      {slots.map((slot) => (
        <article className="save-slot" key={slot.id}>
          <div>
            <p className="slot-kicker">{slot.name}</p>
            <h2>{slot.game ? getSlotTitle(slot.game) : "空存档"}</h2>
            <p>{slot.game ? getSlotSummary(slot) : "从高三重新开始一段科研人生。"}</p>
          </div>
          <div className="slot-actions">
            {slot.game ? (
              <>
                <button className="primary" onClick={() => onContinue(slot)}>继续</button>
                <button className="secondary" onClick={() => onStart(slot.id)}>新开覆盖</button>
                <button className="secondary" onClick={() => onDelete(slot.id)}>删除</button>
              </>
            ) : (
              <button className="primary" onClick={() => onStart(slot.id)}>开始</button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function getSlotTitle(game) {
  if (game.ending) return game.ending.title;
  const stage = STAGES[game.stageIndex] ?? STAGES[0];
  return `${stage.name} 第 ${game.turn} 回合`;
}

function getSlotSummary(slot) {
  const game = slot.game;
  const updatedAt = slot.updatedAt ? new Date(slot.updatedAt).toLocaleString("zh-CN", { hour12: false }) : "未知时间";
  if (game.ending) return `${game.ending.text} 保存于 ${updatedAt}`;
  const stage = STAGES[game.stageIndex] ?? STAGES[0];
  return `${stage.subtitle}，行动点 ${game.ap}。保存于 ${updatedAt}`;
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
