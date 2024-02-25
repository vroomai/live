const sendOSC = (address, params, trimArgs = true) => {
	console.log("sendOSC()", address, params);

	return new Promise((resolve, reject) => {
		const osc = new OSC();
		osc.open({ port: 3000 }); //AbletonOSC default port

		osc.on("open", () => {
			const msg = new OSC.Message(address, ...params);
			osc.send(msg);
		});

		osc.on(address, (message) => {
			console.log(address, message.args);
			resolve(
				trimArgs ? message.args.slice(params.length) : message.args,
			);
			osc.close();
		});

		osc.on("/live/error", (error) => {
			console.error(error);
			reject(error);
			osc.close();
		});
	});
};

export const getTracksDevices = async () => {
	let summary = [];
	const num_tracks = parseInt(await sendOSC("/live/song/get/num_tracks", []));
	const track_data = await sendOSC("/live/song/get/track_data", [
		0,
		num_tracks,
		"track.name",
	], false);

	for (let [track_index, track_name] of track_data.entries()) {
		const track_num_devices = await sendOSC("/live/track/get/num_devices", [
			track_index,
		]);
		if (track_num_devices === 0) {
			continue;
		}
		const track_device_names = await sendOSC(
			"/live/track/get/devices/name",
			[track_index],
		);
		const track_device_classes = await sendOSC(
			"/live/track/get/devices/class_name",
			[track_index],
		);
		let devices = track_device_names.map((name, index) => ({
			id: index,
			name: name,
			class: track_device_classes[index],
		}));
		summary.push({
			track_id: track_index,
			track_name: track_name,
			devices: devices,
		});
	}
	return summary;
};

export const getParameters = async (track_id, device_id) => {
	const names = await sendOSC("/live/device/get/parameters/name", [
		track_id,
		device_id,
	], true);

	const values = await sendOSC("/live/device/get/parameters/value", [
		track_id,
		device_id,
	], true);

	const mins = await sendOSC("/live/device/get/parameters/min", [
		track_id,
		device_id,
	], true);

	const maxes = await sendOSC("/live/device/get/parameters/max", [
		track_id,
		device_id,
	], true);

	return Array.from({ length: names.length }).map((_, index) => ({
		param_id: index,
		name: names[index],
		value: values[index],
		min: mins[index],
		max: maxes[index],
	}));
};

export const setParameter = async (track_id, device_id, param_id, value) => {

	let currentValue = (await sendOSC("/live/device/get/parameters/value", [
		track_id,
		device_id,
	], true))[param_id];

	const deviceName = await sendOSC("/live/device/get/name", [
		track_id,
		device_id,
	]);

	const paramName = (await sendOSC("/live/device/get/parameters/name", [
		track_id,
		device_id,
	]))[param_id];

	const steps = 5;
	const seconds = 2;
	const diff = value - currentValue;
	const step = diff / steps;

	const originalParamValueName = await sendOSC("/live/device/get/parameter/value_string", [
		track_id,
		device_id,
		param_id,
	], true);

	console.log("originalParamValueName", originalParamValueName);

	for (let i = 1; i <= steps; i++) {
		const newValue = currentValue + step * i;
		const setParams = [track_id, device_id, param_id, newValue];
		sendOSC("/live/device/set/parameter/value", setParams);
		await new Promise((r) => setTimeout(r, seconds/steps * 1000));
	}

	const finalParamValueName = await sendOSC("/live/device/get/parameter/value_string", [
		track_id,
		device_id,
		param_id,
	], true);

	return {
		device: deviceName,
		param: paramName,
		from: originalParamValueName,
		to: finalParamValueName
	};
};

export const isLive = async () => {
    const timeout = (ms) => new Promise((resolve, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

    try {
        await Promise.race([
            sendOSC("/live/test", []),
            timeout(5000) // timeout time
        ]);
        return true;
    } catch (error) {
        return false;
    }
};
