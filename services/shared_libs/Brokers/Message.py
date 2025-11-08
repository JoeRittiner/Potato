from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class Message(ABC):
    """
    Message
    =======

    Message is an abstract base class for messages.

    :param body: The message body. (bytes)
    :param properties: The message properties.
    """
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
