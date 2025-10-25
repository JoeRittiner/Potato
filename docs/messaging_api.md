# ✉️ ️ Potato Messaging API Specification

> **Version:** 1.0  
> **Scope:** Internal communication between Potato microservices via RabbitMQ  
> **Goal:** Provide a consistent, low-coupling, high-cohesion message architecture.

---

## 1. Overview

Potato services (Ear, Brain, Mouth, etc.) communicate asynchronously through [RabbitMQ]([https://www.rabbitmq.com/]),
using a topic-based messaging pattern.  
Each service publishes and consumes structured messages that follow a shared contract defined by this specification.

### Design Goals

- **Low Coupling**: Services are independent and unaware of each other's internals.
- **High Cohesion**: Each service focuses on a single, well-defined role.
- **Consistency**: Common naming, structure, and metadata across all messages.
- **Versioning**: Schema and routing versions enable safe evolution.

---

## 2. Design Rationale

### Core Principles

| Principle                    | Description                                                                                                                                          |
|------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Exchange-First Design**    | Producers publish to exchanges, not directly to queues. Consumers bind queues as needed. This enables flexibility and independence between services. |
| **Explicit Domains**         | Exchanges are grouped by logical domain (e.g., `input`, `response`, `events`) to keep traffic organized.                                             |
| **Topic Routing**            | Topic exchanges support routing by pattern, enabling selective listening (e.g., `ear.*.v1`).                                                         |
| **Schema-Defined Payloads**  | Every message is validated against a defined schema (JSON Schema or Pydantic model).                                                                 |
| **Self-Describing Metadata** | All messages include metadata (version, timestamps, correlation IDs) for observability and debugging.                                                |

### Analogy

Think of RabbitMQ as a **postal system**:

- **Exchanges** = Post office counters
- **Routing keys** = Address labels
- **Queues** = Mailboxes
- **Producers** = Letter senders
- **Consumers** = Letter recipients

Producers only drop letters at the post office. They don’t need to know who will receive them or how they’ll get there.

---

## 3. Exchanges & Routing Keys

### 3.1 Exchange Naming Convention

```
potato.<domain>.exchange
```

| Field      | Description                                           |
|------------|-------------------------------------------------------|
| `potato`   | Project namespace prefix                              |
| `<domain>` | Functional area (e.g., `input`, `response`, `events`) |

> All exchanges are **durable** and of type **topic**.

### 3.2 Routing Key Convention

```
<service>.<mode>.<version?>
```

| Field      | Description                                          |
|------------|------------------------------------------------------|
| `service`  | Producing service (e.g., `ear`, `brain`, `mouth`)    |
| `mode`     | Message purpose (e.g., `text`, `speech`, `reasoned`) |
| `version?` | Optional version tag (`v1`, `v2`, etc.)              |

### 3.3 Examples

| Domain   | Exchange Name              | Type  | Example Routing Keys                             |
|----------|----------------------------|-------|--------------------------------------------------|
| input    | `potato.input.exchange`    | topic | `ear.text.v1`, `ear.speech.v1`, `ear.command.v1` |
| response | `potato.response.exchange` | topic | `brain.reasoned.v1`, `brain.context.v1`          |
| events   | `potato.events.exchange`   | topic | `body.state.v1`, `mouth.spoken.v1`               |
| control  | `potato.control.exchange`  | topic | `system.heartbeat.v1`, `system.shutdown.v1`      |

---

## 4. Queues

### 4.1 Queue Naming Convention

```
potato.<service>.queue
```

| Field       | Description                                                  |
|-------------|--------------------------------------------------------------|
| `potato`    | Project prefix                                               |
| `<service>` | Logical service name (e.g., `ear`, `brain`, `mouth`, `body`) |

> Queues are **durable** and bound to one or more exchanges using binding keys that match routing key patterns.

### 4.2 Examples

| Service | Queue Name           | Typical Bindings                                 |
|---------|----------------------|--------------------------------------------------|
| brain   | `potato.brain.queue` | `potato.input.exchange` → `ear.*.v1`             |
| mouth   | `potato.mouth.queue` | `potato.response.exchange` → `brain.reasoned.v1` |

---

## 5. Message Format

Each message has a consistent envelope structure, separating **metadata** (`meta`) from **payload** (business data).

### 5.1 Envelope Structure

```json
{
  "meta": {
    "schema": "ear.text",
    "version": "1",
    "sent_by": "ear",
    "sent_at": "2025-10-10T08:31:12Z",
    "message_id": "uuid-1234-5678",
    "correlation_id": "uuid-9999-0000"
  },
  "payload": {
    /* service-specific content */
  }
}
```

### 5.2 Required Headers (AMQP Properties)

| Header           | Type       | Description                         |
|------------------|------------|-------------------------------------|
| `content-type`   | string     | Always `application/json`           |
| `schema-name`    | string     | e.g., `ear.text`                    |
| `schema-version` | string/int | e.g., `1`                           |
| `message-id`     | UUID 4     | Unique identifier for deduplication |
| `correlation-id` | UUID 4     | Correlates related messages         |
| `source`         | string     | Producing service name              |
| `timestamp`      | integer    | Unix time (ms)                      |

### 5.3 Schema Files

All message payloads are defined under:

```
/schemas/<service>/<schema-name>.v<version>.json
```

Example:

```
schemas/
 └── ear/
      └── text.v1.json
```

---

## 6. Versioning

- **Minor changes** (adding optional fields): Update schema, keep same routing key version.
- **Breaking changes** (rename/remove fields): Create new schema version and routing key (e.g., `.v2`).
- **Routing keys** and **schema versions** should always match.

Consumers must opt in to new versions explicitly via their binding keys.

---

## 7. Error Handling

- **DLX (Dead Letter Exchange):** `potato.dead.exchange` handles failed messages.
- **Retries:** Use retry queues or exponential backoff with message headers like `x-retry-count`.
- **Invalid Messages:** Consumers should log errors, acknowledge to prevent loops, and republish invalid payloads to the
  DLX.

---

## 8. Governance & Validation

### Enforcement Layers

1. **Schema Repository** – All message schemas live under `/schemas/`.
2. **Validation Library** – Shared Pydantic validator used by all producers and consumers.
3. **Runtime Validation** – Consumers reject or route invalid messages to DLX.

---

## 9. Example Flow

**Scenario:** Ear hears text → Brain reasons → Mouth speaks

1. **Ear** publishes to `potato.input.exchange`
    - Routing key: `ear.text.v1`
    - Schema: `schemas/ear/text.v1.json`
2. **Brain** consumes from `potato.brain.queue`
    - Bound to `ear.*.v1`
    - Publishes to `potato.response.exchange` using `brain.reasoned.v1`
3. **Mouth** consumes from `potato.mouth.queue`
    - Bound to `brain.reasoned.v1`
    - Triggers speech synthesis

---

## 10. Defined Domains and Modes

| Domain     | Description                                 |
|------------|---------------------------------------------|
| `input`    | Inbound data from users                     |
| `response` | Reasoned or processed outputs               |
| `events`   | System or state changes                     |
| `control`  | Internal coordination and lifecycle signals |

### Mode Reference (by Service)

| Service | Mode       | Example Routing Key | Description                                           |
|---------|------------|---------------------|-------------------------------------------------------|
| ear     | `text`     | `ear.text.v1`       | Text-based user input                                 |
| ear     | `speech`   | `ear.speech.v1`     | Audio Transcript (speech recognition)                 |
| brain   | `reasoned` | `brain.reasoned.v1` | Logical reasoning results                             |
| brain   | `stream`   | `brain.stream.v1`   | Individual output tokens as part of a larger response |
| brain   | `context`  | `brain.context.v1`  | Context updates                                       |

---

## 11. Future Extensions

- Automated documentation generation from schemas
