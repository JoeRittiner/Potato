import sys

from pika import BasicProperties
from pika.channel import Channel
from pika.spec import Basic

from services.brain.abstract_brain import AbstractBrain
from services.shared_libs.RabbitMQ import RMQ_HOST, RMQ_PORT


class EchoBrain(AbstractBrain):
    def _setup(self):
        pass

    def _callback(self, ch: Channel, method: Basic.Deliver, properties: BasicProperties, body: bytes) -> None:
        received_text = body.decode()
        print(f" [x] Brain received '{received_text}'")

        processed_text = f"Brain echoed: {received_text}"  # Simple echo logic
        self.publish(processed_text.encode(), 'brain_to_mouth', properties=properties)
        print(f" [x] Brain sent '{processed_text}' to Mouth")

        ch.basic_ack(delivery_tag=method.delivery_tag)

    def _handle_unacknowledged_messages(self, un_acknowledged) -> None:
        pass

    def _on_connection_blocked(self, blocked):
        self.logger.warning(f"Connection blocked: {blocked.reason}")

    def _on_connection_unblocked(self, unblocked):
        self.logger.info(f"Connection unblocked.")


def main():
    consumer = EchoBrain('ear_to_brain', RMQ_HOST, RMQ_PORT)
    success = consumer.connect()
    if success:
        print(' [*] Brain waiting for messages. To exit press CTRL+C')
        consumer.consume(auto_ack=False)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('Interrupted')
        try:
            sys.exit(0)
        except SystemExit:
            exit(0)
