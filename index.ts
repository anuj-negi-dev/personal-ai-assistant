import readLine from "node:readline/promises";
import { ChatGroq } from "@langchain/groq";
import {
  createEventTool,
  deleteEventTool,
  getEventsTool,
  webSearch,
  getEmail,
  updateEventTool,
} from "./tools";
import {
  END,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { AIMessage } from "@langchain/core/messages";

const tools = [
  createEventTool,
  getEventsTool,
  deleteEventTool,
  updateEventTool,
  webSearch,
  getEmail,
];

const model = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
}).bindTools(tools);

async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);
  return { messages: [response] };
}

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  return "__end__";
}

const toolNode = new ToolNode(tools);

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue, {
    __end__: END,
    tools: "tools",
  });

const checkpointer = new MemorySaver();

const app = workflow.compile({ checkpointer });

const systemPrompt = `You are an smart ai assistant and you name is ${
  process.env.AGENT_NAME
}
                      You help with users to setup meetings on the google calendar and get information from their google calendar.
                      You have access to the following tools:
                      1. create_event: To create an event on the google calendar. Use this tool when user wants to create a meeting on their calendar.
                      2. get_events: To get events from google calendar. Use this tool when user wants to get information about their meetings on their calendar.
                      3. web_search: To search the web for information. Use this tool when user wants to get information about anything on the web.
                      4. delete_event: To delete an event from google calendar. Use this tool when user wants to delete a meeting from their calendar.
                      5. get_email: To get the email of an attendee. Use this tool when user wants to get the email of a specific attendee use this tool when  the user does not provide it.
                      6. update_event: To update an event on the google calendar. Use this tool when user wants to update a meeting on their calendar.
                    Current Date & Time is : ${new Date()
                      .toLocaleString("sv-SE")
                      .replace(" ", "T")} 
                       Current Timezone is : ${
                         Intl.DateTimeFormat().resolvedOptions().timeZone
                       }
`;

async function main() {
  const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const config = {
    configurable: {
      thread_id: "1",
    },
  };
  while (true) {
    const question = await rl.question("You: ");
    if (question === "exit") break;
    const finalState = await app.invoke(
      {
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: question,
          },
        ],
      },
      config
    );
    console.log(
      "AI: ",
      finalState.messages[finalState.messages.length - 1]?.content
    );
  }

  rl.close();
}

main();
