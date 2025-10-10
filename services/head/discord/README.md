# 🗣️ Discord Head

The **Discord Head** is a **Head**-service implementation that uses a [discord.js](https://discord.js.org/) bot as both
an **Ear** (input) and a **Mouth** (output).

> **Why use Discord?**<br>
> Discord offers a handy and clean user interface for both **text** and **audio** input/output.
> Trying to access a microphone from a Docker container is difficult, hence the discord work-around.
>
> **Why discord.js instead of discord.py?**<br>
> Discord.js supports voice channels, which are required for (near) real-time audio input/output, using Discord. (A
> planned feature.)

---

## 📝 TODO / Planned Features

- **Ear functionality**
    - [x] Listen to user messages in text channels
  - [x] Handle Direct text messages
  - [x] Listen to audio input in voice channels
    - [ ] Improve Message handling
- **Mouth functionality**
    - [x] Send text responses to channels
  - [x] Play audio output in voice channels
    - [ ] Add default fallback channel?
- [ ] Split into multiple services (Same Token)
- [ ] Add configurable settings.
- [ ] Better Documentation

---

## 🔧 Environment Variables:

Create a `.env` file with:

| Variable                       | Description                                                                                                                 |
|--------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| `DISCORD_CLIENT_ID`            | Application ID from the [Discord Developer Portal](https://discord.com/developers/applications)                             |
| `DISCORD_TOKEN`                | [Discord Developer Portal](https://discord.com/developers/applications) > "General Information" > application id            |
| `DISCORD_GUILD_ID`             | [Enable developer mode](https://support.discord.com/hc/en-us/articles/206346498) > Right-click the server title > "Copy ID" |
| `TRANSCRIBER_HOST`             | Host of the transcriber service                                                                                             |
| `TRANSCRIBER_PORT`             | Port of the transcriber service                                                                                             |
| `TRANSCRIBER_SILENCE_DURATION` | Silence threshold (ms) before sending audio to transcriber (default: 1000)                                                  |
---

## 🚀 Usage

**Build the Docker Image**
```bash
docker compose build
```

**Register slash commands**<br>
This runs in the foreground and exits when finished.<br>
Run it whenever you add or update slash commands.
```bash
docker compose up update
````

**Start the bot**
```bash
docker compose up -d bot
```

**View logs**
```bash
docker compose logs -f bot
```

**Stop the bot**
```bash
docker compose down
```

### ⚡ Quick Alternative

Register commands and start the bot:
```bash
docker compose run --rm deploy && docker compose up -d bot
```

### 🧪 Dummies (for Testing)

This service includes two lightweight “dummy” components for testing.
They are not full services and do not connect to RabbitMQ.

| File                                       | Description                                                                |
|--------------------------------------------|----------------------------------------------------------------------------|
| [`dummy_ear.py`](dummies/dummy_ear.py)     | TCP server that receives per-user audio data and saves it to a file.       |
| [`dummy_mouth.py`](dummies/dummy_mouth.py) | Streams [`sample.wav`](dummies/sample.wav) audio to the head for playback. |

**To Test**:

1. `/vc join` connects the bot to the specified Voice Channel.
2. Run `dummy_ear.py`.
3. `/vc listen` enables audio recoding in the voice channel.
4. `/vc speak` enables audio playback in the voice channel.
5. Run `dummy_mouth.py` to play the sample file in the voice channel.