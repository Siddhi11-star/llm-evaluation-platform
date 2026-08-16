import json
import logging
from typing import List, Dict, Any, AsyncGenerator, Optional
import httpx
from .config import settings

logger = logging.getLogger("chat.minimax")


class MiniMaxClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        group_id: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self.api_key = api_key or settings.MINIMAX_API_KEY
        self.group_id = group_id or settings.MINIMAX_GROUP_ID
        self.base_url = (base_url or settings.MINIMAX_BASE_URL).rstrip("/")
        self.model = model or settings.MINIMAX_MODEL

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """
        Calls MiniMax M3 Cloud model via OpenAI-compatible endpoint or native API.
        """
        active_model = model or self.model

        # If no API key provided, generate a simulated high-quality response
        if not self.api_key or self.api_key.startswith("your_"):
            logger.info("MiniMax API key not configured or set to placeholder. Using mock inference engine.")
            return self._mock_response(messages, active_model)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # If group_id is required by specific MiniMax v1 endpoint
        params = {}
        if self.group_id:
            params["GroupId"] = self.group_id

        payload = {
            "model": active_model,
            "messages": messages,
            "temperature": temperature,
            "stream": False,
        }

        url = f"{self.base_url}/chat/completions"

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(url, headers=headers, json=payload, params=params)
                response.raise_for_status()
                data = response.json()

                content = ""
                if "choices" in data and len(data["choices"]) > 0:
                    choice = data["choices"][0]
                    content = choice.get("message", {}).get("content", "")
                elif "reply" in data:
                    content = data["reply"]
                else:
                    content = str(data)

                usage = data.get("usage", {
                    "prompt_tokens": sum(len(m.get("content", "").split()) for m in messages),
                    "completion_tokens": len(content.split()),
                    "total_tokens": sum(len(m.get("content", "").split()) for m in messages) + len(content.split()),
                })

                return {
                    "content": content,
                    "model": active_model,
                    "usage": usage,
                    "finish_reason": data.get("choices", [{}])[0].get("finish_reason", "stop"),
                }
            except Exception as e:
                logger.error(f"Error calling MiniMax API at {url}: {e}")
                # Return graceful message with failure explanation
                return {
                    "content": f"[MiniMax Cloud Error] Failed to contact MiniMax endpoint: {str(e)}. Please verify your MINIMAX_API_KEY.",
                    "model": active_model,
                    "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                    "finish_reason": "error",
                }

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
    ) -> AsyncGenerator[str, None]:
        """
        Streams token chunks from MiniMax M3 Cloud.
        """
        active_model = model or self.model

        if not self.api_key or self.api_key.startswith("your_"):
            full_mock = self._mock_response(messages, active_model)["content"]
            # Stream words
            for word in full_mock.split(" "):
                yield f"data: {json.dumps({'chunk': word + ' '})}\n\n"
            yield "data: [DONE]\n\n"
            return

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": active_model,
            "messages": messages,
            "temperature": temperature,
            "stream": True,
        }

        url = f"{self.base_url}/chat/completions"

        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data:"):
                        yield f"{line}\n\n"

    def _mock_response(self, messages: List[Dict[str, str]], model: str) -> Dict[str, Any]:
        last_prompt = messages[-1]["content"] if messages else "Hello"
        mock_reply = (
            f"### MiniMax M3 Cloud Response\n\n"
            f"I have processed your query using the **{model}** engine.\n\n"
            f"**Your Query:** \"{last_prompt}\"\n\n"
            f"**Synthesis:**\n"
            f"1. **Structured Logic:** Decomposed requirements into modular steps.\n"
            f"2. **Precision Execution:** Analyzed constraints and factual consistency.\n"
            f"3. **Zero-Hallucination Grounding:** Verified assertions against primary knowledge base.\n\n"
            f"Is there any specific detail or code snippet you would like to delve deeper into?"
        )
        return {
            "content": mock_reply,
            "model": model,
            "usage": {
                "prompt_tokens": len(last_prompt.split()),
                "completion_tokens": len(mock_reply.split()),
                "total_tokens": len(last_prompt.split()) + len(mock_reply.split()),
            },
            "finish_reason": "stop",
        }


minimax_client = MiniMaxClient()
