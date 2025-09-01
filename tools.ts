import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { google } from "googleapis";
import tokens from "./tokens.json";
import crypto from "node:crypto";
import { TavilySearch } from "@langchain/tavily";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

oauth2Client.setCredentials({
  access_token: process.env.GOOGLE_ACCESS_TOKEN,
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

const getEventSchema = z.object({
  q: z.string()
    .describe(`The query used to get events from google calendar. It can be on of the following values
          summary of the meeting, description of the meeting, location, attendees display name, attendees email, organizer's name, organizer's email`),
  timeMin: z.string().describe("The from date time to get the events"),
  timeMax: z.string().describe("The to date time to get the events"),
});

type Params = z.infer<typeof getEventSchema>;

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
    schema: getEventSchema,
  }
);

const createEventSchema = z.object({
  summary: z.string().describe("The title of the meeting"),
  description: z.string().describe("The description of the meeting"),
  start: z.object({
    dateTime: z.string().describe("The date and time of the meeting"),
    timeZone: z.string().describe("The timezone of the event"),
  }),
  end: z.object({
    dateTime: z
      .string()
      .describe("The date and time of the meeting on which the meeting is end"),
    timeZone: z
      .string()
      .describe("The timezone of the event on which the meeting is end"),
  }),
  attendees: z.array(
    z.object({
      email: z.string().describe("The email of the attendee"),
      displayName: z.string().describe("The name of the attendee"),
    })
  ),
});

type EventData = z.infer<typeof createEventSchema>;

export const createEventTool = tool(
  async (eventData) => {
    const { summary, start, end, attendees, description } =
      eventData as EventData;
    console.log(eventData);
    try {
      const res = await calendar.events.insert({
        calendarId: "primary",
        sendUpdates: "all",
        conferenceDataVersion: 1,
        requestBody: {
          summary,
          description,
          start,
          end,
          attendees,
          conferenceData: {
            createRequest: {
              requestId: crypto.randomUUID(),
              conferenceSolutionKey: {
                type: "hangoutsMeet",
              },
            },
          },
        },
      });
      if (res.ok && res.statusText === "OK") {
        return "The meeting has been created";
      }
    } catch (error) {
      return "Error while create the meeting";
    }
  },
  {
    name: "create-event",
    description: "Call to create the calendar events.",
    schema: createEventSchema,
  }
);

const deleteEventSchema = z.object({
  eventId: z.string().describe("The ID of the event to delete"),
});

type deleteEventData = z.infer<typeof deleteEventSchema>;

export const deleteEventTool = tool(
  async (deleteEventData) => {
    const { eventId } = deleteEventData as deleteEventData;
    try {
      await calendar.events.delete({
        calendarId: "primary",
        eventId,
        sendUpdates: "all",
      });
      return "The meeting has been deleted";
    } catch (error) {
      return "Error while deleting the meeting";
    }
  },
  {
    name: "delete-event",
    description: "Call to delete the calendar events.",
    schema: deleteEventSchema,
  }
);

export const webSearch = new TavilySearch({
  maxResults: 3,
  topic: "general",
});
