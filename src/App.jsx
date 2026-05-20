import { useState, useEffect, useRef } from "react";

// ─── GAME DATA ────────────────────────────────────────────────────────────────

const STAGES = [
  { id: "gaosan", name: "高三备考", years: "高三", rounds: 4, desc: "人生第一场大考" },
  { id: "benke", name: "本科阶段", years: "大一 - 大四", rounds: 8, desc: "选择比努力更重要" },
];

const ACTIONS = {
  gaosan: [
    { id: "study", label: "题海战术", icon: "📚", cost: 3, effects: { 智识: 3, 毅力: 1, 压力: 2, 体力: -1 }, desc: "埋头苦刷，智识大增但压力陡升" },
    { id: "sleep", label: "充足睡眠", icon: "😴", cost: 2, effects: { 体力: 3, 压力: -2, 专注度: 2 }, desc: "睡够了才能学好" },
    { id: "exercise", label: "操场跑步", icon: "🏃", cost: 2, effects: { 体力: 2, 压力: -1, 毅力: 1 }, desc: "强健体魄，释放压力" },
    { id: "mock", label: "模拟考试", icon: "📝", cost: 3, effects: { 智识: 2, 压力: 3, 专注度: 1 }, desc: "实战演练，但压力不小" },
    { id: "relax", label: "适当娱乐", icon: "🎮", cost: 1, effects: { 压力: -3, 体力: 1, 智识: -1 }, desc: "放松一下，但感觉有点罪恶感" },
    { id: "tutor", label: "请教老师", icon: "👨‍🏫", cost: 2, effects: { 智识: 2, 情商: 1, 压力: -1 }, desc: "老师的点拨往往事半功倍" },
  ],
  benke: [
    { id: "class", label: "认真上课", icon: "📖", cost: 2, effects: { 智识: 2, 毅力: 1, 压力: 1 }, desc: "基础知识是科研的根基" },
    { id: "lab", label: "进实验室", icon: "🔬", cost: 3, effects: { 智识: 2, 声望: 1, 体力: -2, 压力: 2 }, desc: "提前接触科研，但很耗精力" },
    { id: "social", label: "拓展人脉", icon: "🤝", cost: 2, effects: { 情商: 2, 声望: 1, 压力: -1 }, desc: "认识形形色色的人" },
    { id: "competition", label: "参加竞赛", icon: "🏆", cost: 3, effects: { 智识: 1, 声望: 2, 压力: 3, 毅力: 2 }, desc: "高风险高回报" },
    { id: "intern", label: "企业实习", icon: "💼", cost: 3, effects: { 资金: 3, 情商: 1, 声望: 1, 智识: -1 }, desc: "赚点钱，但分了心" },
    { id: "rest", label: "好好休息", icon: "☕", cost: 1, effects: { 体力: 3, 压力: -3 }, desc: "大学不只有卷" },
    { id: "read", label: "阅读文献", icon: "📄", cost: 2, effects: { 智识: 3, 毅力: 1, 压力: 1, 体力: -1 }, desc: "站在巨人的肩膀上" },
    { id: "exercise", label: "健身锻炼", icon: "🏋️", cost: 2, effects: { 体力: 3, 压力: -2, 毅力: 1 }, desc: "身体是革命的本钱" },
  ],
};

