from abc import ABC, abstractmethod

from services.shared_libs.logging_config import setup_logging


class Broker(ABC):
    def __init__(self):
        self.logger = setup_logging(service_name=self.__class__.__name__)

    @abstractmethod
    def connect(self) -> bool:
        """
        Establish connection to the broker.

        :returns: True if connection was successful, False otherwise.
        """
        pass

    @abstractmethod
    def disconnect(self):
        """Close the connection."""
        pass

    @abstractmethod
    def shutdown(self):
        """Close the connection and clean up resources."""
        pass

    @abstractmethod
    def __del__(self):
        """Close and clean up resources."""
        pass
