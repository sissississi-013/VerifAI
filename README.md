# VerifAI

**Demo Video**: https://youtu.be/ZQ2el5iI3Yw

Try it out: https://aistudio.google.com/apps/drive/1-bl2SoDHWMrV2ykjxi4hmtfwfO_nejJL?fullscreenApplet=true&showPreview=true&showAssistant=true


<img width="1920" height="1080" alt="Infosession Slides Spring 26&#39;" src="https://github.com/user-attachments/assets/1a05c24c-b4cc-44e5-ace9-c16b639630fd" />

**Real-time AI fact-checking agent for live meetings and video streams.**

VerifAI listens to your voice in real-time, detects factual claims, performs instant background research using Google Search, and overlays verification cards with data visualizations directly on your camera feed.


![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-preview-orange.svg)

## Key Features

*   **Always-On Listening:** Utilizes **Gemini Live (Multimodal Live API)** to continuously monitor speech for testable claims without wake words.
*   **Instant Verification:** Triggers **Gemini 3.0 Flash** with **Google Search Grounding** to verify statements in seconds.
*   **Dynamic Visualization:** Automatically generates verify/debunk cards with interactive **Recharts** (Bar, Line, Pie) for statistical data.
*   **Camera Overlay:** Draggable, semi-transparent UI cards designed for video conferencing overlays.
*   **Fact Library:** Sidebar history of all verified claims with source links.

## Tech Stack

*   **Frontend:** React 19, TypeScript, Tailwind CSS
*   **AI & Logic:** Google GenAI SDK (`@google/genai`)
*   **Models:** 
    *   *Detection:* `gemini-2.5-flash-native-audio-preview` (Live API)
    *   *Research:* `gemini-3-flash-preview` (Search Tool)
*   **Visuals:** Recharts, Lucide React

## Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Google AI Studio API Key (Paid tier required for search/live features).

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/verifai.git
    cd verifai
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    VITE_API_KEY=your_google_ai_studio_api_key
    ```
    *(Note: Ensure your bundler exposes this key as `process.env.API_KEY` or `import.meta.env.VITE_API_KEY`)*

4.  **Run the App**
    ```bash
    npm run dev
    ```

## Usage

1.  Allow camera and microphone permissions.
2.  Click the **Microphone** icon to go **LIVE**.
3.  Speak natural sentences containing facts (e.g., *"The global population grew by 1% last year"*).
4.  Watch the agent detect the claim and pop up a verification card.
5.  Drag cards to organize your view or open the **Library** to review sources.

## License

MIT License. See [LICENSE](LICENSE) for details.
