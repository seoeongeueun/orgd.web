import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema({
	ip: String,
});

export default mongoose.models.device || mongoose.model("Device", deviceSchema);
