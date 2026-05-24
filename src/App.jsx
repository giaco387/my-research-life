import { useEffect, useMemo, useState } from "react";
import { ACTIONS } from "./data/actions.js";
import { ENDINGS } from "./data/endings.js";
import { GRADUATE_ROUTES } from "./data/graduateRoutes.js";
import { STAGES } from "./data/stages.js";
import { STAT_LABELS } from "./data/stats.js";
import packageInfo from "../package.json";
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
  DEFAULT_PROFILE,
  LEGACY_SAVE_KEYS,
  normalizeSavedGame,
  normalizeSaveSlots,
  SAVE_KEY,
  SAVE_SLOTS_KEY,
  saveGameToSlot,
  shouldShowEnding,
} from "./game/state.js";
import "./App.css";

const GAME_VERSION = packageInfo.version;
const HOME_COVER_STYLE = {
  "--intro-cover": `url("${import.meta.env.BASE_URL}home-cover.webp")`,
};
const CREATION_POINTS = 20;
const CREATION_STATS = ["knowledge", "perseverance", "focus", "health", "eq", "money"];
const EMPTY_ALLOCATIONS = Object.fromEntries(CREATION_STATS.map((key) => [key, 0]));
const GENDER_OPTIONS = [
  { id: "male", label: "男" },
  { id: "female", label: "女" },
];

const STAGE_IMAGE_FILES = {
  high_school: "high-school.webp",
  undergraduate: "undergraduate.webp",
  master: "master.webp",
  phd: "phd.webp",
  young_faculty: "young-faculty.webp",
  talent_track: "young-faculty.webp",
  professor: "professor.webp",
  national_leader: "professor.webp",
  academician_candidate: "academician-candidate.webp",
};

function getStageImageSrc(stageId) {
  const file = STAGE_IMAGE_FILES[stageId];
  return file ? `${import.meta.env.BASE_URL}stages/${file}` : `${import.meta.env.BASE_URL}home-cover.webp`;
}

function getStageStartIndex(stageId) {
  return STAGES.findIndex((stage) => stage.id === stageId);
}

