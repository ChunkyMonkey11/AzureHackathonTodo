import { AzureOpenAI } from "openai";

const fetchAIResponse = async (taskText, description) => {
  const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
  const deployment = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT; 
  const apiVersion = "2024-05-01-preview";

  if (!endpoint || !apiKey || !deployment) {
    console.error("❌ Missing required environment variables");
    console.error({
      endpoint: !!endpoint,
      apiKey: !!apiKey,
      deployment: !!deployment,
    });
    throw new Error("Missing required environment variables");
  }

  console.log("🔹 Debugging API Call:");
  console.log("🔹 Endpoint:", endpoint);
  console.log("🔹 Deployment:", deployment);

  try {
    const client = new AzureOpenAI({
      apiKey,
      endpoint,
      deployment,
      apiVersion,
      dangerouslyAllowBrowser: true,
    });

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

    console.log("🔹 Full API Response:", JSON.stringify(response, null, 2));

    if (!response.choices || response.choices.length === 0) {
      throw new Error("No AI response received.");
    }

    // Parse the response as JSON
    try {
      const content = response.choices[0].message.content.trim();
      return JSON.parse(content);
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return {
        summary: "Error generating structured response",
        steps: [],
        estimatedTime: "Unknown",
        difficulty: "medium",
        relatedTasks: []
      };
    }
  } catch (error) {
    console.error("❌ Error fetching AI description:", error);
    return {
      summary: "Error generating AI response",
      steps: [],
      estimatedTime: "Unknown",
      difficulty: "medium",
      relatedTasks: []
    };
  }
};

export default fetchAIResponse;
