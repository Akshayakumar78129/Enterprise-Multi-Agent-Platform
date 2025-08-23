// Placeholder for potential Redux slice integration.
// Implement store wiring in app root if Redux is adopted.
export interface NextPurchaseChatState {
  lastInteraction: number | null;
}

const initialState: NextPurchaseChatState = {
  lastInteraction: null
};

export const nextPurchaseChatReducer = (state = initialState, action: any): NextPurchaseChatState => {
  switch (action.type) {
    case 'chat/interaction':
      return { ...state, lastInteraction: Date.now() };
    default:
      return state;
  }
};
