const express = require("express");
const Airtable = require("airtable");
const {auth} = require("express-openid-connect");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRETT;
const airbaseApiKey = process.env.AIRBASE_API_KEY;
const clientID = process.env.CLIENT_ID;

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: JWT_SECRET,
  baseURL: "http://localhost:3000",
  clientID: clientID,
  issuerBaseURL: "https://dev-kjecveo5tbrcdtba.us.auth0.com",
};
app.use(auth(config));
app.use(cors());

const base = new Airtable({
  apiKey: airbaseApiKey,
}).base("appRj50vPHTl8obyf");

const getUserID = (req) => {
  return req.oidc?.user?.sub || "anonymous";
};

app.post("/submit-message", express.json(), async (req, res) => {
  try {
    console.log("Received a request to submit a message");
    const {message} = req.body;
    const userId = getUserID(req);
    await base("AnonData").create({User_ID: userId, Message: message});
    res.status(201).send("Message submitted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("retrieve-messages", async (req, res) => {
  try {
    console.log("Received a request to retrrieve messages");
    const userId = getUserID(req);
    const messages = await base("AnonData")
      .select({
        filterByFormula: `{User_ID}='${userId}'`,
      })
      .firstPage();
    if (!messages[0]) throw new Error("No Messages Found");
    res.json(messages.map((record) => record.fields.Message));
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/", (req, res) => {
  res.send(req.oidc.isAuthenticated() ? "Logged in" : "Logged out");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
