# LiveKit Architecture

## Purpose

Provide low-latency realtime transport for voice, captions, and presence events.

## Components

- room lifecycle manager
- token issuance function
- voice stream handlers
- realtime captions channel
- memory recall event channel

## Session Flow

1. Client requests session bootstrap.
2. Backend issues short-lived LiveKit token.
3. Client joins room and initializes audio pipeline.
4. Stream events carry transcripts, responses, and memory recalls.
5. Session closes with summary and event logs.

## Security

- short token TTL
- persona-scoped session permissions
- no direct provider keys on client

## Reliability

- reconnect strategy for unstable networks
- fallback to text-only mode when voice fails
