# 📡 TCP Transcriber Ear

**TCP Transcriber Ear** is an **Ear** service implementation in Python that uses
the [Whisper](https://github.com/openai/whisper) model to transcribe raw PCM audio streams received over a TCP
connection into text.

This service is designed to work in conjunction with the [Discord Head](https://github.com/yourusername/discord-head)
service, which listens to Discord voice channels.

## Important

Currently, this service expects a raw PCM audio stream without any headers or metadata.