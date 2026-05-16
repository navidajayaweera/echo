# Provider System

## Goals

- Route tasks to the best provider for quality, latency, and cost.
- Keep providers interchangeable through a stable adapter interface.
- Avoid provider-specific logic in app screens.

## Initial Routing

- Fast chat: Gemini Flash
- Emotional depth mode: GPT-4o-class model
- Embeddings: Gemini/OpenAI embedding models
- Voice synthesis: ElevenLabs/OpenAI TTS
- Avatar runtime: Beyond Presence pipeline

## Adapter Contract

Each provider adapter must expose:
- `generateResponse(context)`
- `streamResponse(context, callbacks)`
- `embed(textChunks)`
- `synthesizeVoice(text, voiceProfile)` where applicable

## Failure Handling

- fallback route by capability
- retry with idempotency token
- preserve session state when switching provider mid-session

## Observability

- latency, token usage, and error code metrics per provider
- response quality annotations for offline review
