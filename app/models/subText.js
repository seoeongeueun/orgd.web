// /app/models/subText.js
import mongoose from "mongoose";

const subTextSchema = new mongoose.Schema({
	uid: { type: String, required: true, unique: true },
	text: { type: String, required: true },
	background_color: { type: String, required: true },
	position: {
		x: { type: Number, required: true },
		y: { type: Number, required: true },
	},
	rotation: { type: Number, default: 0 },
	main_text_uid: {
		type: String,
		ref: "MainText",
		required: true,
	},
});

export default mongoose.models.SubText ||
	mongoose.model("SubText", subTextSchema);
