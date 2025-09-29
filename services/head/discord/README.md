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

- [ ] **Ear functionality**
    - [ ] Listen to user messages in text channels
    - [ ] Handle Direct text messages
    - [ ] Listen to audio input in voice channels
- [ ] **Mouth functionality**
    - [ ] Send text responses to channels
    - [ ] Play audio output in voice channels
- [ ] Add configurable settings.

---

## 🔑 Environment Variables:

Create a `.env` file with the following variables:

| Variable            | Description                                                                                                                 |
|---------------------|-----------------------------------------------------------------------------------------------------------------------------|
| `DISCORD_CLIENT_ID` | Your bot token from the [Discord Developer Portal](https://discord.com/developers/applications)                             |
| `DISCORD_TOKEN`     | [Discord Developer Portal](https://discord.com/developers/applications) > "General Information" > application id            |
| `DISCORD_GUILD_ID`  | [Enable developer mode](https://support.discord.com/hc/en-us/articles/206346498) > Right-click the server title > "Copy ID" |

---

## 🚀 Usage

**Step 1: Build the Docker Image**

```bash
docker compose build
```

**Step 2: Register slash commands**<br>
This runs in the foreground and exits when done.<br>
(Run when you want to update the slash commands.)

```bash
docker compose up update
````

**Step 3: Start the bot in the background**

```bash
docker compose up -d bot
```

**Step 4: View bot logs**

```bash
docker compose logs -f bot
```

**Step 5: Stop the bot**

```bash
docker compose down
```

### ⚡ Quick Alternative

You can also register commands and start the bot in one line:

```bash
docker compose run --rm deploy && docker compose up -d bot
```