const EVENTS = {
  gaosan: [
    {
      id: "e1", title: "月考成绩出炉", desc: "这次月考发挥失常，比预期低了30分。班主任找你谈话，说要保持心态。",
      choices: [
        { label: "发奋图强，加倍努力", effects: { 智识: 2, 压力: 3, 毅力: 2 } },
        { label: "调整心态，平稳应对", effects: { 压力: -2, 专注度: 2, 毅力: 1 } },
      ]
    },
    {
      id: "e2", title: "好朋友约你出去玩", desc: "高考前夕，好朋友说毕业了大家就散了，趁现在聚一聚。",
      choices: [
        { label: "去！友情无价", effects: { 情商: 2, 压力: -2, 智识: -1 } },
        { label: "拒绝，专心备考", effects: { 智识: 1, 压力: 1, 情商: -1 } },
      ]
    },
    {
      id: "e3", title: "失眠了", desc: "考前焦虑，凌晨三点盯着天花板，脑子里全是做不完的题。",
      choices: [
        { label: "起来继续学习", effects: { 智识: 1, 体力: -3, 压力: 3 } },
        { label: "强迫自己休息", effects: { 体力: 1, 压力: 1, 专注度: 1 } },
      ]
    },
    {
      id: "e4", title: "班级学神退步了", desc: "一直吊打全班的学神这次考差了，有人幸灾乐祸，有人担忧。你怎么看？",
      choices: [
        { label: "默默加油，超越他的机会来了", effects: { 毅力: 2, 智识: 1 } },
        { label: "去安慰他，他一定很难受", effects: { 情商: 3, 压力: -1 } },
      ]
    },
    {
      id: "e5", title: "家长施压", desc: "父母觉得你最近太松懈了，要求你每天汇报学习进度，并给你报了补习班。",
      choices: [
        { label: "接受，父母也是为我好", effects: { 智识: 1, 压力: 3, 毅力: 1 } },
        { label: "沟通，争取自主学习空间", effects: { 情商: 2, 压力: -1, 智识: 1 } },
      ]
    },
  ],
  benke: [
    {
      id: "b1", title: "导师邀请你进组", desc: "一位老师在课后找到你，说你在课上的发言让他印象深刻，邀请你加入他的实验室。",
      choices: [
        { label: "立刻加入！机不可失", effects: { 智识: 2, 声望: 2, 体力: -2, 压力: 2 } },
        { label: "先打听一下再说", effects: { 情商: 1, 智识: 1 } },
        { label: "婉拒，想先好好享受大学生活", effects: { 体力: 1, 压力: -2 } },
      ]
    },
    {
      id: "b2", title: "同学的论文发表了", desc: "和你同年入学的同学，大二就在核心期刊发表了论文，朋友圈一片恭喜。你心里……",
      choices: [
        { label: "被激励了，找他聊聊怎么做到的", effects: { 智识: 2, 情商: 1, 毅力: 2 } },
        { label: "有点焦虑，自己好像落后了", effects: { 压力: 3, 智识: 1 } },
        { label: "真心为他高兴，走自己的路", effects: { 压力: -1, 毅力: 2 } },
      ]
    },
    {
      id: "b3", title: "保研还是考研？", desc: "大三末，你的绩点可以保研，但你心仪的学校只能考研去，而且风险很大。",
      choices: [
        { label: "保研，稳妥为主", effects: { 声望: 1, 压力: -3, 智识: 1 } },
        { label: "放弃保研，冲击顶校", effects: { 毅力: 3, 压力: 4, 智识: 2 } },
      ]
    },
    {
      id: "b4", title: "谈恋爱了", desc: "你喜欢上了同班的同学，对方似乎也有意思。但期末考试下周就要来了。",
      choices: [
        { label: "勇敢表白，爱情不等人", effects: { 情商: 2, 压力: -2, 智识: -1 } },
        { label: "考完再说，先把试考好", effects: { 智识: 2, 压力: 1 } },
      ]
    },
    {
      id: "b5", title: "实验室数据出错了", desc: "你做了一个月的实验，今天发现数据采集方法有根本性错误，一切要重来。",
      choices: [
        { label: "崩溃一会儿，然后重新开始", effects: { 毅力: 3, 压力: 3, 智识: 1 } },
        { label: "找老师求助，看能否补救", effects: { 情商: 2, 智识: 1, 压力: 2 } },
        { label: "质疑自己是否适合科研", effects: { 压力: 4, 毅力: -1 } },
      ]
    },
    {
      id: "b6", title: "暑假大厂实习机会", desc: "字节/腾讯给了你一个暑期实习offer，月薪2万。但你原定暑假做科研项目。",
      choices: [
        { label: "去实习！钱和经验都要", effects: { 资金: 4, 情商: 1, 智识: -1, 声望: 1 } },
        { label: "坚持做科研，学术路才刚开始", effects: { 智识: 2, 毅力: 2, 声望: 1 } },
      ]
    },
  ],
};

const GAOKAO_RESULTS = [
  { min: 85, label: "清北复交", desc: "考入顶尖高校，未来资源丰厚", bonus: { 智识: 5, 声望: 5 } },
  { min: 70, label: "985高校", desc: "实力强校，平台不错", bonus: { 智识: 3, 声望: 3 } },
  { min: 55, label: "211高校", desc: "稳健起步，靠自己发光", bonus: { 智识: 2, 声望: 1 } },
  { min: 0, label: "普通本科", desc: "平台一般，但人生从不只看第一步", bonus: { 毅力: 2 } },
];

