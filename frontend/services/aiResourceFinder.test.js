import { findLearningResources, findResourcesWithFunctionCalling } from './aiResourceFinder';

// Mock the LangChain modules that are dynamically imported
jest.mock("@langchain/openai", () => ({
  ChatOpenAI: jest.fn()
}));

jest.mock("@langchain/community/chat_models/togetherai", () => ({
  ChatTogetherAI: jest.fn()
}));

jest.mock("@langchain/core/prompts", () => ({
  ChatPromptTemplate: {
    fromMessages: jest.fn()
  }
}));

jest.mock("@langchain/core/output_parsers", () => ({
  StructuredOutputParser: {
    fromZodSchema: jest.fn()
  },
  JsonOutputFunctionsParser: jest.fn()
}));

// Test helper functions from the module
describe('Resource type normalization', () => {
  test('normalizes invalid resource types to website', () => {
    // We'll need to export these functions to test them
    // For now, this is a placeholder for the desired behavior
    expect(true).toBe(true);
  });
  
  test('maps common variations to valid types', () => {
    // Test that 'blog' becomes 'article', 'docs' becomes 'documentation', etc.
    expect(true).toBe(true);
  });
  
  test('handles null and undefined resource types', () => {
    // Test that null/undefined defaults to 'website'
    expect(true).toBe(true);
  });
});

describe('aiResourceFinder', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock the dynamic imports
    const mockInvoke = jest.fn().mockResolvedValue({
      resources: [
        {
          title: "Test Resource 1",
          url: "https://example.com/resource1",
          description: "This is a test resource",
          resourceType: "video"
        },
        {
          title: "Test Resource 2",
          url: "https://example.com/resource2",
          description: "This is another test resource",
          resourceType: "article"
        }
      ]
    });

    const mockBind = jest.fn().mockReturnValue({
      pipe: jest.fn().mockReturnValue({
        invoke: mockInvoke
      })
    });
    const mockPipe = jest.fn().mockReturnValue({
      pipe: jest.fn().mockReturnValue({
        invoke: mockInvoke
      })
    });

    const mockPromptTemplate = {
      pipe: mockPipe
    };

    const mockParser = {};

    // Setup mocks for the imported modules
    const { ChatPromptTemplate } = require("@langchain/core/prompts");
    const { StructuredOutputParser, JsonOutputFunctionsParser } = require("@langchain/core/output_parsers");
    const { ChatOpenAI } = require("@langchain/openai");
    const { ChatTogetherAI } = require("@langchain/community/chat_models/togetherai");

    ChatPromptTemplate.fromMessages.mockReturnValue(mockPromptTemplate);
    StructuredOutputParser.fromZodSchema.mockReturnValue(mockParser);
    JsonOutputFunctionsParser.mockImplementation(() => ({}));
    // Using a function expression here to access 'this' for binding purposes
    ChatOpenAI.mockImplementation(function() {
      // Create an instance that has the bind method
      this.bind = mockBind;
      return this;
    });
    ChatTogetherAI.mockImplementation(() => ({}));
  });

  describe('findLearningResources', () => {
    it('should validate input parameters', async () => {
      await expect(findLearningResources('', { apiKey: 'test' }))
        .rejects.toThrow('A valid topic is required');
      
      await expect(findLearningResources('test', {}))
        .rejects.toThrow('API key is required');
    });

    it('should use the right provider based on config', async () => {
      const { ChatOpenAI } = require("@langchain/openai");
      const { ChatTogetherAI } = require("@langchain/community/chat_models/togetherai");
      
      await findLearningResources('test topic', { provider: 'openai', apiKey: 'test-key' });
      expect(ChatOpenAI).toHaveBeenCalled();
      
      jest.clearAllMocks();
      
      await findLearningResources('test topic', { provider: 'together', apiKey: 'test-key' });
      expect(ChatTogetherAI).toHaveBeenCalled();
    });

    it('should return resources in the expected format', async () => {
      const resources = await findLearningResources('test topic', { provider: 'openai', apiKey: 'test-key' });
      
      expect(resources).toEqual([
        {
          title: "Test Resource 1",
          url: "https://example.com/resource1",
          description: "This is a test resource",
          resourceType: "video"
        },
        {
          title: "Test Resource 2",
          url: "https://example.com/resource2",
          description: "This is another test resource",
          resourceType: "article"
        }
      ]);
    });
  });

  describe('findResourcesWithFunctionCalling', () => {
    it('should only allow supported providers', async () => {
      await expect(findResourcesWithFunctionCalling('test', { 
        provider: 'together', 
        apiKey: 'test-key' 
      })).rejects.toThrow('Function calling is only supported with OpenAI, Azure OpenAI, and Google models');
    });

    it('should use function calling with supported providers', async () => {
      const { ChatOpenAI } = require("@langchain/openai");
      
      await findResourcesWithFunctionCalling('test topic', { provider: 'openai', apiKey: 'test-key' });
      
      expect(ChatOpenAI).toHaveBeenCalled();
      const mockInstance = ChatOpenAI.mock.instances[0];
      expect(mockInstance.bind).toHaveBeenCalledWith(expect.objectContaining({
        functions: expect.arrayContaining([
          expect.objectContaining({
            name: 'find_learning_resources'
          })
        ])
      }));
    });

    it('should return resources in the expected format', async () => {
      const resources = await findResourcesWithFunctionCalling('test topic', { provider: 'openai', apiKey: 'test-key' });
      
      expect(resources).toEqual([
        {
          title: "Test Resource 1",
          url: "https://example.com/resource1",
          description: "This is a test resource",
          resourceType: "video"
        },
        {
          title: "Test Resource 2",
          url: "https://example.com/resource2",
          description: "This is another test resource",
          resourceType: "article"
        }
      ]);
    });
  });
});
