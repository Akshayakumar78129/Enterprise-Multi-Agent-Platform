import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'status';
  content: string;
  timestamp: number;
  agent?: string;
  isStreaming?: boolean;
  audioData?: string;
  components?: Array<{
    type: string;
    toolId: string;
    data: any;
  }>;
}

export interface Conversation {
  id: string;
  messages: Message[];
  isActive: boolean;
  createdAt: number;
  lastMessageAt: number;
}

interface ConversationState {
  conversations: Record<string, Conversation>;
  activeConversationId: string | null;
  isStreaming: boolean;
  streamingContent: string;
  selectedAgent: string;
  currentProcessingAgent: string | null;
  processingSteps: string[];
}

const initialState: ConversationState = {
  conversations: {},
  activeConversationId: null,
  isStreaming: false,
  streamingContent: '',
  selectedAgent: 'general',
  currentProcessingAgent: null,
  processingSteps: []
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    createConversation: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.conversations[id] = {
        id,
        messages: [],
        isActive: true,
        createdAt: Date.now(),
        lastMessageAt: Date.now()
      };
      state.activeConversationId = id;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      if (state.activeConversationId && state.conversations[state.activeConversationId]) {
        state.conversations[state.activeConversationId].messages.push(action.payload);
        state.conversations[state.activeConversationId].lastMessageAt = Date.now();
      }
    },
    setStreamingState: (state, action: PayloadAction<boolean>) => {
      state.isStreaming = action.payload;
      if (!action.payload) {
        state.streamingContent = '';
      }
    },
    appendStreamingContent: (state, action: PayloadAction<string>) => {
      state.streamingContent += action.payload;
    },
    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversationId = action.payload;
    },
    clearConversation: (state, action: PayloadAction<string>) => {
      if (state.conversations[action.payload]) {
        state.conversations[action.payload].messages = [];
      }
    },
    setSelectedAgent: (state, action: PayloadAction<string>) => {
      state.selectedAgent = action.payload;
    },
    updateMessage: (state, action: PayloadAction<{ id: string; content: string }>) => {
      if (state.activeConversationId && state.conversations[state.activeConversationId]) {
        const messages = state.conversations[state.activeConversationId].messages;
        const messageIndex = messages.findIndex(msg => msg.id === action.payload.id);
        if (messageIndex !== -1) {
          messages[messageIndex].content = action.payload.content;
          messages[messageIndex].isStreaming = true;
        }
      }
    },
    setCurrentProcessingAgent: (state, action: PayloadAction<string | null>) => {
      state.currentProcessingAgent = action.payload;
    },
    addProcessingStep: (state, action: PayloadAction<string>) => {
      state.processingSteps.push(action.payload);
    },
    clearProcessingSteps: (state) => {
      state.processingSteps = [];
    }
  }
});

export const {
  createConversation,
  addMessage,
  setStreamingState,
  appendStreamingContent,
  setActiveConversation,
  clearConversation,
  setSelectedAgent,
  updateMessage,
  setCurrentProcessingAgent,
  addProcessingStep,
  clearProcessingSteps
} = conversationSlice.actions;

export default conversationSlice.reducer;