// Service for finding learning resources using AI
import { ChatOpenAI } from "@langchain/openai";
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { JsonOutputFunctionsParser } from "@langchain/core/output_parsers";
import { z } from "zod";

/**
 * Helper function to safely extract and parse JSON from text that might contain markdown or other formatting
 * @param {string} text - Text that may contain JSON
 * @returns {object|null} Parsed JSON or null if parsing failed
 */
const extractJsonFromText = (text) => {
  try {
    // First, try direct parsing in case the text is already valid JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      // Not valid JSON, continue to extraction
    }
    
    // Look for JSON within code blocks or without code blocks
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      return JSON.parse(jsonBlockMatch[1].trim());
    }
    
    // Look for JSON patterns without code blocks
    const jsonPattern = /\{[\s\S]*\}/;
    const jsonMatch = text.match(jsonPattern);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting JSON:", error);
    return null;
  }
};

// Schema for learning resources
const resourceSchema = z.object({
  resources: z.array(
    z.object({
      title: z.string().describe("Title of the resource"),
      url: z.string().url().describe("URL of the resource"),
      description: z.string().describe("Short description of the resource"),
      resourceType: z.enum(["video", "pdf", "image", "website", "article"]).describe("Type of resource")
    })
  ).describe("List of learning resources for the topic")
});

/**
 * Initialize a Together AI model
 * deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free
 * meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
 * mistralai/Mixtral-8x7B-Instruct-v0.1
 */
const getTogetherAIModel = (togetherApiKey) => {
  return new ChatTogetherAI({
    modelName: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    temperature: 0.2,
    apiKey: togetherApiKey
  });
};

/**
 * Initialize Azure OpenAI model
 */
const getAzureOpenAIModel = (apiKey, endpoint, deploymentName) => {
  return new ChatOpenAI({
    temperature: 0.2,
    azureOpenAIApiKey: apiKey,
    azureOpenAIApiVersion: "2023-12-01-preview",
    azureOpenAIApiDeploymentName: deploymentName,
    azureOpenAIApiInstanceName: endpoint,
  });
};

/**
 * Initialize Google Cloud model
 */
const getGoogleCloudModel = (apiKey) => {
  return new ChatOpenAI({
    modelName: "gemini-pro",
    temperature: 0.2,
    apiKey: apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro",
  });
};

/**
 * Initialize OpenAI model
 */
const getOpenAIModel = (apiKey) => {
  return new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.2,
    openAIApiKey: apiKey,
  });
};

/**
 * Find learning resources for a topic using AI
 */
export const findLearningResources = async (topic, apiConfig) => {
  try {
    // Input validation
    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      throw new Error("A valid topic is required");
    }
    
    if (!apiConfig || typeof apiConfig !== 'object') {
      throw new Error("Valid API configuration is required");
    }
    
    // Choose which model to use based on config
    const { provider, apiKey, ...additionalConfig } = apiConfig;
    
    if (!apiKey) {
      throw new Error("API key is required");
    }
    
    let model;
    switch (provider) {
      case "together":
        model = getTogetherAIModel(apiKey);
        break;
      case "azure":
        if (!additionalConfig.endpoint || !additionalConfig.deploymentName) {
          throw new Error("Azure endpoint and deployment name are required");
        }
        model = getAzureOpenAIModel(apiKey, additionalConfig.endpoint, additionalConfig.deploymentName);
        break;
      case "google":
        model = getGoogleCloudModel(apiKey);
        break;
      case "openai":
        model = getOpenAIModel(apiKey);
        break;
      default:
        // Default to Together AI
        model = getTogetherAIModel(apiKey);
    }

    // Create prompt template with explicit formatting instructions
    const formatInstructions = parser => `
You MUST respond with a JSON object that conforms to the following schema:
\`\`\`json
{{
  "resources": [
    {{
      "title": "Resource Title",
      "url": "https://resource-url.com",
      "description": "Short description of the resource",
      "resourceType": "video|article|pdf|website|image"
    }},
    // Additional resources...
  ]
}}
\`\`\`

The response must be a valid JSON object with a "resources" array. 
Each resource must have all four fields: title, url, description, and resourceType.
The resourceType must be one of: "video", "article", "pdf", "website", or "image".
DO NOT include any explanation or text outside of the JSON structure.
`;

    // Create the parser
    const parser = StructuredOutputParser.fromZodSchema(resourceSchema);
    
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", `You are a helpful assistant that finds high-quality learning resources.
      
Search for the most popular, useful, and well-rated online learning resources about the topic.
Focus on finding a diverse set of resources including videos, articles, tutorials, and documentation.
For each resource, provide a title, URL, brief description, and resource type.

${formatInstructions(parser)}`],
      ["human", "Find the top 5 learning resources for {topic}. Be exhaustive in your search."]
    ]);

    // Create the chain
    const chain = promptTemplate.pipe(model).pipe(parser);

    // Execute the chain with retries for parsing errors
    const MAX_RETRIES = 2;
    let attempts = 0;
    let lastError = null;
    
    while (attempts <= MAX_RETRIES) {
      try {
        const result = await chain.invoke({
          topic,
        });
        return result.resources;
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempts + 1} failed:`, error.message);
        
        // If it's not a parsing error, don't retry
        if (!error.message.includes("parsing") && 
            !error.message.includes("SyntaxError") && 
            !error.message.includes("Unterminated")) {
          break;
        }
        
        attempts++;
        
        // On the last retry, attempt a direct call to the model without the parser
        if (attempts === MAX_RETRIES) {
          console.log("Attempting direct model call without structured output...");
          try {
            // Make a direct call to the model with explicit formatting instructions
            const directPrompt = ChatPromptTemplate.fromMessages([
              ["system", `You are a helpful assistant that finds high-quality learning resources.
              
IMPORTANT: You MUST respond with ONLY a valid JSON object in the exact format:

{{
  "resources": [
    {{
      "title": "Resource Title",
      "url": "https://resource-url.com",
      "description": "Short description of the resource",
      "resourceType": "video"
    }}
    // Additional resources...
  ]
}}

The resourceType must be one of: "video", "article", "pdf", "website", or "image".
DO NOT include ANY explanatory text, markdown formatting, or code blocks outside the JSON.`],
              ["human", `Find the top 5 learning resources for ${topic}. Respond ONLY with the JSON structure.`]
            ]);
            
            const directResponse = await directPrompt.pipe(model).invoke({});
            
            // Extract JSON from the response
            const responseText = directResponse.content;
            const jsonMatch = responseText.match(/{[\s\S]*}/);
            
            if (jsonMatch) {
              const jsonText = jsonMatch[0];
              const manualParsedResult = JSON.parse(jsonText);
              
              // Verify it has the required structure
              if (manualParsedResult.resources && Array.isArray(manualParsedResult.resources)) {
                return manualParsedResult.resources;
              }
            }
            
            throw new Error("Failed to extract valid JSON structure from model response");
          } catch (directError) {
            console.error("Direct model approach failed:", directError);
            throw lastError; // Throw the original error
          }
        }
      }
    }
    
    throw lastError || new Error("Failed to find learning resources");

  } catch (error) {
    console.error("Error finding learning resources:", error);
    throw error;
  }
};

