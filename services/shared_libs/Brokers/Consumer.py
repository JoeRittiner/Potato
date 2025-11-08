from abc import ABC, abstractmethod
from typing import Generator

from services.shared_libs.Brokers.Broker import Broker
from services.shared_libs.Brokers.Message import Message


class Consumer(Broker, ABC):
    @abstractmethod
    def consume(self, topic: str) -> Generator[Message | None, None, None]:
        """Consume messages from a topic/queue and yield them."""
        pass

    @abstractmethod
    def stop_consuming(self):
        """Stops consuming messages."""
        pass
