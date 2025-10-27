from abc import ABC, abstractmethod

from services.shared_libs.Brokers.Broker import Broker


class Producer(Broker, ABC):
    @abstractmethod
    def send(self, topic: str, message: dict):
        """Send a message to a topic/queue."""
        pass