const ENDINGS = [
  {
    id: "genius", title: "🏆 天才学者", condition: s => s.智识 >= 28 && s.声望 >= 15,
    desc: "你的名字将出现在教科书里。不是每个人都能走到这一步，而你做到了。代价嘛——你已经记不清上次睡个好觉是什么时候了。",
    color: "#FFD700"
  },
  {
    id: "balanced", title: "⚖️ 平衡的人", condition: s => s.情商 >= 15 && s.体力 >= 15 && s.压力 <= 20,
    desc: "你没有顶级的论文，但你有真心的朋友、健康的身体、和一份真正热爱的工作。也许这才是最难的成就。",
    color: "#4ECDC4"
  },
  {
    id: "industry", title: "💼 科技创业者", condition: s => s.资金 >= 12 && s.情商 >= 12,
    desc: "你用科研思维做了一家公司。同学们还在发论文的时候，你已经在思考如何改变世界了。",
    color: "#FF6B6B"
  },
  {
    id: "burnout", title: "😮‍💨 提前退场", condition: s => s.压力 >= 35,
    desc: "某一天你突然明白，不是所有人都应该留在学术界。你离开了，然后发现外面的世界其实挺大的。",
    color: "#95A5A6"
  },
  {
    id: "ordinary", title: "🌱 普通而完整", condition: () => true,
    desc: "没有传奇，没有大奖。但你认真地过了每一天，这本身就是一种了不起的事情。",
    color: "#A8E6CF"
  },
];

const INITIAL_STATS = {
  智识: 10, 毅力: 10, 情商: 8, 体力: 15,
  专注度: 10, 压力: 5, 资金: 5, 声望: 0,
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function StatBar({ label, value, max = 40, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const isWarning = label === "压力" && value > 25;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3, fontFamily: "'Noto Serif SC', serif", color: isWarning ? "#FF6B6B" : "#c9b99a" }}>
        <span>{label}{isWarning ? " ⚠️" : ""}</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 3,
          background: isWarning ? "linear-gradient(90deg, #FF6B6B, #FF9999)" : color,
          transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
          boxShadow: isWarning ? "0 0 8px rgba(255,107,107,0.5)" : "none"
        }} />
      </div>
    </div>
  );
}

function StatDelta({ effects }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
      {Object.entries(effects).map(([k, v]) => (
        <span key={k} style={{
          fontSize: 10, padding: "1px 6px", borderRadius: 10,
          background: v > 0 ? "rgba(78,205,196,0.15)" : "rgba(255,107,107,0.15)",
          color: v > 0 ? "#4ECDC4" : "#FF8A80",
          border: `1px solid ${v > 0 ? "rgba(78,205,196,0.3)" : "rgba(255,107,107,0.3)"}`,
          fontFamily: "monospace"
        }}>
          {k} {v > 0 ? "+" : ""}{v}
        </span>
      ))}
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      background: "rgba(30,24,16,0.97)", border: "1px solid rgba(201,185,154,0.4)",
      borderRadius: 10, padding: "10px 20px", color: "#c9b99a",
      fontFamily: "'Noto Serif SC', serif", fontSize: 13, zIndex: 9999,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "fadeIn 0.3s ease"
    }}>
      {message}
    </div>
  );
}

