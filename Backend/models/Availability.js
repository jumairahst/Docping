const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    timeSlots: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

availabilitySchema.index({ doctor: 1, date: 1 }, { unique: true });

availabilitySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Availability', availabilitySchema);
