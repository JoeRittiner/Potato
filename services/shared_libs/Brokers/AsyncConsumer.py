from abc import ABC, abstractmethod


class AsyncConsumer(ABC):
    @abstractmethod
    async def connect(self):
        """Establish connection to the broker asynchronously."""
        pass

    @abstractmethod
    async def consume(self, topic: str):
        """Consume messages from a topic/queue asynchronously."""
        pass

    @abstractmethod
    async def close(self):
        """Close the connection asynchronously."""
        pass
