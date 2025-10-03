import asyncio
import threading
import time

import numpy as np
import torch
import torchaudio
import whisper

from services.ear.abstract_ear import AbstractEar
from services.shared_libs.RabbitMQ import RMQ_HOST, RMQ_PORT

# TODO: Make these configurable
SAMPLE_RATE = 48000
CHANNELS = 2
SAMPLE_WIDTH = 2  # 16-bit
CHUNK_SECONDS = 5
CHUNK_BYTES = SAMPLE_RATE * CHANNELS * SAMPLE_WIDTH * CHUNK_SECONDS

LISTEN_HOST = "0.0.0.0"
LISTEN_PORT = 5001


class TcpEar(AbstractEar):
    def __init__(self, host, port, model_size="base", download_root="./whisper", device="cuda"):
        super().__init__(host, port)
        self.listen_host = LISTEN_HOST
        self.listen_port = LISTEN_PORT
        self.model_size = model_size
        if device == "cuda" and not torch.cuda.is_available():
            self.logger.warning("GPU not available. Using CPU.")
            device = "cpu"
        self.device = device
        self.logger.info(f"🚀 Loading Whisper model '{model_size}' on {device.upper()}")
        self.model = whisper.load_model(model_size, device=device, download_root=download_root)
        self.resampler = torchaudio.transforms.Resample(orig_freq=48000, new_freq=16000).to(device)

    def _setup(self):
        pass

    def start_listening(self):
        if not self.connect():
            self.logger.error("Failed to connect to RMQ")
            return
        asyncio.run(self._run_server())

    async def _run_server(self):
        server = await asyncio.start_server(
            self._handle_client, self.listen_host, self.listen_port
        )
        addrs = ", ".join(str(sock.getsockname()) for sock in server.sockets)
        self.logger.info(f"🎙️ Listening on {addrs} (expecting 16-bit LE PCM @48kHz stereo)")
        async with server:
            await server.serve_forever()

    async def _handle_client(self, reader, writer):
        addr = writer.get_extra_info("peername")
        self.logger.info(f"📡 Client connected: {addr}")

        buffer = bytearray()

        try:
            while True:
                data = await reader.read(4096)
                if not data:  # client closed
                    break
                buffer.extend(data)

                # Flush into fixed chunks
                while len(buffer) >= CHUNK_BYTES:
                    chunk = bytes(buffer[:CHUNK_BYTES])
                    buffer = buffer[CHUNK_BYTES:]
                    threading.Thread(
                        target=self._process_chunk, args=(chunk,), daemon=True
                    ).start()

            # Process leftover bytes if any
            if buffer:
                threading.Thread(
                    target=self._process_chunk, args=(bytes(buffer),), daemon=True
                ).start()

        except Exception as e:
            self.logger.exception(f"Error while handling client {addr}: {e}")
        finally:
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass
            self.logger.info(f"👋 Connection closed: {addr}")

    def _process_chunk(self, pcm_bytes: bytes):
        try:

            start_t = time.time()

            # Prep audio in memory
            audio_np = np.frombuffer(pcm_bytes, dtype=np.int16).reshape(-1, 2)
            mono_np = audio_np.mean(axis=1).astype(np.float32) / 32768.0

            # Move data to the same device as the model
            waveform = torch.from_numpy(mono_np).unsqueeze(0).to(self.device)

            # Resample using the pre-initialized resampler
            with torch.no_grad():
                waveform_16k = self.resampler(waveform).squeeze(0).cpu().numpy()

            # Transcribe using Whisper
            self.logger.info("⏳ Transcribing audio...")
            result = self.model.transcribe(
                waveform_16k,
                fp16=(self.device == "cuda"),  # Use fp16 only on CUDA
                language="en"
            )
            text = result.get("text", "").strip()
            self.logger.info(f"📝 Transcription ({(time.time() - start_t):.2f}s): {text[:200]}")

            if text:
                self.publish(text.encode("utf-8"), "ear_to_brain")
                self.logger.info("📤 Published to 'ear_to_brain'")

        except Exception as e:
            self.logger.exception(f"Error in transcription: {e}")

    def _on_connection_blocked(self, blocked):
        self.logger.warning(f"Connection blocked: {blocked.reason}")

    def _on_connection_unblocked(self, unblocked):
        self.logger.info("Connection unblocked.")


def main():
    # TODO: Make model size and device configurable
    ear = TcpEar(RMQ_HOST, RMQ_PORT, model_size="tiny", download_root="./whisper", device="cuda")
    try:
        ear.start_listening()
    except KeyboardInterrupt:
        ear.logger.info("Interrupted, shutting down.")


if __name__ == "__main__":
    main()
