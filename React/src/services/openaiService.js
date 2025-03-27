/**
 * OpenAI Service for Task Analysis
 * 
 * This service integrates with Azure OpenAI to provide AI-powered task analysis.
 * It requires the following environment variables to be set in your .env file:
 * 
 * REACT_APP_AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
 * REACT_APP_AZURE_OPENAI_API_KEY=your_azure_openai_api_key
 * REACT_APP_AZURE_OPENAI_DEPLOYMENT=your_azure_openai_deployment
 * 
 * Make sure to create a .env file in the root of your React project
 * and add these variables with your Azure OpenAI credentials.
 */

import { AzureOpenAI } from "openai";

const fetchAIResponse = async (taskText, description) => {
  // Get environment variables
  const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
  const deployment = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT; 
  const apiVersion = "2024-05-01-preview";

  // Validate environment variables
  if (!endpoint || !apiKey || !deployment) {
    console.error("❌ Azure OpenAI environment variables are missing");
    console.error("Please make sure you have set the following in your .env file:");
    console.error("- REACT_APP_AZURE_OPENAI_ENDPOINT");
    console.error("- REACT_APP_AZURE_OPENAI_API_KEY");
    console.error("- REACT_APP_AZURE_OPENAI_DEPLOYMENT");
    
    return {
      summary: "AI features are not configured",
      steps: [{
        step: "Configuration Required",
        details: "The AI features require Azure OpenAI credentials. Please set up your environment variables.",
        resources: []
      }],
      estimatedTime: "N/A",
      difficulty: "medium",
      relatedTasks: []
    };
  }

  console.log("🔹 Initializing Azure OpenAI client...");

  try {
    // Initialize Azure OpenAI client
    const client = new AzureOpenAI({
      apiKey,
      endpoint,
      deployment,
      apiVersion,
      dangerouslyAllowBrowser: true,
    });

    // Prepare the chat completion request
    const response = await client.chat.completions.create({
      model: "gpt-35-turbo",
      messages: [
        {
          role: "system",
          content: `
You are a helpful AI assistant specializing in task management and productivity. 
Your goal is to provide actionable guidance and relevant resources.

**Response Format:**
{
  "summary": "Brief 2-3 sentence summary of the task",
  "steps": [
    {
      "step": "Step description",
      "details": "Additional context or explanation",
      "resources": [
        {
          "title": "Resource name",
          "url": "https://example.com",
          "type": "article|video|tool|book"
        }
      ]
    }
  ],
  "estimatedTime": "Estimated time to complete",
  "difficulty": "easy|medium|hard",
  "relatedTasks": ["Related task 1", "Related task 2"]
}

Keep responses concise and focused on practical, actionable advice.
          `.trim(),
        },
        {
          role: "user",
          content: `
Task: ${taskText}

${description ? "Existing Description: " + description : ""}

Provide structured guidance and resources to help complete this task.
          `.trim(),
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("No AI response received.");
    }

    // Parse and validate the response
    try {
      const content = response.choices[0].message.content.trim();
      const parsedResponse = JSON.parse(content);
      
      // Validate required fields
      if (!parsedResponse.summary || !Array.isArray(parsedResponse.steps)) {
        throw new Error("Invalid response format");
      }

      return parsedResponse;
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return {
        summary: "Error: Could not process AI response",
        steps: [{
          step: "Error occurred",
          details: "There was an error processing the AI response. Please try again.",
          resources: []
        }],
        estimatedTime: "Unknown",
        difficulty: "medium",
        relatedTasks: []
      };
    }
  } catch (error) {
    console.error("❌ Azure OpenAI API Error:", error);
    return {
      summary: "Error: Could not connect to AI service",
      steps: [{
        step: "Service unavailable",
        details: "There was an error connecting to the AI service. Please check your credentials and try again.",
        resources: []
      }],
      estimatedTime: "Unknown",
      difficulty: "medium",
      relatedTasks: []
    };
  }
};

export default fetchAIResponse;
