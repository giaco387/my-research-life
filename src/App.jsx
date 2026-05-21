import { useEffect, useMemo, useState } from "react";
import "./App.css";

const SAVE_KEY = "research-road-save-v1";

const STAT_LABELS = {
  knowledge: "知识",
  perseverance: "毅力",
  focus: "专注",
  health: "体力",
  pressure: "压力",
  eq: "情商",
  money: "资金",
  reputation: "声望",
  literature: "文献",
  experiment: "实验",
  writing: "写作",
  innovation: "创新",
  network: "合作",
  contribution: "贡献",
};

const INITIAL_STATS = {
  knowledge: 42,
  perseverance: 44,
  focus: 42,
  health: 72,
  pressure: 22,
  eq: 38,
  money: 16,
  reputation: 5,
  literature: 8,
  experiment: 6,
  writing: 8,
  innovation: 7,
  network: 6,
  contribution: 0,
};

const STAGES = [
  {
    id: "high_school",
    name: "高中",
    subtitle: "高三冲刺",
    turns: 8,
    ap: 6,
    goal: "考入理想大学，打下长期学习能力。",
    progress: { exam: "高考准备度" },
  },
  {
    id: "undergraduate",
    name: "本科",
    subtitle: "方向选择",
    turns: 10,
    ap: 7,
    goal: "完成专业训练，争取进入科研路线。",
    progress: { gpa: "学业完成度", research: "科研入门度" },
  },
  {
    id: "master",
    name: "硕士",
    subtitle: "科研训练",
    turns: 10,
    ap: 8,
    goal: "完成课题，产出论文，决定是否继续读博。",
    progress: { project: "课题完成度", paper: "论文进度" },
  },
];

const ACTIONS = {
  high_school: [
    action("study", "刷题训练", 2, "稳定提升知识，高压但可靠。", { knowledge: 5, focus: 2, pressure: 4, health: -3 }, { exam: 8 }),
    action("mock", "模拟考试", 3, "用实战暴露短板。", { knowledge: 3, focus: 4, pressure: 6 }, { exam: 12 }),
    action("teacher", "请教老师", 2, "把卡住的问题讲清楚。", { knowledge: 4, eq: 2, pressure: -2 }, { exam: 6 }),
    action("exercise", "操场跑步", 2, "恢复身体，也恢复一点信心。", { health: 8, perseverance: 3, pressure: -5 }),
    action("sleep", "好好睡觉", 1, "专注来自足够的恢复。", { health: 7, focus: 3, pressure: -4 }),
    action("friends", "和同学聊聊", 1, "别把自己变成孤岛。", { eq: 4, pressure: -3, network: 1 }),
  ],
  undergraduate: [
    action("class", "认真上课", 2, "补齐专业基础。", { knowledge: 4, focus: 2, pressure: 2 }, { gpa: 8 }),
    action("library", "阅读文献", 2, "第一次看见问题的边界。", { literature: 5, knowledge: 2, pressure: 2 }, { research: 6 }),
    action("lab", "进入实验室", 3, "提前接触真实科研。", { experiment: 5, reputation: 2, health: -5, pressure: 5 }, { research: 10 }),
    action("competition", "参加竞赛", 3, "高风险高收益的履历积累。", { perseverance: 4, reputation: 4, pressure: 6 }, { gpa: 4, research: 5 }),
    action("social", "拓展人脉", 2, "认识同学、师兄师姐和潜在导师。", { eq: 5, network: 4, pressure: -2 }),
    action("intern", "企业实习", 3, "获得资金和现实感，但会分心。", { money: 8, eq: 2, knowledge: -2, reputation: 1 }),
    action("rest", "规律休息", 1, "本科不是只有绩点。", { health: 8, pressure: -5, focus: 2 }),
  ],
  master: [
    action("read", "系统读文献", 2, "找到值得做的问题。", { literature: 5, innovation: 2, pressure: 2 }, { project: 5 }),
    action("experiment", "推进实验", 3, "把想法变成证据。", { experiment: 6, health: -6, pressure: 5 }, { project: 12 }),
    action("meeting", "组会汇报", 2, "训练表达，也接受质疑。", { writing: 2, eq: 3, reputation: 1, pressure: 3 }, { project: 5 }),
    action("write", "写论文", 3, "将结果组织成可以被同行理解的贡献。", { writing: 6, focus: 2, pressure: 5 }, { paper: 12 }),
    action("submit", "投稿尝试", 3, "可能被拒，但不会白费。", { reputation: 2, pressure: 6, contribution: 3 }, { paper: 8 }),
    action("conference", "参加会议", 3, "看见更大的学术共同体。", { network: 5, reputation: 4, money: -5, eq: 2 }),
    action("recover", "调整状态", 1, "长期科研需要稳定节奏。", { health: 9, pressure: -7, focus: 2 }),
  ],
};

