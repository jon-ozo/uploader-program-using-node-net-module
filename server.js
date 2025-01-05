const { createServer } = require('node:net');
const { open } = require('node:fs/promises');
const { join } = require('node:path');

const PORT = 3005;
const server = createServer();

server.on('connection', (socket) => {
	let writeFileHandle, writeFileStream, fileName;
	console.log('New client connection');

	socket.on('data', async (chunk) => {
		if (chunk.toString('utf-8').includes('file-name')) {
			fileName = chunk.toString('utf-8').slice(11);
		} else {
			if (!writeFileHandle) {
				socket.pause();

				writeFileHandle = await open(join(__dirname, 'uploads', fileName), 'w');
				writeFileStream = writeFileHandle.createWriteStream();
				writeFileStream.write(chunk);

				writeFileStream.on('drain', () => {
					socket.resume();
				});
			} else {
				if (!writeFileStream.write(chunk)) {
					socket.pause();
				}
			}
		}
	});

	socket.on('end', () => {
		if (!writeFileHandle) {
			console.log('Connection closed');
			return;
		}

		writeFileHandle.close();
		writeFileHandle = null;
		writeFileStream = null;

		console.log('Connection closed');
	});

	const handleClientLeave = () => console.log('Client connection terminated');

	socket.on('close', handleClientLeave);
	socket.on('error', handleClientLeave);
});

const handleServerLeave = () =>
	console.log('Something went wrong. Server went down');

server.on('close', handleServerLeave);
server.on('error', handleServerLeave);

server.listen(PORT, '127.0.0.1', () =>
	console.log('Lstening on ', server.address())
);
