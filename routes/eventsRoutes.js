const express = require('express');
const router = express.Router();

const events = [
  {
    id: 1,
    title: "All-day event",
    start: "2025-04-24T12:00:00"
  },
  {
    id: 2,
    title: "Timed event",
    start: new Date().toISOString().split('T')[0] + "T12:00:00"
  }
];

router.get('/', (req, res) => {
  res.json(events);
});

module.exports = router;
