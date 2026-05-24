import { choice, event } from "./helpers.js";

export const EVENTS = {
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
    event("family_crossroad", "成家岔路", "同龄人开始结婚、生育，实验室的灯还常常亮到深夜。你意识到科研节奏也会重塑生活关系。", [
      choice("认真经营亲密关系", { eq: 5, pressure: -3, focus: -1 }, {}, { career: { maritalStatus: "已婚" } }),
      choice("暂时把论文放在前面", { focus: 4, writing: 3, pressure: 4 }),
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
    event("new_child", "家庭新成员", "在最忙的申请季，家里迎来新的生命。日程突然变得更碎，但你也第一次认真重排生活优先级。", [
      choice("共同承担照护", { health: -3, pressure: 4, eq: 5 }, {}, { career: { maritalStatus: "已婚", childrenDelta: 1 } }),
      choice("暂时不改变工作节奏", { focus: 3, pressure: 6, eq: -2 }),
    ]),
  ],
  talent_track: [
    event("window_pressure", "青年人才窗口期", "同龄人的名字出现在人才项目公示里。你知道这不是全部评价，却很难不把它当成倒计时。", [
      choice("集中准备申请", { writing: 5, pressure: 6 }, { talentTitles: 8 }),
      choice("先稳住原创主线", { innovation: 4, contribution: 3, pressure: 2 }, { peerRecognition: 5 }),
      choice("主动和同行交流", { network: 5, eq: 3, pressure: 3 }, { peerRecognition: 6 }),
    ]),
    event("title_or_problem", "帽子还是问题", "学院希望你把主要精力放到人才项目材料上，但学生的关键实验也到了转折点。", [
      choice("优先申请材料", { writing: 5, reputation: 3, pressure: 5 }, { talentTitles: 6 }),
      choice("陪学生把实验做完", { eq: 5, contribution: 3, pressure: 3 }, { talent: 6, integrity: 5 }),
    ]),
    event("recommendation_call", "推荐电话", "一位前辈愿意帮你推荐，但提醒你：“材料要讲清楚你到底解决了什么问题。”", [
      choice("重写原创贡献叙事", { writing: 5, contribution: 4, pressure: 4 }, { peerRecognition: 7 }),
      choice("补齐代表作证据", { focus: 4, pressure: 5 }, { representativeWorks: 1, talentTitles: 4 }),
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
  national_leader: [
    event("platform_audit", "平台评估", "重大平台要求提交阶段总结。表格很厚，但真正难写的是哪些贡献经得起十年后再看。", [
      choice("用数据和开放材料说话", { reputation: 4, pressure: 4 }, { integrity: 8, peerRecognition: 5 }),
      choice("突出应用和战略价值", { writing: 4, network: 3, pressure: 3 }, { strategicContribution: 8 }),
    ]),
    event("field_split", "领域分歧", "你的方向开始影响学科路线，也引来公开争论。年轻同行在等你如何回应。", [
      choice("组织公开专题讨论", { network: 6, eq: 4, pressure: 4 }, { peerRecognition: 8, talent: 4 }),
      choice("用下一篇代表作回应", { innovation: 5, contribution: 5, pressure: 6 }, { representativeWorks: 1, strategicContribution: 6 }),
    ]),
    event("student_lineage", "学生形成梯队", "几名学生已经成为独立 PI。你第一次意识到，人才培养不只是评价指标。", [
      choice("让他们独立署名和申报", { eq: 6, reputation: 3 }, { talent: 9, peerRecognition: 4 }, { career: { facultyDeltas: { lecturer: 1, associateProfessor: 1 }, teamTitleDeltas: { youqing: 1 } } }),
      choice("整合成联合攻关网络", { network: 6, pressure: 3 }, { majorProject: 6, strategicContribution: 5 }, { career: { facultyDeltas: { associateProfessor: 1, professor: 1 }, teamTitleDeltas: { jieqing: 1 } } }),
    ]),
  ],
  academician_candidate: [
    event("ethics_review", "学术道德审查", "评审要求补充早期数据和贡献说明。", [
      choice("完整公开材料", { reputation: 4, pressure: 3 }, { academyReview: 8 }),
      choice("请合作者共同说明", { network: 4, eq: 3, pressure: 2 }, { academyReview: 6 }),
    ]),
    event("final_vote", "同行评议", "多年成果被放到同一张桌上比较，同行开始追问你的工作是否真的改变了问题本身。", [
      choice("接受同行评议", { pressure: 5, reputation: 3 }, { academyReview: 10 }),
      choice("保持节奏，继续做研究", { pressure: -3, contribution: 4 }, { academyReview: 6 }),
    ]),
  ],
};
