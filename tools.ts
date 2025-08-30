import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const createEventTool = tool(
  () => {
    return "The meeting has been created";
  },
  {
    name: "create-event",
    description: "Call to create the calender events.",
    schema: z.object({}),
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
    description: "Call to create the calender events.",
    schema: z.object({}),
  }
);
