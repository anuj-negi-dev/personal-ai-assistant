import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { google } from "googleapis";
import tokens from "./tokens.json";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

oauth2Client.setCredentials(tokens);

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

type Params = {
  q: string;
  timeMin: string;
  timeMax: string;
};

export const getEventsTool = tool(
  async (params) => {
    const { q, timeMin, timeMax } = params as Params;
    try {
      const res = await calendar.events.list({
        calendarId: "primary",
        q,
        timeMin,
        timeMax,
      });
      const events = res.data.items;
      if (!events || events.length === 0) {
        return "No upcoming events found.";
      }
      const result = events.map((event) => {
        return {
          id: event.id,
          summary: event.summary,
          status: event.status,
          organizer: event.organizer,
          start: event.start,
          end: event.end,
          attendees: event.attendees,
          meetingLink: event.hangoutLink,
        };
      });

      return JSON.stringify(result);
    } catch (error) {
      return "Failed to connect to the calender";
    }
  },
  {
    name: "get-event",
    description: "Call to get all the calendar events.",
    schema: z.object({
      q: z.string()
        .describe(`The query used to get events from google calendar. It can be on of the following values
          summary of the meeting, description of the meeting, location, attendees display name, attendees email, organizer's name, organizer's email`),
      timeMin: z
        .string()
        .describe("The from date time in UTC format to get the events"),
      timeMax: z
        .string()
        .describe("The to date time in UTC format to get the events"),
    }),
  }
);

export const createEventTool = tool(
  () => {
    return "The meeting has been created";
  },
  {
    name: "create-event",
    description: "Call to create the calendar events.",
    schema: z.object({
      query: z
        .string()
        .describe("The query used to create events in google calendar."),
    }),
  }
);
