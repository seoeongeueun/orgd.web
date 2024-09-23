import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
	fontSize: {
		default: { type: String, required: true },
		sub: { type: String, required: true },
	},
	mainDevice: { type: [String], default: [] },
});

export default mongoose.models.Settings ||
	mongoose.model("Settings", settingsSchema);
