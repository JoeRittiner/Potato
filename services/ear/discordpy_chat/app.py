"""
Discord Chat Ear
================

Discord Chat Ear is a simple Discord bot that listens to messages and forwards them to `ear_to_brain` via RabbitMQ.
"""

import os
from typing import Callable

import pika
from discord import Client, app_commands, Object, Message, Intents, Interaction

from services.ear.abstract_ear import AbstractEar


class Bot(Client):
    """
    Simple Discord bot.

    :param on_message: Callback function to handle messages.
    """

    def __init__(self, on_message: Callable[[Message], None]):
        intents = Intents.default()
        intents.message_content = True
        super().__init__(intents=intents)

        self.tree = app_commands.CommandTree(self)
        self.guild = Object(id=os.getenv('DISCORD_GUILD_ID'))

        self._on_message = on_message

    async def on_ready(self):
        """Handle when the bot is ready."""
        print(f'Logged in as {self.user} (ID: {self.user.id})')

        try:
            synced = await self.tree.sync(guild=self.guild)
            print(f'Synced {len(synced)} commands to guild {self.guild.id}')
        except Exception as e:
            print(f'Error syncing commands: {e}')

    async def on_message(self, message: Message):
        """Handle Discord messages."""
        if message.author == self.user:
            return
        elif message.author.bot:
            return
        self._on_message(message)


class DiscordEar(AbstractEar):
    def __init__(self):
        AbstractEar.__init__(self)

        self._bot = Bot(self._on_message)
        self._setup_commands()

        self._listening = False

    def run(self):
        """Start the discord bot."""
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
