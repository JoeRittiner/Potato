import logging
import socket
import wave
from typing import Optional

from pydub import AudioSegment

SAMPLE = "sample.wav"

# Audio parameters
TARGET_RATE = 48000
SAMPLE_WIDTH = 2  # bytes (16-bit PCM)
MONO = 1
STEREO = 2

HOST = "127.0.0.0"
PORT = 50007

logging.basicConfig(level=logging.DEBUG)


class AudioOutClient:
    def __init__(self, forward_host, forward_port):

        self.logger = logging.getLogger("TTSMouth")

        self._forward_host = forward_host
        self._forward_port = forward_port
        self._sock: Optional[socket.socket] = None

    def _connect(self) -> None:
        """Open a socket connection to the forward server if not already connected."""
        if self._sock is not None:
            return
        try:
            self._sock = socket.create_connection((self._forward_host, self._forward_port), timeout=5)
            self.logger.info("Connected to forward server %s:%s", self._forward_host, self._forward_port)
        except Exception:
            self.logger.exception("Failed to connect to forward server %s:%s", self._forward_host, self._forward_port)
            self._sock = None

    def _disconnect(self) -> None:
        """Close the socket and mark it as disconnected."""
        if self._sock is None:
            return
        try:
            self._sock.close()
            self.logger.info("Socket to forward server closed")
        except Exception:
            self.logger.exception("Error while closing socket")
        finally:
            self._sock = None

    def _send_audio_segment(self, segment: AudioSegment) -> None:
        if not segment: return

        try:
            # Resample and convert to stereo
            stereo = segment.set_frame_rate(TARGET_RATE).set_channels(STEREO)

            raw = stereo.raw_data

            # Ensure socket is connected
            if self._sock is None:
                self._connect()

            if self._sock:
                try:
                    self._sock.sendall(raw)
                except BrokenPipeError:
                    self.logger.warning("Socket broken pipe while sending audio; disconnecting")
                    self._disconnect()
                except Exception:
                    self.logger.exception("Unexpected error when sending audio chunk")
            else:
                self.logger.warning("No socket connection available; dropping audio chunk")

        except Exception:
            self.logger.exception("Error converting/sending audio chunk")

    def send_audio(self, chunk_size=4096):
        with wave.open(SAMPLE, 'rb') as wf:
            sample_width = wf.getsampwidth()
            channels = wf.getnchannels()
            framerate = wf.getframerate()

            print(f"Channels: {channels}, Sample width: {sample_width} bytes, Framerate: {framerate} Hz")

            # Read and yield fixed-size chunks
            while True:
                data = wf.readframes(chunk_size)
                if not data:
                    break

                # Convert raw mono PCM to AudioSegment to resample
                segment = AudioSegment(
                    data=data, sample_width=sample_width, frame_rate=framerate, channels=channels
                )

                self._send_audio_segment(segment)


def main():
    mouth = AudioOutClient(HOST, PORT)
    mouth.send_audio()


if __name__ == '__main__':
    main()