/**
 * Find learning resources using function calling approach for models that support it
 * This is an alternative implementation that may provide more reliable structured output
 */
export const findResourcesWithFunctionCalling = async (topic, apiConfig) => {
  try {
    // Input validation
    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      throw new Error("A valid topic is required");
    }
    
    if (!apiConfig || !apiConfig.apiKey) {
      throw new Error("Valid API configuration with API key is required");
    }
    
    // Only specific models support function calling
    let model;
    
    if (apiConfig.provider === "openai") {
      model = new ChatOpenAI({
        modelName: "gpt-4o", // Ensure it's a model that supports function calling
        temperature: 0.2,
        openAIApiKey: apiConfig.apiKey,
      });
    } else if (apiConfig.provider === "azure") {
      model = new ChatOpenAI({
        temperature: 0.2,
        azureOpenAIApiKey: apiConfig.apiKey,
        azureOpenAIApiVersion: "2023-12-01-preview",
        azureOpenAIApiDeploymentName: apiConfig.deploymentName,
        azureOpenAIApiInstanceName: apiConfig.endpoint,
      });
    } else if (apiConfig.provider === "google") {
      model = new ChatOpenAI({
        modelName: "gemini-pro",
        temperature: 0.2,
        apiKey: apiConfig.apiKey,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro",
      });
    } else {
      throw new Error("Function calling is only supported with OpenAI, Azure OpenAI, and Google models");
    }
    
    // Define the function spec
    const findResourcesFunction = {
      name: "find_learning_resources",
      description: "Find learning resources on a specific topic",
      parameters: {
        type: "object",
        properties: {
          resources: {
            type: "array",
            description: "List of learning resources for the topic",
            items: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Title of the resource"
                },
                url: {
                  type: "string",
                  description: "URL of the resource"
                },
                description: {
                  type: "string",
                  description: "Short description of the resource"
                },
                resourceType: {
                  type: "string",
                  enum: ["video", "article", "pdf", "website", "image"],
                  description: "Type of resource"
                }
              },
              required: ["title", "url", "description", "resourceType"]
            }
          }
        },
        required: ["resources"]
      }
    };
    
    // Create prompt template
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", `You are a helpful assistant that finds high-quality learning resources.
      
Search for the most popular, useful, and well-rated online learning resources about the topic.
Focus on finding a diverse set of resources including videos, articles, tutorials, and documentation.
For each resource, provide a title, URL, brief description, and resource type.`],
      ["human", "Find the top 5 learning resources for {topic}. Be exhaustive in your search."]
    ]);
    
    // Create and execute the function calling chain
    const functionCallingModel = model.bind({
      functions: [findResourcesFunction],
      function_call: { name: "find_learning_resources" }
    });
    
    const parser = new JsonOutputFunctionsParser();
    
    const chain = promptTemplate.pipe(functionCallingModel).pipe(parser);
    
    const result = await chain.invoke({ topic });
    
    return result.resources;
  } catch (error) {
    console.error("Error finding learning resources with function calling:", error);
    throw error;
  }
};

// Default export with all methods and provider options
export default {
  findLearningResources,
  findResourcesWithFunctionCalling,
  providers: {
    together: "together",
    azure: "azure", 
    google: "google",
    openai: "openai"
  }
};
