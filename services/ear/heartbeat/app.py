import time

from services.ear.abstract_ear import AbstractEar
from services.shared_libs import HealthCheckFlask
from services.shared_libs.HealthCheck import HEALTHCHECK_SERVER_PORT
from services.shared_libs.RabbitMQ import RMQ_HOST, RMQ_PORT


class HeartbeatEar(AbstractEar):
    def __init__(self, rmq_host=RMQ_HOST, rmq_port=RMQ_PORT, health_port=HEALTHCHECK_SERVER_PORT):
        AbstractEar.__init__(self, rmq_host, rmq_port)
        self.health = HealthCheckFlask(health_port)
        self._setup()

    def _setup(self):
        pass

    def start_listening(self):
        try:
            i = 0
            while True:
                i += 1
                user_input = f"Message Nr.{i}"
                message = user_input.encode()
                self.publish(message, 'ear_to_brain')
                print(f" [x] Ear sent '{user_input}' to Brain")
                time.sleep(1)
        except KeyboardInterrupt:
            pass

    def _on_connection_blocked(self, blocked):
        self.logger.warning(f"Connection blocked: {blocked.reason}")

    def _on_connection_unblocked(self, unblocked):
        self.logger.info(f"Connection unblocked.")


def main():
    producer = HeartbeatEar(RMQ_HOST, RMQ_PORT, HEALTHCHECK_SERVER_PORT)
    success = producer.connect()
    if success:
        producer.health.ready = True
        producer.start_listening()


if __name__ == '__main__':
    main()
