# 👂 Ear (Input Services)

Ears handle incoming messages.

Examples:

- [ ] Microphone
- [ ] GUI
- [ ] TCP Socket

### ✅ Heartbeat Ear _(implemented)_

A simple Ear that sends heartbeat messages at regular intervals. See [Ear](./ear/README.md) for more details.

---

# 🧠 Brain (Processing Services)

Brains process input and decide what to send forward.

Examples:

- [ ] LLM APIs
- [ ] Docker Model Runner
- [ ] Rule-based processors

### ✅ Echo Brain _(implemented)_

Returns what it receives (useful for testing). See [Brain](./brain/README.md) for more details.

---

# 👄 Mouth (Output Services)

Mouths handle output to the user.

Examples:

- [ ] GUI
- [ ] Text-to-Speech

### ✅ Console Out Mouth _(implemented)_

Prints the response to the console. See [Mouth](./mouth/README.md) for more details.

---

# ⚪ Template

Check the [template](template/README.md#steps) directory for info on adding a new Service.