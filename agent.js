import { getParameters, getTracksDevices, setParameter } from "./ableton.js";

const functions = [
	{
		name: "get-tracks-devices",
		description: "get all devices of all tracks",
	},
	{
		name: "get-device-params",
		description: "get a specific device's params",
		parameters: {
			type: "object",
			properties: {
				track_id: { type: "number" },
				device_id: { type: "number" },
			},
		},
	},
	{
		name: "set-device-param",
		description: "set a specific device's param",
		parameters: {
			type: "object",
			properties: {
				track_id: { type: "number" },
				device_id: { type: "number" },
				param_id: { type: "number" },
				value: { type: "number" },
			},
		},
	},
];

async function callFunction(function_call) {
	const args = JSON.parse(function_call.arguments);
	switch (function_call.name) {
		case "get-tracks-devices":
			return await getTracksDevices();
		case "get-device-params":
			return await getParameters(args["track_id"], args["device_id"]);
		case "set-device-param":
			return await setParameter(
				args["track_id"],
				args["device_id"],
				args["param_id"],
				args["value"],
			);
		default:
			throw new Error("No function found");
	}
}

export const createAgent =
	({ getMessages, appendMessage, openai }) => async () => {
		while (true) {
			let completion;

			try {
				completion = await openai.chat.completions.create({
					model: "gpt-3.5-turbo-0125",
					messages: getMessages(),
					functions: functions,
				});
			} catch (error) {
				console.error("Error calling OpenAI API:", error);

				alert("Sorry, there was an error processing your request.");
			}

			if (completion.choices[0].message.content) {
				appendMessage({
					role: "assistant",
					content: completion.choices[0].message.content,
				});
			}

			const function_call = completion.choices[0].message.function_call;

			if (!function_call) {
				return;
			}

			const result = await callFunction(function_call);

			appendMessage({
				role: "function",
				name: function_call.name,
				content: JSON.stringify(result),
			});
		}
	};
