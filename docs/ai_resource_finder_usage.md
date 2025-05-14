# AI Resource Finder Usage Guide

The AI Resource Finder is a service that uses LLMs to discover high-quality learning resources on any topic. This document explains how to use the improved implementation that handles diverse AI model responses reliably.

## Basic Usage

```javascript
import aiResources from '../api/aiResources';

// Find resources on a topic
const handleFindResources = async () => {
  try {
    const resources = await aiResources.findResources('sand animation', {
      provider: 'together', // 'together', 'openai', 'azure', or 'google'
      useFunctionCalling: false // set to true for more reliable results with supporting providers
    });
    
    console.log(resources);
    // [
    //   {
    //     title: "Sand Animation: A Beginner's Guide",
    //     url: "https://example.com/sand-animation",
    //     description: "This tutorial covers the basics of sand animation...",
    //     resourceType: "video" // one of: "video", "article", "pdf", "website", "image"
    //   },
    //   // more resources...
    // ]
  } catch (error) {
    console.error('Error finding resources:', error);
  }
};
```

## Available Providers

The service supports multiple AI providers:

1. **Together AI** (`together`) - Default provider, free tier available
2. **OpenAI** (`openai`) - Requires API key, best results with GPT-4
3. **Azure OpenAI** (`azure`) - For enterprise deployments
4. **Google** (`google`) - Using Gemini model

## Function Calling vs. Structured Output

For providers that support function calling (OpenAI, Azure OpenAI, Google), we recommend using the `useFunctionCalling: true` option for more reliable structured outputs:

```javascript
const resources = await aiResources.findResources('machine learning', {
  provider: 'openai',
  apiKey: 'your-openai-api-key',
  useFunctionCalling: true
});
```

## Environment Variables

You can configure providers using environment variables:

```
NEXT_PUBLIC_AI_PROVIDER=together
NEXT_PUBLIC_AI_API_KEY=your-api-key
NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=your-endpoint
NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment
```

## Finding and Saving Resources in One Step

If you want to find resources and save them to your backend in one operation:

```javascript
const savedResources = await aiResources.findAndSaveResources('quantum computing', {
  provider: 'openai',
  pageId: 123 // Optional: associate resources with a specific page
});
```

## Error Handling

The improved implementation includes:
- Robust error handling
- Retries for parsing failures
- Fallback mechanisms
- Extraction of JSON from responses with invalid formatting

If you encounter issues with specific models or topics, try:

1. Switching to a different provider
2. Using function calling (for supported providers)
3. Being more specific with your topic

## Custom Integration

If you need more control over the resource finding process, you can directly use the service:

```javascript
import { findLearningResources } from '../services/aiResourceFinder';

const resources = await findLearningResources('topic', {
  provider: 'provider',
  apiKey: 'your-api-key',
  // Other provider-specific options
});
```
