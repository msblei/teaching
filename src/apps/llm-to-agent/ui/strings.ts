import type { Text } from "../../../lib/i18n";

// All UI copy for the app, DE and EN. Kept short on purpose: Marius explains
// the concepts live, the app only labels things. No em dashes, no emojis.
export const S = {
  // Progress steps in the header
  model: { de: "Modell", en: "Model" },
  tools: { de: "Werkzeuge", en: "Tools" },
  instructions: { de: "Ziel", en: "Goal" },

  greeting: { de: "Womit kann ich helfen?", en: "What can I help with?" },
  placeholder: { de: "Frag irgendwas", en: "Ask anything" },
  send: { de: "Senden", en: "Send" },
  newChat: { de: "Neuer Chat", en: "New chat" },
  theme: { de: "Hell oder dunkel", en: "Light or dark" },
  thinking: { de: "Denkt nach", en: "Thinking" },

  addTools: { de: "Werkzeuge hinzufügen", en: "Add tools" },
  results: { de: "Treffer", en: "results" },
  demoData: { de: "Beispieldaten", en: "demo data" },
  toolError: { de: "fehlgeschlagen", en: "failed" },
  memberSince: { de: "Mitglied seit", en: "member since" },

  attachPhoto: { de: "Foto anhängen", en: "Attach a photo" },
  removePhoto: { de: "Foto entfernen", en: "Remove photo" },
  /** Sent when a photo goes out without any text. */
  photoDefault: { de: "Was ist das, und was ist es gebraucht wert?", en: "What is this, and what is it worth second-hand?" },

  missionsTitle: { de: "Gib deinem Agenten ein Ziel", en: "Give your agent a goal" },
  goalReached: { de: "Ziel erreicht", en: "Goal reached" },
  goalMissed: { de: "Ziel nicht erreicht", en: "Goal not reached" },
  goalItems: { de: "Teile", en: "items" },
  goalOpen: { de: "noch offen", en: "still open" },
  goalReport: { de: "Fortschritt gemeldet", en: "Reported progress" },
  step: { de: "Schritt", en: "Step" },
  startMission: { de: "Agent starten", en: "Start agent" },
  cancel: { de: "Schliessen", en: "Close" },
  showInstructions: { de: "Ganze Anweisungen anzeigen", en: "Show full instructions" },
  hideInstructions: { de: "Anweisungen ausblenden", en: "Hide instructions" },
  editHint: { de: "Du kannst den Text direkt bearbeiten.", en: "You can edit the text directly." },
  removeInstructions: { de: "Ziel entfernen", en: "Remove goal" },

  copy: { de: "Kopieren", en: "Copy" },
  copied: { de: "Kopiert", en: "Copied" },
  stepCap: { de: "Schrittlimit erreicht. Der Harness verlangt jetzt eine Antwort.", en: "Step limit reached. The harness now demands an answer." },
  refused: { de: "Das Modell hat diese Anfrage abgelehnt.", en: "The model declined this request." },
  noKey: {
    de: "Noch kein API-Key aktiv. Warte kurz auf die Kursleitung und sende die Nachricht dann nochmals.",
    en: "No API key active yet. Please wait for your instructor, then send the message again.",
  },
  errBusy: { de: "Gerade viel los. Bitte gleich nochmals versuchen.", en: "Busy right now. Please try again in a moment." },
  errGeneric: { de: "Da ist etwas schiefgelaufen. Bitte nochmals versuchen.", en: "Something went wrong. Please try again." },

  // Level unlocked + spotlight onboarding
  /** {n} is the level number. */
  levelUnlocked: { de: "Level {n} freigeschaltet", en: "Level {n} unlocked" },
  levelToolsSub: { de: "Dein Modell kann jetzt etwas tun.", en: "Your model can now do things." },
  levelInstrSub: { de: "Gib deinem Agenten ein Ziel, das er selbst überprüfen kann.", en: "Give your agent a goal it can check for itself." },
  levelGo: { de: "Weiter", en: "Continue" },
  tourToolsButton: { de: "Gib deinem Modell Werkzeuge.", en: "Give your model tools." },
  tourToolsMenu: { de: "Schalte ein Werkzeug ein.", en: "Switch on a tool." },
  tourMissions: { de: "Öffne das Ziel, passe es an und starte deinen Agenten.", en: "Open the goal, make it yours and start your agent." },
  tourSkip: { de: "Überspringen", en: "Skip" },

  // View switch
  viewChat: { de: "Chat", en: "Chat" },
  viewTrace: { de: "Unter der Haube", en: "Under the hood" },

  // "Under the hood" view
  laneModel: { de: "Modell", en: "Model" },
  laneApp: { de: "Harness", en: "Harness" },
  laneAppSub: { de: "führt den Loop aus", en: "runs the loop" },
  laneTools: { de: "Werkzeuge", en: "Tools" },
  laneToolsSub: { de: "tutti.ch, toppreise.ch", en: "tutti.ch, toppreise.ch" },
  harnessChecks: { de: "Harness prüft selbst", en: "Harness checks itself" },
  traceEmpty: { de: "Schreib eine Nachricht und schau zu, was dabei passiert.", en: "Send a message and watch what happens." },
  you: { de: "Du", en: "You" },
  turn: { de: "Nachricht", en: "Message" },
  request: { de: "Anfrage", en: "Request" },
  messagesN: { de: "Nachrichten", en: "messages" },
  toolsN: { de: "Werkzeuge", en: "tools" },
  noTools: { de: "keine Werkzeuge", en: "no tools" },
  showRequest: { de: "Ganze Anfrage anzeigen", en: "Show full request" },
  hideRequest: { de: "Anfrage ausblenden", en: "Hide request" },
  response: { de: "Antwort", en: "Response" },
  waiting: { de: "Wartet auf das Modell", en: "Waiting for the model" },
  wantsTool: { de: "Das Modell möchte ein Werkzeug benutzen", en: "The model wants to use a tool" },
  finalAnswer: { de: "Antwort an dich", en: "Answer for you" },
  appCalls: { de: "Harness ruft auf", en: "Harness calls" },
  result: { de: "Ergebnis", en: "Result" },
  backToModel: { de: "geht mit der nächsten Anfrage zurück ans Modell", en: "goes back to the model with the next request" },
  showData: { de: "Daten anzeigen", en: "Show data" },
  hideData: { de: "Daten ausblenden", en: "Hide data" },
  isNew: { de: "neu", en: "new" },
  roleSystem: { de: "Anweisungen", en: "Instructions" },
  roleUser: { de: "Du", en: "You" },
  roleAssistant: { de: "Modell", en: "Model" },
  roleTool: { de: "Werkzeug-Ergebnis", en: "Tool result" },
  sourceLive: { de: "live", en: "live" },
  sourceCache: { de: "aus dem Cache", en: "from cache" },
  sourceDemo: { de: "Beispieldaten", en: "demo data" },

  codeTitle: { de: "Workshop-Code", en: "Workshop code" },
  codeGo: { de: "Weiter", en: "Continue" },
  codeWrong: { de: "Dieser Code stimmt nicht.", en: "That code is not valid." },
  codeOff: { de: "Dieser Workshop ist gerade nicht aktiv.", en: "This workshop isn't active right now." },

  /** Shown on the empty chat (model only). */
  chipsModel: [
    { de: "Was kosten gebrauchte Ski gerade auf tutti?", en: "What do used skis cost on tutti right now?" },
    { de: "Erkläre mir in zwei Sätzen, was du bist.", en: "Explain in two sentences what you are." },
  ],
  /** Shown one after the other once tools are on. */
  chipsTools: [
    { de: "Was kosten gebrauchte Ski gerade auf tutti?", en: "What do used skis cost on tutti right now?" },
    { de: "Ist das günstigste Paar davon ein guter Deal?", en: "Is the cheapest pair a good deal?" },
  ],
} satisfies Record<string, Text | Text[]>;
