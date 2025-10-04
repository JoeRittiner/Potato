const { EndBehaviorType } = require('@discordjs/voice');
const { PassThrough } = require('stream');
const { createWriteStream, rename, unlink, mkdirSync } = require('fs');
const net = require('net');
const prism = require('prism-media');
const path = require('path');

module.exports = {
    setupReceiver,
}

const host = process.env.TRANSCRIBER_HOST;
const port = parseInt(process.env.TRANSCRIBER_PORT, 10);

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
                await createListeningStream(receiver, user, host, port);
                console.log(`[LISTEN] ${user.user.username} is being recorded.`);
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


async function createListeningStream(receiver, user, host, port) {
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


    const { backupStream, markBackupRequired } = createBackupStream(user.id, 'pcm', './recordings');
    const teeStream = new PassThrough();  // Duplicate Stream

    // Connect to transcriber TCP server (running in another container)
    const socket = net.createConnection({
        host,
        port
    }, () => {
        console.log(`[LISTEN] Connected to transcriber TCP server for ${user.user.tag}`);
    })

    // Pipe to PCM decoder, then tee stream
    opusStream.pipe(pcmStream).pipe(teeStream);

    // Pipe to TCP socket and backup file
    teeStream.pipe(socket);
    teeStream.pipe(backupStream);

    socket.on('end', () => {
        console.log(`[LISTEN] Finished streaming to transcriber. (on end)`);
    });
    socket.on('error', (error) => {
        console.error(`[LISTEN] Error streaming to transcriber: ${error}`);
        markBackupRequired();
    });
}

function createBackupStream(userId, fileExtension, filePath) {
    const timestamp = Date.now();
    const tempFilename = path.join(filePath, `${timestamp}.${userId}.${fileExtension}.tmp`);
    const finalFilename = path.join(filePath, `${timestamp}.${userId}.${fileExtension}`);
    mkdirSync(filePath, { recursive: true }); // Create directory if not exists
    let backupRequired = false;
    const backupStream = createWriteStream(tempFilename);

    backupStream.on('finish', () => {
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
    backupStream.on('error', (error) => {
        console.error(`[LISTEN] Error writing to backup file: ${error}`);
    });

    return { backupStream, markBackupRequired: () => { backupRequired = true; } };
}