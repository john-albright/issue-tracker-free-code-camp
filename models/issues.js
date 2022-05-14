const mongoose = require('mongoose');

const { Schema } = mongoose;

const issuesSchema = new Schema({
    issue_title: {
        type: String,
        required: true
    },
    issue_text: {
        type: String,
        required: true
    },
    created_by: {
        type: String,
        required: true
    },
    open: {
        type: Boolean,
        default: true
    },
    assigned_to: {
        type: String,
        default: ""
    },
    status_text: {
        type: String,
        default: ""
    },
    created_on: {
        type: Date,
        default: Date.now()
    },
    updated_on: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model('Issues', issuesSchema);