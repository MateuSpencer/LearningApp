// Service for finding learning resources using AI
import { z } from "zod";
// Import TavilySearch directly as it's our default provider
import { TavilySearch } from "@langchain/tavily";
// Other imports will be loaded dynamically when needed to prevent unnecessary loading

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
    return null;
  }
};

/**
 * Normalize and validate resource types, defaulting to 'website' for invalid types
 * @param {string} resourceType - The resource type to normalize
 * @returns {string} A valid resource type
 */
const normalizeResourceType = (resourceType) => {
  if (!resourceType || typeof resourceType !== 'string') {
    return 'website';
  }
  
  const validTypes = [
    'website', 'youtube', 'video', 'pdf', 'article', 
    'book', 'course', 'documentation', 'tutorial', 'image', 'tool'
  ];
  
  const normalizedType = resourceType.toLowerCase().trim();
  
  if (validTypes.includes(normalizedType)) {
    return normalizedType;
  }
  
  // Map common variations to valid types
  const typeMapping = {
    'web': 'website',
    'webpage': 'website',
    'site': 'website',
    'url': 'website',
    'link': 'website',
    'blog': 'article',
    'blogpost': 'article',
    'post': 'article',
    'guide': 'tutorial',
    'howto': 'tutorial',
    'instructions': 'tutorial',
    'docs': 'documentation',
    'doc': 'documentation',
    'reference': 'documentation',
    'manual': 'documentation',
    'lesson': 'course',
    'class': 'course',
    'training': 'course',
    'lecture': 'video',
    'movie': 'video',
    'film': 'video',
    'clip': 'video',
    'ebook': 'book',
    'textbook': 'book',
    'publication': 'book',
    'software': 'tool',
    'app': 'tool',
    'application': 'tool',
    'utility': 'tool',
    'resource': 'website'
  };
  
  if (typeMapping[normalizedType]) {
    return typeMapping[normalizedType];
  }
  
  // Default fallback
  return 'website';
};

/**
 * Process and validate resources, ensuring all have valid types
 * @param {Array} resources - Array of resource objects
 * @returns {Array} Array of validated resource objects
 */
const processResources = (resources) => {
  if (!Array.isArray(resources)) {
    return [];
  }
  
  return resources.map(resource => ({
    ...resource,
    resourceType: normalizeResourceType(resource.resourceType)
  })).filter(resource => 
    resource.title && 
    resource.url && 
    resource.description &&
    resource.resourceType
  );
};

// Schema for learning resources - aligned with frontend form options
const resourceSchema = z.object({
  resources: z.array(
    z.object({
      title: z.string().describe("Title of the resource"),
      url: z.string().url().describe("URL of the resource"),
      description: z.string().describe("Short description of the resource"),
      resourceType: z.enum([
        "website", "youtube", "video", "pdf", "article", 
        "book", "course", "documentation", "tutorial", "image", "tool"
      ]).describe("Type of resource")
    })
  ).describe("List of learning resources for the topic")
});

/**
 * Initialize a Together AI model
 * Available models:
 * - meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
 * - deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free
 */
const getTogetherAIModel = async (togetherApiKey, modelName = "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free") => {
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
 * Find learning resources for a topic using AI
 */
export const findLearningResources = async (topic, apiConfig) => {
  try {
    // Import required modules
    const { ChatPromptTemplate } = await import("@langchain/core/prompts");
    const { StructuredOutputParser } = await import("@langchain/core/output_parsers");
    
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
      "resourceType": "video|youtube|pdf|image|website|article|book|course|documentation|tutorial|tool"
    }},
    // Additional resources...
  ]
}}
\`\`\`

The response must be a valid JSON object with a "resources" array. 
Each resource must have all four fields: title, url, description, and resourceType.
The resourceType must be one of: "video", "youtube", "pdf", "image", "website", "article", "book", "course", "documentation", "tutorial", or "tool".
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
        return processResources(result.resources);
      } catch (error) {
        lastError = error;
        
        // If it's a validation error (invalid enum values), try to parse and fix the data
        if (error.message.includes("Invalid enum value") || error.message.includes("Failed to parse")) {
          try {
            // Extract the raw text from the error message if available
            const errorText = error.message;
            const textMatch = errorText.match(/Text: "(.*?)"\. Error:/s);
            
            if (textMatch && textMatch[1]) {
              const rawText = textMatch[1];
              const extractedJson = extractJsonFromText(rawText);
              
              if (extractedJson && extractedJson.resources) {
                // Process resources with type normalization
                const processedResources = processResources(extractedJson.resources);
                if (processedResources.length > 0) {
                  return processedResources;
                }
              }
            }
          } catch (fallbackError) {
            // Continue to other error handling
          }
        }
        
        // If it's not a parsing error, don't retry
        if (!error.message.includes("parsing") && 
            !error.message.includes("SyntaxError") && 
            !error.message.includes("Unterminated") &&
            !error.message.includes("Invalid enum value")) {
          break;
        }
        
        attempts++;
        
        // On the last retry, attempt a direct call to the model without the parser
        if (attempts === MAX_RETRIES) {
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

The resourceType must be one of: "video", "youtube", "pdf", "image", "website", "article", "book", "course", "documentation", "tutorial", or "tool".
DO NOT include ANY explanatory text, markdown formatting, or code blocks outside the JSON.`],
              ["human", `Find the top 5 learning resources for ${topic}. Respond ONLY with the JSON structure.`]
            ]);
            
            const directResponse = await directPrompt.pipe(model).invoke({});
            
            // Extract JSON from the response
            const responseText = directResponse.content;
            const extractedJson = extractJsonFromText(responseText);
            
            if (extractedJson && extractedJson.resources && Array.isArray(extractedJson.resources)) {
              return processResources(extractedJson.resources);
            }
            
            throw new Error("Failed to extract valid JSON structure from model response");
          } catch (directError) {
            throw lastError; // Throw the original error
          }
        }
      }
    }
    
    throw lastError || new Error("Failed to find learning resources");

  } catch (error) {
    throw error;
  }
};

