var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title:{type: String},
  name: {type: String},
  link: String,
  ABV: {type: Number, min: 2, max: 12},
  IBU: {type: Number, min: 0, max: 100},
  upvotes: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]

});


PostSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
  };

mongoose.model('Post', PostSchema);