function getStageStartAge(stageIndex) {
  return STAGES.slice(0, Math.max(0, stageIndex)).reduce((age, stage) => age + (stage.years ?? 1), 17);
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
  const [activeSlotId, setActiveSlotId] = useState(null);
  const [game, setGame] = useState(() => createInitialGame({ screen: "home" }));
  const [pendingSlotId, setPendingSlotId] = useState(null);
  const [showDevOverview, setShowDevOverview] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const isDevMode = useMemo(() => new URLSearchParams(window.location.search).get("dev") === "1", []);

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
    if (!activeSlotId || game.screen !== "play") return;
    const currentSlots = normalizeSaveSlots(parseStorageJson(SAVE_SLOTS_KEY, []));
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(saveGameToSlot(currentSlots, activeSlotId, game)));
  }, [activeSlotId, game]);

  const stage = STAGES[game.stageIndex];
  const actions = ACTIONS[stage.id] ?? [];
  const statGroups = useMemo(
    () => [
      ["knowledge", "perseverance", "focus", "health", "pressure", "eq", "money", "reputation"],
      ["literature", "experiment", "writing", "innovation", "network", "contribution"],
      ["talentTitles", "peerRecognition", "integrity"],
    ],
    [],
  );

  function startGame(slotId, options = {}) {
    const { confirmOverwrite = true } = options;
    const slot = saveSlots.find((item) => item.id === slotId);
    if (confirmOverwrite && slot?.game && !window.confirm(`确定覆盖${slot.name}吗？当前进度会被新的科研人生替换。`)) {
      return;
    }

    setPendingSlotId(slotId);
    setGame({ ...createInitialGame(), screen: "create" });
  }

  function createCharacter(character) {
    const slotId = pendingSlotId ?? activeSlotId;
    if (!slotId) return;

    const next = {
      ...createInitialGame(),
      screen: "play",
      profile: character.profile,
      stats: {
        ...createInitialGame().stats,
        ...character.stats,
      },
      logs: [`${character.profile.name}的科研之路开始了。你把目标写在便签上：先考上一所好大学。`],
    };
    setActiveSlotId(slotId);
    setPendingSlotId(null);
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
    setGame({ ...createInitialGame(), screen: "home" });
  }

  function deleteSlot(slotId) {
    const slot = saveSlots.find((item) => item.id === slotId);
    if (slot?.game && !window.confirm(`确定删除${slot.name}吗？这个存档无法恢复。`)) {
      return;
    }

    if (activeSlotId === slotId) {
      setActiveSlotId(null);
      setGame({ ...createInitialGame(), screen: "slots" });
    }
    setSaveSlots((current) => clearSaveSlot(current, slotId));
  }

  function returnToSlots() {
    setSaveSlots(loadSaveSlots());
    setPendingSlotId(null);
    setGame((current) => ({ ...current, screen: "slots" }));
  }

  function returnHome() {
    setPendingSlotId(null);
    setGame((current) => ({ ...current, screen: "home" }));
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

  function jumpToStage(stageId) {
    const stageIndex = STAGES.findIndex((item) => item.id === stageId);
    const targetStage = STAGES[stageIndex];
    if (!targetStage) return;

    setActiveSlotId(null);
    setGame({
      ...createInitialGame({ screen: "play" }),
      stageIndex,
      turn: 1,
      ap: targetStage.ap,
      age: getStageStartAge(stageIndex),
      stats: {
        ...createInitialGame().stats,
        knowledge: 70,
        perseverance: 70,
        focus: 68,
        health: 72,
        pressure: 35,
        eq: 62,
        money: 45,
        reputation: 45,
        literature: 45,
        experiment: 45,
        writing: 45,
        innovation: 45,
        network: 45,
        contribution: 35,
      },
      progress: {
        ...createInitialGame().progress,
        ...Object.fromEntries(Object.keys(targetStage.progress).map((key) => [key, 35])),
        talentTitles: stageIndex >= getStageStartIndex("talent_track") ? 42 : 0,
        peerRecognition: stageIndex >= getStageStartIndex("talent_track") ? 42 : 0,
        integrity: 65,
      },
      logs: [`开发者速览：已跳转到${targetStage.name}阶段。`],
    });
  }

  function openGraduateDebug() {
    const stageIndex = STAGES.findIndex((item) => item.id === "undergraduate");
    const stage = STAGES[stageIndex];

    setActiveSlotId(null);
    setGame({
      ...createInitialGame({ screen: "play" }),
      stageIndex,
      turn: stage.turns,
      ap: 0,
      age: getStageStartAge(stageIndex),
      stats: {
        ...createInitialGame().stats,
        knowledge: 72,
        perseverance: 70,
        focus: 68,
        pressure: 30,
        reputation: 24,
        literature: 28,
        writing: 28,
        money: 24,
      },
      progress: {
        ...createInitialGame().progress,
        gpa: 72,
        research: 70,
      },
      pendingGraduateChoice: true,
      logs: ["开发者速览：已打开本科毕业读研路线选择。"],
    });
  }

  if (game.screen === "intro" || game.screen === "home") {
    return (
      <main className="intro" style={HOME_COVER_STYLE}>
        <section className="intro-hero">
          <VersionBadge />
          <div className="home-layout">
            <div className="home-copy">
              <h1>科研之路</h1>
              <p className="intro-copy">
                一开始，只是想选个好专业。
                <br />
                后来发现论文、基金和头衔都会变成新的考题。
                <br />
                这不是一场公平考试，但你仍然要交卷。
              </p>
              <div className="intro-actions">
                <button className="primary" onClick={() => setGame((current) => ({ ...current, screen: "slots" }))}>
                  进入存档
                </button>
              </div>
            </div>
          </div>
          {isDevMode && (
            <DevTools
              onJumpStage={jumpToStage}
              onOpenGraduate={openGraduateDebug}
              onShowOverview={() => setShowDevOverview(true)}
            />
          )}
          {showDevOverview && <DevOverview onClose={() => setShowDevOverview(false)} />}
        </section>
      </main>
    );
  }

  if (game.screen === "slots") {
    return (
      <main className="intro" style={HOME_COVER_STYLE}>
        <section className="intro-hero">
          <VersionBadge />
          <div>
            <p className="eyebrow">存档管理</p>
            <h1>选择科研人生</h1>
            <p className="intro-copy">选择一个存档继续，或从高三重新开始一段新的科研道路。</p>
            <div className="intro-actions">
              <button className="secondary" onClick={returnHome}>返回首页</button>
            </div>
            <SaveSlotList slots={saveSlots} onStart={startGame} onContinue={continueGame} onDelete={deleteSlot} />
          </div>
          {isDevMode && (
            <DevTools
              onJumpStage={jumpToStage}
              onOpenGraduate={openGraduateDebug}
              onShowOverview={() => setShowDevOverview(true)}
            />
          )}
          {showDevOverview && <DevOverview onClose={() => setShowDevOverview(false)} />}
        </section>
      </main>
    );
  }

  if (game.screen === "create") {
    return (
      <main className="intro" style={HOME_COVER_STYLE}>
        <section className="intro-hero create-hero">
          <VersionBadge />
          <CharacterCreator
            baseStats={createInitialGame().stats}
            onCancel={returnToSlots}
            onCreate={createCharacter}
          />
          {isDevMode && (
            <DevTools
              onJumpStage={jumpToStage}
              onOpenGraduate={openGraduateDebug}
              onShowOverview={() => setShowDevOverview(true)}
            />
          )}
          {showDevOverview && <DevOverview onClose={() => setShowDevOverview(false)} />}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell has-side-dock" style={{ "--game-cover": `url("${getStageImageSrc(stage.id)}")` }}>
      <VersionBadge />
      <header className="topbar">
        <div>
          <p className="eyebrow">{stage.subtitle}</p>
          <h1>{game.profile?.name ?? DEFAULT_PROFILE.name}</h1>
        </div>
        <div className="top-actions">
          <button className="secondary" onClick={returnToSlots}>存档列表</button>
          <button className="secondary" onClick={resetGame}>重新开始</button>
        </div>
      </header>

      <SideDock
        game={game}
        stage={stage}
        onOpenLogs={() => setShowLogModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      <div className="game-grid">
        <section className="main-column">
          <section className="panel story-panel">
            <p className="eyebrow">{stage.name} · 第 {game.turn} 回合</p>
            <h2>{stage.goal}</h2>
            <p>你还有 {game.ap} 点行动点。先想想这一回合要把时间花在哪里。</p>
          </section>

          <details className="panel growth-panel">
            <summary>
              <span>成长面板</span>
              <strong>查看阶段、进度和行动点</strong>
            </summary>
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
                <span>年龄</span>
                <strong>{game.age ?? 17} 岁</strong>
              </div>
              <div>
                <span>行动点</span>
                <strong>{game.ap}</strong>
              </div>
            </section>
            <div className="progress-list">
              {Object.entries(stage.progress).map(([key, label]) => (
                <ProgressBar key={key} label={label} value={game.progress[key]} />
              ))}
            </div>
          </details>

          <div className="panel action-panel">
            <div className="panel-heading">
              <h2>这一回合做什么</h2>
              <p className="turn-hint">选择会影响成长，但细节不必一开始就盯着看。</p>
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
                  <details className="action-details" onClick={(event) => event.stopPropagation()}>
                    <summary>查看影响</summary>
                    {item.requirements?.length > 0 && (
                      <p className="requirements">条件：{describeRequirements(item.requirements).join("，")}</p>
                    )}
                    {item.risk && (
                      <p className="risk-note">风险：{Math.round(item.risk.chance * 100)}% 可能出现负面结果</p>
                    )}
                    <EffectChips effects={item.effects} progress={item.progress} />
                  </details>
                </button>
              ))}
            </div>
          </div>
        </section>

      </div>

      {game.activeEvent && (
        <EventModal event={game.activeEvent} onChoose={handleEventChoice} />
      )}

      {game.pendingGraduateChoice && (
        <GraduateRouteModal game={game} routes={GRADUATE_ROUTES} onChoose={handleGraduateRoute} />
      )}

      {showProfileModal && (
        <ProfileModal
          game={game}
          stage={stage}
          statGroups={statGroups}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showLogModal && (
        <LogModal logs={game.logs} onClose={() => setShowLogModal(false)} />
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

      {isDevMode && (
        <DevTools
          onJumpStage={jumpToStage}
          onOpenGraduate={openGraduateDebug}
          onShowOverview={() => setShowDevOverview(true)}
        />
      )}
      {showDevOverview && <DevOverview onClose={() => setShowDevOverview(false)} />}
    </main>
  );
}

function VersionBadge() {
  return <div className="version-badge">v{GAME_VERSION}</div>;
}

function SideDock({ game, stage, onOpenLogs, onOpenProfile }) {
  const latestLog = game.logs?.[0] ?? "暂无记录。";
  return (
    <aside className="side-dock" aria-label="角色与记录">
      <ProfileCard game={game} stage={stage} onOpen={onOpenProfile} />
      <button className="dock-card log-card" type="button" onClick={onOpenLogs}>
        <div>
          <p className="slot-kicker">记录</p>
          <h2>最新</h2>
          <span>{latestLog}</span>
        </div>
        <strong>查看</strong>
      </button>
    </aside>
  );
}

function DevTools({ onJumpStage, onOpenGraduate, onShowOverview }) {
  return (
    <aside className="dev-tools">
      <p className="slot-kicker">开发者速览</p>
      <div className="dev-actions">
        {STAGES.map((stage) => (
          <button className="secondary compact" key={stage.id} onClick={() => onJumpStage(stage.id)}>
            {stage.name}
          </button>
        ))}
        <button className="primary compact" onClick={onOpenGraduate}>读研选择</button>
        <button className="primary compact" onClick={onShowOverview}>内容总览</button>
      </div>
    </aside>
  );
}

function DevOverview({ onClose }) {
  return (
    <div className="modal-backdrop">
      <section className="modal dev-overview">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">开发者速览</p>
            <h2>游戏内容总览</h2>
          </div>
          <button className="secondary compact" onClick={onClose}>关闭</button>
        </div>
        <div className="dev-overview-grid">
          <section>
            <h3>阶段与行动</h3>
            {STAGES.map((stage) => (
              <p key={stage.id}>
                <strong>{stage.name}</strong>：{stage.turns} 回合，{stage.ap} AP，{ACTIONS[stage.id]?.length ?? 0} 个行动。
              </p>
            ))}
          </section>
          <section>
            <h3>读研路线</h3>
            {GRADUATE_ROUTES.map((route) => (
              <p key={route.id}>
                <strong>{route.name}</strong>：{route.track}
              </p>
            ))}
          </section>
          <section>
            <h3>结局</h3>
            {ENDINGS.map((ending) => (
              <p key={ending.id}>
                <strong>{ending.title}</strong>：{ending.method}
              </p>
            ))}
          </section>
        </div>
      </section>
    </div>
  );
}

function ProfileCard({ game, stage, onOpen }) {
  const career = game.career ?? {};
  const title = career.selfTitles?.[career.selfTitles.length - 1] ?? stage.subtitle;
  return (
    <button className="dock-card profile-card" type="button" onClick={onOpen}>
      <div className="id-photo small" aria-hidden="true">
        <ProfilePortrait game={game} stage={stage} />
      </div>
      <div>
        <p className="slot-kicker">角色档案</p>
        <h2>{game.profile?.name ?? DEFAULT_PROFILE.name}</h2>
        <span>{game.age ?? 17} 岁 / {getGenderLabel(game.profile?.gender)} / {title}</span>
      </div>
      <strong>查看</strong>
    </button>
  );
}

function LogModal({ logs, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="modal log-modal" aria-labelledby="log-modal-title" aria-modal="true" role="dialog" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">记录</p>
            <h2 id="log-modal-title">科研日志</h2>
          </div>
          <button className="secondary compact" type="button" onClick={onClose}>关闭</button>
        </div>
        <div className="log-list">
          {logs.map((item, index) => (
            <p key={`${item}-${index}`}>{item}</p>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProfilePortrait({ game, stage }) {
  const genderClass = game.profile?.gender === "female" ? "female" : game.profile?.gender === "male" ? "male" : "neutral";
  const careerClass = stage.id === "high_school" || stage.id === "undergraduate" ? "student" : stage.id === "master" || stage.id === "phd" ? "researcher" : "faculty";
  return (
    <div className={`portrait-face ${genderClass} ${careerClass}`}>
      <span className="portrait-hair" />
      <span className="portrait-head" />
      <span className="portrait-body" />
      <span className="portrait-badge" />
    </div>
  );
}

function ProfileModal({ game, stage, statGroups, onClose }) {
  const career = game.career ?? {};
  const stageIndex = game.stageIndex ?? 0;
  const students = career.students ?? {};
  const faculty = career.faculty ?? {};
  const grants = career.grants ?? {};
  const teamTitles = career.teamTitles ?? {};
  const careerEntries = [
    { label: "录用论文", value: game.progress.acceptedPapers ?? 0, minStageIndex: 2 },
    { label: "高影响论文", value: game.progress.highImpactPapers ?? 0, minStageIndex: 3 },
    { label: "代表作", value: game.progress.representativeWorks ?? 0, minStageIndex: 2 },
    { label: "学术信用", value: game.progress.integrity ?? 0, minStageIndex: 3 },
    { label: "导师", value: career.mentor ?? "暂无", minStageIndex: 1 },
    { label: "婚姻", value: career.maritalStatus ?? "未婚", minStageIndex: 4 },
    { label: "后代", value: career.children ?? 0, minStageIndex: 4 },
    { label: "学生", value: `硕${students.master ?? 0} / 博${students.phd ?? 0} / 博后${students.postdoc ?? 0}`, minStageIndex: 4 },
    { label: "团队教师", value: `讲师${faculty.lecturer ?? 0} / 副高${faculty.associateProfessor ?? 0} / 正高${faculty.professor ?? 0}`, minStageIndex: 4 },
    { label: "国家基金", value: `申请${grants.applications ?? 0} / 资助${grants.funded ?? 0}`, minStageIndex: 4 },
    { label: "基金类型", value: `青年${grants.youth ?? 0} / 面上${grants.general ?? 0} / 重点${grants.key ?? 0} / 重大${grants.major ?? 0}`, minStageIndex: 4 },
    { label: "本人帽子", value: career.selfTitles?.length ? career.selfTitles.join("、") : "暂无", minStageIndex: 5 },
    { label: "人才项目", value: `${game.progress.talentTitles ?? 0}`, minStageIndex: 5 },
    { label: "同行认可", value: `${game.progress.peerRecognition ?? 0}`, minStageIndex: 5 },
    { label: "团队帽子", value: `优青${teamTitles.youqing ?? 0} / 杰青${teamTitles.jieqing ?? 0} / 长青${teamTitles.changjiangYoung ?? 0} / 长特${teamTitles.changjiangProfessor ?? 0}`, minStageIndex: 6 },
  ].filter((item) => stageIndex >= item.minStageIndex);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="modal profile-modal" aria-labelledby="profile-modal-title" aria-modal="true" role="dialog" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">角色档案</p>
            <h2 id="profile-modal-title">{game.profile?.name ?? DEFAULT_PROFILE.name}</h2>
          </div>
          <button className="secondary compact" type="button" onClick={onClose}>关闭</button>
        </div>

        <div className="profile-layout">
          <aside className="profile-identity">
            <div className="id-photo">
              <ProfilePortrait game={game} stage={stage} />
            </div>
            <CareerLine label="阶段" value={stage.name} />
            <CareerLine label="年龄" value={`${game.age ?? 17} 岁`} />
            <CareerLine label="性别" value={getGenderLabel(game.profile?.gender)} />
            <CareerLine label="当前身份" value={career.selfTitles?.[career.selfTitles.length - 1] ?? stage.subtitle} />
          </aside>

          <div className="profile-columns">
            <ProfileSection title="角色状态">
              <div className="profile-stat-grid">
                {statGroups.map((group, index) => (
                  <div className="profile-stat-group" key={index}>
                    {group.map((key) => (
                      <ProfileStat key={key} label={STAT_LABELS[key]} value={game.stats[key] ?? game.progress[key] ?? 0} danger={key === "pressure"} />
                    ))}
                  </div>
                ))}
              </div>
            </ProfileSection>

            <ProfileSection title="履历状态">
              {careerEntries.length > 0 ? (
                <div className="profile-record-grid">
                  {careerEntries.map((item) => (
                    <CareerLine key={item.label} label={item.label} value={item.value} />
                  ))}
                </div>
              ) : (
                <p className="profile-empty">当前阶段暂无可展示的履历内容。</p>
              )}
            </ProfileSection>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileSection({ title, children }) {
  return (
    <section className="profile-section">
      <h3>{title}</h3>
      <div className="profile-section-body">{children}</div>
    </section>
  );
}

function ProfileStat({ label, value, danger }) {
  return (
    <div className={danger ? "profile-stat danger" : "profile-stat"}>
      <span>{label}</span>
      <strong>{value}</strong>
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

function CareerLine({ label, value }) {
  return (
    <div className="career-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CharacterCreator({ baseStats, onCancel, onCreate }) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState(DEFAULT_PROFILE.gender);
  const [allocations, setAllocations] = useState(createRandomAllocations);
  const [creationStep, setCreationStep] = useState(0);
  const usedPoints = Object.values(allocations).reduce((sum, value) => sum + value, 0);
  const remaining = CREATION_POINTS - usedPoints;
  const finalName = name.trim() || DEFAULT_PROFILE.name;
  const creationSteps = [
    { title: "姓名", desc: "先给这段科研人生留下一个名字。" },
    { title: "性别", desc: "选择你希望在存档和履历里显示的身份。" },
    { title: "属性点", desc: "系统已经给出一套随机方案，你也可以手动调整。" },
  ];
  const isLastStep = creationStep === creationSteps.length - 1;

  function adjustStat(key, delta) {
    setAllocations((current) => {
      const value = current[key] ?? 0;
      if (delta > 0 && remaining <= 0) return current;
      const nextValue = clamp(value + delta, 0, 8);
      return { ...current, [key]: nextValue };
    });
  }

  function submit(event) {
    event.preventDefault();

    if (!isLastStep) {
      setCreationStep((current) => Math.min(current + 1, creationSteps.length - 1));
      return;
    }

    onCreate({
      profile: {
        name: finalName.slice(0, 12),
        gender,
      },
      stats: Object.fromEntries(CREATION_STATS.map((key) => [key, baseStats[key] + allocations[key]])),
    });
  }

  return (
    <form className="creator-panel creator-wizard" onSubmit={submit}>
      <div className="modal-heading">
        <div>
          <p className="eyebrow">角色创建</p>
          <h1>开始前的自己</h1>
        </div>
        <button className="secondary compact" type="button" onClick={onCancel}>返回</button>
      </div>

      <div className="creator-progress" aria-label="角色创建进度">
        {creationSteps.map((step, index) => (
          <button
            className={[
              "creator-step",
              index === creationStep ? "active" : "",
              index < creationStep ? "done" : "",
            ].filter(Boolean).join(" ")}
            key={step.title}
            onClick={() => setCreationStep(index)}
            type="button"
          >
            <span>{index + 1}</span>
            {step.title}
          </button>
        ))}
      </div>

      <section className="creator-step-panel">
        <div className="panel-heading">
          <div>
            <h2>{creationSteps[creationStep].title}</h2>
            <p>{creationSteps[creationStep].desc}</p>
          </div>
          <span className="step-count">{creationStep + 1} / {creationSteps.length}</span>
        </div>

        {creationStep === 0 && (
          <label className="field-row">
            <span>姓名</span>
            <input
              autoFocus
              maxLength={12}
              onChange={(event) => setName(event.target.value)}
              placeholder={DEFAULT_PROFILE.name}
              value={name}
            />
            <small>当前将显示为：{finalName.slice(0, 12)}</small>
          </label>
        )}

        {creationStep === 1 && (
          <div className="field-row">
            <span>性别</span>
            <div className="segmented-control">
              {GENDER_OPTIONS.map((option) => (
                <button
                  className={gender === option.id ? "segment active" : "segment"}
                  key={option.id}
                  onClick={() => setGender(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <small>当前将显示为：{getGenderLabel(gender)}</small>
          </div>
        )}

        {creationStep === 2 && (
          <div className="allocation-panel">
            <div className="panel-heading">
              <h2>初始属性点</h2>
              <p className={remaining === 0 ? "points-left done" : "points-left"}>剩余 {remaining}</p>
            </div>
            <div className="allocation-list">
              {CREATION_STATS.map((key) => {
                const bonus = allocations[key] ?? 0;
                return (
                  <div className="allocation-row" key={key}>
                    <div>
                      <strong>{STAT_LABELS[key]}</strong>
                      <span>{baseStats[key]} + {bonus} = {baseStats[key] + bonus}</span>
                    </div>
                    <div className="stepper">
                      <button type="button" onClick={() => adjustStat(key, -1)} disabled={bonus <= 0}>-</button>
                      <b>{bonus}</b>
                      <button type="button" onClick={() => adjustStat(key, 1)} disabled={remaining <= 0 || bonus >= 8}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <div className="intro-actions creator-actions">
        {creationStep > 0 && (
          <button className="secondary" type="button" onClick={() => setCreationStep((current) => Math.max(current - 1, 0))}>
            上一步
          </button>
        )}
        {creationStep === 2 && (
          <button className="secondary" type="button" onClick={() => setAllocations(createRandomAllocations())}>
            随机方案
          </button>
        )}
        {creationStep === 2 && (
          <button className="secondary" type="button" onClick={() => setAllocations(EMPTY_ALLOCATIONS)}>
            重置点数
          </button>
        )}
        <button className="primary" type="submit">{isLastStep ? "开始科研之路" : "继续"}</button>
      </div>
    </form>
  );
}

function createRandomAllocations() {
  const allocations = { ...EMPTY_ALLOCATIONS };
  for (let point = 0; point < CREATION_POINTS; point += 1) {
    const availableStats = CREATION_STATS.filter((key) => allocations[key] < 8);
    const selected = availableStats[Math.floor(Math.random() * availableStats.length)];
    allocations[selected] += 1;
  }
  return allocations;
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
  return `${game.profile?.name ?? DEFAULT_PROFILE.name}：${stage.name} 第 ${game.turn} 回合，${game.age ?? 17} 岁`;
}

function getSlotSummary(slot) {
  const game = slot.game;
  const updatedAt = slot.updatedAt ? new Date(slot.updatedAt).toLocaleString("zh-CN", { hour12: false }) : "未知时间";
  if (game.ending) return `${game.ending.text} 保存于 ${updatedAt}`;
  const stage = STAGES[game.stageIndex] ?? STAGES[0];
  return `${getGenderLabel(game.profile?.gender)}，${stage.subtitle}，行动点 ${game.ap}，年龄 ${game.age ?? 17}。保存于 ${updatedAt}`;
}

function getGenderLabel(gender) {
  return GENDER_OPTIONS.find((option) => option.id === gender)?.label ?? "男";
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
                  <b>{route.ending ? "确定" : `成功率 ${Math.round(chance * 100)}%`}</b>
                </div>
                <p>{route.desc}</p>
                {!route.ending && (
                  <p className="route-chance-note">成功率代表当前积累走通这条路径的概率；失败会进入该路线的备选分支，不会直接结局。</p>
                )}
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
