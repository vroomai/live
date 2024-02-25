import { createRenderer } from "./renderer.js";
import { createAgent } from "./agent.js";
import { isLive } from "./ableton.js";

document.getElementById("enterChat").addEventListener(
	"click",
	async function () {
		const key = document.getElementById("apiKey").value.trim();

		if (key === "") {
			alert("Please enter a key.");
			return;
		}

		const live = await isLive();
		if (!live) {
			alert(
				"Ableton is not live. Please make sure the ws-udp bridge is open.",
			);
			return;
		}

		const messages = [
			{
				role: "system",
				content:
					"You are a music producer controlling Ableton Live. Use the tools available to respond to the user as best as possible. It's critical you respond in exclusively lower case.",
			},
		];

		document.getElementById("auth-section").style.display = "none";
		document.getElementById("chat-section").style.display = "flex";

		const renderMessages = createRenderer({
			getMessages: () => messages,
			element: document.querySelector("#messages"),
		});

		const runAgent = createAgent({
			getMessages: () => messages,
			appendMessage: (message) => {
				messages.push(message);
				renderMessages();
			},
			openai: new OpenAI({
				apiKey: key,
				dangerouslyAllowBrowser: true,
			}),
		});

		async function sendMessage() {
			const content = $messageInput.value.trim();
			$messageInput.value = "";

			if (!content) return;

			messages.push({
				role: "user",
				content,
			});

			renderMessages();

			await runAgent();
		}

		const $messageInput = document.getElementById("messageInput");

		// allow enter

		$messageInput.addEventListener("keydown", async (event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				await sendMessage();
			}
		});
	},
);
