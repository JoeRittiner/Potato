import signal
import sys
from abc import ABC, abstractmethod


class Service(ABC):
    """Base Service class for handling shutdown signals."""

    def __init__(self):
        # Register the handler for SIGINT (Ctrl+C)
        signal.signal(signal.SIGINT, self._signal_handler)
        # Register the handler for SIGTERM (standard termination)
        signal.signal(signal.SIGTERM, self._signal_handler)

    @abstractmethod
    def shutdown(self):
        """Shut down the Service and prepare for script exit."""
        pass

    def _signal_handler(self, sig, frame):
        """Handle shutdown signals."""
        try:
            self.shutdown()
            sys.exit(0)
        except Exception as e:
            message = f"Failed to shut down service: {e}"
            print(message, file=sys.stderr)

            sys.exit(1)
