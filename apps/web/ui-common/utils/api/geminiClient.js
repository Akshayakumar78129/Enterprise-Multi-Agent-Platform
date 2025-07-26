/**
 * Enterprise IQ Gemini Client
 * 
 * A utility client for interacting with Google's Gemini 2.5 API, 
 * particularly focused on function calling capabilities to control UI components.
 */

// Function declaration registry
let registeredFunctions = [];

/**
 * Initialize the Gemini client with API key
 * @param {string} apiKey - The Gemini API key
 * @param {Object} options - Additional configuration options
 */
export const initializeGeminiClient = (apiKey, options = {}) => {
  if (!apiKey) {
    console.error('Gemini API key is required');
    return false;
  }
  
  window.GEMINI_API_KEY = apiKey;
  window.GEMINI_OPTIONS = {
    model: 'gemini-2.5-pro',
    temperature: 0.2,
    topK: 32,
    topP: 0.95,
    maxOutputTokens: 1000,
    ...options
  };
  
  return true;
};

/**
 * Register a function that can be called by Gemini
 * @param {Object} functionDeclaration - Function declaration in JSON Schema format
 * @param {Function} implementation - Actual function implementation
 */
export const registerFunction = (functionDeclaration, implementation) => {
  if (!functionDeclaration.name) {
    console.error('Function declaration must include a name');
    return false;
  }
  
  // Store both declaration and implementation
  registeredFunctions.push({
    declaration: functionDeclaration,
    implementation
  });
  
  return true;
};

/**
 * Register multiple functions at once
 * @param {Array} functions - Array of {declaration, implementation} objects
 */
export const registerFunctions = (functions) => {
  if (!Array.isArray(functions)) {
    console.error('registerFunctions expects an array');
    return false;
  }
  
  functions.forEach(func => {
    registerFunction(func.declaration, func.implementation);
  });
  
  return true;
};

/**
 * Get all registered function declarations (for sending to Gemini)
 * @returns {Array} Array of function declarations
 */
export const getFunctionDeclarations = () => {
  return registeredFunctions.map(func => func.declaration);
};

/**
 * Execute a function by name with provided arguments
 * @param {string} name - Function name
 * @param {Object} args - Function arguments
 * @returns {Promise} Result of function execution
 */
export const executeFunction = async (name, args) => {
  const func = registeredFunctions.find(f => f.declaration.name === name);
  
  if (!func) {
    throw new Error(`Function ${name} not found`);
  }
  
  try {
    return await func.implementation(args);
  } catch (error) {
    console.error(`Error executing function ${name}:`, error);
    throw error;
  }
};

/**
 * Send a message to Gemini with potential function calling
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @returns {Promise} Gemini response
 */
export const sendMessage = async (message, history = []) => {
  if (!window.GEMINI_API_KEY) {
    throw new Error('Gemini client not initialized. Call initializeGeminiClient first.');
  }
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': window.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          ...formatChatHistory(history),
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ],
        tools: [{
          functionDeclarations: getFunctionDeclarations()
        }],
        generationConfig: window.GEMINI_OPTIONS
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Unknown error from Gemini API');
    }
    
    // Handle function calling in response
    const result = await processFunctionCalling(data);
    return result;
    
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};

/**
 * Process function calling in Gemini response
 * @param {Object} response - Raw Gemini API response
 * @returns {Object} Processed response with function results
 */
const processFunctionCalling = async (response) => {
  if (!response.candidates || response.candidates.length === 0) {
    return { text: 'No response from Gemini', functionCalls: [] };
  }
  
  const candidate = response.candidates[0];
  const content = candidate.content;
  
  if (!content.parts || content.parts.length === 0) {
    return { text: 'Empty response from Gemini', functionCalls: [] };
  }
  
  // Check if response contains function calls
  const functionCalls = [];
  let responseText = '';
  
  for (const part of content.parts) {
    if (part.text) {
      responseText += part.text;
    }
    
    if (part.functionCall) {
      const functionCall = part.functionCall;
      console.log(`Executing function: ${functionCall.name}`, functionCall.args);
      
      try {
        // Execute the function and store result
        const result = await executeFunction(functionCall.name, functionCall.args);
        functionCalls.push({
          name: functionCall.name,
          args: functionCall.args,
          result
        });
      } catch (error) {
        functionCalls.push({
          name: functionCall.name,
          args: functionCall.args,
          error: error.message
        });
      }
    }
  }
  
  return {
    text: responseText,
    functionCalls
  };
};

/**
 * Format chat history for Gemini API
 * @param {Array} history - Array of message objects
 * @returns {Array} Formatted messages for Gemini API
 */
const formatChatHistory = (history) => {
  if (!history || !Array.isArray(history)) return [];
  
  return history.map(message => ({
    role: message.role || 'user',
    parts: [{ text: message.content || message.text || '' }]
  }));
};

/**
 * Call Gemini to explain visualization or data
 * @param {string} visualizationType - Type of visualization
 * @param {Object} data - Data being visualized
 * @param {string} query - User query about the visualization
 * @returns {Promise} Explanation from Gemini
 */
export const explainVisualization = async (visualizationType, data, query) => {
  const prompt = `
You are analyzing the following ${visualizationType} visualization:

Data: ${JSON.stringify(data)}

User question: "${query}"

Provide a concise, insightful explanation.
  `.trim();
  
  return await sendMessage(prompt);
};

/**
 * Get function call suggestions from Gemini based on current state
 * @param {Object} currentState - Current application state
 * @returns {Promise} Suggested function calls
 */
export const getSuggestions = async (currentState) => {
  const prompt = `
Based on the current state of the application:

${JSON.stringify(currentState, null, 2)}

What actions would be most helpful to the user? Suggest up to 3 function calls that would provide valuable insights or improve the user experience.
  `.trim();
  
  return await sendMessage(prompt);
};

// Export the API
export default {
  initializeGeminiClient,
  registerFunction,
  registerFunctions,
  getFunctionDeclarations,
  executeFunction,
  sendMessage,
  explainVisualization,
  getSuggestions
}; 