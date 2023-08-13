// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { randomBytes } = require('crypto');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create comments object
const commentsByPostId = {};

// Create route to handle get requests
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

// Create route to handle post requests
app.post('/posts/:id/comments', async (req, res) => {
  const commentId = randomBytes(4).toString('hex'); // Create random id
  const { content } = req.body; // Destructure content from request body
  const comments = commentsByPostId[req.params.id] || []; // Get comments for post id

  comments.push({ id: commentId, content, status: 'pending' }); // Add comment to comments array

  commentsByPostId[req.params.id] = comments; // Set comments for post id

  // Create event
  await axios.post('http://localhost:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: 'pending',
    },
  });

  // Send response
  res.status(201).send(comments);
});

// Create route to handle event requests
app.post('/events', async (req, res) => {
  console.log('Event Received:', req.body.type);

  const { type, data } = req.body; // Destructure type and data from request body

  // Check if type is CommentModerated
  if (type === 'CommentModerated') {
    const { postId, id, status, content } = data; // Destructure postId, id, status, and content from data

    // Get comments for post id
    const comments = commentsByPostId[postId];

    // Find comment with id
    const comment = comments.find((comment) => {
      return comment.id === id;
    });

    // Set status for comment
    comment.status = status;

    // Create event
    await axios.post('http://localhost:4005/events', {
      type: 'CommentUpdated',
      data: {
        id,