"""
Discord Chat Bot
================

Discord Chat Bot is a simple Discord bot that listens to messages and passes them to ``on_message``.
"""
import os
from typing import Callable

from discord import Client, app_commands, Object, Message, Intents

from services.shared_libs.logging_config import setup_logging


class Bot(Client):
    """
    Simple Discord bot.

    :param on_message: Callback function to handle messages.
    """

    def __init__(self, on_message: Callable[[Message], None]):
        intents = Intents.default()
        intents.message_content = True
        super().__init__(intents=intents)

        self._logger = setup_logging(self.__class__.__name__)

        self.tree = app_commands.CommandTree(self)
        self.guild = Object(id=os.getenv('DISCORD_GUILD_ID'))

        self._on_message = on_message

    async def on_ready(self):
        """Handle when the bot is ready."""
        self._logger.info(f'Logged in as {self.user} (ID: {self.user.id})')

        try:
            synced = await self.tree.sync(guild=self.guild)
            self._logger.info(f'Synced {len(synced)} commands to guild {self.guild.id}')
        except Exception as e:
            self._logger.error(f'Error syncing commands: {e}')

    async def on_message(self, message: Message):
        """Handle Discord messages."""
        if message.author == self.user:
            return
        elif message.author.bot:
            return
        self._on_message(message)
