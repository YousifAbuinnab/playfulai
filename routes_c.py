"""
PlayfulAI - Person C backend part.

Voice (ElevenLabs), join codes, kid answers and teacher stats.

B plugs it into main.py with:
    from routes_c import router
    app.include_router(router)

Endpoints:
    POST /lessons/{lesson_id}/publish   voice the lesson + create a 4-digit join code
    GET  /play/{code}                   lesson for the kid app
    POST /play/{code}/answer            store one kid answer
    GET  /lessons/{lesson_id}/stats     data for the teacher dashboard
    GET  /audio/status                  credits used, cache size (for the 18:15 check)
"""

import hashlib
import logging
import os
import random
import re
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

try:  # B's real storage on the demo laptop
    from storage import ANSWERS, CODES, LESSONS, save
except ImportError:  # local testing on C's laptop
    from storage_stub import ANSWERS, CODES, LESSONS, save

load_dotenv()
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("routes_c")

# ---------------------------------------------------------------- settings
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
NARRATOR_VOICE_ID = os.getenv("NARRATOR_VOICE_ID", "")
CHARACTER_VOICE_ID = os.getenv("CHARACTER_VOICE_ID", "")
AUDIO_ENABLED = os.getenv("AUDIO_ENABLED", "false").strip().lower() == "true"
ELEVENLABS_MODEL = os.getenv("ELEVENLABS_MODEL", "eleven_flash_v2_5")
MAX_CHARS_PER_PUBLISH = int(os.getenv("MAX_CHARS_PER_PUBLISH", "1500"))

BASE_DIR = Path(__file__).parent
AUDIO_DIR = BASE_DIR / "static" / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
CREDITS_FILE = BASE_DIR / "credits_used.txt"

router = APIRouter()

_client = None


def get_client():
    """Create the ElevenLabs client only when it is really needed."""
    global _client
    if _client is None:
        from elevenlabs.client import ElevenLabs

        _client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    return _client


# ---------------------------------------------------------------- text for speech
SPEECH_WORDS = {
    "en": {"plus": "plus", "minus": "minus", "times": "times", "equals": "equals", "question": "equals what?"},
    "de": {"plus": "plus", "minus": "minus", "times": "mal", "equals": "ist", "question": "ist wie viel?"},
}


def lang_code(lesson: dict) -> str:
    lang = str(lesson.get("language", "en")).strip().lower()
    return "de" if lang.startswith(("de", "german", "deutsch")) else "en"


def number_words(match: re.Match, lang: str) -> str:
    n = int(match.group())
    if n > 1000:
        return match.group()
    try:
        from num2words import num2words

        return num2words(n, lang=lang)
    except Exception:
        return match.group()


def speech_text(text: str, lang: str) -> str:
    """'7 + 5 = ?' -> 'seven plus five equals what?' so the voice reads math correctly."""
    if not text:
        return ""
    w = SPEECH_WORDS[lang]
    t = str(text)
    t = re.sub(r"=\s*\?", w["question"], t)
    t = re.sub(r"(\d)\s*\+\s*(?=\d)", lambda m: f"{m.group(1)} {w['plus']} ", t)
    t = re.sub(r"(\d)\s*[-\u2212\u2013]\s*(?=\d)", lambda m: f"{m.group(1)} {w['minus']} ", t)
    t = re.sub(r"(\d)\s*[\u00d7*]\s*(?=\d)", lambda m: f"{m.group(1)} {w['times']} ", t)
    t = re.sub(r"(\d)\s*=\s*(?=\d)", lambda m: f"{m.group(1)} {w['equals']} ", t)
    t = re.sub(r"\d+", lambda m: number_words(m, lang), t)
    return re.sub(r"\s+", " ", t).strip()


# ---------------------------------------------------------------- lesson helpers
def chapter_tasks(chapter: dict) -> list:
    """Supports 'tasks' (list, our contract) and an older single 'task'."""
    if chapter.get("tasks"):
        return chapter["tasks"]
    if chapter.get("task"):
        return [chapter["task"]]
    return []


def all_tasks(lesson: dict) -> list:
    tasks = []
    for chapter in lesson.get("chapters") or []:
        tasks.extend(chapter_tasks(chapter))
    for level in lesson.get("levels") or []:
        tasks.extend(level.get("tasks") or [])
    return tasks


def audio_jobs(lesson: dict) -> list:
    """(object, field, text to speak, voice_id) for every narration and task prompt.
    Explanations are never voiced (credit saving)."""
    lang = lang_code(lesson)
    jobs = []
    for chapter in lesson.get("chapters") or []:
        narration = chapter.get("narration_text") or chapter.get("narration") or ""
        jobs.append((chapter, "narration_audio", speech_text(narration, lang), NARRATOR_VOICE_ID))
    for task in all_tasks(lesson):
        jobs.append((task, "prompt_audio", speech_text(task.get("prompt", ""), lang), CHARACTER_VOICE_ID))
    return [job for job in jobs if job[2]]


# ---------------------------------------------------------------- ElevenLabs
def audio_path(text: str, voice_id: str) -> Path:
    key = f"{ELEVENLABS_MODEL}|{voice_id}|{text}".encode("utf-8")
    return AUDIO_DIR / f"{hashlib.sha1(key).hexdigest()[:20]}.mp3"


def audio_url(path: Path) -> str:
    return f"/static/audio/{path.name}"


