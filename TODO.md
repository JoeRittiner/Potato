# 📌 TODO

- [x] Abstract [`Producer`](services/shared_libs/Brokers/Producer.py) and [
  `Consumer`](services/shared_libs/Brokers/Consumer.py) classes (interfaces)
    -  [ ] Make RabbitMQProducer and RabbitMQConsumer inherit from these abstract classes
- [ ] Inject producer/ consumer into services
    - Services shouldn't be subclasses of producer/consumer
