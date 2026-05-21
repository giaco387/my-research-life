export const ENDINGS = [
  {
    id: "academician",
    title: "当选院士",
    method: "在院士候选阶段完成高质量评审，同时具备长期原创贡献、代表性成果、重要奖项、重大项目、人才培养和同行认可。",
    requirements: [
      ["院士评审", "academyReview", 90],
      ["录用论文", "acceptedPapers", 16],
      ["高影响论文", "highImpactPapers", 4],
      ["代表作", "representativeWorks", 3],
      ["重要奖项", "nationalAwards", 2],
      ["重大项目", "majorProject", 74],
      ["人才培养", "talent", 70],
      ["战略贡献", "strategicContribution", 40],
      ["贡献", "contribution", 90, "stats"],
      ["声望", "reputation", 88, "stats"],
      ["合作", "network", 75, "stats"],
      ["体力", "health", 35, "stats"],
    ],
    test: (s, p) =>
      p.academyReview >= 90 &&
      p.acceptedPapers >= 16 &&
      p.highImpactPapers >= 4 &&
      p.representativeWorks >= 3 &&
      p.nationalAwards >= 2 &&
      p.majorProject >= 74 &&
      p.talent >= 70 &&
      p.strategicContribution >= 40 &&
      s.contribution >= 90 &&
      s.reputation >= 88 &&
      s.network >= 75 &&
      s.health >= 35 &&
      s.pressure <= 65,
    text: "你的原创贡献、人才培养和长期学术影响获得同行认可。科研之路抵达最高荣誉，但问题本身仍在前方。",
  },
  {
    id: "master",
    title: "学术大师",
    method: "即使没有完全通过院士评审，也用极高原创贡献留下长期学术坐标。",
    requirements: [
      ["院士评审", "academyReview", 76],
      ["高影响论文", "highImpactPapers", 3],
      ["代表作", "representativeWorks", 3],
      ["重大项目", "majorProject", 72],
      ["战略贡献", "strategicContribution", 35],
      ["贡献", "contribution", 86, "stats"],
    ],
    test: (s, p) =>
      p.academyReview >= 76 &&
      p.highImpactPapers >= 3 &&
      p.representativeWorks >= 3 &&
      p.majorProject >= 72 &&
      p.strategicContribution >= 35 &&
      s.contribution >= 86,
    text: "你未必拿到所有头衔，但你的工作已经成为后来者绕不开的坐标。",
  },
  {
    id: "professor",
    title: "优秀教授",
    method: "在教授阶段稳定培养人才，并形成可见的团队成果或重大项目。",
    requirements: [
      ["人才培养", "talent", 55],
      ["声望", "reputation", 60, "stats"],
      ["录用论文", "acceptedPapers", 8],
      ["贡献", "contribution", 55, "stats"],
      ["或 重大项目", "majorProject", 55],
      ["或 代表作", "representativeWorks", 3],
    ],
    test: (s, p) =>
      (p.talent >= 55 && s.reputation >= 60 && p.acceptedPapers >= 8 && s.contribution >= 55) ||
      (p.majorProject >= 55 && s.contribution >= 45) ||
      (p.representativeWorks >= 3 && s.contribution >= 55),
    text: "你建立了稳定团队，培养了学生，也留下了扎实的代表性成果。",
  },
  {
    id: "burnout",
    title: "科研受挫",
    method: "压力过高或体力过低时触发。长期忽视恢复会更容易进入该结局。",
    requirements: [
      ["压力达到", "pressure", 85, "stats"],
      ["或 体力低于", "health", 12, "stats", "lte"],
    ],
    test: (s) => s.pressure >= 85 || s.health <= 12,
    text: "你走得太急，身体和心理先提出了抗议。暂停并不是失败，但这条路暂时走不下去了。",
  },
  {
    id: "industry",
    title: "转向产业研发",
    method: "积累资金和沟通能力，让科研训练转化为产业研发路线。",
    requirements: [
      ["情商", "eq", 55, "stats"],
      ["实验", "experiment", 25, "stats"],
      ["合作", "network", 65, "stats"],
      ["或 资金", "money", 25, "stats"],
    ],
    test: (s) => s.eq >= 55 && s.experiment >= 25 && s.network >= 65,
    text: "你保留科研训练带来的严谨，也选择把问题带到产业现场解决。",
  },
  {
    id: "steady",
    title: "平凡但完整",
    method: "没有达成其他特殊结局时获得。它不是失败，而是一条普通但完整的人生路径。",
    requirements: [],
    test: () => true,
    text: "你没有成为传记里的名字，但认真完成了每个阶段的选择。科研训练也成为你理解世界的一种方式。",
  },
];
