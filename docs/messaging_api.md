# 📨 Potato Messaging API Specification

> **Version:** 1.0<br>
> **Scope:** Internal communication between Potato microservices via RabbitMQ<br>
> **Goal:** Provide a consistent, low-coupling, high-cohesion message architecture.
---

## 1. Overview

Potato services usually communicate via **RabbitMQ** using a **topic exchange pattern**.<br>
Messages are schema-validated JSON objects wrapped in a common envelope.

> **Note:** Some Services may communicate via other means. Those are not covered by this specification.

The key design goals are:

- **🔗 Low coupling:** Producers and consumers only depend on shared contracts (exchange, routing key, schema).
- **🧱 High cohesion:** Each service focuses on a single responsibility.
- **🧠 Clarity:** Consistent naming, versioning, and message structure across all services.
- **🧰 Extensibility:** Easy to add new message types without breaking existing integrations.

---

## 2. Exchanges & Routing Keys

### 2.1 Exchange Naming Convention

`potato.<domain>.exchange`

| Field      | Description                                     |
|------------|-------------------------------------------------|
| `potato`   | Project namespace prefix                        |
| `<domain>` | Functional area (input, response, events, etc.) |

Exchanges are generally created as **durable topic exchanges.**
The **type (topic)** allows flexible routing via patterns such as `<service>.<mode>.<version?>`.

> **Note:** The `potato` prefix is used to avoid name collisions with external exchanges. If multiple `potato`
> "instances" are running at once, this prefix may change to reflect their separation.

### 2.2 Routing Keys

`<service>.<mode>.<version?>`

| Field        | Description                                                                     |
|--------------|---------------------------------------------------------------------------------|
| `<service>`  | The producing service (e.g., `ear`, `brain`, `mouth`)                           |
| `<mode>`     | The message purpose or category (e.g., `text`, `speech`, `command`, `reasoned`) |
| `<version?>` | Optional semantic version (e.g., `v1`, `v2`) for routing or schema evolution    |

### 2.3 Examples

| Domain   | Exchange Name              | Type  | Example Routing Keys                             |
|----------|----------------------------|-------|--------------------------------------------------|
| input    | `potato.input.exchange`    | topic | `ear.text.v1`, `ear.speech.v1`, `ear.command.v1` |
| response | `potato.response.exchange` | topic | `brain.reasoned.v1`, `brain.context.v1`          |
| events   | `potato.events.exchange`   | topic | `body.state.v1`, `mouth.spoken.v1`               |

> **🧭 Rule of thumb:**
> - `input`: inbound data or commands
> - `response`: processed output
> - `events`: service-emitted notifications or state changes

---

## 3. Queues

### 3.1 Queue naming convention

`potato.<service>.queue`

| Field       | Description                                          |
|-------------|------------------------------------------------------|
| `potato`    | Project prefix                                       |
| `<service>` | Logical service name (ear, brain, mouth, body, etc.) |

Queues are usually durable and bound to one or more exchanges via binding keys.
Each service consumes from exactly one queue (for simplicity and clarity).

> **Note:** If a service is stateful, or a body part is represented by different services, each queue should only be
> bound to one service. This avoids mismatched message processing.
> <br>E.g. an "Echo Brain" and an "LLM Brain" should not share a queue, to ensure the stateful "LLM Brain" has the full
> context.
> <br>A setup with multiple "LLM Brains" also should not share a queue, unless they share the same state.

### 3.2 Examples

| Service | Queue Name           | Example Bindings                                   |
|---------|----------------------|----------------------------------------------------|
| brain   | `potato.brain.queue` | `potato.input.exchange` → `ear.*.v1`               |
| mouth   | `potato.mouth.queue` | `potato.response.exchange` → `brain.stream.v1`     |
| body    | `potato.body.queue`  | `potato.events.exchange` → `#` (all event traffic) |

--- 

## 4. Message Structure

Messages are JSON objects conforming to a shared envelope format, consisting of:

- `meta`: Standardized Metadata (common for all messages)
- `payload`: Service-specific payload

### 4.1 Message Envelope

```json
{
  "meta": {
    "schema": "ear.text",
    "version": "1",
    "message_id": "uuid",
    "correlation_id": "uuid",
    "service": "ear",
    "domain": "input",
    "mode": "text",
    "timestamp": "2025-10-10T12:34:56Z"
  },
  "payload": {
    /* Service-specific content */
  }
}
```

### 4.2 Required Headers (AMQP Properties)

| Header           | Type          | Description                           |
|------------------|---------------|---------------------------------------|
| `content-type`   | string        | Always `application/json`             |
| `schema-name`    | string        | e.g., `ear.text`                      |
| `schema-version` | string/int    | e.g., `1`                             |
| `message-id`     | string (UUID) | Unique identifier for deduplication   |
| `correlation-id` | string (UUID) | Used for request/response correlation |
| `source`         | string        | Producing service name                |
| `timestamp`      | integer       | Unix time (ms)                        |

### 4.3 Schema Definition

All message payloads are validated against JSON Schemas located in:

`/schemas/<service>/<schema-name>.v<version>.json`

Example:

```
schemas/
 └── ear/
      └── text.v1.json
```

> See [/schemas/pydantic/v1/model.py](../schemas/pydantic/v1/models.py) for Python-level models reflecting these
> schemas.<br>
> Validation is performed both before publishing (producer side) and upon message receipt (consumer side).

---

## 5. Versioning

- **Minor changes** (adding optional fields): increment schema file version, update routing key if needed.
- **Major changes** (removing/ renaming fields, changing field types): create new schema file with `v_`and route via a
  new key (e.g., `ear.text.v2`).
- Consumers must explicitly opt-in to new versions by binding to the new routing key.

> Schema version and routing key version should always match.

---

## 6. Error Handling

- Each queue is configured with a Dead Letter Exchange (DLX): `potato.dead.exchange` where failed or unacknowledged
  messages are routed.
- Consumers should:
    - Validate schema upon receipt
    - Log and acknowledge invalid messages (to avoid infinite redelivery)
    - Optionally republish to potato.dead.exchange with failure metadata

--- 

## 7. TODO

- [ ] Define Message Structure. See: [4.1 Message Envelope](#41-message-envelope)
- [ ] Implement PyDantic(?) BaseModels
- [ ] Implement Changes in [RabbitMQ Classes](../services/shared_libs/RabbitMQ/)
- [ ] Add infrastructure script (like `setup_rabbitmq.py`)?
    - For declaring exchanges, queues, bindings, etc.
- [ ] Implement Changes in [Services](../services/)
- [ ] Define Implementation specific (metadata) schemas in relevant branches.
- [ ] Testing?