// Service for generating AI summaries of learning resources
import { z } from "zod";

/**
 * Helper function to parse markdown sections into a structured object
 * @param {string} markdown - Markdown formatted text
 * @returns {object} Object with summary, highlights, and targetAudience
 */
const parseMarkdownSections = (markdown) => {
  if (!markdown) return {};
  
  // Initialize result object
  const result = {
    summary: '',
    mainParts: '',
    highlights: []
  };
  
  try {
    // Extract summary section (content between ## Summary and the next ##)
    const summaryMatch = markdown.match(/## Summary\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (summaryMatch && summaryMatch[1]) {
      result.summary = summaryMatch[1].trim();
    }
    
    // Extract main parts (content between ## Main Parts and the next ##)
    const mainPartsMatch = markdown.match(/## Main Parts\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (mainPartsMatch && mainPartsMatch[1]) {
      result.mainParts = mainPartsMatch[1].trim();
    }
    
    // Extract key takeaways (list items after ## Key Takeaways)
    const takeawaysMatch = markdown.match(/## Key Takeaways\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (takeawaysMatch && takeawaysMatch[1]) {
      // Extract bullet points
      const bulletPoints = takeawaysMatch[1].split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-') || line.startsWith('*'))
        .map(line => line.substring(1).trim());
      
      result.highlights = bulletPoints;
    }
    
    return result;
  } catch (error) {
    console.error("Error parsing markdown sections:", error);
    return result;
  }
};

/**
 * Helper function to safely extract and parse JSON from text that might contain markdown or other formatting
 * @param {string} text - Text that may contain JSON
 * @returns {object|null} Parsed JSON or null if parsing failed
 */
const extractJsonFromText = (text) => {
  if (!text) return null;
  
  try {
    // First, try direct parsing in case the text is already valid JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      // Not valid JSON, continue to extraction
    }
    
    // Look for JSON within code blocks
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
    const jsonBlockMatch = text.match(codeBlockRegex);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      try {
        return JSON.parse(jsonBlockMatch[1].trim());
      } catch (e) {
        console.warn("Found code block but content isn't valid JSON:", e.message);
      }
    }
    
    // Look for JSON patterns - find the most complete JSON object in the text
    const findObjectsRegex = /(\{[\s\S]*?\})/g;
    const potentialObjects = [...text.matchAll(findObjectsRegex)];
    
    if (potentialObjects.length > 0) {
      // Try each potential object, starting with the longest one (likely most complete)
      const sortedObjects = potentialObjects
        .map(match => match[0])
        .sort((a, b) => b.length - a.length);
      
      for (const objText of sortedObjects) {
        try {
          const parsed = JSON.parse(objText);
          // Validate it has the expected structure
          if (parsed && parsed.summary) {
            return parsed;
          }
        } catch (e) {
          // Continue to next candidate
        }
      }
    }
    
    // Last resort: try to fix common JSON issues
    try {
      // Look for the start of an object
      const start = text.indexOf('{');
      if (start >= 0) {
        // Find a balanced closing bracket
        let depth = 0;
        let end = -1;
        
        for (let i = start; i < text.length; i++) {
          if (text[i] === '{') depth++;
          if (text[i] === '}') {
            depth--;
            if (depth === 0) {
              end = i;
              break;
            }
          }
        }
        
        if (end > start) {
          try {
            return JSON.parse(text.substring(start, end + 1));
          } catch (e) {
            // Unable to parse the extracted portion
          }
        }
      }
    } catch (e) {
      // Ignore errors from the last resort attempt
    }
    
    return null;
  } catch (error) {
    console.error("Error in JSON extraction process:", error);
    return null;
  }
};

// Schema for resource summary
const summarySchema = z.object({
  summary: z.string().describe("A comprehensive yet concise summary of the learning resource"),
  mainParts: z.string().describe("The main parts of the resource explained"),
  highlights: z.array(z.string()).describe("Key takeaways from the learning resource"),
});

