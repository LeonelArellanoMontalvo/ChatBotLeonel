# **App Name**: Gemini Tutor

## Core Features:

- AI Question Answering: Use the Gemini API to answer questions on a specified topic.
- API Management: Implement logic to handle Gemini API requests with rate limiting (using the free tier).
- Chat Interface: Display a simple chat interface where users can ask questions and see the bot's responses.
- Cloud Deployment: Deployment to a static web hosting service (e.g., Netlify or GitHub Pages) for public accessibility, ensuring CORS configuration is set up correctly.
- Loading and Error Handling: Provide clear visual feedback during loading or error states while waiting for Gemini's response. Implement error handling on API calls to manage scenarios where Gemini is unavailable.
- Output Validation: Use an LLM to evaluate the response based on pre defined criterea such as 'Correctness' and/or 'usefulness' to filter for safe usage as a tool

## Style Guidelines:

- Primary color: Blue (#3498db) for a calm and trustworthy feel.
- Background color: Light gray (#ecf0f1) to provide a clean and non-distracting backdrop.
- Accent color: Orange (#e67e22) to highlight interactive elements.
- Body and headline font: 'Inter', a grotesque-style sans-serif, for a clean and modern feel.
- Clean and straightforward layout for easy navigation.
- Subtle animations for loading states and transitions to improve user experience.