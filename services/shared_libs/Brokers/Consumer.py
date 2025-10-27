from abc import ABC, abstractmethod

from services.shared_libs.Brokers.Broker import Broker


class Consumer(Broker, ABC):
    @abstractmethod
    def consume(self, topic: str):
        """Consume messages from a topic/queue."""
        pass
