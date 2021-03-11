require('dotenv').config();
const { Client, utils } = require('openrgb-sdk');
const finnhub = require('finnhub');

var price = 0;

async function start() {
	const client = new Client('stonks', 6742, 'localhost');
	await client.connect();

	const kb = await client.getControllerData(0);
	let deviceList = [];

	const controllerCount = await client.getControllerCount();
	for (let deviceId = 0; deviceId < controllerCount; deviceId++) {
		deviceList.push(await client.getControllerData(deviceId));
		client.updateMode(deviceId, 0);
	}

	const loop = async () => {
		const api_key = finnhub.ApiClient.instance.authentications['api_key'];
		api_key.apiKey = process.env.APIKEY;
		const finnhubClient = new finnhub.DefaultApi();

		finnhubClient.quote('GME', async (e, data, res) => {
			if (data) {
				console.log(`New price: ${data.c}\nPrevious price: ${price}\n`);

				for (const i of deviceList) {
					if (data.c >= price) {
						const green = Array(i.colors.length).fill({
							red: 0x00,
							green: 0xff,
							blue: 0x00,
						});
						await client.updateLeds(i.deviceId, green);
					} else {
						const red = Array(i.colors.length).fill({
							red: 0xff,
							green: 0x00,
							blue: 0x00,
						});

						await client.updateLeds(i.deviceId, red);
					}
				}

				price = data.c;
			} else {
				console.log(e, data, res);
			}
		});
	};
	loop();
	setInterval(loop, 5000);
}

start();
