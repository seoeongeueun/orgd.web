// /app/models/mainText.js
import mongoose from "mongoose";

const mainTextSchema = new mongoose.Schema({
	uid: { type: String, required: true, unique: true },
	text: { type: String, required: true },
	position: {
		x: { type: Number, required: true },
		y: { type: Number, required: true },
	},
	sub_text_uid: {
		type: String,
		ref: "SubText",
		default: null,
	},
});

export default mongoose.models.MainText ||
	mongoose.model("MainText", mainTextSchema);
