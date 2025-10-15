// User model
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRoadmapProgress {
	nodeId: Types.ObjectId;
	tutorialDone: Date | null;
	slideDone: Date | null;
	quizzesDone: { quizId: Types.ObjectId; score: number; finishedAt: Date }[];
	stars: number;
}

export interface IUser extends Document {
	roadmapProgress: IRoadmapProgress[];
}

const RoadmapProgressSchema = new Schema<IRoadmapProgress>({
	nodeId: { type: Schema.Types.ObjectId, required: true, ref: 'Node' },
	tutorialDone: { type: Date, default: null },
	slideDone: { type: Date, default: null },
	quizzesDone: [
		{
			quizId: { type: Schema.Types.ObjectId, ref: 'Quiz' },
			score: Number,
			finishedAt: Date,
		},
	],
	stars: { type: Number, default: 0 },
});

const UserSchema = new Schema<IUser>({
	roadmapProgress: [RoadmapProgressSchema],
});

export default mongoose.model<IUser>('User', UserSchema);
