from abc import ABC, abstractmethod


class AsyncProducer(ABC):
    @abstractmethod
    async def connect(self):
        """Establish connection to the broker asynchronously."""
        pass

    @abstractmethod
    async def send(self, topic: str, message: dict):
        """Send a message to a topic/queue asynchronously."""
        pass

    @abstractmethod
    async def close(self):
        """Close the connection asynchronously."""
        pass
