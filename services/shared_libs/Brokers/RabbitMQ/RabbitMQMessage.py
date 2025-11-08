from pika.adapters.blocking_connection import BlockingChannel
from pika.spec import Basic, BasicProperties

from services.shared_libs.Brokers import Message


# Excessive Abstraction?
class RabbitMQMessage(Message):
    """
    RabbitMQMessage
    =============

    RabbitMQMessage is a message that is received from a RabbitMQ server.

    :param body: The message body (bytes).
    :param properties: The message properties.
    :param channel: The channel object.
    :param method: The delivery method frame.
    """
    channel: BlockingChannel
    method: Basic.Deliver

    def __init__(self, channel: BlockingChannel, method: Basic.Deliver, properties: BasicProperties, body: bytes):
        # `BasicProperties` doesn't have an `as_dict()` method.
        properties_dict = {k: v for k, v in properties.__dict__.items() if v}
        super().__init__(body=body, properties=properties_dict)
        self.channel = channel
        self.method = method

    def mark_processed(self):
        self.channel.basic_ack(self.method.delivery_tag)

    def mark_failed(self, requeue=True):
        self.channel.basic_nack(self.method.delivery_tag, requeue=requeue)
