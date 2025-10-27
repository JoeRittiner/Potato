# 📌 TODO

- [ ] Abstract [`Producer`](services/shared_libs/Broker/Producer.py) and [
  `Consumer`](services/shared_libs/Broker/Consumer.py) classes (interfaces)
    -  [ ] Make RabbitMQProducer and RabbitMQConsumer inherit from these abstract classes
- [ ] Inject producer/ consumer into services
    - Services shouldn't be subclasses of producer/consumer
