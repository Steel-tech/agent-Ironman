"""
LLM Client Service using Anthropic Claude
Handles AI model interactions with proper error handling and streaming
"""

import anthropic
from typing import List, Dict, Any, Optional, Iterator
import logging

from python_worker.config import settings

logger = logging.getLogger(__name__)


class LLMClient:
    """Wrapper for Anthropic Claude API"""

    def __init__(self):
        """Initialize Anthropic client"""
        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY not set in environment")

        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.default_model = settings.default_model
        self.max_tokens = settings.max_tokens
        self.temperature = settings.temperature
        logger.info(f"LLM client initialized with model: {self.default_model}")

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        stop_sequences: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate completion from Claude

        Args:
            prompt: User prompt/message
            system: System prompt for instructions
            model: Model to use (defaults to config)
            max_tokens: Max tokens to generate
            temperature: Temperature for sampling
            stop_sequences: List of sequences that stop generation

        Returns:
            Dict with response text and metadata
        """
        try:
            messages = [{"role": "user", "content": prompt}]

            response = self.client.messages.create(
                model=model or self.default_model,
                max_tokens=max_tokens or self.max_tokens,
                temperature=temperature or self.temperature,
                system=system or "",
                messages=messages,
                stop_sequences=stop_sequences or []
            )

            result = {
                "status": "success",
                "text": response.content[0].text,
                "model": response.model,
                "stop_reason": response.stop_reason,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                }
            }

            logger.info(f"Generated {result['usage']['output_tokens']} tokens")
            return result

        except anthropic.APIError as e:
            logger.error(f"Anthropic API error: {e}")
            raise
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            raise

    def generate_with_context(
        self,
        prompt: str,
        context_documents: List[str],
        system: Optional[str] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate completion with RAG context

        Args:
            prompt: User question/prompt
            context_documents: Retrieved documents for context
            system: Additional system instructions
            model: Model to use

        Returns:
            Dict with response and metadata
        """
        # Build context-enhanced prompt
        context_text = "\n\n".join([
            f"Document {i+1}:\n{doc}"
            for i, doc in enumerate(context_documents)
        ])

        enhanced_prompt = f"""Here is relevant context from the knowledge base:

{context_text}

Based on the above context, please answer the following question:

{prompt}"""

        system_prompt = system or "You are a helpful AI assistant. Answer questions based on the provided context. If the context doesn't contain enough information, say so."

        return self.generate(
            prompt=enhanced_prompt,
            system=system_prompt,
            model=model
        )

    def chat(
        self,
        messages: List[Dict[str, str]],
        system: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Multi-turn conversation

        Args:
            messages: List of {role: "user"|"assistant", content: str}
            system: System prompt
            model: Model to use
            max_tokens: Max tokens to generate

        Returns:
            Dict with response and metadata
        """
        try:
            response = self.client.messages.create(
                model=model or self.default_model,
                max_tokens=max_tokens or self.max_tokens,
                system=system or "",
                messages=messages
            )

            result = {
                "status": "success",
                "text": response.content[0].text,
                "model": response.model,
                "stop_reason": response.stop_reason,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                }
            }

            logger.info(f"Chat response: {result['usage']['output_tokens']} tokens")
            return result

        except Exception as e:
            logger.error(f"Chat failed: {e}")
            raise

    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Quick sentiment analysis using Claude"""
        prompt = f"""Analyze the sentiment of the following text and respond with a JSON object containing:
- sentiment: "positive", "negative", or "neutral"
- confidence: 0.0 to 1.0
- key_emotions: list of detected emotions

Text: {text}

Respond with only valid JSON, no other text."""

        response = self.generate(
            prompt=prompt,
            system="You are a sentiment analysis expert. Respond only with valid JSON.",
            temperature=0.3
        )

        import json
        try:
            result = json.loads(response["text"])
            return {"status": "success", "analysis": result}
        except json.JSONDecodeError:
            logger.warning("Failed to parse sentiment response as JSON")
            return {"status": "error", "message": "Invalid JSON response"}


# Singleton instance
llm_client = LLMClient()
