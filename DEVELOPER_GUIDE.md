# 科研之路开发者说明

本文档记录当前版本的开发调试入口、内容速览方式和图片生成流程。

## 访问入口

普通玩家入口：

```text
https://giaco387.github.io/my-research-life/
```

开发调试入口：

```text
https://giaco387.github.io/my-research-life/?dev=1
```

普通入口不会显示开发者工具。只有 URL 中带 `?dev=1` 时，页面右上角才会出现“开发者速览”面板。

## 开发者速览

开发者速览用于快速检查游戏内容，避免像普通玩家一样从高中阶段慢慢打到后期。

当前功能：

- 快速跳转到任意阶段。
- 直接打开本科毕业后的读研路线选择。
- 查看游戏内容总览，包括阶段、读研路线和结局。

跳转阶段不会写入任何存档。它只用于当前页面会话的调试浏览。

## 存档与刷新

游戏支持 3 个本地存档槽。

刷新页面后，游戏总是回到首页，不会自动进入上一次游玩的界面。玩家需要从首页进入存档列表，再手动选择继续某个存档。

## 读研路线成功率

本科毕业后的读研路线中会显示“成功率”。

这个百分数表示：以当前本科阶段积累，走通该路线的概率。

如果路线失败，不会直接结局，而是进入该路线设计好的备选分支。例如直博失败会转入硕士路线，海外 PhD 申请失败也会转入国内硕士路线。

## 版本号

游戏右下角会显示当前版本号。

版本号来自 `package.json` 中的 `version` 字段。当前版本为：

```text
0.1.0
```

修改版本号时，需要同步更新：

- `package.json`
- `package-lock.json`

## 图片资源

首页封面：

```text
public/home-cover.png
```

阶段图片：

```text
public/stages/high-school.png
public/stages/undergraduate.png
public/stages/master.png
public/stages/phd.png
public/stages/young-faculty.png
public/stages/professor.png
public/stages/academician-candidate.png
```

青年人才竞争期暂时复用 `young-faculty.png`，国家级人才与重大项目期暂时复用 `professor.png`。游戏会按当前阶段自动加载对应图片。如果阶段图片不存在，会回退到默认 `hero.png`。

## 图片生成脚本

图片生成脚本位于：

```text
scripts/generate_game_images.py
```

生成所有阶段图片：

```powershell
python scripts\generate_game_images.py --stage all
```

生成首页封面：

```powershell
python scripts\generate_game_images.py --stage home_cover
```

生成单个阶段图片：

```powershell
python scripts\generate_game_images.py --stage phd
```

脚本默认调用：

```text
http://127.0.0.1:25955/v1/responses
```

脚本支持普通 JSON 和 SSE 流式返回。图片会从返回结果中提取 base64 并保存到对应目录。

## 常用命令

本地开发：

```powershell
npm.cmd run dev
```

构建：

```powershell
npm.cmd run build
```

完整检查：

```powershell
npm.cmd run check
```

部署 GitHub Pages：

```powershell
npm.cmd run deploy
```

## 最近重点改动

- 新增游戏首页，不再一进入就显示存档。
- 新增 3 个本地存档槽。
- 刷新页面固定回到首页。
- 新增首页封面图。
- 新增阶段图片。
- 新增版本号角标。
- 新增 `?dev=1` 开发者速览模式。
- 新增年龄系统、青年人才竞争期、国家级人才与重大项目期，以及优青/杰青/长江等人才项目窗口。
