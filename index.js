const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));

app.get('/rules', (req, res) => {
  const rules = require('./rules.json');
  res.json(rules);
});

app.get('/courses', (req, res) => {
  const courses = require('./courses.json');
  res.json(courses);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});