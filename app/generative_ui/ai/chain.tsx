import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "langchain/tools";

import { z } from "zod";

import { Place } from "@/app/generative_ui/components/place";
import { createRunnableUI } from "../utils/server";
import { search, images } from "./tools";
import { Images } from "../components/image";

const searchTool = new DynamicStructuredTool({
  name: "SerpAPI",
  description:
    "A search engine. useful for when you need to answer questions about current events. input should be a search query.",
  schema: z.object({ query: z.string() }),
  func: async (input, config) => {
    const stream = createRunnableUI(config);
    stream.update(<div>Searching the internet...</div>);

    const result = await search(input);

    stream.done(
      <div className="flex gap-2 flex-wrap justify-end">
        {JSON.parse(result).map((place: any, index: number) => (
          <Place place={place} key={index} />
        ))}
      </div>,
    );

    return result;
  },
});

const imagesTool = new DynamicStructuredTool({
  name: "Images",
  description: "A tool to search for images. input should be a search query.",
  schema: z.object({
    query: z.string().describe("The search query used to search for cats"),
    limit: z.number().describe("The number of pictures shown to the user"),
  }),
  func: async (input, config) => {
    const stream = createRunnableUI(config);
    stream.update(<div>Searching...</div>);

    const result = await images(input);
    stream.done(
      <Images
        images={result.images_results
          .map((image) => image.thumbnail)
          .slice(0, input.limit)}
      />,
    );

    return `[Returned ${result.images_results.length} images]`;
  },
});


const audioFilePicker = new DynamicStructuredTool({
  name: "AudioFilePicker",
  description: "A tool to select a local audio file.",
  schema: z.object({
    // audioFilePath: z.string().describe("The file path that contains the audio")
  }),
  func: async (input, config) => {
    let resolvePromise: (value: number) => void;
    const conditionPromise = new Promise<number>((resolve) => {
      resolvePromise = resolve;
    });

    const stream = createRunnableUI(config);
    let audioBase64Data = ""
    stream.update(
      <div>
        <h1>Please upload me a audio file</h1>
        <input type="file" />
        <button id="btnUpload"
        >
          Upload a audio
        </button>
      </div>
    );


    const btnUpload = document.getElementById("btnUpload");
    if(btnUpload) {
      btnUpload.addEventListener("click", () => {
        console.log("fuck!!!!!!!!!!!!")
        resolvePromise(0); // Call resolvePromise to resolve the Promise
      });
    }
    
    await conditionPromise;

    console.log("!!!")
    
    stream.done(
      <button
      >cut it!</button>,
    );

    return `[Returned "/tmp/a.mp3"]`;
  },
});

const audiocutTool = new DynamicStructuredTool({
  name: "AudioCutter",
  description: "A tool to cut audios. input should be a audio file path.",
  schema: z.object({
    audioFilePath: z.string().describe("The file path that contains the audio")
  }),
  func: async (input, config) => {
    const stream = createRunnableUI(config);
    stream.update(<div>Cutting...</div>);

    stream.done(
      <audio controls src={"1111.mp3"}
      />,
    );

    return `[Returned 1 audio]`;
  },
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a talking parrot named Polly. All final responses must be how a talking parrot would respond. Squawk often!`,
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const llm = new ChatOpenAI({
  // modelName: "gpt-3.5-turbo-1106",
  modelName: "gpt-4",
  temperature: 0,
  streaming: true,
});

const tools = [searchTool, imagesTool, audioFilePicker, audiocutTool];

export const agentExecutor = new AgentExecutor({
  agent: createToolCallingAgent({ llm, tools, prompt }),
  tools,
});
