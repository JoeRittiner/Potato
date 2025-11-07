# 👂 Ear (Input Services)

Ears handle incoming messages.

## Heartbeat Ear

A simple Ear that sends heartbeat messages at regular intervals.

## Discord Chat Ear

An Ear that listens to Discord messages and sends them to the Brain.  
Listening can be enabled and disabled via the `/listen` and `/stop` commands.

## TODO

- [ ] Add RabbitMQ Ear (Listens for messages from RabbitMQ via topic?)
    - Or no?, one RabbitMQ instance per Potato? -> Communicate somehow else.
      For isolation, each Potato gets its own RabbitMQ instance.