// Global test setup

// Polyfill for fetch API in tests
import 'whatwg-fetch';

// Polyfill for TextEncoder/TextDecoder (required by LangChain libraries)
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Polyfill for ReadableStream (required by LangChain libraries)
// Polyfill for ReadableStream (required by LangChain libraries)
// Note: This implementation provides only the minimal interface required for tests.
// It does not fully replicate the behavior of a real ReadableStream and should not be used in production.
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() {
      return {
        read: () => Promise.resolve({ done: true, value: undefined }),
        releaseLock: () => {},
      };
    }
  };
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    reload: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Add any additional global test setup here
