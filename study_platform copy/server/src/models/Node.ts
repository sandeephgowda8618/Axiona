// Node model
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INode extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  order: number;
  isLocked: boolean;
  requiredStars: number;
}

const NodeSchema = new Schema<INode>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, required: true },
  isLocked: { type: Boolean, default: true },
  requiredStars: { type: Number, default: 0 },
});

export default mongoose.model<INode>('Node', NodeSchema);