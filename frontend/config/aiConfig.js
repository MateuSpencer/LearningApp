// AI provider configuration file
export const AI_CONFIG = {
  // Default provider - use environment variable or fallback to "together"
  activeProvider: process.env.NEXT_PUBLIC_AI_PROVIDER || "together", // 'together', 'azure', 'google', 'openai'
  
  // API Keys from environment variables
  apiKeys: {
    // Together AI
    together: process.env.NEXT_PUBLIC_TOGETHER_AI_API_KEY || "", 

    // Azure OpenAI
    azure: {
      apiKey: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY || "",
      endpoint: process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT || "",
      deploymentName: process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT || ""
    },

    // Google Cloud
    google: process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || "",

    // OpenAI
    openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "",
  }
};

// Export provider options
export const AI_PROVIDERS = {
  TOGETHER: "together",
  AZURE: "azure", 
  GOOGLE: "google",
  OPENAI: "openai"
};

// Get current active provider configuration
export const getActiveProviderConfig = () => {
  const provider = AI_CONFIG.activeProvider;
  const config = {
    provider,
    apiKey: provider === "azure" 
      ? AI_CONFIG.apiKeys.azure.apiKey
      : AI_CONFIG.apiKeys[provider],
  };

  // Add additional config for Azure
  if (provider === "azure") {
    config.endpoint = AI_CONFIG.apiKeys.azure.endpoint;
    config.deploymentName = AI_CONFIG.apiKeys.azure.deploymentName;
  }

  return config;
};
