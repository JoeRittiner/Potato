import pika
from pika.adapters.blocking_connection import BlockingChannel
from pika.exceptions import AMQPConnectionError

from services.shared_libs.Brokers.Broker import Broker


class RabbitMQBroker(Broker):
    """
    A class for interacting with RabbitMQ.

    Meant to be subclassed.
    """

    def __init__(self, connection_parameters: pika.ConnectionParameters):

        if not isinstance(connection_parameters, pika.ConnectionParameters):
            raise TypeError("connection_parameters must be a pika.ConnectionParameters object.")

        super().__init__()

        self._connection: pika.BlockingConnection | None = None  # TCP connection
        self._channel: BlockingChannel | None = None  #

        self._connection_parameters = connection_parameters

        self._host = connection_parameters.host
        self._port = connection_parameters.port

    @property
    def ready(self):
        return self._connection and self._connection.is_open and self._channel and self._channel.is_open

    def connect(self):
        # Establish connection with RabbitMQ server
        self.logger.info(f"Attempting to connect to RabbitMQ at {self._host}:{self._port}...")
        try:
            self._connection = pika.BlockingConnection(self._connection_parameters)
            self._channel = self._connection.channel()
            self.logger.info("Connected to RabbitMQ successfully")
            return True  # Exit if connection is successful
        except AMQPConnectionError as e:
            self.logger.error(
                f"Failed to connect to RabbitMQ after {self._connection_parameters.connection_attempts} attempts."
            )
            return False
        except Exception as e:
            self.logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise e

    def disconnect(self):
        self.logger.info("Closing RabbitMQ connection.")
        if self._channel and self._channel.is_open:
            self._channel.close()
            self.logger.debug("Channel closed.")
        else:
            self.logger.debug("Channel already closed.")
        if self._connection and self._connection.is_open:
            self._connection.close()
            self.logger.debug("Connection closed.")
        else:
            self.logger.debug("Connection already closed.")
        self.logger.info("Disconnected from RabbitMQ successfully.")

    def __del__(self):
        self.logger.debug("Deleting RabbitMQ instance.")
        if self.ready:
            try:
                self.disconnect()
            except AMQPConnectionError as e:
                self.logger.error(f"Failed to disconnect from RabbitMQ: {e}")
        else:
            self.logger.debug("RabbitMQ connection is already closed.")
