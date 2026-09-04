"""
app/core/llm.py — Core unified LLM client supporting Google Gemini 3.6 Flash & Groq.

Includes automatic provider fallback, prompt guardrails, and JSON response mode handling.
"""

import json
import logging
import re
from typing import Optional

import httpx

from app.config import get_settings

LOGGER = logging.getLogger(__name__)


def _call_gemini(
    prompt: str,
    system_prompt: Optional[str] = None,
    json_mode: bool = False,
    timeout: float = 30.0,
) -> str:
    """Execute LLM text generation call using Google Gemini API (gemini-3.6-flash)."""
    settings = get_settings()
    api_key = settings.gemini_api_key
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured in environment/.env")

    model = settings.gemini_model or "gemini-3.6-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    contents = []
    if system_prompt:
        contents.append({"role": "user", "parts": [{"text": f"SYSTEM INSTRUCTION:\n{system_prompt}"}]})
        contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly follow these instructions."}]})

    prompt_text = prompt
    if json_mode and "JSON" not in prompt_text.upper():
        prompt_text += "\nRespond strictly in valid JSON format."

    contents.append({"role": "user", "parts": [{"text": prompt_text}]})

    payload = {"contents": contents}

    headers = {"Content-Type": "application/json"}
    with httpx.Client(timeout=timeout) as client:
        resp = client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

        try:
            candidate = data["candidates"][0]
            text = candidate["content"]["parts"][0]["text"]
            return text.strip()
        except (KeyError, IndexError) as err:
            raise ValueError(f"Unexpected response structure from Gemini API: {data}") from err


def _call_groq(
    prompt: str,
    system_prompt: Optional[str] = None,
    json_mode: bool = False,
    timeout: float = 30.0,
) -> str:
    """Execute LLM text generation call using Groq API (openai/gpt-oss-120b)."""
    settings = get_settings()
    api_key = settings.groq_api_key
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured in environment/.env")

    model = settings.groq_model or "openai/gpt-oss-120b"
    url = "https://api.groq.com/openai/v1/chat/completions"

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})

    prompt_text = prompt
    if json_mode and "JSON" not in prompt_text.upper():
        prompt_text += "\nRespond strictly in valid JSON format."

    messages.append({"role": "user", "content": prompt_text})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.2,
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=timeout) as client:
        resp = client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

        try:
            text = data["choices"][0]["message"]["content"]
            return text.strip()
        except (KeyError, IndexError) as err:
            raise ValueError(f"Unexpected response structure from Groq API: {data}") from err


def generate_llm_text(
    prompt: str,
    system_prompt: Optional[str] = None,
    provider: Optional[str] = None,
    json_mode: bool = False,
    timeout: float = 30.0,
) -> str:
    """Generate text using primary LLM provider (Gemini 3.6 Flash) with automatic fallback (Groq).

    Enforces strict guardrails and clean text output.
    """
    settings = get_settings()
    chosen_provider = (provider or settings.default_llm_provider or "gemini").lower()

    providers_to_try = (
        ["gemini", "groq"] if chosen_provider == "gemini" else ["groq", "gemini"]
    )

    last_error: Optional[Exception] = None

    for prov in providers_to_try:
        try:
            if prov == "gemini":
                LOGGER.info("Calling Gemini API (%s)...", settings.gemini_model)
                res = _call_gemini(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    json_mode=json_mode,
                    timeout=timeout,
                )
            else:
                LOGGER.info("Calling Groq API (%s)...", settings.groq_model)
                res = _call_groq(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    json_mode=json_mode,
                    timeout=timeout,
                )

            # Post-process code fences if JSON mode is requested
            if json_mode:
                res = re.sub(r"^```json\s*", "", res, flags=re.IGNORECASE)
                res = re.sub(r"^```\s*", "", res)
                res = re.sub(r"\s*```$", "", res).strip()

            return res

        except Exception as err:
            LOGGER.warning("LLM call to %s failed: %s. Attempting fallback if available.", prov, err)
            last_error = err

    raise RuntimeError(f"All LLM providers failed. Last error: {last_error}")