const EVENTS = {
  high_school: [
    event("month_exam", "月考失利", "这次月考比预期低了不少。班主任建议你先稳住节奏。", [
      choice("加倍刷题", { knowledge: 4, perseverance: 3, pressure: 6 }, { exam: 6 }),
      choice("复盘错题，降低节奏", { focus: 4, pressure: -4 }, { exam: 4 }),
    ]),
    event("parents", "家长施压", "父母给你报了新的补习班，希望每晚汇报学习进度。", [
      choice("接受安排", { knowledge: 3, pressure: 6 }, { exam: 5 }),
      choice("认真沟通，争取自主计划", { eq: 4, pressure: -3, focus: 2 }),
    ]),
    event("insomnia", "考前失眠", "凌晨三点，你还在想没有做完的题。", [
      choice("起床继续学", { knowledge: 2, health: -8, pressure: 6 }),
      choice("强迫自己休息", { health: 4, focus: 2, pressure: 2 }),
    ]),
  ],
  undergraduate: [
    event("mentor_invite", "导师邀请", "一位老师课后邀请你加入课题组。", [
      choice("立刻加入", { experiment: 5, reputation: 3, health: -4, pressure: 4 }, { research: 8 }),
      choice("先打听课题组情况", { eq: 3, network: 3, literature: 2 }),
      choice("暂时拒绝", { health: 3, pressure: -3 }),
    ]),
    event("paper_peer", "同学提前发论文", "同级同学发表了第一篇论文，朋友圈都在祝贺。", [
      choice("找他请教经验", { knowledge: 2, eq: 3, literature: 3 }),
      choice("焦虑但开始追赶", { pressure: 5, perseverance: 4 }, { research: 5 }),
      choice("坚持自己的节奏", { pressure: -3, focus: 3 }),
    ]),
    event("major_doubt", "专业兴趣动摇", "你发现自己并不确定是否喜欢当前方向。", [
      choice("跨方向旁听", { innovation: 4, knowledge: 2, pressure: 2 }),
      choice("先把当前专业学扎实", { focus: 4, knowledge: 3 }, { gpa: 5 }),
    ]),
  ],
  master: [
    event("bad_data", "数据出错", "做了一个月的实验发现采集方法有根本错误。", [
      choice("重做并写清记录", { perseverance: 5, experiment: 3, pressure: 5 }, { project: 4 }),
      choice("找导师讨论补救", { eq: 4, network: 2, pressure: 2 }, { project: 6 }),
      choice("怀疑自己是否适合科研", { pressure: 7, perseverance: -3 }),
    ]),
    event("review", "审稿意见大修", "审稿人认可问题，但要求补充大量实验。", [
      choice("补实验再投", { experiment: 4, writing: 3, pressure: 6 }, { paper: 8 }),
      choice("改投更合适的期刊", { writing: 4, pressure: 2 }, { paper: 5 }),
    ]),
    event("phd_choice", "读博还是就业", "导师问你是否愿意继续读博，同学也在准备秋招。", [
      choice("明确继续科研", { contribution: 5, reputation: 3, pressure: 4 }),
      choice("保留就业选项", { money: 5, eq: 2, pressure: -2 }),
    ]),
  ],
};

