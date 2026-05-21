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
  {
    id: "phd",
    name: "博士",
    subtitle: "独立探索",
    turns: 12,
    ap: 9,
    goal: "形成独立方向，完成博士论文，积累原创贡献。",
    progress: { dissertation: "博士论文", originality: "原创贡献" },
  },
  {
    id: "young_faculty",
    name: "青年教师",
    subtitle: "独立 PI",
    turns: 10,
    ap: 9,
    goal: "申请基金、建设团队，完成从学生到学术负责人的转变。",
    progress: { fund: "基金积累", team: "团队建设" },
  },
  {
    id: "professor",
    name: "教授",
    subtitle: "学术带头人",
    turns: 10,
    ap: 10,
    goal: "承担重大项目，培养学生，形成稳定学术影响。",
    progress: { majorProject: "重大项目", talent: "人才培养" },
  },
  {
    id: "academician_candidate",
    name: "院士候选",
    subtitle: "最高评审",
    turns: 6,
    ap: 10,
    goal: "以原创贡献、学术声望和人才培养接受最终评审。",
    progress: { academyReview: "院士评审" },
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
  phd: [
    action("deep_topic", "深挖选题", 3, "把问题从可做推进到值得做。", { innovation: 6, literature: 3, pressure: 4 }, { originality: 10 }),
    action("long_experiment", "长周期实验", 4, "高投入、高波动，但可能形成代表作。", { experiment: 7, health: -7, pressure: 6 }, { dissertation: 10, originality: 8 }),
    action("paper_sprint", "论文冲刺", 3, "把博士阶段的结果组织成论文。", { writing: 7, reputation: 3, pressure: 6 }, { dissertation: 12 }),
    action("visit", "交流访问", 3, "在更大的网络里校准自己的方向。", { network: 7, reputation: 4, money: -6, eq: 2 }, { originality: 5 }),
    action("mentor_junior", "指导低年级", 2, "开始学习如何带人做事。", { eq: 4, network: 3, contribution: 2 }, { dissertation: 4 }),
    action("mental_break", "心理调适", 1, "博士不是短跑，稳定比爆发更稀缺。", { health: 9, pressure: -8, focus: 2 }),
  ],
  young_faculty: [
    action("grant", "申请青年基金", 3, "基金是独立 PI 的第一道硬门槛。", { writing: 5, reputation: 3, pressure: 5 }, { fund: 12 }),
    action("recruit", "招募学生", 3, "团队开始从一个人变成一群人。", { network: 5, eq: 4, pressure: 3 }, { team: 10 }),
    action("platform", "建设平台", 3, "设备、流程和数据都要从零搭起来。", { money: -7, experiment: 4, pressure: 4 }, { team: 8, fund: 4 }),
    action("representative", "发表代表作", 4, "需要把方向压成清晰的学术贡献。", { reputation: 8, contribution: 7, pressure: 7 }, { fund: 6 }),
    action("teach", "平衡教学", 2, "教学会消耗时间，也会训练表达。", { writing: 3, eq: 3, health: -2 }, { team: 4 }),
    action("recover", "恢复节奏", 1, "可持续的科研节奏本身就是能力。", { health: 8, pressure: -7, focus: 2 }),
  ],
  professor: [
    action("major_grant", "组织重大项目", 4, "把多个方向、团队和资源合成一个目标。", { reputation: 6, network: 5, pressure: 6 }, { majorProject: 12 }),
    action("train_phd", "培养博士生", 3, "学生的成长会反过来塑造你的学术影响。", { eq: 5, contribution: 3, pressure: 3 }, { talent: 10 }),
    action("breakthrough", "攻关原创问题", 4, "风险很高，但这是走向学术高峰的核心。", { innovation: 7, contribution: 8, pressure: 7 }, { majorProject: 8 }),
    action("community", "学术共同体服务", 2, "审稿、会议和学会工作会扩大长期声望。", { reputation: 4, network: 4, health: -2 }, { talent: 4 }),
    action("award", "申报重要奖项", 3, "把长期成果整理成可被评审理解的证据。", { writing: 4, reputation: 6, pressure: 4 }, { majorProject: 6 }),
    action("recover", "留出空白", 1, "越到后期，越需要避免被事务吞没。", { health: 8, pressure: -7, focus: 2 }),
  ],
  academician_candidate: [
    action("summarize", "凝练原创贡献", 3, "把一生工作压缩成几条真正站得住的贡献。", { contribution: 8, writing: 5, pressure: 4 }, { academyReview: 12 }),
    action("peer_support", "同行推荐", 3, "声望不是投票机器，但同行认可是硬条件。", { reputation: 7, network: 5, pressure: 3 }, { academyReview: 10 }),
    action("talent_record", "整理人才培养", 2, "学生和团队的成果也是学术生命的一部分。", { eq: 4, reputation: 3 }, { academyReview: 7 }),
    action("ethics", "学术自查", 2, "越接近顶端，越要经得起细看。", { contribution: 3, pressure: -3, reputation: 2 }, { academyReview: 6 }),
    action("public_impact", "社会影响", 3, "让基础研究和现实问题产生连接。", { reputation: 5, money: 4, network: 3 }, { academyReview: 8 }),
    action("recover", "保持健康", 1, "终局评审前，身体依然是所有行动的前提。", { health: 8, pressure: -7 }),
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
  phd: [
    event("scooped", "被竞争团队抢发", "你追了半年的方向被另一支团队先发表了。", [
      choice("快速转向延展问题", { innovation: 5, perseverance: 4, pressure: 5 }, { originality: 5 }),
      choice("补强证据继续投稿", { experiment: 4, writing: 3, pressure: 7 }, { dissertation: 6 }),
    ]),
    event("advisor_gap", "导师资源不足", "导师近期事务繁忙，课题推进主要靠你自己判断。", [
      choice("主动约讨论并给方案", { eq: 4, focus: 3, pressure: 2 }, { dissertation: 5 }),
      choice("独立推进", { innovation: 4, perseverance: 4, pressure: 5 }, { originality: 6 }),
    ]),
    event("international", "国际合作机会", "一次会议后，海外课题组邀请你做短期合作。", [
      choice("接受合作", { network: 6, reputation: 4, money: -5 }, { originality: 6 }),
      choice("留在组内完成主线", { focus: 4, pressure: -2 }, { dissertation: 6 }),
    ]),
  ],
  young_faculty: [
    event("grant_reject", "基金申请失败", "青年基金没有中，评审意见有用但也很刺耳。", [
      choice("逐条修改来年再投", { writing: 5, perseverance: 4, pressure: 4 }, { fund: 6 }),
      choice("先用小项目维持方向", { network: 3, money: 3, pressure: 2 }, { team: 4 }),
    ]),
    event("student_issue", "学生培养问题", "一名学生长期没有进展，你需要决定怎么处理。", [
      choice("细化目标并密集反馈", { eq: 5, pressure: 4 }, { team: 6 }),
      choice("调整课题方向", { innovation: 3, pressure: 2 }, { team: 4 }),
    ]),
  ],
  professor: [
    event("academic_dispute", "学术争议", "你的代表性成果被同行公开质疑。", [
      choice("公开数据和复现实验", { reputation: 4, contribution: 4, pressure: 6 }, { majorProject: 5 }),
      choice("组织专题讨论", { network: 5, eq: 4, pressure: 3 }, { talent: 5 }),
    ]),
    event("student_breakthrough", "学生取得突破", "你指导的博士生做出了超出预期的成果。", [
      choice("让学生做一作独立展示", { reputation: 4, eq: 5, contribution: 3 }, { talent: 8 }),
      choice("整合进团队主线", { contribution: 5, pressure: 2 }, { majorProject: 6 }),
    ]),
  ],
  academician_candidate: [
    event("ethics_review", "学术道德审查", "评审要求补充早期数据和贡献说明。", [
      choice("完整公开材料", { reputation: 4, pressure: 3 }, { academyReview: 8 }),
      choice("请合作者共同说明", { network: 4, eq: 3, pressure: 2 }, { academyReview: 6 }),
    ]),
    event("final_vote", "最终评议", "多年成果被放到同一张桌上比较，评议进入最后阶段。", [
      choice("接受同行评议", { pressure: 5, reputation: 3 }, { academyReview: 10 }),
      choice("保持节奏，继续做研究", { pressure: -3, contribution: 4 }, { academyReview: 6 }),
    ]),
  ],
};

const ENDINGS = [
  {
    id: "academician",
    title: "当选院士",
    test: (s, p) => p.academyReview >= 78 && s.contribution >= 72 && s.reputation >= 72 && s.network >= 55,
    text: "你的原创贡献、人才培养和长期学术影响获得同行认可。科研之路抵达最高荣誉，但问题本身仍在前方。",
  },
  {
    id: "master",
    title: "学术大师",
    test: (s, p) => p.academyReview >= 68 && s.contribution >= 78,
    text: "你未必拿到所有头衔，但你的工作已经成为后来者绕不开的坐标。",
  },
  {
    id: "professor",
    title: "优秀教授",
    test: (s, p) => p.talent >= 60 || s.reputation >= 65,
    text: "你建立了稳定团队，培养了学生，也留下了扎实的代表性成果。",
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
    title: "平凡但完整",
    test: () => true,
    text: "你没有成为传记里的名字，但认真完成了每个阶段的选择。科研训练也成为你理解世界的一种方式。",
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
    progress: {
      exam: 0,
      gpa: 0,
      research: 0,
      project: 0,
      paper: 0,
      dissertation: 0,
      originality: 0,
      fund: 0,
      team: 0,
      majorProject: 0,
      talent: 0,
      academyReview: 0,
    },
    usedEvents: [],
    activeEvent: null,
    pendingAdvance: false,
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

function canPerformAnyAction(stageId, ap) {
  return ACTIONS[stageId].some((item) => item.cost <= ap);
}

function advanceTurn(current, { allowEvent = true } = {}) {
  const currentStage = STAGES[current.stageIndex];
  const event = allowEvent ? pickEvent(current) : null;
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
      pendingAdvance: true,
      usedEvents: [...current.usedEvents, event.id],
      logs: [`触发事件：${event.title}`, ...current.logs].slice(0, 80),
    };
  }

  if (current.turn >= currentStage.turns) {
    return settleStage({ ...current, stats: nextStats, pendingAdvance: false });
  }

  return {
    ...current,
    stats: nextStats,
    turn: current.turn + 1,
    ap: Math.max(3, currentStage.ap + recovery),
    pendingAdvance: false,
    logs: [`行动点不足，自动进入${currentStage.name}第${current.turn + 1}回合。`, ...current.logs].slice(0, 80),
  };
}

function settleStage(current) {
  if (current.stageIndex === STAGES.length - 1) {
    const ending = getEnding(current.stats, current.progress);
    return {
      ...current,
      ending,
      pendingAdvance: false,
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
    pendingAdvance: false,
    logs: [`阶段结算：${bonus.text}`, `进入${nextStage.name}阶段：${nextStage.goal}`, ...current.logs].slice(0, 80),
  };
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
      const currentStage = STAGES[current.stageIndex];
      const stats = applyDelta(current.stats, item.effects);
      const progress = applyDelta(current.progress, item.progress);
      const nextAp = current.ap - item.cost;
      const updated = {
        ...current,
        ap: nextAp,
        stats,
        progress,
        logs: [`${currentStage.name} 第${current.turn}回合：${item.name}。${formatDelta(item.effects)}`, ...current.logs].slice(0, 80),
      };
      return canPerformAnyAction(currentStage.id, nextAp) ? updated : advanceTurn(updated);
    });
  }

  function chooseEvent(option) {
    setGame((current) => {
      const stats = applyDelta(current.stats, option.effects);
      const progress = applyDelta(current.progress, option.progress);
      const resolved = {
        ...current,
        stats,
        progress,
        activeEvent: null,
        pendingAdvance: false,
        logs: [`事件选择：${option.label}。${formatDelta(option.effects)}`, ...current.logs].slice(0, 80),
      };
      return current.pendingAdvance ? advanceTurn(resolved, { allowEvent: false }) : resolved;
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

  if (stageId === "undergraduate") {
    const readiness = progress.gpa * 0.35 + progress.research * 0.45 + stats.reputation * 0.2;
    if (readiness >= 70) return { text: "你获得优秀导师认可，带着明确方向进入硕士阶段。", effects: { reputation: 6, literature: 4, network: 4 } };
    if (readiness >= 48) return { text: "你拿到升学机会，但仍需要补足科研基本功。", effects: { literature: 3, experiment: 2 } };
    return { text: "你勉强进入科研训练，压力和不确定性都更高了。", effects: { pressure: 6, perseverance: 3 } };
  }

  if (stageId === "master") {
    const readiness = progress.project * 0.4 + progress.paper * 0.4 + stats.literature * 0.1 + stats.writing * 0.1;
    if (readiness >= 72) return { text: "你带着论文和问题意识进入博士阶段。", effects: { reputation: 7, contribution: 6, innovation: 4 } };
    if (readiness >= 50) return { text: "你获得读博机会，但博士阶段需要更强的独立性。", effects: { perseverance: 5, literature: 3, pressure: 3 } };
    return { text: "你完成了硕士训练，但科研基础并不稳固。", effects: { pressure: 5, writing: 2 } };
  }

  if (stageId === "phd") {
    const readiness = progress.dissertation * 0.45 + progress.originality * 0.4 + stats.contribution * 0.15;
    if (readiness >= 75) return { text: "你的博士工作形成了清晰原创贡献，拿到青年教师位置。", effects: { reputation: 9, contribution: 8, network: 5 } };
    if (readiness >= 52) return { text: "你顺利博士毕业，开始独立承担课题。", effects: { reputation: 5, writing: 4, pressure: 2 } };
    return { text: "博士毕业过程艰难，你进入下一阶段时仍背着很重的压力。", effects: { pressure: 8, perseverance: 4 } };
  }

  if (stageId === "young_faculty") {
    const readiness = progress.fund * 0.45 + progress.team * 0.35 + stats.reputation * 0.2;
    if (readiness >= 70) return { text: "你站稳了独立 PI 的位置，团队开始产出稳定成果。", effects: { reputation: 8, contribution: 6, money: 8 } };
    if (readiness >= 48) return { text: "你保住了方向，也理解了管理和科研的双重压力。", effects: { eq: 4, network: 4, pressure: 3 } };
    return { text: "青年教师阶段消耗很大，你的团队基础仍然薄弱。", effects: { pressure: 7, health: -4 } };
  }

  if (stageId === "professor") {
    const readiness = progress.majorProject * 0.45 + progress.talent * 0.35 + stats.contribution * 0.2;
    if (readiness >= 72) return { text: "你形成了学术影响和人才梯队，进入院士候选视野。", effects: { reputation: 10, contribution: 8, network: 6 } };
    if (readiness >= 50) return { text: "你成为稳健的学术带头人，但距离最高评审仍有差距。", effects: { reputation: 6, contribution: 4 } };
    return { text: "你承担了大量事务，真正能沉淀为学术影响的成果偏少。", effects: { pressure: 6, eq: 3 } };
  }

  return { text: "你进入最终评审阶段，所有积累都会被重新衡量。", effects: { reputation: 2 } };
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
