import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agent?: string;
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
}

const initialState: ConversationState = {
  conversations: {},
  activeConversationId: null,
  isStreaming: false,
  streamingContent: '',
  selectedAgent: 'general'
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
  setSelectedAgent
} = conversationSlice.actions;

export default conversationSlice.reducer;