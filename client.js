const { createConnection } = require('node:net');
const { open } = require('node:fs/promises');

const socket = createConnection(3005, '127.0.0.1', async () => {
	console.log('Connected to upload server');

	const readFileHandle = await open('../../streams/notes.txt', 'r');
	const readStream = readFileHandle.createReadStream();

	readStream.on('data', (chunk) => {
		if (!socket.write(chunk)) {
			readStream.pause();
		}
	});

	socket.on('drain', () => {
		readStream.resume();
	});

	readStream.on('end', () => {
		console.log('Upload successful');
		socket.end();
	});
}).on('error', () => {
	console.log('Could not connect to the server. Try again');
});
