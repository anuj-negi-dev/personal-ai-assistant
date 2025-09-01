import readLine from "node:readline/promises";
import { ChatGroq } from "@langchain/groq";
import { createEventTool, getEventsTool } from "./tools";
import {
  END,
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { AIMessage } from "@langchain/core/messages";

const tools = [createEventTool, getEventsTool];

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
