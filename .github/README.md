# 🥔 Potato

**Potato** is a modular toy project inspired by [Mr. Potato Head](https://en.wikipedia.org/wiki/Mr._Potato_Head).
Each "body part" is a self-contained service, running in its own Docker container and communicating with others through
RabbitMQ.

**The goal:** learn and experiment with concepts like Docker, service architecture, RabbitMQ, and API design — while
keeping things playful and modular.

---

# 🧩 Architecture

- **Backbone** → RabbitMQ (messaging between parts)
- **Ear** → Input services (listening to the world)
- **Brain** → Processing services (thinking/responding)
- **Mouth** → Output services (communicating back)
- **More** coming soon?

**🔀 Replaceability**

Each part is **independent** and **replaceable**. For example, you can swap out one "Ear" for another without touching
the Brain or Mouth.

**💡 Independence:**

All services are designed to run on their own without depending on specific others. They may sit idle if no messages
arrive, but they won’t crash just because another service isn’t running.
The only exception: everything requires the Backbone (RabbitMQ) to be up for communication.

--- 

# 🥔 Basic Potato (MVP)

The current MVP Potato runs with:

- Heartbeat Ear
- Echo Brain
- Console Out Mouth

This setup demonstrates the full cycle (input → process → output).
See the [services](../services/README.md) for more details on each part.

---

# ⚡ Quick Start

Clone the repo and spin up the MVP Potato:

```bash
git clone https://github.com/JoeRittiner/Potato.git
cd Potato
cp .env.example .env
# Edit .env file as needed
docker-compose up
```

You should see heartbeat messages appear in the console, passed from Ear → Brain → Mouth.

---

# 🚀 Next Steps / Ideas

- More Ears (Voice input, GUI, Flask)
- Smarter Brains (OpenAI APIs, Docker Model Runner)
- Richer Mouths (GUI, Text-to-Speech)
- Discord Bot (Ear + Mouth)

---

# 📚 Documentation

Check out the [docs](https://joerittiner.github.io/Potato/) for more details.

---

# ℹ️ Note

This is a **toy project**. Mainly a sandbox for me to learn Docker, RabbitMQ, and service-based design. As well as other
concepts and technologies. 
