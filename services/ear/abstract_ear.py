from abc import ABC, abstractmethod

from services.shared_libs.Brokers import Producer


class AbstractEar(ABC):
    def __init__(self, producer: Producer):
        self._producer = producer

    @abstractmethod
    def start_listening(self):
        pass

    @abstractmethod
    def stop_listening(self):
        pass

    @abstractmethod
    def shutdown(self):
        pass
