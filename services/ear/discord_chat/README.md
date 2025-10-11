# 👂 Discord Chat Ear

This Discord Bot handles Ear functionality specifically. (As opposed to the Monolith [Head](../../head/discord) that
handled Chat-Ear, Chat-Mouth, VC-Ear and VC-Mouth.)
<br>This Bot listens to dicord messages (when listening) and forwards them via RabbitMQ.

## TODO:

- [ ] Implement actual logic.
    - Start/ Stop Listening
    - RabbitMQ
    - etc.
- [ ] Doublecheck `tsconfig.json`
- [ ] Doublecheck `index.ts`
- [ ] Base Docker Image for all Discord related Services (shared_libs)
- [x] Check what happens when two bots have the same command names
    - One Bot will raise a `DiscordAPIError[10062]: Unknown interaction` and/ or
      `DiscordAPIError[40060]: Interaction has already been acknowledged.` and crash.
- [ ] Check what happens when you `register-command.js`. (Are old commands overwritten?)