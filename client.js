const { createConnection } = require('node:net');
const { open } = require('node:fs/promises');
const { basename } = require('node:path');

const clearLine = (dir) => {
	return new Promise((res, rej) => {
		process.stdout.clearLine(dir, () => {
			res();
		});
	});
};

const moveCursor = (dx, dy) => {
	return new Promise((res, rej) => {
		process.stdout.moveCursor(dx, dy, () => {
			res();
		});
	});
};

const socket = createConnection(3005, '127.0.0.1', async () => {
	console.log('Connected to upload server\n');

	if (process.argv.length < 3) {
		console.log('Add a file');
		socket.end();
		return;
	} else {
		const fileName = basename(process.argv[2]);
		socket.write(`file-name: ${fileName}`);

		const readFileHandle = await open(
			'../../node-stream-module/notes.txt',
			'r'
		);
		const readStream = readFileHandle.createReadStream();
		const fileSize = (await readFileHandle.stat()).size;
		let bytesUploaded = 0;

		readStream.on('data', async (chunk) => {
			if (!socket.write(chunk)) {
				readStream.pause();
			}

			bytesUploaded += chunk.length;
			const progressCount = Math.floor((bytesUploaded / fileSize) * 100);

			await moveCursor(0, -1);
			await clearLine(0);
			console.log(`Uploading... ${progressCount}%`);
		});

		socket.on('drain', () => {
			readStream.resume();
		});

		readStream.on('end', () => {
			console.log('Upload successful');
			socket.end();
		});
	}
}).on('error', () => {
	console.log('Connection terminated');
});
