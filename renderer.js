export const createRenderer = ({ getMessages, element }) => () => {
	const renderMessage = (message) => {
		const messageDiv = document.createElement("div");

		if (message.role === "function") {
			if (message.name === "get-tracks-devices") {
				messageDiv.textContent = "⚙ Getting tracks and devices...";
			} else if (message.name === "get-device-params") {
				messageDiv.textContent = "⚙ Getting device params...";
			} else if (message.name === "set-device-param") {
				console.log(message.content.from, message.content.to);
				let device_data = JSON.parse(message.content);

				messageDiv.textContent =
					`⚙ Setting ${device_data.device} (${device_data.param}) from ${device_data.from} to ${device_data.to} ...`;
			}
		} else {
			messageDiv.textContent = message.content;
		}

		const isAssistantMessage = message.role !== "user";
		const isFunctionMessage = message.role === "function";

		Object.assign(messageDiv.style, {
			backgroundColor: isAssistantMessage ? "#F0F0F0" : "#DCF8C6",
		});

		const containerDiv = document.createElement("div");
		containerDiv.appendChild(messageDiv);
		Object.assign(containerDiv.style, {
			justifyContent: isAssistantMessage ? "flex-start" : "flex-end",
		});

		return containerDiv;
	};

	const messages = getMessages();

	const messagesOutput =
		// get all non-system messages
		messages.filter((message) => message.role !== "system")
			// convert to html nodes
			.map(renderMessage)
			// render as html text
			.map((el) => el.outerHTML);

	const lastMessage = messages[messages.length - 1];

	if (typeof lastMessage === "object" && lastMessage.role === "user") {
		messagesOutput.push(`
			<div>
				<div style="background-color: #F0F0F0;">
					<span class="dot"></span>
					<span class="dot"></span>
					<span class="dot"></span>
				</div>
			</div>
		`);
	}

	element.innerHTML = messagesOutput.join("");
	element.scrollTop = element.scrollHeight;
};