const ENDINGS = [
  {
    id: "phd",
    title: "顺利读博",
    test: (s, p) => p.paper >= 70 && p.project >= 70 && s.reputation >= 30,
    text: "你带着代表作和清晰的问题意识进入博士阶段，真正的科研长跑开始了。",
  },
  {
    id: "industry",
    title: "转向产业研发",
    test: (s) => s.money >= 35 && s.eq >= 48,
    text: "你保留科研训练带来的严谨，也选择把问题带到产业现场解决。",
  },
  {
    id: "burnout",
    title: "科研受挫",
    test: (s) => s.pressure >= 85 || s.health <= 12,
    text: "你走得太急，身体和心理先提出了抗议。暂停并不是失败，但这条路暂时走不下去了。",
  },
  {
    id: "steady",
    title: "稳健毕业",
    test: () => true,
    text: "你完成了硕士训练，理解了科研的真实质地。下一步仍有许多可能。",
  },
];

function action(id, name, cost, desc, effects, progress = {}) {
  return { id, name, cost, desc, effects, progress };
}

function event(id, title, desc, choices) {
  return { id, title, desc, choices };
}

function choice(label, effects, progress = {}) {
  return { label, effects, progress };
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function applyDelta(source, delta, max = 100) {
  const next = { ...source };
  Object.entries(delta).forEach(([key, value]) => {
    next[key] = clamp((next[key] ?? 0) + value, 0, max);
  });
  return next;
}

function createInitialGame() {
  return {
    screen: "intro",
    stageIndex: 0,
    turn: 1,
    ap: STAGES[0].ap,
    stats: INITIAL_STATS,
    progress: { exam: 0, gpa: 0, research: 0, project: 0, paper: 0 },
    usedEvents: [],
    activeEvent: null,
    ending: null,
    logs: ["高三开始了。你把目标写在便签上：先考上一所好大学。"],
  };
}

function formatDelta(delta) {
  return Object.entries(delta)
    .map(([key, value]) => `${STAT_LABELS[key] ?? key}${value > 0 ? "+" : ""}${value}`)
    .join("，");
}

function pickEvent(game) {
  const stage = STAGES[game.stageIndex];
  const pool = EVENTS[stage.id].filter((item) => !game.usedEvents.includes(item.id));
  if (!pool.length) return null;
  const pressureBoost = game.stats.pressure > 70 ? 0.25 : 0;
  if (Math.random() > 0.42 + pressureBoost) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getEnding(stats, progress) {
  return ENDINGS.find((ending) => ending.test(stats, progress));
}

function App() {
  const [game, setGame] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      return saved ? JSON.parse(saved) : createInitialGame();
    } catch {
      return createInitialGame();
    }
  });

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  }, [game]);

  const stage = STAGES[game.stageIndex];
  const actions = ACTIONS[stage.id];
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
    setGame(createInitialGame());
  }

  function performAction(item) {
    if (game.ap < item.cost || game.activeEvent || game.ending) return;
    setGame((current) => {
      const stats = applyDelta(current.stats, item.effects);
      const progress = applyDelta(current.progress, item.progress);
      const log = `${stage.name} 第${current.turn}回合：${item.name}。${formatDelta(item.effects)}`;
      return {
        ...current,
        ap: current.ap - item.cost,
        stats,
        progress,
        logs: [log, ...current.logs].slice(0, 80),
      };
    });
  }

  function endTurn() {
    if (game.activeEvent || game.ending) return;
    setGame((current) => {
      const currentStage = STAGES[current.stageIndex];
      const event = pickEvent(current);
      const recovery = current.stats.health < 20 ? -2 : 0;
      const nextStats = applyDelta(current.stats, {
        health: current.stats.health < 30 ? 3 : 1,
        pressure: current.stats.pressure > 65 ? 1 : -1,
      });

      if (event) {
        return {
          ...current,
          stats: nextStats,
          activeEvent: event,
          usedEvents: [...current.usedEvents, event.id],
          logs: [`触发事件：${event.title}`, ...current.logs].slice(0, 80),
        };
      }

      if (current.turn >= currentStage.turns) {
        return settleStage({ ...current, stats: nextStats });
      }

      return {
        ...current,
        stats: nextStats,
        turn: current.turn + 1,
        ap: Math.max(3, currentStage.ap + recovery),
        logs: [`进入${currentStage.name}第${current.turn + 1}回合。`, ...current.logs].slice(0, 80),
      };
    });
  }

  function settleStage(current) {
    if (current.stageIndex === STAGES.length - 1) {
      const ending = getEnding(current.stats, current.progress);
      return {
        ...current,
        ending,
        logs: [`结局：${ending.title}`, ...current.logs].slice(0, 80),
      };
    }

    const finished = STAGES[current.stageIndex];
    const nextStage = STAGES[current.stageIndex + 1];
    const bonus = stageBonus(finished.id, current.stats, current.progress);
    const stats = applyDelta(current.stats, bonus.effects);
    return {
      ...current,
      stageIndex: current.stageIndex + 1,
      turn: 1,
      ap: nextStage.ap,
      stats,
      logs: [`阶段结算：${bonus.text}`, `进入${nextStage.name}阶段：${nextStage.goal}`, ...current.logs].slice(0, 80),
    };
  }

  function chooseEvent(option) {
    setGame((current) => {
      const stats = applyDelta(current.stats, option.effects);
      const progress = applyDelta(current.progress, option.progress);
      return {
        ...current,
        stats,
        progress,
        activeEvent: null,
        logs: [`事件选择：${option.label}。${formatDelta(option.effects)}`, ...current.logs].slice(0, 80),
      };
    });
  }

  if (game.screen === "intro") {
    return (
      <main className="intro">
        <section className="intro-hero">
          <div>
            <p className="eyebrow">模拟经营 / 科研成长 / 回合制选择</p>
            <h1>科研之路</h1>
            <p className="intro-copy">
              从高中开始，在考试、专业选择、实验室、论文和压力之间做长期取舍。首版目标是走完高中、本科和硕士，争取进入博士阶段。
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
              <button className="primary compact" onClick={endTurn} disabled={!!game.activeEvent || !!game.ending}>
                结束回合
              </button>
            </div>
            <div className="actions-grid">
              {actions.map((item) => (
                <button
                  className="action-card"
                  key={item.id}
                  disabled={game.ap < item.cost || !!game.activeEvent || !!game.ending}
                  onClick={() => performAction(item)}
                >
                  <div className="action-title">
                    <strong>{item.name}</strong>
                    <span>{item.cost} AP</span>
                  </div>
                  <p>{item.desc}</p>
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
        <EventModal event={game.activeEvent} onChoose={chooseEvent} />
      )}

      {game.ending && (
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

function stageBonus(stageId, stats, progress) {
  if (stageId === "high_school") {
    const score = progress.exam * 0.55 + stats.knowledge * 0.25 + stats.focus * 0.15 - stats.pressure * 0.08;
    if (score >= 78) return { text: "你考入顶尖高校，获得更好的平台资源。", effects: { reputation: 8, knowledge: 5, network: 4 } };
    if (score >= 62) return { text: "你进入一所不错的大学，科研道路正式打开。", effects: { reputation: 4, knowledge: 3 } };
    return { text: "高考结果普通，但你保留了韧性和继续向上的空间。", effects: { perseverance: 5, pressure: -4 } };
  }

  const readiness = progress.gpa * 0.35 + progress.research * 0.45 + stats.reputation * 0.2;
  if (readiness >= 70) return { text: "你获得优秀导师认可，带着明确方向进入硕士阶段。", effects: { reputation: 6, literature: 4, network: 4 } };
  if (readiness >= 48) return { text: "你拿到升学机会，但仍需要补足科研基本功。", effects: { literature: 3, experiment: 2 } };
  return { text: "你勉强进入科研训练，压力和不确定性都更高了。", effects: { pressure: 6, perseverance: 3 } };
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

export default App;
