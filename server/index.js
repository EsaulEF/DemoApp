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
import Crypto from 'crypto';

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
    signature = Crypto.createHmac('sha256', key).update(data).digest('hex');
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
  const timestamp = req.headers['x-ib-exchange-req-timestamp'];
  const signature = req.headers['x-ib-exchange-req-signature'];
  //x-ib-exchange-req-accountkey
  // payload = accountID
  const payload =  JSON.stringify(req.body);
  //console.log('*-*-*-*  headers ', JSON.stringify(req.headers))
  //console.log('request ---- payload ',`${timestamp+payload}`," signing secret ", signingSecret)
  //console.log(' generate Signature  ', generateSignature((timestamp+payload).trim(), signingSecret.trim())," ",  'signature ', signature)
  //console.log('------*--*-*-*-**-*- ',signature === generateSignature(`${(timestamp+payload).trim()}`, `${signingSecret.trim()}`));
  const reservation = await getByEmail(req.body.email).catch((error) => {
    return res.status(500).json({ error });
  });
  if (signature === generateSignature((timestamp+payload).trim(), signingSecret.trim())){
    return res.json(reservation);
  }else{
    return res.status(401).json({ error });
  }
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
