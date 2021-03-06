require('newrelic'); // Metrics

const express = require('express');
const client = require('./db/database');

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.post('/api/images/', (req, res) => {
  // Create
  const query = `INSERT INTO zagat.restaurants (id,images,name) VALUES (${req.body.id},${req.body.images},${req.body.name})`;

  client
    .execute(query)
    .then(() => {
      res.send({
        ok: true,
        message: 'Post success',
      });
    })
    .catch(() => {
      res.send({
        ok: false,
        message: 'Post error',
      });
    });
});

app.get('/api/images/:restaurantId', (req, res) => {
  // Read
  const id = parseInt(req.params.restaurantId);

  const query = `SELECT * FROM restaurants WHERE id = ${id}`;
  client.execute(query).then((result) => {
    if (result.rows[0]) {
      let row = result.rows[0];
      return new Promise((resolve,reject) => {
        // add https://cow-bucket-sdc5.s3.us-east-2.amazonaws.com/images/
        for(var i = 0; i < row.images.length; i++) {
          row.images[i] = `https://cow-bucket-sdc5.s3.us-east-2.amazonaws.com/images/${row.images[i]}.jpg`;
        }
        resolve(row);
      }).then((result) => {
        res.send(result);
      })
    } else {
      res.statusCode = 400;
      res.end();
    }
  });
});

app.patch('/api/images/:restaurantId', (req, res) => {
  // Update
  // req.body.updates should be an array of changes (ex: ["name=hello","images=['googe.com']"])
  // const query = `UPDATE ${...req.body.updates} FROM restaurants WHERE id = ${req.body.id}`;

  let updates = '';
  for (let i = 0; i < req.body.updates.length; i++) {
    updates += `${req.body.updates[i]} `;
  }

  const query = `UPDATE ${updates} FROM restaurants WHERE id = ${req.body.id}`;
  client
    .execute(query)
    .then(() => {
      res.send({
        ok: true,
        message: 'Updated',
      });
    })
    .catch(() => {
      res.send({
        ok: false,
        message: 'Update error',
      });
    });
});

app.delete('/api/images/:restaurantId', (req, res) => {
  // Delete
  const query = `DELETE FROM zagat.restaurants WHERE id = ${req.body.id}`;
  client
    .execute(query)
    .then(() => {
      res.send({
        ok: true,
        message: 'Deleted',
      });
    })
    .catch(() => {
      res.send({
        ok: false,
        message: 'Delete error',
      });
    });
});

app.post('/stress/images/', (req, res) => {
  // Measure post throughput
  const query = `INSERT INTO zagat.restaurants (id,images,name) VALUES (${100000000},${[]},${'test'})`;
  client
    .execute(query)
    .then(() => {
      res.send({
        ok: true,
        message: 'query exec',
      });
    })
    .catch(() => {
      res.statusCode = 400;
      res.end();
    })
    .then(() => {
      client.execute(`DELETE FROM zagat.restaurants WHERE id = ${100000000}`);
    });
});

app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`[Server] Running on port ${PORT}`);
  }
});
