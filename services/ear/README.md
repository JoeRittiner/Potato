# 👂 Ear (Input Services)

Ears handle incoming messages.

## Heartbeat Ear

A simple Ear that sends heartbeat messages at regular intervals.

## TODO

- [ ] Add RabbitMQ Ear (Listens for messages from RabbitMQ via topic?)
    - Or no?, one RabbitMQ instance per Potato? -> Communicate somehow else.
      For isolation, each Potato gets its own RabbitMQ instance.