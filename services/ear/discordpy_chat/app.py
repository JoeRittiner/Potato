"""
Discord Chat Ear
================

The Discord Chat Ear is a RMQ Publisher that listens to Discord messages and forwards them to Brain via ``ear_to_brain``.
"""

import os

import pika
from discord import Message, Interaction

from services.ear.abstract_ear import AbstractEar
from services.ear.discordpy_chat.bot import Bot


class DiscordEar(AbstractEar):
    def __init__(self):
        AbstractEar.__init__(self)

        self._bot = Bot(self._on_message)
        self._setup_commands()

        self._listening = False

    def run(self):
        """Start the services discord bot."""
        self._bot.run(os.getenv('DISCORD_TOKEN'))

    def _on_message(self, message: Message):
        """Forward Discord messages to Brain."""
        if self._listening:
            msg = f"Message from {message.author.name}: {message.content}"
            self.publish(msg.encode(), 'ear_to_brain')

    def _setup_commands(self):
        """Setup commands for the bot."""

        @self._bot.tree.command(name="listen", description="Start listening to messages.", guild=self._bot.guild)
        async def listen(interaction: Interaction):
            self._listening = True
            self.logger.info("Listening to messages.")
            await interaction.response.send_message("Listening to messages.")

        @self._bot.tree.command(name="stop", description="Stop listening to messages.", guild=self._bot.guild)
        async def stop(interaction: Interaction):
            self._listening = False
            self.logger.info("Stopping listening to messages.")
            await interaction.response.send_message("Stopped listening to messages.")

    def _setup(self) -> None:
        pass

    def _on_connection_blocked(self, blocked: pika.spec.Connection.Blocked):
        pass

    def _on_connection_unblocked(self, unblocked: pika.spec.Connection.Unblocked):
        pass


def main():
    producer = DiscordEar()
    success = producer.connect()
    if success:
        producer.run()  # Blocking call.


if __name__ == '__main__':
    main()
