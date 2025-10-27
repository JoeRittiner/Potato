from abc import ABC, abstractmethod


class Consumer(ABC):
    @abstractmethod
    def connect(self):
        """Establish connection to the broker."""
        pass

    @abstractmethod
    def consume(self, topic: str):
        """Consume messages from a topic/queue."""
        pass

    @abstractmethod
    def close(self):
        """Close the connection."""
        pass
