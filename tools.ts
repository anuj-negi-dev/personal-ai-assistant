import { tool } from "@langchain/core/tools";
import { z } from "zod";

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

export const getEventsTool = tool(
  () => {
    return JSON.stringify([
      {
        title: "Meeting with Anuj",
        date: "30th Aug 2025",
        time: "2 PM",
        location: "Online",
      },
    ]);
  },
  {
    name: "get-event",
    description: "Call to get all the calendar events.",
    schema: z.object({
      query: z
        .string()
        .describe("The query used to get events from google calendar."),
    }),
  }
);
