from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Generator, Any, Dict

from services.shared_libs.Brokers.Broker import Broker


@dataclass
class Message(ABC):
    body: bytes
    properties: Dict[str, Any]

    @abstractmethod
    def mark_processed(self) -> None:
        """Mark message as successfully processed."""
        pass

    @abstractmethod
    def mark_failed(self, requeue: bool = True) -> None:
        """Mark message as failed (optionally requeue)."""
        pass


class Consumer(Broker, ABC):
    @abstractmethod
    def consume(self, topic: str) -> Generator[Message | None, None, None]:
        """Consume messages from a topic/queue and yield them."""
        pass
