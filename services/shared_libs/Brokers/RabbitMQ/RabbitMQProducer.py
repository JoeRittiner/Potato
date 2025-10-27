import json

import pika

from services.shared_libs.Brokers.Producer import Producer
from services.shared_libs.Brokers.RabbitMQ.RabbitMQBroker import RabbitMQBroker


class RabbitMQProducer(RabbitMQBroker, Producer):
    def __init__(self, connection_parameters, exchange):
        RabbitMQBroker.__init__(self, connection_parameters)
        Producer.__init__(self)

        self._exchange = exchange

    def connect(self):
        connected = super().connect()
        if connected:
            self._connection.add_on_connection_blocked_callback(self._on_connection_blocked)
            self._connection.add_on_connection_unblocked_callback(self._on_connection_unblocked)

            self._channel.exchange_declare(
                exchange=self._exchange,
                exchange_type='topic',
                durable=True,
                auto_delete=False
            )
            self.logger.info(f"Topic Exchange `{self._exchange}` declared successfully.")

        return connected

    def send(self, topic: str, message: dict):
        """
        :param topic:
        :param message:
        :return:
        :raises RuntimeError: If the producer is not connected.
        """
        if self._channel is None:
            raise RuntimeError("Producer not connected.")
        self._channel.basic_publish(
            exchange=self._exchange,
            routing_key=topic,
            body=json.dumps(message).encode('utf-8')
        )

    def _on_connection_blocked(self, blocked: pika.spec.Connection.Blocked):
        self.logger.warning(f"Connection blocked: {blocked.reason}")

    def _on_connection_unblocked(self, unblocked: pika.spec.Connection.Unblocked):
        self.logger.info(f"Connection unblocked.")
