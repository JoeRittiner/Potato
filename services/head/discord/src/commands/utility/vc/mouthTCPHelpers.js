const { createAudioResource, createAudioPlayer, AudioPlayerStatus, VoiceConnection, StreamType } = require('@discordjs/voice');
const net = require('net');
const { PassThrough } = require('stream');

module.exports = {
    setupServer,
    teardownServer
}

/**
 * Establishes a TCP server to receive an audio stream and play it back in a voice channel.
 * @param {VoiceConnection} connection 
 * @returns {net.Server} The created TCP server instance.
 */
async function setupServer(connection) {
    console.log('Setting up mouth TCP server...');
    
    const server = net.createServer((socket) => {
        console.log("[STREAM_BACK] 📡 Got incoming audio stream");

        socket.on('drain', () => {
            console.log("[STREAM_BACK] Socket drained, ready to receive more data");
        });
        socket.on('error', (err) => {
            console.error("[STREAM_BACK] Socket error:", err);
        });
        socket.on('data', (data) => {
            console.log("[STREAM_BACK] Received data chunk of size:", data.length);
        });

        const passThrough = new PassThrough();
        socket.pipe(passThrough); //  Redirect socket to buffer

        const ressource = createAudioResource(passThrough, {
            inputType: StreamType.Raw  // Assuming raw PCM 48kHz stereo
        });

        const player = createAudioPlayer();
        player.play(ressource);
        connection.subscribe(player);

        player.on('error', error => {
            console.error('Error in audio player:', error);
        });
        player.on(AudioPlayerStatus.Playing, () => { // on or once?
            console.log('[STREAM_BACK] 🔊 Now streaming audio');
        });
    });

    server.listen(50007, '0.0.0.0', () => {   // TODO make host:port configurable
        console.log(`Mouth TCP server listening on port ${50007}`);
    });
    server.on('connection', (socket) => {
        console.log('New client connected to mouth TCP server');
        console.log('Client address:', socket.remoteAddress, 'Client port:', socket.remotePort);
    });
    server.on('error', (err) => {
        console.error('Server error:', err);
    });
    return server;
}

/**
 * 
 * @param {net.Server} server 
 */
async function teardownServer(server) {
    console.log('Tearing down mouth TCP server...');

    server.close(() => {
        console.log('Mouth TCP server closed.');
    });
    
}