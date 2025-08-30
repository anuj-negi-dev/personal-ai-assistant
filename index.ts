import { ChatGroq } from "@langchain/groq";

const tools: any = [];

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
}).bindTools(tools);
