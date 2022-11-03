import express from "express";
import {
  createConnection,
  deleteReservation,
  updateReservation,
  getAllReservations,
  addReservation,
  getByEmail,
} from "./database.js";
import fs from 'fs';
import crypto from 'crypto';

const port = process.env.PORT || 3001;
const app = express();

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}
createConnection();

const signingSecretFile = process.cwd() + '/signingSecret.txt';
let signingSecret = ''
try {
  fs.readFile(signingSecretFile, 'utf8', (err, data) => {
    if (err) {
      return;
    }
    signingSecret =  data;
  });
}catch (e) {
  console.log(e)
}

const generateSignature  = (data , key) => {
  let signature = ''
  try{
    signature = crypto.createHmac('sha256', key).update(data).digest("base64")
  }catch (e) {

  }
  return signature;
}

app.use(express.json()); // to support JSON-encoded bodies

app.get("/exchange/restaurant/reservations/:email", async (req, res) => {
  const timestamp = req.headers['X-Ib-Exchange-Req-Timestamp'];
  const signature = req.headers['X-Ib-Exchange-Req-Signature'];
  const payload = req.body;
console.log('hice algo')
 console.log(signature === generateSignature(timestamp+payload, signingSecret));
  const reservation = await getByEmail(req.params.email).catch((error) => {
    return res.status(200).json({ error });
  });
  return res.json(reservation);
});

app.post("/exchange/restaurant/reservations/email", async (req, res) => {
  const timestamp = req.headers['X-Ib-Exchange-Req-Timestamp'];
  const signature = req.headers['X-Ib-Exchange-Req-Signature'];
  const payload = req.body;
  console.log('hice algo')
  console.log(signature === generateSignature(timestamp+payload, signingSecret));
  const reservation = await getByEmail(req.body.email).catch((error) => {
    return res.status(200).json({ error });
  });
  return res.json(reservation);
});

app.get("/exchange/restaurant/reservations", async (req, res) => {
  return res.json({ reservations: await getAllReservations() });
});

app.post("/exchange/restaurant/reservations", async (req, res) => {
  const reservation = await addReservation(req.body).catch((error) => {
    return res.status(500).json({ error });
  });
  return res.json(reservation);
});

app.delete("/exchange/restaurant/reservations/:id", (req, res) => {
  res.json(deleteReservation(req.params.id));
});

app.put("/exchange/restaurant/reservations/:id", (req, res) => {
  res.json(updateReservation(req.params.id, req.body));
});

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
