# 《科研之路》结局总览与实现方法

## 1. 实现位置

结局定义在 `src/App.jsx` 的 `ENDINGS` 常量中。

游戏最终进入 `academician_candidate` 阶段末尾后，会调用：

```js
const ending = getEnding(current.stats, current.progress);
```

`getEnding` 的实现是：

```js
function getEnding(stats, progress) {
  return ENDINGS.find((ending) => ending.test(stats, progress));
}
```

因此结局判定遵循 **从上到下的优先级**。越特殊、越高等级的结局必须放在数组前面；兜底结局必须放在最后。

## 2. 当前结局列表

### 2.1 当选院士

最高成功结局。

达成条件：

- 院士评审 `academyReview >= 90`
- 录用论文 `acceptedPapers >= 18`
- 高影响论文 `highImpactPapers >= 6`
- 代表作 `representativeWorks >= 5`
- 重要奖项 `nationalAwards >= 2`
- 重大项目 `majorProject >= 85`
- 人才培养 `talent >= 75`
- 战略贡献 `strategicContribution >= 60`
- 学术贡献 `contribution >= 90`
- 学术声望 `reputation >= 88`
- 合作网络 `network >= 75`
- 体力 `health >= 35`
- 压力 `pressure <= 65`

实现：

```js
test: (s, p) =>
  p.academyReview >= 90 &&
  p.acceptedPapers >= 18 &&
  p.highImpactPapers >= 6 &&
  p.representativeWorks >= 5 &&
  p.nationalAwards >= 2 &&
  p.majorProject >= 85 &&
  p.talent >= 75 &&
  p.strategicContribution >= 60 &&
  s.contribution >= 90 &&
  s.reputation >= 88 &&
  s.network >= 75 &&
  s.health >= 35 &&
  s.pressure <= 65
```

设计意图：

玩家不能只刷某一个数值。必须同时具备原创贡献、同行认可、长期声望和最终评审表现。

### 2.2 学术大师

高贡献但未必当选院士的结局。

达成条件：

- 院士评审 `academyReview >= 68`
- 代表作 `representativeWorks >= 3`
- 学术贡献 `contribution >= 82`

实现：

```js
test: (s, p) =>
  p.academyReview >= 68 &&
  p.representativeWorks >= 3 &&
  s.contribution >= 82
```

设计意图：

给“贡献极高但头衔未必最高”的路线留出口，避免游戏价值观变成只有院士才算成功。

### 2.3 优秀教授

稳定学术职业成功结局。

达成条件：

- 人才培养 `talent >= 60`
- 或学术声望 `reputation >= 65`

实现：

```js
test: (s, p) =>
  p.talent >= 60 ||
  s.reputation >= 65
```

设计意图：

强调教授阶段不只是个人论文，也包括团队建设、学生培养和学术共同体影响。

### 2.4 转向产业研发

非纯学术路线结局。

达成条件：

- 资金 `money >= 35`
- 情商 `eq >= 48`

实现：

```js
test: (s) =>
  s.money >= 35 &&
  s.eq >= 48
```

设计意图：

允许玩家把科研训练转化到产业研发，不把离开学术界简单视为失败。

### 2.5 科研受挫

身心状态失衡结局。

达成条件：

- 压力 `pressure >= 85`
- 或体力 `health <= 12`

实现：

```js
test: (s) =>
  s.pressure >= 85 ||
  s.health <= 12
```

设计意图：

让休息、恢复和长期节奏成为真实策略，而不是装饰性行动。

### 2.6 平凡但完整

兜底结局。

达成条件：

- 没有达成以上任何特殊结局。

实现：

```js
test: () => true
```

设计意图：

保证游戏一定能给出结局，同时保留普通但完整的人生路径。

## 3. 判定优先级

当前顺序：

1. 当选院士
2. 学术大师
3. 优秀教授
4. 转向产业研发
5. 科研受挫
6. 平凡但完整

注意：因为使用 `Array.find`，如果一个玩家同时满足多个结局，只会获得最靠前的那个。

例如：

- 同时满足“当选院士”和“科研受挫”，会判定为“当选院士”。
- 同时满足“优秀教授”和“转向产业研发”，会判定为“优秀教授”。

如果希望“科研受挫”优先级更高，需要把它移动到数组更前面。

## 4. 新增结局的方法

在 `ENDINGS` 中新增一个对象：

```js
{
  id: "new_ending",
  title: "新结局名称",
  method: "开发者可读的达成方式说明。",
  requirements: [
    ["显示名", "字段名", 阈值],
    ["显示名", "字段名", 阈值, "stats"],
  ],
  test: (s, p) => p.someProgress >= 60 && s.someStat >= 50,
  text: "玩家最终看到的结局描述。",
}
```

字段说明：

- `id`：稳定唯一标识。
- `title`：结局标题。
- `method`：开发者总览用说明，目前不显示给玩家。
- `requirements`：结构化条件说明，便于以后做开发工具或成就页。
- `test`：实际判定函数。
- `text`：结局弹窗里的叙事文本。

## 5. stats 与 progress 的区别

`stats` 是角色长期属性，例如：

- `contribution` 学术贡献
- `reputation` 声望
- `network` 合作网络
- `money` 资金
- `eq` 情商
- `pressure` 压力
- `health` 体力

`progress` 是阶段性进度，例如：

- `academyReview` 院士评审
- `talent` 人才培养
- `majorProject` 重大项目
- `fund` 基金积累
- `paper` 论文进度

结局条件通常应该混合使用两者：`progress` 表示最后阶段做成了什么，`stats` 表示整个生涯积累了什么。

## 6. 平衡建议

- “当选院士”应保持多条件门槛，避免单刷一个行动就达成。
- “科研受挫”目前排在较后，如果希望健康和压力成为硬约束，可提高它的优先级。
- “转向产业研发”目前可能被“优秀教授”覆盖，如果希望它成为主动路线，需要加入玩家选择 flag。
- 后续可以加入 `flags`，例如 `choseIndustryPath`、`academicMisconduct`、`wonNationalAward`，让结局不只依赖数值。

## 7. 数值模拟

当前提供了开发者模拟脚本：

```bash
npm run simulate -- 1000
```

它会自动随机选择可执行行动，并输出结局分布。这个脚本不等于真实玩家策略，但能快速发现明显失衡，例如某个结局过于容易或完全无法达成。
