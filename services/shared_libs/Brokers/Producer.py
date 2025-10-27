from abc import ABC, abstractmethod


class Producer(ABC):
    @abstractmethod
    def connect(self):
        """Establish connection to the broker."""
        pass

    @abstractmethod
    def send(self, topic: str, message: dict):
        """Send a message to a topic/queue."""
        pass

    @abstractmethod
    def close(self):
        """Close the connection."""
        pass
