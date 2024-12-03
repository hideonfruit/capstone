
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.SERVER_PORT || 8080;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.json());

app.get('/financial-records', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const query = 'SELECT * FROM market_insights ORDER BY date LIMIT $1 OFFSET $2';
    const result = await pool.query(query, [limit, offset]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching data', error);
    res.status(500).send('Server error');
  }
});

app.post('/financial-records', async (req, res) => {
  const { date, spy, gld, amzn, goog, meta, tesla, msft } = req.body;

  const query = `
    INSERT INTO market_insights (date, spy, gld, amzn, goog, meta, tesla, msft)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`;
  const values = [date, spy, gld, amzn, goog, meta, tesla, msft];

  try {
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error inserting data', error);
    res.status(500).send('Server error');
  }
});

app.put('/financial-records/:date', async (req, res) => {
  const { date } = req.params;
  const { spy, gld, amzn, goog, meta, tesla, msft } = req.body;

  const query = `
    UPDATE market_insights
    SET spy = $1, gld = $2, amzn = $3, goog = $4, meta = $5, tesla = $6, msft = $7
    WHERE date = $8
    RETURNING *`;
  const values = [spy, gld, amzn, goog, meta, tesla, msft, date];

  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      res.status(404).send('Record not found');
    } else {
      res.status(200).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error updating data', error);
    res.status(500).send('Server error');
  }
});

app.delete('/financial-records/:date', async (req, res) => {
  const { date } = req.params;

  const query = 'DELETE FROM market_insights WHERE date = $1 RETURNING *';

  try {
    const result = await pool.query(query, [date]);
    if (result.rowCount === 0) {
      res.status(404).send('Record not found');
    } else {
      res.status(200).json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error deleting data', error);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
