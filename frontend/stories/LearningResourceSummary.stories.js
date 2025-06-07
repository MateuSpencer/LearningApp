import React from 'react';
import LearningResourceSummary from '../components/LearningResourceSummary';

export default {
  title: 'Components/LearningResourceSummary',
  component: LearningResourceSummary,
  argTypes: {
    onSummaryGenerated: { action: 'summary generated' }
  },
};

// Mock resource without a summary
const resourceWithoutSummary = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Introduction to Machine Learning',
  resource_type: 'video',
  primary_url: {
    url: 'https://example.com/intro-ml',
    is_primary: true
  },
  urls: [
    {
      url: 'https://example.com/intro-ml',
      is_primary: true
    }
  ],
  ai_summary_generated: false,
  ai_summary: null,
  ai_summary_generated_at: null
};

// Mock resource with a summary
const resourceWithSummary = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  title: 'Advanced Machine Learning Techniques',
  resource_type: 'article',
  primary_url: {
    url: 'https://example.com/advanced-ml',
    is_primary: true
  },
  urls: [
    {
      url: 'https://example.com/advanced-ml',
      is_primary: true
    }
  ],
  ai_summary_generated: true,
  ai_summary: 'This article explores advanced machine learning techniques including ensemble methods, deep learning architectures, and transfer learning.\n\nKey Highlights:\n1. Gradient boosting machines outperform random forests in many classification tasks.\n2. Transfer learning can dramatically reduce the amount of data needed for training.\n3. Attention mechanisms have revolutionized natural language processing applications.\n\nTarget Audience: Intermediate to advanced machine learning practitioners who already understand basic concepts.',
  ai_summary_generated_at: '2025-05-16T14:30:00Z'
};

// Template for the stories
const Template = (args) => <LearningResourceSummary {...args} />;

// Story for a resource without a summary (shows the generate button)
export const NoSummary = Template.bind({});
NoSummary.args = {
  resource: resourceWithoutSummary
};

// Story for a resource with a summary
export const WithSummary = Template.bind({});
WithSummary.args = {
  resource: resourceWithSummary
};

// Story for loading state
export const Loading = Template.bind({});
Loading.args = {
  resource: resourceWithoutSummary
};
Loading.parameters = {
  mockData: [
    {
      url: '/api/learning-resources/123e4567-e89b-12d3-a456-426614174000/set_ai_summary/',
      method: 'POST',
      status: 200,
      delay: 2000,
      response: {
        ai_summary: 'Generated summary content',
        ai_summary_generated: true,
        ai_summary_generated_at: new Date().toISOString()
      }
    }
  ]
};
