import argparse
import base64
import json
import os
import warnings
from pathlib import Path

warnings.filterwarnings("ignore", message=".*urllib3.*charset_normalizer.*")

import requests


DEFAULT_API_URL = "http://127.0.0.1:25955/v1/responses"
DEFAULT_MODEL = "gpt-5.5"
DEFAULT_OUTPUT_DIR = Path("public/stages")
DEFAULT_API_KEY = "agt_codex_vCsqhXwMBrAF2s9FKjCh3ZmAg6lpFWnz"
PROTAGONIST = (
    "Use the same protagonist across the whole series: a Chinese / East Asian male academic, short black hair, "
    "calm serious expression, ordinary realistic appearance, no celebrity likeness. Age him naturally for each stage. "
)

STAGE_PROMPTS = {
    "high_school": {
        "file": "high-school.png",
        "prompt": (
            "16:9 cinematic realistic editorial game image. "
            + PROTAGONIST
            + "At age 18, the protagonist is a Chinese high school student sitting by "
            "the window during late evening self-study, with exam papers, a mistake notebook, and a water cup "
            "on the desk. Night campus lights outside. Real pressure but not hopeless, tired yet focused. "
            "No readable text, no watermark, no exaggerated facial expression."
        ),
    },
    "undergraduate": {
        "file": "undergraduate.png",
        "prompt": (
            "16:9 cinematic realistic editorial game image. "
            + PROTAGONIST
            + "At age 20, the protagonist is now an undergraduate, "
            "standing between a university laboratory building and a library, carrying a laptop bag and holding "
            "a course schedule plus a first printed research paper. Express curiosity, uncertainty, and first "
            "contact with academic research. No readable text, no watermark."
        ),
    },
    "master": {
        "file": "master.png",
        "prompt": (
            "16:9 cinematic realistic editorial game image. "
            + PROTAGONIST
            + "At age 24, the protagonist is now a master's student, "
            "organizing data at a lab computer, with instruments, sample containers, a whiteboard, and meeting "
            "notes nearby. Show research training, repeated experiments, an early manuscript, and practical "
            "pressure. No readable text, no watermark."
        ),
    },
    "phd": {
        "file": "phd.png",
        "prompt": (
            "16:9 cinematic realistic editorial game image. "
            + PROTAGONIST
            + "At age 29, the protagonist is now a PhD student, alone "
            "late at night between a lab and an office. Screens suggest complex charts without readable text; "
            "the desk has manuscript drafts and cold coffee. Show independent exploration, long-term pressure, "
            "and the search for an original problem. No readable text, no watermark."
        ),
    },
    "young_faculty": {
        "file": "young-faculty.png",
        "prompt": (
            "16:9 cinematic realistic editorial game image. "
            + PROTAGONIST
            + "At age 35, the protagonist is now a young faculty member "
            "and independent PI, standing in a newly built research group space. Students discuss on one side; "
            "unfinished equipment and grant application materials sit on the other. Show the shift from student "
            "to responsible leader, limited resources, and team building. No readable text, no watermark."
        ),
    },
    "professor": {
        "file": "professor.png",
        "prompt": (
            "16:9 cinematic realistic editorial game image. "
            + PROTAGONIST
            + "At age 48, the protagonist is now a professor, discussing "
            "a major research project with students in a meeting room. The wall has unreadable diagrams and a "
            "research roadmap; project materials are on the table. Show academic leadership, mentoring, "
            "responsibility, and influence. No readable text, no watermark."
        ),
    },
    "academician_candidate": {
        "file": "academician-candidate.png",
        "prompt": (
            "16:9 cinematic realistic editorial game image. "
            + PROTAGONIST
            + "At age 62, with some gray hair, the protagonist is now a senior scientist and "
            "academician candidate, standing in a quiet archive room or in front of an achievement display. "
            "Behind them are subtle team photos, research prototypes, and notebooks without readable text. "
            "Show long-term contribution, peer review, mentorship, and restrained honor. No readable text, no watermark."
        ),
    },
}


def extract_image_base64(response_json: dict) -> str | None:
    for key in ("b64_json", "image_base64", "partial_image_b64", "data", "result"):
        if response_json.get(key):
            return response_json[key]

    output = response_json.get("output", [])

    for item in output:
        if item.get("type") == "image_generation_call" and item.get("result"):
            return item["result"]

        for content in item.get("content", []):
            for key in ("b64_json", "image_base64", "data", "result"):
                if content.get(key):
                    return content[key]

    return None


def parse_sse_response(text: str) -> dict:
    merged = {"output": []}

    for block in text.split("\n\n"):
        data_lines = []
        for line in block.splitlines():
            if line.startswith("data:"):
                data_lines.append(line.removeprefix("data:").strip())

        if not data_lines:
            continue

        raw_data = "\n".join(data_lines)
        try:
            event_data = json.loads(raw_data)
        except json.JSONDecodeError:
            continue

        image_base64 = extract_image_base64(event_data)
        if image_base64:
            merged["image_base64"] = image_base64

        item = event_data.get("item")
        if item:
            existing_index = next((index for index, entry in enumerate(merged["output"]) if entry.get("id") == item.get("id")), None)
            if existing_index is None:
                merged["output"].append(item)
            else:
                merged["output"][existing_index] = { **merged["output"][existing_index], **item }

        response = event_data.get("response")
        if response:
            merged = { **merged, **response }

    return merged


def parse_response(resp: requests.Response) -> dict:
    try:
        return resp.json()
    except Exception:
        if resp.text.lstrip().startswith("event:"):
            return parse_sse_response(resp.text)
        raise


def generate_image(prompt: str, output_file: Path, api_url: str, api_key: str, model: str) -> None:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "input": prompt,
        "tools": [{"type": "image_generation"}],
        "tool_choice": {"type": "image_generation"},
    }

    resp = requests.post(api_url, headers=headers, json=payload, timeout=300)
    try:
        data = parse_response(resp)
    except Exception as exc:
        raise RuntimeError(f"接口返回的不是 JSON：HTTP {resp.status_code}\n{resp.text}") from exc

    if resp.status_code >= 400:
        raise RuntimeError(f"请求失败：HTTP {resp.status_code}\n{json.dumps(data, ensure_ascii=False, indent=2)}")

    image_base64 = extract_image_base64(data)
    if not image_base64:
        raise RuntimeError(f"没有在返回结果里找到图片 base64：\n{json.dumps(data, ensure_ascii=False, indent=2)}")

    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_bytes(base64.b64decode(image_base64))
    print(f"图片已保存：{output_file}")


def main() -> None:
    parser = argparse.ArgumentParser(description="生成《科研之路》的阶段插图。")
    parser.add_argument("--stage", choices=[*STAGE_PROMPTS.keys(), "all"], default="all")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--api-url", default=os.getenv("IMAGE_API_URL", DEFAULT_API_URL))
    parser.add_argument("--model", default=os.getenv("IMAGE_MODEL", DEFAULT_MODEL))
    args = parser.parse_args()

    api_key = os.getenv("IMAGE_API_KEY", DEFAULT_API_KEY)
    if not api_key:
        raise RuntimeError(
            "未找到环境变量 IMAGE_API_KEY。请先在 PowerShell 中执行：\n"
            'setx IMAGE_API_KEY "你的完整API_KEY"'
        )

    stages = STAGE_PROMPTS.keys() if args.stage == "all" else [args.stage]
    for stage_id in stages:
        spec = STAGE_PROMPTS[stage_id]
        generate_image(spec["prompt"], args.out_dir / spec["file"], args.api_url, api_key, args.model)


if __name__ == "__main__":
    main()