/**
 * Initialize a Together AI model
 * Available models:
 * - meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
 * - deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free
 */
const getTogetherAIModel = async (togetherApiKey, modelName = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free") => {
  console.log(`[AISummaryGenerator] Using Together AI model: ${modelName}`);
  
  // Dynamically import the module only when needed
  const { ChatTogetherAI } = await import("@langchain/community/chat_models/togetherai");
  
  return new ChatTogetherAI({
    modelName: modelName,
    temperature: 0.2,
    apiKey: togetherApiKey
  });
};

/**
 * Initialize Azure OpenAI model
 */
const getAzureOpenAIModel = async (apiKey, endpoint, deploymentName) => {
  // Dynamically import the module only when needed
  const { ChatOpenAI } = await import("@langchain/openai");
  
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
const getGoogleCloudModel = async (apiKey) => {
  // Dynamically import the module only when needed
  const { ChatOpenAI } = await import("@langchain/openai");
  
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
const getOpenAIModel = async (apiKey) => {
  // Dynamically import the module only when needed
  const { ChatOpenAI } = await import("@langchain/openai");
  
  return new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.2,
    openAIApiKey: apiKey,
  });
};

/**
 * Generate a summary for a learning resource
 */
export const generateResourceSummary = async (url, title, resourceType, apiConfig) => {
  try {
    // Import required modules
    const { ChatPromptTemplate } = await import("@langchain/core/prompts");
    const { StructuredOutputParser } = await import("@langchain/core/output_parsers");
    
    // Input validation
    if (!url || typeof url !== 'string' || url.trim() === '') {
      throw new Error("A valid URL is required");
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
        model = await getTogetherAIModel(apiKey, additionalConfig.modelName);
        break;
      case "azure":
        if (!additionalConfig.endpoint || !additionalConfig.deploymentName) {
          throw new Error("Azure endpoint and deployment name are required");
        }
        model = await getAzureOpenAIModel(apiKey, additionalConfig.endpoint, additionalConfig.deploymentName);
        break;
      case "google":
        model = await getGoogleCloudModel(apiKey);
        break;
      case "openai":
        model = await getOpenAIModel(apiKey);
        break;
      default:
        // Default to Together AI
        model = await getTogetherAIModel(apiKey);
    }

    // Create a simpler prompt template for markdown output
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", `You are a helpful assistant that creates summaries of educational content.

Your task is to create a markdown-formatted summary of learning resources.

RESPONSE FORMAT:
You MUST respond with ONLY the following markdown structure without ANY additional text:

## Summary
[Concise overview of the resource content]

## Main Parts
[Explanation of the main parts or sections of the resource]

## Key Takeaways
- [First key point]
- [Second key point]
- [Third key point]

DO NOT include any introduction, explanations, or commentary outside this structure.
DO NOT wrap your response in code blocks or quotes. Just return the raw markdown.`],
      ["human", `Generate a summary for the following learning resource:
Title: {title}
URL: {url}
Type: {resourceType}`]
    ]);

    // Create the chain
    const chain = promptTemplate.pipe(model);

    // Log which model is being used
    console.log(`[AISummaryGenerator] Using AI model: ${provider}${additionalConfig.modelName ? ' with model: ' + additionalConfig.modelName : ''}`);

    // Execute the chain and process the markdown response
    try {
      console.log(`[AISummaryGenerator] Generating markdown summary...`);
      const response = await chain.invoke({
        url,
        title,
        resourceType
      });
      
      // Extract the content from the response
      const markdownContent = response.content;
      console.log(`[AISummaryGenerator] Generated markdown summary successfully`);
      
      // Parse the markdown into structured sections
      const sections = parseMarkdownSections(markdownContent);
      
      return {
        summary: sections.summary || "Summary could not be extracted",
        mainParts: sections.mainParts || "Main parts could not be extracted",
        highlights: sections.highlights || []
      };
    } catch (error) {
      console.warn("Markdown summary generation failed:", error.message);
      
      // Fallback approach - direct call to model with markdown formatting instructions
      try {
        console.log("[AISummaryGenerator] Attempting fallback with direct markdown prompt...");
        // Make a direct call to the model with clearer formatting instructions
        const directPrompt = ChatPromptTemplate.fromMessages([
          ["system", `You are a helpful assistant that creates summaries of educational content.
          
IMPORTANT: Respond with ONLY the following markdown structure without ANY additional text:

## Summary
[Concise overview of the resource content]

## Main Parts
[Explanation of the main parts or sections of the resource]

## Key Takeaways
- [First key point]
- [Second key point]
- [Third key point]

DO NOT include any text outside this exact structure.
DO NOT wrap your response in code blocks or quotes. Just return the raw markdown.`],
          ["human", `Generate a summary for the following learning resource:
Title: ${title}
URL: ${url}
Type: ${resourceType}`]
        ]);
        
        const directResponse = await directPrompt.pipe(model).invoke({});
        
        // Extract the content from the response
        const markdownContent = directResponse.content;
        console.log("[AISummaryGenerator] Raw fallback response:", markdownContent.substring(0, 100) + "...");
        
        // Parse the markdown into structured sections
        const sections = parseMarkdownSections(markdownContent);
        
        if (sections.summary) {
          console.log("[AISummaryGenerator] Successfully extracted markdown sections");
          return {
            summary: sections.summary,
            mainParts: sections.mainParts || "Details of the resource were not available",
            highlights: sections.highlights || []
          };
        }
        
        console.warn("[AISummaryGenerator] Could not extract valid markdown sections, returning basic response");
        // If we still don't have valid sections, create a basic response structure
        return {
          summary: "Unable to generate a structured summary. Please try again later.",
          mainParts: "Could not analyze the main parts of this resource.",
          highlights: ["Summary generation encountered an issue"]
        };
      } catch (directError) {
        console.error("All summary generation approaches failed:", directError);
        
        // Return a basic structure instead of throwing
        return {
          summary: "Unable to generate a summary at this time. Please try again later.",
          mainParts: "Resource details could not be analyzed.",
          highlights: ["Summary generation encountered an issue"]
        };
      }
    }

  } catch (error) {
    console.error("Error generating resource summary:", error);
    throw error;
  }
};

/**
 * Generate a summary for a learning resource using function calling approach for models that support it
 * This is an alternative implementation that may provide more reliable structured output
 */
export const generateSummaryWithFunctionCalling = async (url, title, resourceType, apiConfig) => {
  try {
    // Dynamically import required modules
    const { ChatPromptTemplate } = await import("@langchain/core/prompts");
    const { JsonOutputFunctionsParser } = await import("@langchain/core/output_parsers");
    
    // Input validation
    if (!url || typeof url !== 'string' || url.trim() === '') {
      throw new Error("A valid URL is required");
    }
    
    if (!apiConfig || !apiConfig.apiKey) {
      throw new Error("Valid API configuration with API key is required");
    }
    
    // Only specific models support function calling
    let model;
    
    if (apiConfig.provider === "openai") {
      const { ChatOpenAI } = await import("@langchain/openai");
      model = new ChatOpenAI({
        modelName: "gpt-4o", // Ensure it's a model that supports function calling
        temperature: 0.2,
        openAIApiKey: apiConfig.apiKey,
      });
    } else if (apiConfig.provider === "azure") {
      const { ChatOpenAI } = await import("@langchain/openai");
      model = new ChatOpenAI({
        temperature: 0.2,
        azureOpenAIApiKey: apiConfig.apiKey,
        azureOpenAIApiVersion: "2023-12-01-preview",
        azureOpenAIApiDeploymentName: apiConfig.deploymentName,
        azureOpenAIApiInstanceName: apiConfig.endpoint,
      });
    } else if (apiConfig.provider === "google") {
      const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
      model = new ChatGoogleGenerativeAI({
        modelName: "gemini-pro",
        temperature: 0.2,
        apiKey: apiConfig.apiKey,
      });
    } else {
      throw new Error("Function calling is only supported with OpenAI, Azure OpenAI, and Google models");
    }
    
    // Define the function spec
    const generateSummaryFunction = {
      name: "generate_resource_summary",
      description: "Generate a summary for a learning resource",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "A comprehensive yet concise summary of the learning resource"
          },
          mainParts: {
            type: "string",
            description: "Explanation of the main parts or sections of the resource"
          },
          highlights: {
            type: "array",
            description: "Key takeaways from the learning resource",
            items: {
              type: "string"
            }
          }
        },
        required: ["summary", "mainParts", "highlights"]
      }
    };
    
    // Create prompt template
    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", `You are a helpful assistant that creates summaries of educational content.
      
I'll give you a URL, title, and type of a learning resource. Your task is to create a comprehensive yet 
concise summary of what the resource contains, explain its main parts or sections, and highlight key takeaways.

You should use the website title and resource type to make educated inferences about the content.
Format your response to match the function's expected output.`],
      ["human", `Generate a summary for the following learning resource:
Title: {title}
URL: {url}
Type: {resourceType}`]
    ]);
    
    // Create and execute the function calling chain
    const functionCallingModel = model.bind({
      functions: [generateSummaryFunction],
      function_call: { name: "generate_resource_summary" }
    });
    
    const parser = new JsonOutputFunctionsParser();
    
    const chain = promptTemplate.pipe(functionCallingModel).pipe(parser);
    
    // Log which model is being used
    console.log(`[AISummaryGenerator] Using AI model with function calling: ${apiConfig.provider}`);
    
    try {
      const result = await chain.invoke({
        url,
        title,
        resourceType
      });
      return result;
    } catch (error) {
      console.error("Function calling approach failed:", error.message);
      
      // Fallback to standard approach
      console.log("Function calling failed, falling back to markdown prompt approach...");
      
      // Create a standard prompt with markdown formatting
      const standardPrompt = ChatPromptTemplate.fromMessages([
        ["system", `You are a helpful assistant that creates summaries of educational content.
        
IMPORTANT: Respond with ONLY the following markdown structure without ANY additional text:

## Summary
[Concise overview of the resource content]

## Main Parts
[Explanation of the main parts or sections of the resource]

## Key Takeaways
- [First key point]
- [Second key point]
- [Third key point]

DO NOT include any text outside this exact structure.
DO NOT wrap your response in code blocks or quotes. Just return the raw markdown.`],
        ["human", `Generate a summary for the following learning resource:
Title: ${title}
URL: ${url}
Type: ${resourceType}`]
      ]);
      
      const directResponse = await standardPrompt.pipe(model).invoke({});
      
      // Extract the markdown content from the response
      const markdownContent = directResponse.content;
      console.log("[AISummaryGenerator] Raw fallback response:", markdownContent.substring(0, 100) + "...");
      
      // Parse the markdown into structured sections
      const sections = parseMarkdownSections(markdownContent);
      
      if (sections.summary) {
        console.log("[AISummaryGenerator] Successfully extracted markdown sections");
        return {
          summary: sections.summary,
          mainParts: sections.mainParts || "Details not available",
          highlights: sections.highlights || []
        };
      }
      
      // If still failing, provide a basic response in markdown format
      console.warn("[AISummaryGenerator] Could not extract valid markdown sections, returning basic response");
      return {
        summary: "Unable to generate a detailed summary at this time. Please try again later.",
        mainParts: "Could not analyze the resource structure.",
        highlights: ["Summary generation encountered technical difficulties"]
      };
    }
  } catch (error) {
    console.error("Error generating resource summary with function calling:", error);
    
    // Return a basic structure instead of throwing
    return {
      summary: "Unable to generate a summary at this time due to technical difficulties. Please try again later.",
      mainParts: "Resource structure analysis unavailable.",
      highlights: ["Summary generation encountered an issue"]
    };
  }
};

// Default export with all methods
export default {
  generateResourceSummary,
  generateSummaryWithFunctionCalling
};
