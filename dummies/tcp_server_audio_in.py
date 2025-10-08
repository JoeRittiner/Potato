import asyncio
import datetime
import logging
import threading
import wave

OUTPUT = "output/{filename}.wav"

HOST = "0.0.0.0"
PORT = 5001

logging.basicConfig(level=logging.INFO)


class AudioInServer:
    def __init__(self, host, port):

        self.logger = logging.getLogger(__name__)

        self.listen_host = host
        self.listen_port = port

    def start_listening(self):
        asyncio.run(self._run_server())

    def stop_listening(self):
        asyncio.run(self._stop_listening())

    async def _stop_listening(self):
        try:
            self.logger.info("Shutting down...")
            tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
            await asyncio.gather(*tasks, return_exceptions=True)
            self.logger.info("Shutdown complete.")
        except KeyboardInterrupt:
            pass

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
                self.logger.debug(f"Received {len(data)} bytes from {addr}")
                buffer.extend(data)

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
        self.logger.info(f"Received {len(pcm_bytes)} bytes")
        """Writes raw PCM bytes into a .wav file."""
        output_file = OUTPUT.format(filename=datetime.datetime.now().strftime("%Y%m%d%H%M%S"))
        with wave.open(output_file, 'wb') as wf:
            wf.setnchannels(2)
            wf.setsampwidth(2)
            wf.setframerate(48000)
            wf.writeframes(pcm_bytes)


def main():
    ear = AudioInServer(HOST, PORT)
    try:
        ear.start_listening()
    except KeyboardInterrupt:
        ear.logger.info("Interrupted, shutting down.")
        ear.stop_listening()


if __name__ == "__main__":
    main()
