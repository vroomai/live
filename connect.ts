#!/usr/bin/env deno --unstable-net run --allow-all
const abletonPort = 11000;
const localOscPort = 11001;
const webSocketServerPort = 3000;

let webSocket: WebSocket | undefined;

const udpSocket = Deno.listenDatagram({ port: localOscPort, transport: "udp" });

const headers = new Headers({
	"Access-Control-Allow-Origin": "https://live.vroomai.com"
})

Deno.serve({
	port: webSocketServerPort,
	hostname: "0.0.0.0",
}, (req) => {
	if (req.headers.get("upgrade") != "websocket") {
		return new Response(null, { status: 501, headers });
	}

	const { socket: _socket, response } = Deno.upgradeWebSocket(req);

	webSocket = _socket;

	webSocket.addEventListener("message", (event) => {
		const data = event.data;

		console.log(data);

		if (!(data instanceof ArrayBuffer)) {
			throw new Error("Data from WebSocket not ArrayBuffer.");
		}

		udpSocket.send(new Uint8Array(data), {
			transport: "udp",
			hostname: "127.0.0.1",
			port: abletonPort,
		});
	});

	return response;
});

(async () => {
	for await (const [data] of udpSocket) {
		if (webSocket === undefined) {
			console.warn("Recieved OSC data but no WebSocket connected.");
			continue;
		}

		webSocket.send(data);
	}
})();
