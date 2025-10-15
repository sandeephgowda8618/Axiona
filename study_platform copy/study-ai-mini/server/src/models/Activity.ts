// Activity model
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivity extends Document {
  nodeId: Types.ObjectId;
  tutorialId: Types.ObjectId;
  slideId: Types.ObjectId;
  quizIds: Types.ObjectId[];
}

const ActivitySchema = new Schema<IActivity>({
  nodeId: { type: Schema.Types.ObjectId, required: true, ref: 'Node' },
  tutorialId: { type: Schema.Types.ObjectId, required: true, ref: 'Tutorial' },
  slideId: { type: Schema.Types.ObjectId, required: true, ref: 'Slide' },
  quizIds: [{ type: Schema.Types.ObjectId, ref: 'Quiz' }],
});

export default mongoose.model<IActivity>('Activity', ActivitySchema);
