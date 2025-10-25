# 📌 TODO — Messaging API Implementation

> Based on [`docs/messaging_api.md`](../docs/messaging_api.md)

---

## 📨 Exchanges & Routing Keys

Each domain exchange (`input`, `response`, `events`, `control`) must be created and bound according to the spec.

### Tasks

- [ ] **Update all services** to use shared exchange and routing conventions:
    - `potato.<domain>.exchange`
    - Routing key: `<service>.<mode>.<version?>`
- [ ] **Abstract `RabbitMQProducer`**
    - Centralize message publishing
    - Auto-fill `meta` fields (`message_id`, `sent_at`, etc.)
    - Validate payloads before publishing
    - Handle retries and connection pooling

---

## 📦 Queues & Consumers

Each service owns a single durable queue named `potato.<service>.queue`.

### Tasks

- [ ] **Update all services** to follow naming and binding conventions
    - Queue name: `potato.<service>.queue`
    - Bindings defined per service (e.g. `ear.*.v1`, `brain.reasoned.v1`)
- [ ] **Abstract `RabbitMQConsumer`**
    - Handles connection setup and binding logic
    - Validates incoming messages against schema
    - Gracefully handles errors (DLX publishing, retries, logging)

---

## 🧩 Schema Repository

All message payloads are defined under [`/schemas/`](../schemas).  
Each schema should correspond to one routing key version.

### Tasks

- [ ] **Define Schema Files**
    - [ ] **ear/**
        - [ ] `text.v1.json`
        - [ ] `speech.v1.json`
    - [ ] **brain/**
        - [ ] `reasoned.v1.json`
        - [ ] `stream.v1.json`
        - [ ] `context.v1.json`


- [ ] Validate all schemas with `jsonschema` or equivalent linter

---

## 🧠 Validation Library

A shared validation utility ensures all messages match their schema before being published or processed.

### Tasks

- [ ] Implement **Pydantic or JSONSchema validator**
    - [ ] `validate_outgoing(message, schema)`
    - [ ] `validate_incoming(message, schema)`
- [ ] Automatically inject:
    - `message_id`
    - `sent_at`
    - `schema-name`
    - `schema-version`
- [ ] Fail fast on schema mismatches and route invalid messages to DLX

---

## 🔍 Observability & Monitoring

Implement tracing, logging, and DLX monitoring per spec.

### Tasks

- [ ] Add `trace_id` and `correlation_id` propagation
- [ ] Log message metadata (`message_id`, `routing_key`, `source`)
- [ ] Track DLX message counts and retry metrics

---

## 🚀 Future Extensions

- [ ] Automated documentation generation from schemas