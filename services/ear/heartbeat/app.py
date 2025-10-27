import time

from services.ear.abstract_ear import AbstractEar


class HeartbeatEar(AbstractEar):
    def __init__(self, producer, exchange):
        super().__init__(producer)

        self._exchange = exchange

        self._listening = False

    def start_listening(self):
        self._listening = True
        i = 0
        with self._producer as p:
            while self._listening:
                i += 1
                user_input = f"Message Nr.{i}"
                p.send(self._exchange, {"message": user_input})
                print(f" [x] Ear sent '{user_input}' to `{self._exchange}`")
                time.sleep(5)

    def stop_listening(self):
        self._listening = False

    def shutdown(self):
        self.stop_listening()
        self._producer.shutdown()


def main():
    import os

    from services.shared_libs.Brokers import RabbitMQProducer
    from pika import ConnectionParameters, PlainCredentials

    producer = RabbitMQProducer(
        ConnectionParameters(
            host=os.getenv('RMQ_HOST', 'localhost'),
            port=int(os.getenv('RMQ_PORT', 5672)),
            credentials=PlainCredentials(
                os.getenv('RMQ_USER', 'guest'),
                os.getenv('RMQ_PASSWORD', 'guest')),
            socket_timeout=5,
            connection_attempts=5,
            retry_delay=5,
            heartbeat=60,
        ),
        exchange='ear_to_brain',
    )
    ear = HeartbeatEar(producer, 'ear_to_brain')
    try:
        ear.start_listening()
    except KeyboardInterrupt:
        ear.stop_listening()
    finally:
        ear.shutdown()


if __name__ == '__main__':
    main()