// ─── MAIN GAME ────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("intro"); // intro | game | event | gaokao | stage_end | ending
  const [stageIdx, setStageIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [ap, setAp] = useState(10); // action points
  const [stats, setStats] = useState({ ...INITIAL_STATS });
  const [statDeltas, setStatDeltas] = useState({});
  const [event, setEvent] = useState(null);
  const [log, setLog] = useState([]);
  const [gaokaoScore, setGaokaoScore] = useState(null);
  const [schoolResult, setSchoolResult] = useState(null);
  const [ending, setEnding] = useState(null);
  const [toast, setToast] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const logRef = useRef();

  const stage = STAGES[stageIdx];
  const actions = ACTIONS[stage?.id] || [];
  const totalRounds = stage?.rounds || 4;

  function addLog(msg) {
    setLog(prev => [...prev.slice(-30), { msg, time: Date.now() }]);
    setTimeout(() => logRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
  }

  function applyEffects(effects, source = "") {
    const deltas = {};
    setStats(prev => {
      const next = { ...prev };
      Object.entries(effects).forEach(([k, v]) => {
        next[k] = Math.max(0, Math.min(50, (next[k] || 0) + v));
        deltas[k] = v;
      });
      return next;
    });
    setStatDeltas(deltas);
    setTimeout(() => setStatDeltas({}), 1500);
    if (source) addLog(source);
  }

  function doAction(action) {
    if (ap < action.cost) { setToast("行动点不足！"); return; }
    setAp(p => p - action.cost);
    applyEffects(action.effects, `✅ ${action.label}：${action.desc}`);
    setAnimKey(k => k + 1);
  }

  function triggerRandomEvent() {
    const pool = EVENTS[stage.id] || [];
    const e = pool[Math.floor(Math.random() * pool.length)];
    setEvent(e);
    setScreen("event");
  }

  function chooseEvent(choice) {
    applyEffects(choice.effects, `📌 你选择了「${choice.label}」`);
    setEvent(null);
    setScreen("game");
    nextRound();
  }

  function nextRound() {
    const nextRound = round + 1;
    if (nextRound > totalRounds) {
      // stage end
      if (stageIdx === 0) {
        // gaokao!
        const score = Math.min(100, Math.max(20, Math.round(stats.智识 * 2.2 + stats.专注度 * 1.5 - stats.压力 * 0.8 + Math.random() * 15)));
        setGaokaoScore(score);
        const res = GAOKAO_RESULTS.find(r => score >= r.min);
        setSchoolResult(res);
        applyEffects(res.bonus, `🎓 高考结束！考入${res.label}`);
        setScreen("gaokao");
      } else {
        // end game
        const end = ENDINGS.find(e => e.condition(stats)) || ENDINGS[ENDINGS.length - 1];
        setEnding(end);
        setScreen("ending");
      }
    } else {
      setRound(nextRound);
      setAp(10);
      addLog(`─── 第${nextRound}回合开始 ───`);
      // random event every 2 rounds
      if (nextRound % 2 === 0) {
        setTimeout(triggerRandomEvent, 300);
      }
    }
  }

  function endTurn() {
    addLog(`📅 结束本回合（剩余${ap}点行动力）`);
    if (round % 2 !== 0) nextRound();
    else triggerRandomEvent();
  }

  function startBenke() {
    setStageIdx(1);
    setRound(1);
    setAp(10);
    addLog("─── 本科阶段开始 ───");
    setScreen("game");
  }

  // ── SCREENS ──

  const bg = "radial-gradient(ellipse at 20% 50%, #1a1205 0%, #0d0c08 60%, #050505 100%)";
  const cardBg = "rgba(255,255,255,0.03)";
  const border = "1px solid rgba(201,185,154,0.12)";
  const gold = "#c9b99a";
  const accent = "#e8d5a0";

  if (screen === "intro") return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:transparent } ::-webkit-scrollbar-thumb { background:rgba(201,185,154,0.2); border-radius:2px }
      `}</style>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center", animation: "fadeIn 0.8s ease" }}>
        <div style={{ fontSize: 64, marginBottom: 16, filter: "drop-shadow(0 0 30px rgba(200,180,100,0.3))" }}>🎓</div>
        <h1 style={{
          fontFamily: "'Noto Serif SC', serif", fontSize: 36, fontWeight: 700,
          background: "linear-gradient(135deg, #c9b99a, #f0e0b0, #c9b99a) 200% center / 200%",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          animation: "shimmer 3s linear infinite", marginBottom: 8, letterSpacing: 4
        }}>我的科研之路</h1>
        <p style={{ color: "rgba(201,185,154,0.5)", fontFamily: "'Noto Serif SC', serif", fontSize: 13, marginBottom: 40, letterSpacing: 2 }}>
          从高考到退休 · 每个选择都算数
        </p>
        <div style={{ background: cardBg, border, borderRadius: 16, padding: 24, marginBottom: 32, textAlign: "left" }}>
          <p style={{ color: gold, fontFamily: "'Noto Serif SC', serif", fontSize: 13, lineHeight: 2, margin: 0 }}>
            你将经历<strong style={{ color: accent }}> 高三备考 → 本科 → 读研 → 青年学者 → 退休</strong> 的完整人生。<br/>
            每个回合分配有限的行动力，做出选择，应对随机事件。<br/>
            最终，你的人生将走向哪个结局？
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 32 }}>
          {[["📚","智识"],["💪","毅力"],["😊","情商"],["❤️","体力"]].map(([icon,name]) => (
            <div key={name} style={{ background: cardBg, border, borderRadius: 10, padding: "10px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 20 }}>{icon}</div>
              <div style={{ color: gold, fontSize: 11, fontFamily: "'Noto Serif SC', serif", marginTop: 4 }}>{name}</div>
            </div>
          ))}
        </div>
        <button onClick={() => { setScreen("game"); addLog("─── 高三备考开始 ───"); }} style={{
          width: "100%", padding: "14px 0", borderRadius: 12, border: "1px solid rgba(201,185,154,0.4)",
          background: "linear-gradient(135deg, rgba(201,185,154,0.1), rgba(201,185,154,0.05))",
          color: accent, fontFamily: "'Noto Serif SC', serif", fontSize: 16, cursor: "pointer",
          letterSpacing: 4, transition: "all 0.3s"
        }} onMouseOver={e => e.target.style.background = "rgba(201,185,154,0.15)"}
           onMouseOut={e => e.target.style.background = "linear-gradient(135deg, rgba(201,185,154,0.1), rgba(201,185,154,0.05))"}>
          开始你的人生
        </button>
      </div>
    </div>
  );

  if (screen === "gaokao") return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap'); * { box-sizing:border-box } @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} } @keyframes countUp { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }`}</style>
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center", animation: "fadeIn 0.6s ease" }}>
        <div style={{ fontSize: 60, marginBottom: 20 }}>📋</div>
        <h2 style={{ fontFamily: "'Noto Serif SC', serif", color: accent, fontSize: 28, marginBottom: 8, letterSpacing: 3 }}>高考结束了</h2>
        <div style={{ background: cardBg, border, borderRadius: 20, padding: 32, marginBottom: 24 }}>
          <div style={{ fontSize: 72, fontWeight: 700, color: accent, fontFamily: "monospace", animation: "countUp 0.8s cubic-bezier(.4,0,.2,1)", lineHeight: 1 }}>
            {gaokaoScore}
          </div>
          <div style={{ color: "rgba(201,185,154,0.5)", fontSize: 12, marginTop: 4, marginBottom: 20, fontFamily: "'Noto Serif SC', serif" }}>综合评分（满分100）</div>
          <div style={{ background: "rgba(201,185,154,0.08)", borderRadius: 12, padding: 16 }}>
            <div style={{ color: accent, fontFamily: "'Noto Serif SC', serif", fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{schoolResult?.label}</div>
            <div style={{ color: "rgba(201,185,154,0.6)", fontFamily: "'Noto Serif SC', serif", fontSize: 13 }}>{schoolResult?.desc}</div>
          </div>
        </div>
        <p style={{ color: "rgba(201,185,154,0.4)", fontSize: 12, fontFamily: "'Noto Serif SC', serif", marginBottom: 24 }}>
          人生的第一个节点，但绝不是最后的定论。
        </p>
        <button onClick={startBenke} style={{
          width: "100%", padding: "14px 0", borderRadius: 12, border: "1px solid rgba(201,185,154,0.4)",
          background: "rgba(201,185,154,0.08)", color: accent,
          fontFamily: "'Noto Serif SC', serif", fontSize: 15, cursor: "pointer", letterSpacing: 3
        }}>
          迈入大学校门 →
        </button>
      </div>
    </div>
  );

  if (screen === "event" && event) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap'); * { box-sizing:border-box } @keyframes fadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }`}</style>
      <div style={{ maxWidth: 480, width: "100%", animation: "fadeIn 0.5s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span style={{ background: "rgba(255,200,100,0.1)", border: "1px solid rgba(255,200,100,0.3)", borderRadius: 20, padding: "4px 14px", color: "#f0c060", fontSize: 11, fontFamily: "'Noto Serif SC', serif" }}>⚡ 随机事件</span>
        </div>
        <div style={{ background: cardBg, border, borderRadius: 20, padding: 28, marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Noto Serif SC', serif", color: accent, fontSize: 20, marginBottom: 12, textAlign: "center" }}>{event.title}</h3>
          <p style={{ color: gold, fontFamily: "'Noto Serif SC', serif", fontSize: 14, lineHeight: 1.9, textAlign: "center", margin: 0 }}>{event.desc}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {event.choices.map((c, i) => (
            <button key={i} onClick={() => chooseEvent(c)} style={{
              padding: "16px 20px", borderRadius: 14, border: "1px solid rgba(201,185,154,0.2)",
              background: "rgba(255,255,255,0.03)", color: gold, fontFamily: "'Noto Serif SC', serif",
              fontSize: 14, cursor: "pointer", textAlign: "left", transition: "all 0.2s"
            }} onMouseOver={e => e.currentTarget.style.background = "rgba(201,185,154,0.08)"}
               onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
              <div style={{ marginBottom: 6 }}>「{c.label}」</div>
              <StatDelta effects={c.effects} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (screen === "ending" && ending) return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap'); * { box-sizing:border-box } @keyframes fadeIn { from{opacity:0} to{opacity:1} } @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }`}</style>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center", animation: "fadeIn 1s ease" }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>{ending.title.split(" ")[0]}</div>
        <h2 style={{
          fontFamily: "'Noto Serif SC', serif", fontSize: 28, fontWeight: 700, marginBottom: 24,
          background: `linear-gradient(135deg, ${ending.color}, #ffffff, ${ending.color}) 200% center / 200%`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          animation: "shimmer 3s linear infinite"
        }}>{ending.title.split(" ").slice(1).join(" ")}</h2>
        <div style={{ background: cardBg, border, borderRadius: 20, padding: 28, marginBottom: 32 }}>
          <p style={{ color: gold, fontFamily: "'Noto Serif SC', serif", fontSize: 15, lineHeight: 2, margin: 0 }}>{ending.desc}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 32 }}>
          {[["智识",stats.智识,"#4ECDC4"],["毅力",stats.毅力,"#FFD93D"],["情商",stats.情商,"#FF6B9D"],["体力",stats.体力,"#6BCB77"]].map(([k,v,c]) => (
            <div key={k} style={{ background: cardBg, border, borderRadius: 12, padding: 12 }}>
              <div style={{ color: c, fontSize: 20, fontWeight: 700, fontFamily: "monospace" }}>{v}</div>
              <div style={{ color: "rgba(201,185,154,0.5)", fontSize: 11, fontFamily: "'Noto Serif SC', serif" }}>{k}</div>
            </div>
          ))}
        </div>
        <button onClick={() => { setStats({...INITIAL_STATS}); setStageIdx(0); setRound(1); setAp(10); setLog([]); setEnding(null); setGaokaoScore(null); setSchoolResult(null); setScreen("intro"); }} style={{
          width: "100%", padding: "14px 0", borderRadius: 12, border: "1px solid rgba(201,185,154,0.4)",
          background: "rgba(201,185,154,0.08)", color: accent,
          fontFamily: "'Noto Serif SC', serif", fontSize: 15, cursor: "pointer", letterSpacing: 3
        }}>重走一次人生</button>
      </div>
    </div>
  );

  // MAIN GAME SCREEN
  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "'Noto Serif SC', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bump { 0%{transform:scale(1)} 50%{transform:scale(1.05)} 100%{transform:scale(1)} }
        ::-webkit-scrollbar { width:4px } ::-webkit-scrollbar-track { background:transparent } ::-webkit-scrollbar-thumb { background:rgba(201,185,154,0.2); border-radius:2px }
      `}</style>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 12px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "12px 16px", background: cardBg, borderRadius: 14, border }}>
          <div>
            <div style={{ color: accent, fontSize: 15, fontWeight: 600, letterSpacing: 2 }}>{stage.name}</div>
            <div style={{ color: "rgba(201,185,154,0.4)", fontSize: 11, marginTop: 2 }}>{stage.desc}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "rgba(201,185,154,0.4)", fontSize: 10 }}>回合</div>
              <div style={{ color: accent, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{round}/{totalRounds}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "rgba(201,185,154,0.4)", fontSize: 10 }}>行动力</div>
              <div style={{ color: ap <= 2 ? "#FF6B6B" : "#4ECDC4", fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{ap}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12 }}>

          {/* Stats Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: cardBg, border, borderRadius: 14, padding: 16 }}>
              <div style={{ color: "rgba(201,185,154,0.4)", fontSize: 10, marginBottom: 10, letterSpacing: 2 }}>基础能力</div>
              <StatBar label="智识" value={stats.智识} color="linear-gradient(90deg,#4ECDC4,#45B7D1)" />
              <StatBar label="毅力" value={stats.毅力} color="linear-gradient(90deg,#FFD93D,#FF9500)" />
              <StatBar label="情商" value={stats.情商} color="linear-gradient(90deg,#FF6B9D,#FF8E8E)" />
              <StatBar label="体力" value={stats.体力} color="linear-gradient(90deg,#6BCB77,#4CAF50)" />
            </div>
            <div style={{ background: cardBg, border, borderRadius: 14, padding: 16 }}>
              <div style={{ color: "rgba(201,185,154,0.4)", fontSize: 10, marginBottom: 10, letterSpacing: 2 }}>即时状态</div>
              <StatBar label="专注度" value={stats.专注度} color="linear-gradient(90deg,#A78BFA,#7C3AED)" />
              <StatBar label="压力" value={stats.压力} max={40} color="linear-gradient(90deg,#FB923C,#EF4444)" />
              <StatBar label="资金" value={stats.资金} color="linear-gradient(90deg,#FCD34D,#F59E0B)" />
              <StatBar label="声望" value={stats.声望} color="linear-gradient(90deg,#F472B6,#EC4899)" />
            </div>

            {/* End Turn Button */}
            <button onClick={endTurn} style={{
              padding: "12px 0", borderRadius: 12, border: "1px solid rgba(201,185,154,0.3)",
              background: "rgba(201,185,154,0.06)", color: accent, fontSize: 13,
              cursor: "pointer", letterSpacing: 2, transition: "all 0.2s"
            }} onMouseOver={e => e.currentTarget.style.background = "rgba(201,185,154,0.12)"}
               onMouseOut={e => e.currentTarget.style.background = "rgba(201,185,154,0.06)"}>
              结束回合 →
            </button>
          </div>

          {/* Right Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Actions */}
            <div style={{ background: cardBg, border, borderRadius: 14, padding: 16 }}>
              <div style={{ color: "rgba(201,185,154,0.4)", fontSize: 10, marginBottom: 12, letterSpacing: 2 }}>本回合行动（剩余 {ap} 点行动力）</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }} key={animKey}>
                {actions.map((a, i) => {
                  const canDo = ap >= a.cost;
                  return (
                    <button key={a.id} onClick={() => doAction(a)} disabled={!canDo} style={{
                      padding: "12px 12px", borderRadius: 12,
                      border: canDo ? "1px solid rgba(201,185,154,0.2)" : "1px solid rgba(201,185,154,0.06)",
                      background: canDo ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.2)",
                      color: canDo ? gold : "rgba(201,185,154,0.25)",
                      cursor: canDo ? "pointer" : "not-allowed",
                      textAlign: "left", transition: "all 0.2s",
                      animation: `fadeIn 0.3s ease ${i * 0.04}s both`
                    }} onMouseOver={e => canDo && (e.currentTarget.style.background = "rgba(201,185,154,0.07)")}
                       onMouseOut={e => canDo && (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>{a.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</span>
                        <span style={{ marginLeft: "auto", fontSize: 10, background: canDo ? "rgba(201,185,154,0.1)" : "rgba(0,0,0,0.2)", borderRadius: 6, padding: "1px 6px" }}>
                          -{a.cost}AP
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(201,185,154,0.4)", marginBottom: 4, lineHeight: 1.5 }}>{a.desc}</div>
                      <StatDelta effects={a.effects} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Log */}
            <div style={{ background: cardBg, border, borderRadius: 14, padding: 16, flex: 1 }}>
              <div style={{ color: "rgba(201,185,154,0.4)", fontSize: 10, marginBottom: 10, letterSpacing: 2 }}>事件记录</div>
              <div ref={logRef} style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {log.length === 0 && <div style={{ color: "rgba(201,185,154,0.2)", fontSize: 12 }}>你的故事正在开始……</div>}
                {log.map((l, i) => (
                  <div key={i} style={{ color: "rgba(201,185,154,0.6)", fontSize: 11, lineHeight: 1.6, borderLeft: "2px solid rgba(201,185,154,0.1)", paddingLeft: 8 }}>
                    {l.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 12, padding: "8px 16px", background: cardBg, borderRadius: 10, border }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(201,185,154,0.3)", marginBottom: 6 }}>
            <span>{STAGES[0].name}</span>
            <span>{STAGES[1]?.name}</span>
            <span>读研</span>
            <span>青年学者</span>
            <span>退休</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${((stageIdx * 16 + round) / 36) * 100}%`,
              background: "linear-gradient(90deg, #4ECDC4, #c9b99a)",
              transition: "width 0.5s ease"
            }} />
          </div>
        </div>

      </div>
    </div>
  );
}
