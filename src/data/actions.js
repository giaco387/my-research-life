import { action } from "./helpers.js";
import { requirement } from "../game/requirements.js";

export const ACTIONS = {
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
    action("submit", "投稿尝试", 3, "可能被拒，但不会白费。", { pressure: 4 }, {}, {
      maxUses: 3,
      system: "paper_submission",
      requirements: [requirement("论文进度", "paper", 35, "progress"), requirement("写作", "writing", 18)],
    }),
    action("conference", "参加会议", 3, "看见更大的学术共同体。", { network: 5, reputation: 4, money: -5, eq: 2 }),
    action("recover", "调整状态", 1, "长期科研需要稳定节奏。", { health: 9, pressure: -7, focus: 2 }),
  ],
  phd: [
    action("deep_topic", "深挖选题", 3, "把问题从可做推进到值得做。", { innovation: 6, literature: 3, pressure: 4 }, { originality: 10 }),
    action("long_experiment", "长周期实验", 4, "高投入、高波动，但可能形成代表作。", { experiment: 7, health: -7, pressure: 6 }, { dissertation: 10, originality: 8 }, {
      risk: { chance: 0.22, text: "关键实验失败，留下了可用经验但论文进度受损。", effects: { pressure: 6, perseverance: 2 }, progress: { dissertation: -4 } },
    }),
    action("paper_sprint", "论文冲刺", 3, "把博士阶段的结果组织成论文。", { writing: 7, reputation: 3, pressure: 6 }, { dissertation: 12 }),
    action("journal_submit", "博士论文投稿", 3, "用更成熟的证据冲击高水平期刊。", { pressure: 5 }, {}, {
      maxUses: 4,
      system: "paper_submission",
      requirements: [requirement("博士论文", "dissertation", 35, "progress"), requirement("写作", "writing", 35)],
    }),
    action("visit", "交流访问", 3, "在更大的网络里校准自己的方向。", { network: 7, reputation: 4, money: -6, eq: 2 }, { originality: 5 }),
    action("mentor_junior", "指导低年级", 2, "开始学习如何带人做事。", { eq: 4, network: 3, contribution: 2 }, { dissertation: 4 }),
    action("mental_break", "心理调适", 1, "博士不是短跑，稳定比爆发更稀缺。", { health: 9, pressure: -8, focus: 2 }),
  ],
  young_faculty: [
    action("grant", "申请青年基金", 3, "基金是独立 PI 的第一道硬门槛。", { writing: 5, reputation: 3, pressure: 5 }, { fund: 12 }, {
      maxUses: 3,
      requirements: [requirement("写作", "writing", 30), requirement("声望", "reputation", 20)],
      risk: { chance: 0.3, text: "基金落选，评审意见尖锐但能帮助你修改方向。", effects: { writing: 3, pressure: 5 }, progress: { fund: -5 } },
    }),
    action("recruit", "招募学生", 3, "团队开始从一个人变成一群人。", { network: 5, eq: 4, pressure: 3 }, { team: 10 }, {
      maxUses: 3,
    }),
    action("platform", "建设平台", 3, "设备、流程和数据都要从零搭起来。", { money: -7, experiment: 4, pressure: 4 }, { team: 8, fund: 4 }, {
      maxUses: 3,
    }),
    action("representative", "发表代表作", 4, "需要把方向压成清晰的学术贡献。", { reputation: 8, contribution: 7, pressure: 7 }, { fund: 6, acceptedPapers: 3, highImpactPapers: 1, representativeWorks: 1 }, {
      maxUses: 3,
      requirements: [requirement("基金积累", "fund", 35, "progress"), requirement("创新", "innovation", 35)],
    }),
    action("teach", "平衡教学", 2, "教学会消耗时间，也会训练表达。", { writing: 3, eq: 3, health: -2 }, { team: 4 }, {
      maxUses: 3,
    }),
    action("recover", "恢复节奏", 1, "可持续的科研节奏本身就是能力。", { health: 8, pressure: -7, focus: 2 }),
  ],
  professor: [
    action("major_grant", "组织重大项目", 4, "把多个方向、团队和资源合成一个目标。", { reputation: 6, network: 5, pressure: 6 }, { majorProject: 12, strategicContribution: 5 }, {
      maxUses: 3,
      requirements: [requirement("声望", "reputation", 45), requirement("合作", "network", 38)],
      risk: { chance: 0.18, text: "重大项目评审落选，团队短期士气受挫。", effects: { pressure: 5, reputation: -2 }, progress: { majorProject: -4 } },
    }),
    action("train_phd", "培养博士生", 3, "学生的成长会反过来塑造你的学术影响。", { eq: 5, contribution: 3, pressure: 3 }, { talent: 10 }, {
      maxUses: 4,
    }),
    action("breakthrough", "攻关原创问题", 4, "风险很高，但这是走向学术高峰的核心。", { innovation: 7, contribution: 8, pressure: 7 }, { majorProject: 8, strategicContribution: 10, representativeWorks: 1 }, {
      maxUses: 3,
    }),
    action("team_papers", "团队持续产出", 3, "成熟团队能持续发表系列成果，但也会消耗大量指导精力。", { reputation: 5, contribution: 4, pressure: 5 }, { acceptedPapers: 4, highImpactPapers: 1, talent: 4 }, {
      maxUses: 4,
      requirements: [requirement("团队建设", "team", 45, "progress"), requirement("人才培养", "talent", 25, "progress")],
    }),
    action("community", "学术共同体服务", 2, "审稿、会议和学会工作会扩大长期声望。", { reputation: 4, network: 4, health: -2 }, { talent: 4 }, {
      maxUses: 3,
    }),
    action("award", "申报重要奖项", 3, "把长期成果整理成可被评审理解的证据。", { writing: 4, reputation: 6, pressure: 4 }, { majorProject: 6, nationalAwards: 1 }, {
      maxUses: 2,
      requirements: [requirement("贡献", "contribution", 45), requirement("重大项目", "majorProject", 35, "progress")],
      risk: { chance: 0.55, text: "奖项申报未中，成果还需要更长时间被同行确认。", effects: { pressure: 4 }, progress: { nationalAwards: -1 } },
    }),
    action("recover", "留出空白", 1, "越到后期，越需要避免被事务吞没。", { health: 8, pressure: -7, focus: 2 }),
  ],
  academician_candidate: [
    action("summarize", "凝练原创贡献", 3, "把一生工作压缩成几条真正站得住的贡献。", { contribution: 8, writing: 5, pressure: 4 }, { academyReview: 12 }, {
      maxUses: 3,
    }),
    action("peer_support", "同行推荐", 3, "声望不是投票机器，但同行认可是硬条件。", { reputation: 7, network: 5, pressure: 3 }, { academyReview: 10 }, {
      maxUses: 2,
    }),
    action("talent_record", "整理人才培养", 2, "学生和团队的成果也是学术生命的一部分。", { eq: 4, reputation: 3 }, { academyReview: 7 }, {
      maxUses: 2,
    }),
    action("ethics", "学术自查", 2, "越接近顶端，越要经得起细看。", { contribution: 3, pressure: -3, reputation: 2 }, { academyReview: 6 }, {
      maxUses: 2,
    }),
    action("public_impact", "社会影响", 3, "让基础研究和现实问题产生连接。", { reputation: 5, money: 4, network: 3 }, { academyReview: 8 }, {
      maxUses: 2,
    }),
    action("recover", "保持健康", 1, "终局评审前，身体依然是所有行动的前提。", { health: 8, pressure: -7 }),
  ],
};
