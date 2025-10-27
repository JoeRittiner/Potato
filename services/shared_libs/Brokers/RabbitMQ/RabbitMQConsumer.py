from typing import Callable

from services.shared_libs.Brokers.Consumer import Consumer
from services.shared_libs.Brokers.RabbitMQ.RabbitMQBroker import RabbitMQBroker


class RabbitMQConsumer(RabbitMQBroker, Consumer):

    def __init__(
            self,
            connection_parameters,
            exchange: str,
            queue: str,
            callback: Callable,
            exclusive_queue: bool = False,
            name: str = None):
        RabbitMQBroker.__init__(self, connection_parameters)
        Consumer.__init__(self)

        if not isinstance(exchange, str):
            raise TypeError("exchange must be of type str")

        if not isinstance(queue, str):
            raise TypeError("queue must be of type str")

        if not isinstance(exclusive_queue, bool):
            raise TypeError("exclusive_queue must be of type bool")

        if not callable(callback):
            raise TypeError("callback must be a callable function")

        self._exchange = exchange

        self._queue_name = queue
        self._exclusive_queue = exclusive_queue

        self._callback = callback

        self._consumer_tag = name or __class__.__name__

    def connect(self):
        connected = super().connect()
        if connected:
            self._channel.exchange_declare(
                exchange=self._exchange,
                exchange_type='topic',
                durable=True,
                auto_delete=False
            )
            self.logger.info(f"Topic Exchange `{self._exchange}` declared successfully.")

            self._channel.queue_declare(
                queue=self._queue_name,
                durable=True,
                exclusive=self._exclusive_queue,
                auto_delete=False
            )
            self.logger.info(f"Queue `{self._queue_name}` declared successfully.")
        return connected

    def consume(self, topic):
        self._channel.queue_bind(
            queue=self._queue_name,
            exchange=self._exchange,
            routing_key=topic
        )
        self.logger.info(f"Queue `{self._queue_name}` bound to exchange `{self._exchange}` successfully.")

        self._consumer_tag = self._channel.basic_consume(
            queue=self._queue_name,
            auto_ack=False,
            on_message_callback=self._callback,
            exclusive=self._exclusive_queue,
            consumer_tag=self._consumer_tag
        )

        self._channel.start_consuming()

    def stop_consuming(self):
        if self._consumer_tag:
            un_acknowledged = self._channel.basic_cancel(self._consumer_tag)
            self.logger.info(f"Stopped consuming messages from queue `{self._queue_name}`.")
            self._consumer_tag = None

            if un_acknowledged:
                self._handle_unacknowledged_messages(un_acknowledged)

    # TODO: Handle unacknowledged messages better.
    def _handle_unacknowledged_messages(self, un_acknowledged):
        for ch, method, properties, body in un_acknowledged:
            self.logger.info(f"Unacknowledged message: {body}")
            ch.basic_ack(delivery_tag=method.delivery_tag)

    def __del__(self):
        self.stop_consuming()
        super().__del__()
