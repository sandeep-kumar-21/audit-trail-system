import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  data: {
    type: Object,
    required: true
  }
});

export default mongoose.model("Project", projectSchema);
