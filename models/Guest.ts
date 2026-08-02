import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGuest extends Document {
  id: string;
  name: string;
  slug: string;
  refusalCount: number;
  createdAt: Date;
}

const GuestSchema = new Schema<IGuest>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    refusalCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Guest: Model<IGuest> =
  mongoose.models.Guest || mongoose.model<IGuest>("Guest", GuestSchema);

export default Guest;
