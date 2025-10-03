const { EndBehaviorType } = require('@discordjs/voice');
const { PassThrough } = require('stream');
const { createWriteStream, rename, unlink, mkdirSync } = require('fs');
const net = require('net');
const prism = require('prism-media');

module.exports = {
    setupReceiver,
}

async function setupReceiver(connection, channel, guild) {

    console.log(`[LISTEN] Setting up receiver for ${guild.name} in channel ${channel.name}`);
    const receiver = connection.receiver;

    receiver.speaking.on('start', async (userId) => {
        try {
            const user = await guild.members.fetch(userId);
            console.log(`[LISTEN] ${user.user.username} started speaking`);

            const requiredRole = '1235283710438277160'; // TODO: Make configurable
            const hasRequiredRole = user.roles.cache.has(requiredRole);

            if (!hasRequiredRole) {
                console.log(`[LISTEN] ${user.user.username} does not have required role to be recorded.`);
                return null;
            } else {
                await createListeningStream(receiver, user);
            }

        } catch (error) {
            console.warn('[LISTEN] Error setting up listening stream:', error);
        }
    });

    receiver.speaking.on('end', async (userId) => {
        console.log(`[LISTEN] ${userId} stopped speaking`);
    });

    console.log('[LISTEN] Receiver set up');
    return receiver;
}


async function createListeningStream(receiver, user) {
    const opusStream = receiver.subscribe(
        user.id,
        {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 1000,  // TODO: Make configurable
            }
        }
    );

    const pcmStream = new prism.opus.Decoder({
        channels: 2,    // Stereo
        format: 'pcm',  // PCM Output Format
        rate: 48000,    // 48kHz sample rate
        sampleSize: 16, // 16-bit samples
        frameSize: 960, // 20ms frames
    });

    const timestamp = Date.now();
    const username = user.user.username;  // toLowerCase() ?
    const tempFilename = `./recordings/tmp/${timestamp}.${username}.pcm`;
    const finalFilename = `./recordings/${timestamp}.${username}.pcm`;

    mkdirSync('./recordings/tmp', { recursive: true }); // Create tmp directory if it doesn't exist
    let backupRequired = false;
    const backupFile = createWriteStream(tempFilename);
    const teeStream = new PassThrough();  // Duplicate Stream

    // Connect to transcriber TCP server (running in another container)
    const socket = net.createConnection({
        // TODO: Make configurable
        host: 'host.docker.internal',
        port: 5001
    }, () => {
        console.log(`[LISTEN] Connected to transcriber TCP server for ${user.user.tag}`);
    })

    // Pipe to PCM decoder, then tee stream
    opusStream.pipe(pcmStream).pipe(teeStream);

    // Pipe to TCP socket and backup file
    teeStream.pipe(socket);
    teeStream.pipe(backupFile);

    socket.on('end', () => {
        console.log(`[LISTEN] Finished streaming to transcriber. (on end)`);
    });
    socket.on('error', (error) => {
        console.error(`[LISTEN] Error streaming to transcriber: ${error}`);
        backupRequired = true;
    });

    backupFile.on('finish', () => {
        if (backupRequired) {
            rename(tempFilename, finalFilename, (err) => {
                if (err) {
                    console.error(`[LISTEN] Error renaming file: ${err}`);
                } else {
                    console.log(`[LISTEN] Backup saved to ${finalFilename}`)
                }
            });
        } else {
            unlink(tempFilename, (err) => {
                if (err) {
                    console.error(`[LISTEN] Error removing file: ${err}`);
                } else {
                    console.log(`[LISTEN] Temp file removed: ${tempFilename}`);
                }
            });
        }
    });
    backupFile.on('error', (error) => {
        console.error(`[LISTEN] Error writing to backup file: ${error}`);
    });
}