/**
 * Find learning resources using function calling approach for models that support it
 * This is an alternative implementation that may provide more reliable structured output
 */
export const findResourcesWithFunctionCalling = async (topic, apiConfig) => {
  try {
    // Dynamically import required modules
    const { ChatPromptTemplate } = await import("@langchain/core/prompts");
    const { JsonOutputFunctionsParser } = await import("@langchain/core/output_parsers");
    const { ChatOpenAI } = await import("@langchain/openai");
    
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
                  enum: ["website", "youtube", "video", "pdf", "article", "book", "course", "documentation", "tutorial", "image", "tool"],
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
    
    return processResources(result.resources);
  } catch (error) {
    // If function calling fails, try to extract and process any partial results
    if (error.message && error.message.includes("resources")) {
      try {
        const extractedJson = extractJsonFromText(error.message);
        if (extractedJson && extractedJson.resources) {
          const processedResources = processResources(extractedJson.resources);
          if (processedResources.length > 0) {
            return processedResources;
          }
        }
      } catch (fallbackError) {
        // Continue to throw original error
      }
    }
    throw error;
  }
};

/**
 * Find learning resources using Tavily Search API
 */
export const findLearningResourcesWithTavily = async (topic, apiConfig) => {
  try {
    // Input validation
    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      throw new Error("A valid topic is required");
    }

    // Use apiKey from apiConfig, or directly from environment variable
    const tavilyApiKey = apiConfig?.apiKey || process.env.NEXT_PUBLIC_TAVILY_API_KEY;
    
    if (!tavilyApiKey) {
      throw new Error("Tavily API key is required");
    }

    // Set the environment variable that the Tavily library expects
    process.env.TAVILY_API_KEY = tavilyApiKey;

    // Configure Tavily Search - using default constructor which picks up TAVILY_API_KEY
    const tavily = new TavilySearch({
      maxResults: 5,
      includeRawContent: false,
      includeImages: false,
      searchDepth: "moderate", // Use "basic" for faster results, "moderate" for more comprehensive
      k: 5 // Number of results to return
    });

    // Execute search
    const searchQuery = `best learning resources for "${topic}" for educational purposes. No wikipedia pages`;
    const searchResults = await tavily.invoke({
      query: searchQuery
    });

    // Transform the results to match our expected format
    const resources = searchResults.results.map(result => {
      let resourceType = "website"; // Default type

      // Determine resource type based on URL or content
      if (result.url.includes("youtube.com") || result.url.includes("youtu.be")) {
        resourceType = "youtube";
      } else if (result.url.includes("vimeo.com") || result.url.includes("dailymotion.com")) {
        resourceType = "video";
      } else if (result.url.endsWith(".pdf")) {
        resourceType = "pdf";
      } else if (result.url.endsWith(".jpg") || result.url.endsWith(".png") || 
                result.url.endsWith(".gif") || result.url.endsWith(".jpeg")) {
        resourceType = "image";
      } else if (result.url.includes("blog") || 
                result.url.includes("article") || 
                result.url.includes("tutorial") ||
                result.content.length > 100) {
        resourceType = "article";
      } else if (result.url.includes("course") || result.url.includes("udemy") ||
                result.url.includes("coursera") || result.url.includes("edx")) {
        resourceType = "course";
      } else if (result.url.includes("docs") || result.url.includes("documentation")) {
        resourceType = "documentation";
      } else if (result.url.includes("book") || result.url.includes("ebook")) {
        resourceType = "book";
      } else if (result.url.includes("tool") || result.url.includes("software")) {
        resourceType = "tool";
      }

      return {
        title: result.title,
        url: result.url,
        description: result.content.substring(0, 200) + (result.content.length > 200 ? "..." : ""),
        resourceType: resourceType
      };
    });

    return resources;
  } catch (error) {
    throw error;
  }
};

// Default export with all methods and provider options
export default {
  findLearningResources,
  findResourcesWithFunctionCalling,
  findLearningResourcesWithTavily,
  providers: {
    together: "together",
    azure: "azure", 
    google: "google",
    openai: "openai",
    tavily: "tavily"
  }
};