def tts(text: str, voice_id: str):
    """Returns a relative URL to the MP3, or None. Cached files never cost credits."""
    if not text or not voice_id:
        return None
    path = audio_path(text, voice_id)
    if path.exists():
        return audio_url(path)
    if not AUDIO_ENABLED:
        return None
    try:
        audio = get_client().text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id=ELEVENLABS_MODEL,
            output_format="mp3_44100_128",
        )
        tmp = path.with_suffix(".part")
        with open(tmp, "wb") as f:
            if isinstance(audio, (bytes, bytearray)):
                f.write(audio)
            else:
                for chunk in audio:
                    if chunk:
                        f.write(chunk)
        tmp.replace(path)
        return audio_url(path)
    except Exception as e:
        log.error("ElevenLabs failed for %r: %s", text[:40], e)
        return None


def read_credits() -> int:
    try:
        return int(CREDITS_FILE.read_text().strip() or 0)
    except Exception:
        return 0


def add_credits(chars: int) -> int:
    total = read_credits() + chars
    CREDITS_FILE.write_text(str(total))
    return total


def new_join_code() -> str:
    while True:
        code = f"{random.randint(1000, 9999)}"
        if code not in CODES:
            return code


# ---------------------------------------------------------------- endpoints
@router.post("/lessons/{lesson_id}/publish")
def publish(lesson_id: str):
    lesson = LESSONS.get(lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="lesson not found")

    jobs = audio_jobs(lesson)
    unique = {(text, voice) for _, _, text, voice in jobs if voice}
    uncached = [(text, voice) for text, voice in unique if not audio_path(text, voice).exists()]
    chars_needed = sum(len(text) for text, _ in uncached) if AUDIO_ENABLED else 0

    if chars_needed > MAX_CHARS_PER_PUBLISH:
        return JSONResponse(
            status_code=400,
            content={"error": "too many characters", "chars": chars_needed, "limit": MAX_CHARS_PER_PUBLISH},
        )

    with ThreadPoolExecutor(max_workers=4) as pool:
        urls = dict(zip(unique, pool.map(lambda pair: tts(*pair), unique)))

    chars_sent = sum(len(text) for text, voice in uncached if urls.get((text, voice)))
    if chars_sent:
        total = add_credits(chars_sent)
        log.info("Publish %s: sent %d chars to ElevenLabs (running total %d)", lesson_id, chars_sent, total)

    missing_audio = 0
    for obj, field, text, voice in jobs:
        obj[field] = urls.get((text, voice))
        if obj[field] is None:
            missing_audio += 1

    code = lesson.get("join_code")
    if not code or CODES.get(code) != lesson_id:
        code = new_join_code()
        CODES[code] = lesson_id
        lesson["join_code"] = code
    lesson["published"] = True
    save()

    return {
        "code": code,
        "lesson": lesson,
        "chars_sent": chars_sent,
        "audio_enabled": AUDIO_ENABLED,
        "missing_audio": missing_audio,
    }


@router.get("/play/{code}")
def play(code: str):
    lesson_id = CODES.get(code)
    lesson = LESSONS.get(lesson_id) if lesson_id else None
    if lesson is None:
        raise HTTPException(status_code=404, detail="code not found")
    return lesson


class Answer(BaseModel):
    player: str
    task_id: str
    correct: bool


@router.post("/play/{code}/answer")
def answer(code: str, body: Answer):
    lesson_id = CODES.get(code)
    if lesson_id is None:
        raise HTTPException(status_code=404, detail="code not found")
    ANSWERS.append(
        {
            "lesson_id": lesson_id,
            "player": body.player,
            "task_id": body.task_id,
            "correct": body.correct,
            "timestamp": time.time(),
        }
    )
    save()
    return {"ok": True}


@router.get("/lessons/{lesson_id}/stats")
def stats(lesson_id: str):
    lesson = LESSONS.get(lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="lesson not found")

    tasks = all_tasks(lesson)

    first = {}  # (player, task_id) -> correct, first attempt only
    for a in ANSWERS:
        if a.get("lesson_id") != lesson_id:
            continue
        key = (a["player"], a["task_id"])
        if key not in first:
            first[key] = bool(a["correct"])

    players = {}
    for (player, _), ok in first.items():
        p = players.setdefault(player, {"player": player, "correct": 0, "answered": 0, "total": len(tasks)})
        p["answered"] += 1
        p["correct"] += int(ok)

    questions = []
    for task in tasks:
        results = [ok for (_, tid), ok in first.items() if tid == task.get("id")]
        wrong = results.count(False)
        questions.append(
            {
                "task_id": task.get("id"),
                "prompt": task.get("prompt", ""),
                "answers": len(results),
                "error_rate": round(wrong / len(results), 2) if results else 0.0,
            }
        )
    questions.sort(key=lambda q: q["error_rate"], reverse=True)

    return {
        "lesson_id": lesson_id,
        "title": lesson.get("title", ""),
        "join_code": lesson.get("join_code"),
        "players": sorted(players.values(), key=lambda p: p["correct"], reverse=True),
        "questions": questions,
    }


@router.get("/audio/status")
def audio_status():
    info = {
        "audio_enabled": AUDIO_ENABLED,
        "model": ELEVENLABS_MODEL,
        "chars_sent_total": read_credits(),
        "cached_files": len(list(AUDIO_DIR.glob("*.mp3"))),
    }
    if ELEVENLABS_API_KEY:
        try:
            sub = get_client().user.subscription.get()
            info["account_credits_used"] = sub.character_count
            info["account_credits_limit"] = sub.character_limit
        except Exception as e:
            info["account_info_error"] = str(e)[:200]
    return info
