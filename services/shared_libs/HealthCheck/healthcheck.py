"""
Health check script for Docker containers

This script checks the health of a Docker container by connecting to a RabbitMQ broker and
publishing a message to a temporary queue.
It also checks the status of a server running on port 5000.
"""
import os
import sys

import pika
import requests
from pika.exceptions import AMQPConnectionError, AMQPChannelError

RMQ_HOST = os.getenv('RMQ_HOST', 'localhost')
RMQ_PORT = int(os.getenv('RMQ_PORT', 5672))
HEALTHCHECK_QUEUE = 'healthcheck_queue_temp'  # A temporary queue for health checks
SERVER_PORT = os.getenv('HEALTHCHECK_SERVER_PORT', 5000)


def check_rabbitmq_connection(n, m):
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters(
            host=RMQ_HOST,
            port=RMQ_PORT,
            heartbeat=60,
            blocked_connection_timeout=5  # Short timeout for the connection attempt itself
        ))
        channel = connection.channel()

        # Declare a temporary queue (auto-delete after consumer disconnects)
        channel.queue_declare(queue=HEALTHCHECK_QUEUE, auto_delete=True)

        # Try to publish a message
        channel.basic_publish(
            exchange='',
            routing_key=HEALTHCHECK_QUEUE,
            body=b'health_check_ping'
        )
        print(f"[{n}/{m}] Health check successful: Connected to RabbitMQ and published to '{HEALTHCHECK_QUEUE}'.")

        connection.close()
        return
    except AMQPConnectionError as e:
        print(f"[{n}/{m}] Health check failed: Could not connect to RabbitMQ. Error: {e}", file=sys.stderr)
        sys.exit(1)  # Unhealthy
    except AMQPChannelError as e:
        print(f"[{n}/{m}] Health check failed: AMQP Channel Error (e.g., permissions). Error: {e}", file=sys.stderr)
        sys.exit(1)  # Unhealthy
    except Exception as e:
        print(f"[{n}/{m}] Health check failed: An unexpected error occurred. Error: {e}", file=sys.stderr)
        sys.exit(1)  # Unhealthy


def check_server_status(n, m):
    try:
        response = requests.get(f'http://localhost:{SERVER_PORT}/health')
        if response.status_code == 200:
            print(f"[{n}/{m}] Health check successful: Server is healthy.")
            return  # Healthy
        elif response.status_code == 503:
            print(f"[{n}/{m}] Health check failed: Server is unhealthy.")
            sys.exit(1)  # Unhealthy
        else:
            print(
                f"[{n}/{m}] Health check failed: Unexpected response from server. Status code: {response.status_code}")
            sys.exit(1)  # Unhealthy

    except Exception as e:
        print(f"[{n}/{m}] Health check failed: An unexpected error occurred. Error: {e}", file=sys.stderr)
        sys.exit(1)  # Unhealthy


def main():
    check_rabbitmq_connection(1, 2)
    check_server_status(2, 2)
    sys.exit(0)  # Healthy


if __name__ == '__main__':
    main()
