export const ASSISTANT_DLS_DEFAULT_SCENARIO = "baseline";

export const ASSISTANT_DLS_DEFAULT_MATRIX = [
  "baseline",
  "disabled-by-default-suppressed",
  "q1-then-q1-plus-q2",
  "others-only-self-speech",
  "language-switch-en-to-fa",
  "profile-switch-mid-session",
  "salience-first-client-call",
  "proactive-coach-mode",
  "daily-sync-bullets-fastest",
  "custom-prompt-short-paragraph",
  "improve-my-answer-script",
  "summarize-structured-sections",
];

export const ASSISTANT_DLS_SCENARIO_ALIASES = {
  baseline: "baseline-answer-for-me",
  "baseline-answer-for-me": "baseline-answer-for-me",
  "disabled-by-default-suppressed": "disabled-by-default-suppressed",
  "q1-then-q1-plus-q2": "q1-then-q1-plus-q2",
  "others-only-self-speech": "others-only-self-speech",
  "language-switch-en-to-fa": "language-switch-en-to-fa",
  "profile-switch-mid-session": "profile-switch-mid-session",
  "salience-first-client-call": "salience-first-client-call",
  "proactive-coach-mode": "proactive-coach-mode",
  "daily-sync-bullets-fastest": "daily-sync-bullets-fastest",
  "custom-prompt-short-paragraph": "custom-prompt-short-paragraph",
  "improve-my-answer-script": "improve-my-answer-script",
  "summarize-structured-sections": "summarize-structured-sections",
};

export const ASSISTANT_DLS_REQUIRED_OPTION_COVERAGE = {
  enabledByDefault: [true, false],
  responseIntent: [
    "answer_for_me",
    "improve_my_answer",
    "suggest_next_point",
    "summarize_what_was_just_said",
    "surface_risks",
    "coach_me",
  ],
  responseFormat: [
    "bullets",
    "talking_points",
    "short_paragraph",
    "structured_sections",
    "script",
  ],
  responseDepth: ["ultra_brief", "brief", "standard", "expanded"],
  responseTone: ["neutral", "direct", "supportive", "confident", "analytical"],
  deliveryBias: ["fastest", "balanced", "careful"],
  triggerPolicy: ["questions_requests_only", "salience_first", "proactive"],
  participantScope: ["all_participants", "others_only"],
};
