import argparse
import json
import os
from pathlib import Path

import requests


def get_bilibili_ai_subtitle(bvid: str, sessdata: str) -> tuple[dict, list[dict]]:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
        ),
        "Referer": f"https://www.bilibili.com/video/{bvid}/",
    }
    cookies = {"SESSDATA": sessdata}

    view_resp = requests.get(
        "https://api.bilibili.com/x/web-interface/view",
        params={"bvid": bvid},
        headers=headers,
        cookies=cookies,
        timeout=20,
    )
    view_resp.raise_for_status()
    view_data = view_resp.json()
    if view_data.get("code") != 0:
        raise RuntimeError(f"获取视频信息失败: {view_data}")

    video = view_data["data"]
    cid = video["cid"]

    player_resp = requests.get(
        "https://api.bilibili.com/x/player/wbi/v2",
        params={"bvid": bvid, "cid": cid},
        headers=headers,
        cookies=cookies,
        timeout=20,
    )
    player_resp.raise_for_status()
    player_data = player_resp.json()
    if player_data.get("code") != 0:
        raise RuntimeError(f"获取播放器信息失败: {player_data}")

    subtitles = [
        item for item in player_data["data"]["subtitle"]["subtitles"]
        if item.get("subtitle_url")
    ]
    if not subtitles:
        raise RuntimeError("没有找到字幕。可能原因：未登录、SESSDATA 失效、视频没有 AI 字幕，或字幕需要在网页端先打开。")

    subtitle = next((item for item in subtitles if item.get("lan") == "ai-zh"), subtitles[0])
    subtitle_url = subtitle["subtitle_url"]
    if subtitle_url.startswith("//"):
        subtitle_url = f"https:{subtitle_url}"

    subtitle_resp = requests.get(subtitle_url, headers=headers, cookies=cookies, timeout=20)
    subtitle_resp.raise_for_status()
    subtitle_json = json.loads(subtitle_resp.content.decode("utf-8"))
    body = subtitle_json["body"]

    meta = {
        "bvid": bvid,
        "aid": video["aid"],
        "cid": cid,
        "title": video["title"],
        "owner": video["owner"]["name"],
        "subtitle_language": subtitle.get("lan_doc", subtitle.get("lan", "")),
        "subtitle_url": subtitle_url,
    }
    return meta, body


def save_outputs(meta: dict, body: list[dict], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    text = "\n".join(item["content"] for item in body)
    output.write_text(text, encoding="utf-8")

    raw_path = output.with_suffix(".json")
    raw_path.write_text(json.dumps({"meta": meta, "body": body}, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"标题: {meta['title']}")
    print(f"UP主: {meta['owner']}")
    print(f"字幕类型: {meta['subtitle_language']}")
    print(f"文本已保存: {output}")
    print(f"原始字幕已保存: {raw_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch Bilibili AI subtitle by BV id.")
    parser.add_argument("bvid", help="Bilibili BV id, e.g. BV1ThedzuEm9")
    parser.add_argument("-o", "--output", default="bili_subtitle.txt", help="Output txt path")
    parser.add_argument("--sessdata", default=os.getenv("BILI_SESSDATA"), help="Bilibili SESSDATA, or set BILI_SESSDATA env var")
    args = parser.parse_args()

    if not args.sessdata:
        raise SystemExit("缺少 SESSDATA。请设置环境变量 BILI_SESSDATA，或使用 --sessdata 传入。不要把 SESSDATA 提交到 git。")

    meta, body = get_bilibili_ai_subtitle(args.bvid, args.sessdata)
    save_outputs(meta, body, Path(args.output))


if __name__ == "__main__":
    main()
