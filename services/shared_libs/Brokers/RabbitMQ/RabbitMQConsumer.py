from typing import Generator, Optional

from pika.adapters.blocking_connection import BlockingChannel
from pika.spec import Basic, BasicProperties

from services.shared_libs.Brokers.Consumer import Consumer, Message
from services.shared_libs.Brokers.RabbitMQ.RabbitMQBroker import RabbitMQBroker


# Excessive Abstraction?
class RabbitMQMessage(Message):
    channel: BlockingChannel
    method: Basic.Deliver

    def __init__(self, channel: BlockingChannel, method: Basic.Deliver, properties: BasicProperties, body: bytes):
        properties = {k: v for k, v in properties.__dict__.items() if v}
        super().__init__(body, properties)
        self.channel = channel
        self.method = method

    def mark_processed(self):
        self.channel.basic_ack(self.method.delivery_tag)

    def mark_failed(self, requeue=True):
        self.channel.basic_nack(self.method.delivery_tag, requeue=requeue)


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

        if not isinstance(inactivity_timeout, int | float | None):
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

    def consume(self, topic) -> Generator[RabbitMQMessage | None, None, None]:
        self._channel.queue_bind(
            queue=self._queue_name,
            exchange=self._exchange,
            routing_key=topic
        )
        self.logger.info(f"Queue `{self._queue_name}` bound to exchange `{self._exchange}` successfully.")

        message_queue = self._channel.consume(
            queue=self._queue_name,
            auto_ack=False,
            exclusive=self._exclusive_queue,
            inactivity_timeout=self._inactivity_timeout
        )

        self._consuming = True
        self.logger.info(f"Consuming messages from queue `{self._queue_name}`.")
        for method, properties, body in message_queue:
            if method is None and properties is None and body is None:
                yield None
            yield RabbitMQMessage(self._channel, method, properties, body)

    def stop_consuming(self):
        if self._channel and self._consuming:
            self.logger.info("Stopping consumption.")
            self._channel.cancel()
        elif not self._consuming:
            self.logger.debug("Not consuming messages.")
        self._consuming = False

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()

    def shutdown(self):
        self.stop_consuming()
        super().shutdown()
