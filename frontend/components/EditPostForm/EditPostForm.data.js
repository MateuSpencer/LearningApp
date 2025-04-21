const EditPostFormData = {
  post: {
    id: '550e8400-e29b-41d4-a716-446655440000', // Example UUID
    title: 'Example Post Title',
    content: 'This is an example post content for testing the edit form component.',
    status: 'published',
    page_slug: 'example-article'
  },
  onSave: (updatedPost) => console.log('Post updated:', updatedPost),
  onCancel: () => console.log('Edit cancelled')
};

export default EditPostFormData;
