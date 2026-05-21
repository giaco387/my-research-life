# B 站 AI 字幕获取流程

## 方式一：使用登录态自动获取

适用于有 AI 字幕的视频。需要你在本机浏览器里登录 B 站，并从 Cookie 中取得 `SESSDATA`。

不要把 `SESSDATA` 发给别人，也不要提交到 git。

PowerShell 示例：

```powershell
$env:BILI_SESSDATA="你的 SESSDATA"
python scripts/fetch_bili_subtitle.py BV1ThedzuEm9 -o transcripts/BV1ThedzuEm9.txt
```

脚本会同时输出：

- `transcripts/BV1ThedzuEm9.txt`：纯文本字幕
- `transcripts/BV1ThedzuEm9.json`：原始字幕 JSON 和视频元信息

如果报“没有找到字幕”，常见原因：

- 该视频没有 AI 字幕。
- `SESSDATA` 已过期。
- 网页端没有先打开过 AI 字幕。
- 字幕接口需要更完整的登录 Cookie。

## 方式二：浏览器 Network 手动复制

1. 打开 B 站视频。
2. 按 `F12` 打开开发者工具。
3. 进入 `Network`。
4. 在播放器中打开 AI 字幕。
5. 搜索字幕里的一句关键词。
6. 找到包含大量 `"content"` 字段的字幕 JSON 响应。
7. 全部复制为 `input.json`。
8. 运行：

```powershell
python scripts/extract_bili_subtitle_from_json.py input.json -o output.txt
```

## 当前目标视频

```text
BV1ThedzuEm9
院士候选人名单出炉，小镇做题家如何走上巅峰？
```

拿到字幕后，可以把 `output.txt` 放到 `transcripts/` 目录，再基于文本提炼：

- 学术圈成功路径
- 院士候选常见履历结构
- 科研评价体系中的显性指标和隐性资源
- 可转化为游戏事件、行动和结局条件的社会现象

