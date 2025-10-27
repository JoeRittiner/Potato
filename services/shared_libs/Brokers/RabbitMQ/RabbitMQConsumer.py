from typing import Generator, Tuple, Optional

from pika import BasicProperties
from pika.adapters.blocking_connection import BlockingChannel
from pika.spec import Basic

from services.shared_libs.Brokers.Consumer import Consumer
from services.shared_libs.Brokers.RabbitMQ.RabbitMQBroker import RabbitMQBroker


class RabbitMQConsumer(RabbitMQBroker, Consumer):

    def __init__(
            self,
            connection_parameters,
            exchange: str,
            queue: str,
            exclusive_queue: bool = False,
            inactivity_timeout: Optional[float] = None):
        RabbitMQBroker.__init__(self, connection_parameters)
        Consumer.__init__(self)

        if not isinstance(exchange, str):
            raise TypeError("exchange must be of type str")

        if not isinstance(queue, str):
            raise TypeError("queue must be of type str")

        if not isinstance(exclusive_queue, bool):
            raise TypeError("exclusive_queue must be of type bool")

        if not isinstance(inactivity_timeout, float | None):
            raise TypeError("inactivity_timeout must be of type float or None")
        elif inactivity_timeout is not None and not inactivity_timeout >= 0:
            raise ValueError("inactivity_timeout must be greater than or equal to 0")

        self._exchange = exchange

        self._queue_name = queue
        self._exclusive_queue = exclusive_queue

        self._inactivity_timeout = inactivity_timeout or None
        self._consuming = False

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

    def disconnect(self):
        self.stop_consuming()
        super().disconnect()

    def consume(self, topic) -> Generator[Tuple[BlockingChannel, Basic.Deliver, BasicProperties, bytes], None, None]:
        self._channel.queue_bind(
            queue=self._queue_name,
            exchange=self._exchange,
            routing_key=topic
        )
        self.logger.info(f"Queue `{self._queue_name}` bound to exchange `{self._exchange}` successfully.")

        self._consuming = True
        self.logger.info(f"Consuming messages from queue `{self._queue_name}`.")
        for method, properties, body in self._channel.consume(
            queue=self._queue_name,
            auto_ack=False,
            exclusive=self._exclusive_queue,
                inactivity_timeout=self._inactivity_timeout
        ):
            yield self._channel, method, properties, body

    def stop_consuming(self):
        if self._channel and self._consuming:
            self.logger.info("Stopping consumption.")
            self._channel.cancel()
        elif not self._consuming:
            self.logger.debug("Not consuming messages.")
        self._consuming = False


    def __del__(self):
        self.stop_consuming()
        super().__del__()
