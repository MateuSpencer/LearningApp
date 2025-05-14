import { findLearningResources, findResourcesWithFunctionCalling } from './aiResourceFinder';
import { ChatOpenAI } from "@langchain/openai";
import { ChatTogetherAI } from "@langchain/community/chat_models/togetherai";

// Mock the LangChain modules
jest.mock("@langchain/openai");
jest.mock("@langchain/community/chat_models/togetherai");

describe('aiResourceFinder', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock implementations for LangChain models
    ChatOpenAI.mockImplementation(() => ({
      bind: jest.fn().mockReturnValue({
        invoke: jest.fn().mockResolvedValue({
          content: JSON.stringify({
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
          })
        })
      }),
      pipe: jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          invoke: jest.fn().mockResolvedValue({
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
          })
        })
      })
    }));
    
    ChatTogetherAI.mockImplementation(() => ({
      pipe: jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          invoke: jest.fn().mockResolvedValue({
            resources: [
              {
                title: "Together Test Resource 1",
                url: "https://example.com/resource1",
                description: "This is a test resource from Together AI",
                resourceType: "video"
              }
            ]
          })
        })
      })
    }));
  });

  describe('findLearningResources', () => {
    it('should validate input parameters', async () => {
      await expect(findLearningResources('', { apiKey: 'test' }))
        .rejects.toThrow('A valid topic is required');
      
      await expect(findLearningResources('test', {}))
        .rejects.toThrow('API key is required');
    });

    it('should use the right provider based on config', async () => {
      await findLearningResources('test topic', { provider: 'openai', apiKey: 'test-key' });
      expect(ChatOpenAI).toHaveBeenCalled();
      
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
      await findResourcesWithFunctionCalling('test topic', { provider: 'openai', apiKey: 'test-key' });
      
      expect(ChatOpenAI).toHaveBeenCalled();
      expect(ChatOpenAI.mock.instances[0].bind).toHaveBeenCalledWith(expect.objectContaining({
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
