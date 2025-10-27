from abc import ABC, abstractmethod
from typing import Generator

from services.shared_libs.Brokers.Broker import Broker


class Consumer(Broker, ABC):
    @abstractmethod
    def consume(self, topic: str) -> Generator:
        """Consume messages from a topic/queue and yield them."""
        pass
