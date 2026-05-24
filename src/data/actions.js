import { action } from "./helpers.js";
import { requirement } from "../game/requirements.js";

export const ACTIONS = {
  high_school: [
    action("study", "刷题训练", 2, "稳定提升知识，高压但可靠。", { knowledge: 5, focus: 2, pressure: 4, health: -3 }, { exam: 8 }, { flavor: "你把错题重新摊开，逼自己把每一步讲清楚。" }),
    action("mock", "模拟考试", 3, "用实战暴露短板。", { knowledge: 3, focus: 4, pressure: 6 }, { exam: 12 }, { flavor: "计时器响起时，你终于看见自己最容易失手的地方。" }),
    action("teacher", "请教老师", 2, "把卡住的问题讲清楚。", { knowledge: 4, eq: 2, pressure: -2 }, { exam: 6 }, { flavor: "老师没有直接给答案，只把问题拆成了几个更小的台阶。" }),
    action("exercise", "操场跑步", 2, "恢复身体，也恢复一点信心。", { health: 8, perseverance: 3, pressure: -5 }, {}, { flavor: "跑到第三圈时，脑子里那团紧绷的线松了一点。" }),
    action("sleep", "好好睡觉", 1, "专注来自足够的恢复。", { health: 7, focus: 3, pressure: -4 }, {}, { flavor: "你关掉台灯，决定把明天的专注留给明天。" }),
    action("friends", "和同学聊聊", 1, "别把自己变成孤岛。", { eq: 4, pressure: -3, network: 1 }, {}, { flavor: "闲聊没有解决卷子，但你想起自己不是一个人在熬。" }),
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
      career: { grantDeltas: { applications: 1, funded: 1, youth: 1 } },
      requirements: [requirement("写作", "writing", 30), requirement("声望", "reputation", 20)],
      risk: { chance: 0.3, text: "基金落选，评审意见尖锐但能帮助你修改方向。", effects: { writing: 3, pressure: 5 }, progress: { fund: -5 }, career: { grantDeltas: { funded: -1, youth: -1 } } },
    }),
    action("recruit", "招募学生", 3, "团队开始从一个人变成一群人。", { network: 5, eq: 4, pressure: 3 }, { team: 10 }, {
      maxUses: 3,
      career: { studentDeltas: { master: 2, phd: 1 } },
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
  talent_track: [
    action("youqing", "冲击优青", 3, "青年人才窗口很窄，前期成果、申请书和同行可见度都会被放在一起比较。", { writing: 5, reputation: 5, pressure: 5 }, { talentTitles: 14, peerRecognition: 6 }, {
      maxUses: 2,
      career: { grantDeltas: { applications: 1, funded: 1 }, addSelfTitles: ["优青"] },
      requirements: [requirement("年龄", "age", 0, "age", 40), requirement("声望", "reputation", 42), requirement("代表作", "representativeWorks", 1, "progress")],
      risk: { chance: 0.42, text: "优青落选，评审意见写着“基础较好，但优势不够突出”。", effects: { pressure: 5, writing: 3 }, progress: { talentTitles: -5 }, career: { grantDeltas: { funded: -1 }, removeSelfTitles: ["优青"] } },
    }),
    action("changjiang_young", "申报长江青年", 3, "高校体系里的青年头衔既看成果，也看平台、推荐和学科位置。", { reputation: 6, network: 4, pressure: 5 }, { talentTitles: 12, peerRecognition: 8 }, {
      maxUses: 2,
      career: { addSelfTitles: ["长江青年"] },
      requirements: [requirement("年龄", "age", 0, "age", 40), requirement("合作", "network", 44), requirement("团队建设", "team", 38, "progress")],
      risk: { chance: 0.4, text: "长江青年评审未通过，你意识到平台叙事和同行推荐也会影响窗口期。", effects: { pressure: 4 }, progress: { peerRecognition: -3 }, career: { removeSelfTitles: ["长江青年"] } },
    }),
    action("jieqing", "冲击杰青", 4, "这不再是普通青年项目，而是对原创主线、代表作和同行认可的综合审查。", { writing: 6, reputation: 7, pressure: 7 }, { talentTitles: 18, peerRecognition: 10, strategicContribution: 4 }, {
      maxUses: 2,
      career: { grantDeltas: { applications: 1, funded: 1 }, addSelfTitles: ["杰青"] },
      requirements: [requirement("年龄", "age", 0, "age", 48), requirement("贡献", "contribution", 58), requirement("代表作", "representativeWorks", 2, "progress"), requirement("同行认可", "peerRecognition", 30, "progress")],
      risk: { chance: 0.48, text: "杰青落选，同行认可没有消失，但你也错过了一次关键资源入口。", effects: { pressure: 6, perseverance: 3 }, progress: { talentTitles: -6 }, career: { grantDeltas: { funded: -1 }, removeSelfTitles: ["杰青"] } },
    }),
    action("overseas_young", "海外优青回国", 3, "把海外训练、合作网络和回国平台捆到同一份申请里。", { network: 6, reputation: 5, money: -4, pressure: 4 }, { talentTitles: 12, peerRecognition: 6 }, {
      maxUses: 1,
      career: { grantDeltas: { applications: 1, funded: 1 }, addSelfTitles: ["海外优青"] },
      requirements: [requirement("年龄", "age", 0, "age", 42), requirement("合作", "network", 48), requirement("写作", "writing", 42)],
      risk: { chance: 0.35, text: "海外优青申请没能落地，回国平台和方向匹配还需要重新谈判。", effects: { pressure: 5, money: -3 }, progress: { talentTitles: -4 }, career: { grantDeltas: { funded: -1 }, removeSelfTitles: ["海外优青"] } },
    }),
    action("peer_seminar", "组织领域研讨", 2, "让同行理解你的问题，而不是只在表格里看指标。", { network: 6, eq: 4, reputation: 4, health: -2 }, { peerRecognition: 10, integrity: 3 }, {
      maxUses: 3,
    }),
    action("integrity_record", "整理学术信用", 2, "公开数据、厘清贡献和署名，把经得起审查当成长期资产。", { contribution: 4, pressure: -2, reputation: 3 }, { integrity: 10, peerRecognition: 4 }, {
      maxUses: 3,
    }),
    action("protect_students", "保护学生成果", 2, "短期看不如多发一篇论文，但学生会记住谁在关键时刻站出来。", { eq: 6, reputation: 2, pressure: 3 }, { talent: 8, integrity: 6 }, {
      maxUses: 3,
    }),
    action("recover", "从窗口期抽身", 1, "承认窗口期压力存在，但不要把自己完全交给它。", { health: 8, pressure: -8, focus: 2 }),
  ],
  professor: [
    action("major_grant", "组织重大项目", 4, "把多个方向、团队和资源合成一个目标。", { reputation: 6, network: 5, pressure: 6 }, { majorProject: 12, strategicContribution: 5 }, {
      maxUses: 3,
      career: { grantDeltas: { applications: 1, funded: 1, general: 1 } },
      requirements: [requirement("声望", "reputation", 45), requirement("合作", "network", 38)],
      risk: { chance: 0.18, text: "重大项目评审落选，团队短期士气受挫。", effects: { pressure: 5, reputation: -2 }, progress: { majorProject: -4 }, career: { grantDeltas: { funded: -1, general: -1 } } },
    }),
    action("train_phd", "培养博士生", 3, "学生的成长会反过来塑造你的学术影响。", { eq: 5, contribution: 3, pressure: 3 }, { talent: 10 }, {
      maxUses: 4,
      career: { studentDeltas: { phd: 2, postdoc: 1 } },
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
  national_leader: [
    action("changjiang_professor", "申报长江特聘", 3, "教授阶段的头衔更看代表性成果、平台责任和学科带动力。", { reputation: 7, network: 5, pressure: 5 }, { talentTitles: 14, peerRecognition: 8 }, {
      maxUses: 2,
      career: { addSelfTitles: ["长江特聘"] },
      requirements: [requirement("年龄", "age", 0, "age", 55), requirement("声望", "reputation", 62), requirement("重大项目", "majorProject", 45, "progress")],
      risk: { chance: 0.38, text: "长江特聘未能入选。评审没有否定成果，但认为学科带动力还不够清晰。", effects: { pressure: 5 }, progress: { peerRecognition: -4 }, career: { removeSelfTitles: ["长江特聘"] } },
    }),
    action("innovation_group", "组建创新群体", 4, "从一个课题组变成一个方向共同体，考验资源整合和年轻骨干培养。", { network: 7, eq: 5, pressure: 6 }, { majorProject: 10, talent: 8, talentTitles: 10 }, {
      maxUses: 2,
      career: { facultyDeltas: { lecturer: 2, associateProfessor: 1 }, teamTitleDeltas: { youqing: 1 } },
      requirements: [requirement("团队建设", "team", 55, "progress"), requirement("人才培养", "talent", 42, "progress"), requirement("合作", "network", 60)],
      risk: { chance: 0.28, text: "创新群体申请受挫，几个子方向还没有形成足够统一的问题意识。", effects: { pressure: 5 }, progress: { majorProject: -4 }, career: { teamTitleDeltas: { youqing: -1 } } },
    }),
    action("national_platform", "承担国家级平台", 4, "平台会放大资源，也会放大行政、协调和长期责任。", { reputation: 6, money: 8, pressure: 7, health: -4 }, { majorProject: 12, strategicContribution: 10, peerRecognition: 5 }, {
      maxUses: 3,
      career: { grantDeltas: { applications: 1, funded: 1, key: 1 }, facultyDeltas: { associateProfessor: 1, professor: 1 } },
      requirements: [requirement("人才项目", "talentTitles", 45, "progress"), requirement("声望", "reputation", 68)],
    }),
    action("strategic_problem", "攻关战略问题", 4, "把长期原创方向接到更大的科学或工程问题上。", { innovation: 7, contribution: 9, pressure: 7 }, { strategicContribution: 14, representativeWorks: 1, peerRecognition: 6 }, {
      maxUses: 3,
      requirements: [requirement("创新", "innovation", 62), requirement("重大项目", "majorProject", 55, "progress")],
      risk: { chance: 0.26, text: "战略问题推进缓慢，短期看不到结果，但团队积累了难得的数据和方法。", effects: { perseverance: 4, pressure: 5 }, progress: { strategicContribution: -4 } },
    }),
    action("field_consensus", "形成领域共识", 3, "学术领军不是自我宣称，同行是否真正认可会在这里逐渐显形。", { reputation: 6, network: 7, pressure: 4 }, { peerRecognition: 12, academyReview: 6 }, {
      maxUses: 3,
      requirements: [requirement("同行认可", "peerRecognition", 45, "progress")],
    }),
    action("award_bundle", "整理国家奖证据链", 3, "把分散多年的论文、应用和人才培养整理成可被审查的证据。", { writing: 5, reputation: 6, pressure: 5 }, { nationalAwards: 1, strategicContribution: 6, academyReview: 4 }, {
      maxUses: 2,
      career: { grantDeltas: { applications: 1, funded: 1, major: 1 }, teamTitleDeltas: { jieqing: 1, changjiangYoung: 1 } },
      requirements: [requirement("战略贡献", "strategicContribution", 45, "progress"), requirement("代表作", "representativeWorks", 3, "progress")],
      risk: { chance: 0.45, text: "国家奖申报未中，成果还需要更长时间被共同体确认。", effects: { pressure: 5 }, progress: { nationalAwards: -1 }, career: { grantDeltas: { funded: -1, major: -1 }, teamTitleDeltas: { jieqing: -1, changjiangYoung: -1 } } },
    }),
    action("recover", "维持生活秩序", 1, "越接近顶端，越需要有人提醒你不是一台评审材料生成机器。", { health: 8, pressure: -8, focus: 2 }),
  ],
  academician_candidate: [
    action("summarize", "凝练原创贡献", 3, "把多年工作压缩成几条真正站得住的贡献。", { contribution: 8, writing: 5, pressure: 4 }, { academyReview: 12 }, {
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
    action("recover", "保持健康", 1, "越到后期，身体依然是所有行动的前提。", { health: 8, pressure: -7 }),
  ],
};
