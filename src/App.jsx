import { useEffect, useMemo, useState } from "react";
import { ACTIONS } from "./data/actions.js";
import { ENDINGS } from "./data/endings.js";
import { STAGES } from "./data/stages.js";
import { STAT_LABELS } from "./data/stats.js";
import packageInfo from "../package.json";
import {
  canPerformAction,
  chooseEvent as resolveEventChoice,
  performAction as resolveAction,
} from "./game/engine.js";
import { clamp } from "./game/formulas.js";
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
const BACKGROUND_OPTIONS = [
  {
    id: "steady",
    label: "稳扎稳打",
    desc: "你习惯把事情拆成计划，一点点推进。",
    effects: { focus: 4, pressure: -2 },
  },
  {
    id: "curious",
    label: "好奇心重",
    desc: "你容易被问题吸引，也常常忍不住多想一步。",
    effects: { knowledge: 3, innovation: 3, pressure: 1 },
  },
  {
    id: "social",
    label: "会找人帮忙",
    desc: "你不喜欢一个人硬扛，愿意把困惑说出来。",
    effects: { eq: 4, network: 2 },
  },
];
const STAGE_SCENES = {
  high_school: "晚自习的灯还亮着，桌上摊着卷子和错题本。窗外操场安静下来，你得决定今晚怎么过。",
  undergraduate: "新专业、新同学和陌生的实验室同时出现。你开始意识到，成绩只是大学生活的一部分。",
  master: "课题组的日程贴在墙上，导师的建议、实验数据和论文草稿交织在一起。",
  phd: "问题变得更窄，也更深。你需要在不确定里坚持，同时避免被它拖垮。",
  young_faculty: "你有了自己的方向，也有了学生、经费和平台压力。每个决定都会牵动更多人。",
  talent_track: "优青、杰青和长江青年窗口期像倒计时一样靠近。材料只是入口，真正要说清楚的是你的问题。",
  professor: "团队已经成形，学生和项目都在向你要判断。你不再只是完成自己的论文。",
  national_leader: "杰青、长江、创新群体和重大项目把你推到更大的平台上。资源更多，责任也更重。",
  academician_candidate: "头衔之外，同行开始用更长的时间衡量你的贡献、学生和方向。真正要回答的是：哪些工作经得起时间。",
};

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
  const [openPlayPanel, setOpenPlayPanel] = useState(null);
  const [seenStageScenes, setSeenStageScenes] = useState(() => new Set());
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
  const activePlayPanel = game.screen === "play" && !seenStageScenes.has(game.stageIndex) ? "scene" : openPlayPanel;
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
      logs: [`${character.profile.name}的科研之路开始了。${getBackgroundLabel(character.profile.background)}的你，把目标写在便签上：先考上一所好大学。`],
    };
    setActiveSlotId(slotId);
    setPendingSlotId(null);
    setSeenStageScenes(new Set());
    setGame(next);
    setSaveSlots((current) => saveGameToSlot(current, slotId, next));
  }

  function continueGame(slot) {
    if (!slot.game) return;
    setActiveSlotId(slot.id);
    setSeenStageScenes(new Set());
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

  function closePlayPanel() {
    if (activePlayPanel === "scene") {
      setSeenStageScenes((seen) => new Set([...seen, game.stageIndex]));
    }
    setOpenPlayPanel(null);
  }

  function jumpToStage(stageId) {
    const stageIndex = STAGES.findIndex((item) => item.id === stageId);
    const targetStage = STAGES[stageIndex];
    if (!targetStage) return;

    setActiveSlotId(null);
    setSeenStageScenes(new Set());
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
              onShowOverview={() => setShowDevOverview(true)}
            />
          )}
          {showDevOverview && <DevOverview onClose={() => setShowDevOverview(false)} />}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell" style={{ "--game-cover": `url("${getStageImageSrc(stage.id)}")` }}>
      <VersionBadge />
      {isDevMode && (
        <header className="topbar">
          <div className="top-actions">
            <button className="secondary" onClick={returnToSlots}>存档列表</button>
            <button className="secondary" onClick={resetGame}>重新开始</button>
          </div>
        </header>
      )}

      <section className="map-caption">
        <p className="eyebrow">{stage.name} · 第 {game.turn} 回合</p>
        <h2>{stage.subtitle}</h2>
      </section>

      <nav className="play-toolbar" aria-label="游戏操作">
        <button className={activePlayPanel === "actions" ? "tool-button active" : "tool-button"} onClick={() => setOpenPlayPanel(activePlayPanel === "actions" ? null : "actions")} type="button">行动</button>
        <button className={activePlayPanel === "growth" ? "tool-button active" : "tool-button"} onClick={() => setOpenPlayPanel(activePlayPanel === "growth" ? null : "growth")} type="button">成长</button>
        <button className="tool-button" onClick={() => setShowLogModal(true)} type="button">记录</button>
        <button className="tool-button" onClick={() => setShowProfileModal(true)} type="button">档案</button>
      </nav>

      {activePlayPanel && (
        <div className="play-panel-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closePlayPanel();
        }}>
          <PlayPanel
            actions={actions}
            game={game}
            onAction={handleAction}
            onClose={closePlayPanel}
            panel={activePlayPanel}
            stage={stage}
          />
        </div>
      )}

      {game.activeEvent && (
        <EventModal event={game.activeEvent} onChoose={handleEventChoice} />
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

function PlayPanel({ actions, game, onAction, onClose, panel, stage }) {
  const title = panel === "actions" ? "这一回合做什么" : panel === "growth" ? "成长面板" : "当前处境";
  return (
    <aside className={`play-panel ${panel}`} aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-heading">
        <div>
          <p className="eyebrow">{stage.name} · 第 {game.turn} 回合</p>
          <h2>{title}</h2>
        </div>
        <button className="secondary compact" onClick={onClose} type="button">收起</button>
      </div>

      {panel === "scene" && (
        <section className="story-panel bare">
          <h2>{stage.goal}</h2>
          <p>{getTurnScene(stage, game)}</p>
          <p className="ap-line">你还有 {game.ap} 点行动点。先想想这一回合要把时间花在哪里。</p>
        </section>
      )}

      {panel === "growth" && (
        <>
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
        </>
      )}

      {panel === "actions" && (
        <div className="actions-grid">
          {actions.map((item) => (
            <article className="action-card" key={item.id}>
              <div className="action-title">
                <strong>{item.name}</strong>
                <span>{item.cost} AP</span>
              </div>
              <p>{item.desc}</p>
              <div className="action-footer">
                <button
                  className="primary compact"
                  disabled={!canPerformAction(game, item)}
                  onClick={() => onAction(item)}
                  type="button"
                >
                  选择
                </button>
              </div>
              <details className="action-details">
                <summary>查看影响</summary>
                {item.requirements?.length > 0 && (
                  <p className="requirements">条件：{describeRequirements(item.requirements).join("，")}</p>
                )}
                {item.risk && (
                  <p className="risk-note">风险：{Math.round(item.risk.chance * 100)}% 可能出现负面结果</p>
                )}
                <EffectChips effects={item.effects} progress={item.progress} />
              </details>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}

function DevTools({ onJumpStage, onShowOverview }) {
  return (
    <aside className="dev-tools">
      <p className="slot-kicker">开发者速览</p>
      <div className="dev-actions">
        {STAGES.map((stage) => (
          <button className="secondary compact" key={stage.id} onClick={() => onJumpStage(stage.id)}>
            {stage.name}
          </button>
        ))}
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

function ProfileModal({ game, statGroups, onClose }) {
  const [activeTab, setActiveTab] = useState("stats");
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

        <div className="profile-tabs" role="tablist" aria-label="角色档案分类">
          <button className={activeTab === "stats" ? "profile-tab active" : "profile-tab"} onClick={() => setActiveTab("stats")} role="tab" type="button">角色状态</button>
          <button className={activeTab === "career" ? "profile-tab active" : "profile-tab"} onClick={() => setActiveTab("career")} role="tab" type="button">履历状态</button>
        </div>

        <div className="profile-page">
          {activeTab === "stats" && (
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
          )}

          {activeTab === "career" && (
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
          )}
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
  const [background, setBackground] = useState(DEFAULT_PROFILE.background);
  const [allocations, setAllocations] = useState(createRandomAllocations);
  const [creationStep, setCreationStep] = useState(0);
  const usedPoints = Object.values(allocations).reduce((sum, value) => sum + value, 0);
  const remaining = CREATION_POINTS - usedPoints;
  const finalName = name.trim() || DEFAULT_PROFILE.name;
  const creationSteps = [
    { title: "姓名", desc: "先给这段科研人生留下一个名字。" },
    { title: "性别", desc: "选择你希望在存档和履历里显示的身份。" },
    { title: "背景", desc: "选择一个起点。它不会决定命运，但会改变你最开始的惯性。" },
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
        background,
      },
      stats: Object.fromEntries(CREATION_STATS.map((key) => [key, baseStats[key] + allocations[key] + (getBackgroundOption(background).effects[key] ?? 0)])),
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
          <div className="background-options">
            {BACKGROUND_OPTIONS.map((option) => (
              <button
                className={background === option.id ? "background-card active" : "background-card"}
                key={option.id}
                onClick={() => setBackground(option.id)}
                type="button"
              >
                <strong>{option.label}</strong>
                <span>{option.desc}</span>
              </button>
            ))}
          </div>
        )}

        {creationStep === 3 && (
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
        {creationStep === 3 && (
          <button className="secondary" type="button" onClick={() => setAllocations(createRandomAllocations())}>
            随机方案
          </button>
        )}
        {creationStep === 3 && (
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

function getTurnScene(stage, game) {
  const base = STAGE_SCENES[stage.id] ?? stage.goal;
  if ((game.stats?.pressure ?? 0) > 70) return `${base} 最近压力明显变重，连普通决定都像多了一层噪音。`;
  if ((game.stats?.health ?? 100) < 30) return `${base} 身体已经在提醒你：继续硬撑会有代价。`;
  return base;
}

function getBackgroundOption(background) {
  return BACKGROUND_OPTIONS.find((option) => option.id === background) ?? BACKGROUND_OPTIONS[0];
}

function getBackgroundLabel(background) {
  return getBackgroundOption(background).label;
}

function EffectChips({ effects, progress }) {
  return (
    <div className="chips">
      {Object.entries({ ...effects, ...progress }).map(([key, value]) => (
        <span className={value >= 0 ? "chip up" : "chip down"} key={key}>
          {STAT_LABELS[key] ?? "未知指标"}{value > 0 ? "+" : ""}{value}
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

export default App;
