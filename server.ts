import express from "express";
import { google } from "googleapis";

const app = express();

const port = process.env.PORT;

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

app.get("/auth", (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/calendar"];
  const link = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
  console.log("URL", link);
  res.redirect(link);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code as string;
  const { tokens } = await oauth2Client.getToken(code);
  console.log("Tokens", tokens);
  oauth2Client.setCredentials(tokens);
  res.send("Connected ✅ You can close this tab now.");
});

app.listen(port, () => {
  console.log(`Server is running on PORT ${port}`);
});
