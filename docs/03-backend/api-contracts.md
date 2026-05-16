# API Contracts

## Session Start Request

`POST /functions/v1/start-ai-session`

```json
{
  "personaId": "uuid",
  "mode": "text|voice|avatar|reflection",
  "userMessage": "optional string",
  "clientContext": {
    "locale": "en-US",
    "timezone": "Asia/Colombo"
  }
}
```

Response includes session id, provider route, and stream configuration.

## Memory Ingest Request

`POST /functions/v1/ingest-memory`

```json
{
  "personaId": "uuid",
  "memoryType": "journal|photo|voice|letter|transcript|timeline_event",
  "title": "string",
  "content": "optional text",
  "mediaPath": "optional storage path",
  "metadata": {}
}
```

Response includes ingestion id and async indexing status.

## Share Persona Request

`POST /functions/v1/share-persona`

```json
{
  "personaId": "uuid",
  "granteeUserId": "uuid",
  "role": "viewer|contributor|manager",
  "action": "grant|revoke"
}
```

## Backward Compatibility Rule

Any breaking change to request/response contracts requires:
1. New versioned endpoint or explicit migration path.
2. Decision log entry in `docs/14-decisions/`.
3. Updated mobile app docs and implementation status.
