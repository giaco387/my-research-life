import argparse
import json
import re
from pathlib import Path


def extract_with_json(text: str) -> list[str]:
    data = json.loads(text)
    if isinstance(data, dict) and "body" in data:
        return [item["content"] for item in data["body"] if "content" in item]
    if isinstance(data, list):
        return [item["content"] for item in data if isinstance(item, dict) and "content" in item]
    return []


def extract_with_regex(text: str) -> list[str]:
    return re.findall(r'"content"\s*:\s*"(.*?)"', text)


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract subtitle content from copied Bilibili subtitle JSON.")
    parser.add_argument("input", help="Input JSON path copied from browser Network panel")
    parser.add_argument("-o", "--output", default="output.txt", help="Output txt path")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    text = input_path.read_text(encoding="utf-8")

    try:
        contents = extract_with_json(text)
    except json.JSONDecodeError:
        contents = extract_with_regex(text)

    if not contents:
        raise SystemExit("没有提取到 content 字段。请确认 input 文件是 AI 字幕 JSON。")

    output_path.write_text("\n".join(contents), encoding="utf-8")
    print(f"导出完成: {output_path}")
    print(f"字幕行数: {len(contents)}")


if __name__ == "__main__":
    main()
