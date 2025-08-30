import { ChatGroq } from "@langchain/groq";
import { createEventTool, getEventsTool } from "./tools";

const tools = [createEventTool, getEventsTool];

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
}).bindTools(tools);
