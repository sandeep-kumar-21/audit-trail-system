import mongoose from "mongoose";

const auditEventSchema = new mongoose.Schema({
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  action: String,
  timestamp: { type: Date, default: Date.now },
  diff: Object
});

export default mongoose.model("AuditEvent", auditEventSchema);
