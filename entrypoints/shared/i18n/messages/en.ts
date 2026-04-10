import type { MessageTree } from "../types";

export const enMessages = {
  common: {
    appName: "CaptionArc",
    quickAccess: "Quick Access",
    actions: {
      cancel: "Cancel",
      clear: "Clear",
      close: "Close",
      collapse: "Collapse",
      confirmDelete: "Confirm delete",
      delete: "Delete",
      expand: "Expand",
      hide: "Hide",
      loading: "Loading...",
      open: "Open",
      show: "Show",
      continue: "Continue",
      working: "Working...",
    },
    brands: {
      openAi: "OpenAI",
    },
    noContentYet: "No content yet.",
    meetingPlatforms: {
      googleMeet: "Google Meet",
      microsoftTeams: "Teams",
      zoomWeb: "Zoom",
      generic: "Meeting",
    },
    theme: {
      group: "Theme",
      system: "Use system theme",
      light: "Use light theme",
      dark: "Use dark theme",
    },
    optional: "(optional)",
    uiLanguage: {
      label: "Interface language",
      description:
        "Choose the language used by popup, settings, history, and in-meeting UI.",
      system: "Use browser language",
      locales: {
        en: "English",
        fa: "فارسی",
        ar: "العربية",
        es: "Español",
        fr: "Français",
        de: "Deutsch",
        pt: "Português",
        ru: "Русский",
        hi: "हिन्दी",
        zh: "中文",
        ja: "日本語",
        ko: "한국어",
      },
    },
    links: {
      github: "GitHub",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
    },
    legal: {
      version: "Version {version}",
      copyright: "Copyright © {year} CaptionArc",
    },
    firstRunTerms: {
      eyebrow: "First-run setup",
      title: "Review and accept the Terms to continue",
      body:
        "CaptionArc needs one-time acceptance of the current Terms of Service before you continue with setup.",
      version: "Terms version {version}",
      reviewPrompt:
        "Review the current Terms of Service and Privacy Policy before accepting.",
      acceptanceNote:
        "By continuing, you confirm that you reviewed the current Terms of Service and understand the Privacy Policy.",
      declinedBody:
        "CaptionArc remains inactive on this device because the current Terms of Service were declined.",
      declinedPrompt:
        "Review the current Terms again whenever you are ready to continue.",
      declinedNote:
        "CaptionArc stays blocked until the current Terms of Service are accepted for this device.",
      accept: "Accept Terms",
    },
    legalPages: {
      shared: {
        eyebrow: "Legal",
        loadingDescription:
          "Loading the latest published legal copy for this extension.",
      },
      privacyPolicy: {
        title: "Privacy Policy",
        subtitle:
          "A readable in-product copy of the same Privacy Policy published in the repository.",
        sourceNote:
          "This page renders the same markdown source that is published in the repository so the in-extension copy and the public document stay aligned.",
        loadingTitle: "Loading Privacy Policy",
      },
      termsOfService: {
        title: "Terms of Service",
        subtitle:
          "Review the current operating terms, responsibilities, and legal boundaries for CaptionArc.",
        acceptEyebrow: "First-run setup",
        acceptSubtitle:
          "Scroll through the current Terms before accepting them for this device.",
        acceptPrompt:
          "Read through the current Terms of Service to unlock acceptance.",
        scrollRequired:
          "Scroll to the end of the document to enable acceptance.",
        scrollReady:
          "You have reached the end of the Terms. You can now accept and continue.",
        accept: "Accept and continue",
        decline: "Decline",
        declineNote:
          "Declining keeps CaptionArc inactive on this device until you return and accept the current Terms.",
        sourceNote:
          "This page renders the same markdown source that is published in the repository so the in-extension copy and the public document stay aligned.",
        alreadyAcceptedTitle: "Current Terms already accepted",
        alreadyAcceptedBody:
          "This device already has a recorded acceptance for the current Terms version.",
        declinedTitle: "Current Terms were declined on this device",
        declinedBody:
          "CaptionArc stays blocked until the current Terms version is accepted on this device.",
        version: "Version {version}",
        loadingTitle: "Loading Terms of Service",
      },
    },
    units: {
      byte: "B",
      kilobyte: "KB",
      megabyte: "MB",
    },
  },
  options: {
    header: {
      eyebrow: "Settings",
      title: "CaptionArc Settings",
      subtitle:
        "Configure the shared AI service, meeting profiles, live translation behavior, cloud protection, and recovery from one compact control surface.",
      openMeetingHistory: "Meeting History",
    },
    navigation: {
      title: "Settings Map",
      description: "Move section by section through the console.",
      quickJump: "Quick Jump",
    },
    loading: "Loading...",
    snapshot: {
      aiEngine: "AI engine",
      serviceStatus: "Service status",
      model: "Model",
      primaryProfile: "Primary profile",
      theme: "Theme",
      cloudVault: "Cloud vault",
      meetingUi: "Meeting UI",
      none: "None",
      system: "System",
      light: "Light",
      dark: "Dark",
      providerOne: "{count} provider",
      providerOther: "{count} providers",
      visibleClickThrough: "Visible · click-through",
      visibleInteractive: "Visible · interactive",
      hidden: "Hidden",
    },
    sections: {
      workspace: {
        eyebrow: "Workspace",
        title: "Experience & Defaults",
        description:
          "Set the shared defaults once, then keep visual behavior, meeting flow, and archive rules clearly separated.",
        shortLabel: "Workspace",
        mapHint: "Appearance, meeting flow, and archive defaults",
      },
      openAiService: {
        eyebrow: "OpenAI Service",
        title: "Shared AI Service",
        shortLabel: "OpenAI",
        mapHint: "Translation, summaries, and assistant",
        description:
          "Manage the shared OpenAI service used by live translation, meeting summaries, and the in-meeting assistant.",
      },
      translation: {
        eyebrow: "Translation",
        title: "Live Translation",
        shortLabel: "Translation",
        mapHint: "Live caption behavior and tuning",
        description:
          "Tune how OpenAI handles live caption translation without changing summary generation or assistant behavior.",
      },
      profiles: {
        eyebrow: "Meeting AI",
        title: "Meeting Profiles",
        shortLabel: "Profiles",
        mapHint: "Identity, summary, and assistant",
        description:
          "Meeting profiles define one meeting type once, then reuse that identity for summary generation and the live assistant.",
      },
      cloudSync: {
        eyebrow: "Cloud Sync",
        title: "Personal Cloud Vault",
        shortLabel: "Cloud Sync",
        mapHint: "Archive protection and providers",
        description:
          "Connect Google Drive, OneDrive, or both to keep one local-first archive protected across your devices.",
      },
      dataRecovery: {
        eyebrow: "Recovery",
        title: "Data Recovery",
        shortLabel: "Recovery",
        mapHint: "Encrypted backup and reset",
        description:
          "Cloud sync is the primary continuity path. Use the encrypted archive as a fallback backup, or delete the saved archive when you need a clean reset.",
      },
    },
    saveBadge: {
      saving: "Saving changes",
      attention: "Needs attention",
      saved: "Saved automatically",
    },
    workspace: {
      appearance: {
        title: "Appearance",
        description:
          "Choose a fixed theme or let CaptionArc follow your system automatically.",
      },
      uiLanguage: {
        title: "Interface language",
        description:
          "Apply one language across popup, settings, meeting history, and the in-meeting UI.",
      },
      meetingFlow: {
        title: "Meeting flow",
        description:
          "Control how CaptionArc starts capture, helps with captions, and decides whether a rejoined meeting should continue the same session.",
      },
      captureStartup: {
        label: "Capture startup",
        off: {
          name: "Keep capture off",
          description:
            "Do not initialize the in-meeting capture box for supported meetings.",
        },
        ask: {
          name: "Ask every meeting",
          description:
            "Show a short approval prompt before any capture starts. This is the default.",
        },
        always: {
          name: "Always start capture",
          description:
            "Start the capture flow immediately without asking first.",
        },
      },
      captionActivation: {
        label: "Caption activation",
        guided: {
          name: "Guided",
          description:
            "Keep the current flow. CaptionArc shows inline help so you can turn live captions on yourself.",
        },
        automatic: {
          name: "Automatic when possible",
          description:
            "After you join, CaptionArc tries once to turn live captions on automatically when the meeting app supports it, then falls back to the guided flow if it cannot.",
        },
      },
      sessionContinuation: {
        title: "Session continuation window",
        description:
          "Decide how long CaptionArc should offer to continue the same session after rejoining.",
        windowLabel: "Window",
        off: "Off",
        oneHour: "1 hour",
        hours: "{count} hours",
        hoursMinutes: "{hours}h {minutes}m",
        minutes: "{minutes} min",
      },
      inMeetingSurfaces: {
        title: "In-meeting surfaces",
        description:
          "Shape how the live meeting surfaces look and behave while they are on screen.",
      },
      overlayOpacity: {
        title: "Overlay opacity",
        description:
          "Lower values keep the meeting more visible underneath.",
        subtle: "Subtle",
        solid: "Solid",
      },
      overlayClickThrough: {
        label: "Click-through mode",
        description:
          "Let clicks pass through the live meeting surfaces while they stay visible.",
      },
      meetingArchive: {
        title: "Meeting archive",
        description:
          "Decide what meeting data should be retained for later review, export, and summary generation.",
      },
      storeMeetingChat: {
        label: "Store meeting chat",
        description:
          "Save supported meeting chat so it can appear in meeting history, exports, and summaries.",
      },
    },
    legalRisk: {
      shared: {
        eyebrow: "Use with care",
        warningLabel: "Legal and privacy notice",
      },
      captureStartupAlways: {
        dialog: {
          title: "Always-start capture reduces consent safeguards",
          body:
            "This mode skips the per-meeting approval prompt and starts the capture flow as soon as a supported meeting is detected.",
          pointOne:
            "Use it only in meetings where you are confident you may capture and retain meeting-derived content.",
          pointTwo:
            "Other features may later use saved captions or chat for summaries, live guidance, or exports, depending on what you enable.",
          pointThree:
            "You remain responsible for any notice, consent, workplace-policy, or platform-policy requirements that apply to your use.",
          confirm: "Enable always-start capture",
        },
        warning: {
          title: "Always-start capture is active",
          body:
            "CaptionArc will skip the per-meeting approval step. Keep this on only where you can lawfully capture and retain meeting-derived content.",
        },
      },
      captionActivationAutomatic: {
        dialog: {
          title: "Automatic caption activation interacts with the meeting app for you",
          body:
            "This mode attempts to switch on live captions automatically when the supported meeting surface allows it.",
          pointOne:
            "Automatic activation can be more sensitive than guided mode because it changes the meeting UI without a manual step from you each time.",
          pointTwo:
            "Keep it for environments where automated caption activation is acceptable under your policy and workflow.",
          pointThree:
            "You remain responsible for using this automation only where provider rules and meeting expectations allow it.",
          confirm: "Enable automatic caption activation",
        },
        warning: {
          title: "Automatic caption activation is active",
          body:
            "CaptionArc will try to switch captions on automatically when the provider supports it. Review this mode carefully for policy-sensitive meetings.",
        },
      },
      storeMeetingChat: {
        dialog: {
          title: "Stored meeting chat can increase privacy sensitivity",
          body:
            "When this stays on, supported meeting chat becomes part of your saved meeting record and can appear in history, exports, and AI-assisted follow-up flows.",
          pointOne:
            "Meeting chat can contain more sensitive or identifying material than visible captions alone.",
          pointTwo:
            "Saved chat may later be included in summaries, translations, and assistant context when those features are used.",
          pointThree:
            "Use chat storage only where retaining that content fits your notice, consent, and confidentiality expectations.",
          confirm: "Enable meeting chat storage",
        },
        warning: {
          title: "Meeting chat storage is active",
          body:
            "Supported meeting chat is being retained for history, export, and AI-assisted follow-up. Keep this on only where that retention is appropriate.",
        },
      },
    },
    openAiService: {
      title: "OpenAI Service",
      sectionDescription:
        "Manage the shared OpenAI service used by live translation, meeting summaries, and the in-meeting assistant.",
      sharedService: "Shared service",
      serviceName: "OpenAI (GPT)",
      serviceDescription:
        "One shared OpenAI service powers live translation, meeting summaries, and the in-meeting assistant.",
      setupDescription:
        "Add the API key once, choose the default GPT model, and confirm access before relying on any AI-powered workflow.",
      verificationLabel: "Test OpenAI Connection",
      verifyingLabel: "Testing current OpenAI setup",
      highlights: {
        translation: "Live translation",
        summaries: "Meeting summaries",
        assistant: "Live assistant",
      },
      cards: {
        translationTitle: "Translation",
        translationBody: "Live captions",
        summariesTitle: "Summaries",
        summariesBody: "Post-meeting output",
        assistantTitle: "Assistant",
        assistantBody: "Live guidance",
      },
      state: {
        setupRequired: {
          label: "Setup required",
          description: "Add the API key and confirm the default GPT model.",
          impact:
            "AI-powered features stay unavailable until the OpenAI service is fully configured.",
        },
        actionRequired: {
          label: "Action required",
          impact:
            "AI-powered features may be unavailable until the OpenAI service is working again.",
        },
        ready: {
          label: "Ready",
          impact:
            "OpenAI is available for translation, summaries, and live guidance.",
        },
        checking: {
          label: "Checking",
          impact:
            "A connection check is in progress. The result will update every AI-powered area of the product.",
        },
        needsVerification: {
          label: "Needs verification",
          description:
            "Run a connection check once to confirm the current key and model.",
          impact:
            "Settings can still be edited, but AI output should be treated as unconfirmed until the service is verified.",
        },
      },
      banners: {
        needsAttention: "OpenAI needs attention",
        finishSetup: "Finish the OpenAI setup",
        verifySetup: "Verify the OpenAI setup",
      },
      apiKeyInput: {
        label: "API Key",
        provider: "OpenAI",
        storedLocally: "Stored locally",
        credential: "Secret credential",
        show: "Show API key",
        hide: "Hide API key",
        helper:
          "This key stays on this device and is used for translation, summaries, and live guidance.",
        guide: "OpenAI API key guide",
      },
      modelLabel: "Model",
    },
    models: {
      gpt5Mini: {
        description:
          "Best default for live translation: fast, reliable, and high quality for noisy subtitles.",
        badge: "Recommended",
      },
      gpt52: {
        description:
          "Best when translation accuracy and nuance matter more than latency or cost.",
        badge: "Highest Quality",
      },
      gpt51: {
        description:
          "Strong all-round model with a balanced quality-to-speed profile.",
      },
      gpt5Nano: {
        description:
          "Lowest-latency option for very fast responses, with simpler output quality.",
        badge: "Fastest",
      },
      gpt41: {
        description:
          "Stable legacy choice if you prefer a proven general-purpose translation model.",
        badge: "Legacy",
      },
      gpt41Mini: {
        description:
          "Lower-cost GPT-4.1 variant for lighter workloads and moderate translation quality.",
        badge: "Lighter",
      },
    },
    translation: {
      bestFor: {
        title: "Best for",
        description:
          "Tone, technical terminology, abbreviation handling, and noisy subtitle cleanup.",
      },
      keepLean: {
        title: "Keep it lean",
        description:
          "Shorter instructions usually translate faster and stay more stable across live captions.",
      },
      avoid: {
        title: "Avoid",
        description:
          "Long policies, repeated rules, or formatting requirements that slow down every caption request.",
      },
      instructionsLabel: "Live Translation Instructions",
      instructionsHint:
        "Applied to every caption translation request. Use it for subtitle cleanup, terminology, and translation tone.",
    },
    profiles: {
      identity: {
        eyebrow: "Profile Identity",
        description:
          "These fields define the meeting-type profile itself. They are shared by summary generation and the live assistant.",
        nameLabel: "Profile name",
        namePlaceholder: "Daily Sync",
        descriptionLabel: "Short description",
        descriptionPlaceholder: "Recurring team check-in",
      },
      summary: {
        eyebrow: "Summary",
        description:
          "These settings shape how this meeting profile generates summaries: how much AI effort it uses and which instructions run during summary generation.",
        autoSummaryLabel: "Automatic end-of-meeting summary",
        autoSummaryDescription:
          "When this profile is active, a summary starts on its own after the meeting ends.",
        effortLabel: "Summary effort",
        instructionsLabel: "Summary instructions",
        instructionsHint:
          "Used when this meeting type is selected from meeting history.",
        modes: {
          economy: {
            name: "Economy",
            description:
              "Lower AI work. Best for shorter meetings when speed matters most.",
            badge: "Fastest",
          },
          balanced: {
            name: "Balanced",
            description:
              "Recommended. Adapts the summary strategy for reliability without overusing extra AI work.",
          },
          thorough: {
            name: "Thorough",
            description:
              "Uses more AI work for longer or more complex meetings to reduce summary failures.",
            badge: "Slowest",
          },
        },
      },
      assistant: {
        eyebrow: "Assistant",
        description:
          "These settings define how live guidance behaves when this meeting profile is active.",
        enabledLabel: "Use assistant with this profile",
        enabledDescription:
          "When enabled, this meeting profile can generate live guidance in supported meetings.",
        disabledHint:
          "Assistant settings stay visible here so you can review or tune them later, but they stay locked until this profile is turned on.",
        responseIntentLabel: "Primary guidance mode",
        responseFormatLabel: "Response format",
        responseDepthLabel: "Response depth",
        responseToneLabel: "Response tone",
        deliveryBiasLabel: "Speed vs completeness",
        triggerPolicyLabel: "When guidance should trigger",
        participantScopeLabel: "Who can trigger guidance",
        instructionsLabel: "Assistant instructions",
        instructionsHint:
          "Used when this meeting profile is active and the assistant generates live guidance.",
        intents: {
          answerForMe: {
            name: "Answer For Me",
            description:
              "Draft the strongest direct answer the user can give right now.",
          },
          improveMyAnswer: {
            name: "Improve My Answer",
            description: "Tighten what the user already seems to be saying.",
          },
          suggestNextPoint: {
            name: "Suggest Next Point",
            description:
              "Offer the next useful talking point to move the meeting forward.",
          },
          summarizeRecentTurn: {
            name: "Summarize Recent Turn",
            description:
              "Compress the latest exchange into a quick usable recap.",
          },
          surfaceRisks: {
            name: "Surface Risks",
            description:
              "Highlight risks, gaps, or objections that deserve attention.",
          },
          coachMe: {
            name: "Coach Me",
            description:
              "Guide the user on how to respond more effectively in the moment.",
          },
        },
        formats: {
          bullets: {
            name: "Bullets",
            description: "Very short scan-friendly bullet points.",
            badge: "Fastest",
          },
          talkingPoints: {
            name: "Talking Points",
            description:
              "Short spoken-style points the user can say naturally.",
          },
          shortParagraph: {
            name: "Short Paragraph",
            description:
              "One compact paragraph when bullets would feel too choppy.",
          },
          structuredSections: {
            name: "Structured Sections",
            description:
              "Segment the answer into small labeled sections when clarity matters.",
            badge: "Slowest",
          },
          script: {
            name: "Script",
            description:
              "Write a more literal phrasing the user can follow closely.",
          },
        },
        depths: {
          ultraBrief: {
            name: "Ultra Brief",
            description: "Minimal answer designed for highest speed.",
            badge: "Fastest",
          },
          brief: {
            name: "Brief",
            description:
              "Short and practical. Good default for live meetings.",
          },
          standard: {
            name: "Standard",
            description: "A bit more context when speed is still important.",
          },
          expanded: {
            name: "Expanded",
            description:
              "More explanation when a fuller answer is useful.",
            badge: "Slowest",
          },
        },
        tones: {
          neutral: {
            name: "Neutral",
            description: "Balanced and professional.",
          },
          direct: {
            name: "Direct",
            description: "More concise and firm.",
          },
          supportive: {
            name: "Supportive",
            description: "Helpful and reassuring without being vague.",
          },
          confident: {
            name: "Confident",
            description:
              "Strong and decisive when the user needs sharper phrasing.",
          },
          analytical: {
            name: "Analytical",
            description: "More reasoning-oriented and structured.",
          },
        },
        delivery: {
          fastest: {
            name: "Fastest",
            description: "Bias heavily toward speed and quick usefulness.",
            badge: "Best Speed",
          },
          balanced: {
            name: "Balanced",
            description: "Trade some speed for better completeness.",
          },
          careful: {
            name: "Careful",
            description:
              "Prefer higher completeness when the meeting allows it.",
            badge: "Slowest",
          },
        },
        trigger: {
          questionsAndRequests: {
            name: "Questions And Requests",
            description:
              "Trigger primarily on question-like or request-like turns.",
            badge: "Lowest Load",
          },
          salienceFirst: {
            name: "Salience First",
            description:
              "Also react to high-salience problems, decisions, or tension points.",
          },
          proactive: {
            name: "Proactive",
            description:
              "Most eager mode. Use only when you want more unsolicited help.",
            badge: "Highest Load",
          },
        },
        scope: {
          everyone: {
            name: "Everyone",
            description:
              "Consider both the user and other participants as valid triggers.",
            badge: "Heavier",
          },
          othersOnly: {
            name: "Others Only",
            description:
              "Ignore the user's own turns when deciding whether to answer.",
            badge: "Lighter",
          },
        },
      },
      badges: {
        primary: "Primary",
        alwaysAvailable: "Always available",
        customProfile: "Custom profile",
        assistantOn: "Assistant on",
        autoSummary: "Auto summary",
      },
      editor: {
        title: "Meeting profile editor",
        description:
          "Pick one profile, then edit its shared identity, summary behavior, and live assistant behavior in one place.",
        addProfile: "Add meeting profile",
        listTitle: "Profiles",
        totalCount: "{count} total",
        defaultOutputLanguage: "Default AI output language",
        untitled: "Untitled profile",
        noDescription: "No description yet.",
        noShortDescription:
          "This profile does not have a short description yet.",
        setAsPrimary: "Set as primary",
        builtInTitle: "Built-in default profile",
        builtInDescription:
          "This profile gives CaptionArc a safe general-purpose fallback for both summary generation and live guidance when no specialized meeting type fits.",
        newName: "New Meeting Type",
        newDescription: "Custom meeting profile",
        newPrompt:
          "Summarize this meeting accurately in the requested language. Focus on the points that matter most for this meeting type.",
      },
    },
    cloudSync: {
      providers: {
        googleDrive: {
          title: "Google Drive App Data Folder",
          subtitle: "Private extension storage inside your Google account.",
        },
        oneDrive: {
          title: "OneDrive App Folder",
          subtitle:
            "Private extension storage inside your Microsoft account.",
        },
      },
      actions: {
        refreshStatus: "Refresh status",
        connect: "Connect",
        retryNow: "Retry now",
        reconnect: "Reconnect",
        disconnect: "Disconnect",
      },
      overview: {
        title: "Vault overview",
        loadingDescription:
          "Loading the current cloud sync state for this device.",
        offDescription: "No personal cloud providers are connected yet.",
        needsAttentionDescription:
          "At least one cloud destination needs intervention before the archive is fully protected again.",
        syncingDescription:
          "The vault is actively reconciling local and remote changes in the background.",
        upToDateDescription:
          "The connected cloud destinations are caught up with the current local archive.",
      },
      stats: {
        currentDevice: "Current device",
        connectedProviders: "Connected providers",
        connectedProvidersNone: "No cloud destinations connected yet",
        connectedProvidersOne: "One cloud destination is active",
        connectedProvidersTwo: "Both cloud destinations are active",
        lastSuccessfulSync: "Last successful sync",
        lastSuccessfulSyncHint:
          "Based on the most recent successful provider checkpoint.",
        queueStatus: "Queue status",
      },
      queue: {
        noQueuedChanges: "No queued changes",
        queuedChanges: "{count} queued changes",
        engineProcessing: "The engine is processing work right now.",
        tasksReady: "{count} tasks are ready for the next run.",
        engineIdle:
          "The engine is idle until the next local or remote change.",
      },
      syncHealth: {
        title: "Sync health",
        attention: "Attention",
        status: "Status",
      },
      pendingChoice: {
        title: "Shared settings already exist in cloud",
        badge: "Choice needed",
        description:
          "This device already has its own shared settings, and the connected cloud vault has another set. Choose which one should become the starting point for future sync.",
        source: "Source: {provider}",
        keepLocal: "Keep this device's shared settings",
        useCloud: "Use cloud shared settings",
      },
      providerCard: {
        account: "Account",
        lastSuccessfulSync: "Last successful sync",
        providerStatus: "Provider status",
      },
      scope: {
        sharedTitle: "Synced across devices",
        localTitle: "This device only",
        shared: {
          meetingSessions: "Meeting sessions",
          translations: "Translations",
          summaries: "Summaries",
          summaryProfiles: "Summary profiles",
          sharedSettings: "Shared settings",
        },
        local: {
          apiKeys: "API keys",
          verificationStatus: "Verification status",
          deviceIdentity: "Device identity",
        },
      },
      health: {
        syncing: "Syncing",
        upToDate: "Up to date",
        retryingAutomatically: "Retrying automatically",
        needsAttention: "Needs attention",
        actionRequired: "Action required",
        off: "Off",
      },
      connection: {
        notConnectedTitle: "Not connected",
        notConnectedDescription: "Connect to start protecting this archive.",
        connectedTitle: "Connected",
        connectedAt: "Connected {time}",
      },
      sync: {
        notYet: "Not yet",
        scannedAt: "Scanned {time}",
        noScanRecorded: "No scan recorded yet.",
      },
      statusMessage: {
        disconnected: "Disconnected. This provider is not receiving updates.",
        manualRetryAvailable:
          "Automatic retries paused. You can trigger a manual retry.",
        syncing: "Syncing local and remote changes now.",
        retryingAutomatically: "Retrying automatically in the background.",
        needsAttention: "Needs attention before protection is fully restored.",
        actionRequired:
          "Manual action is required before sync can continue.",
        upToDate: "Provider is fully synchronized.",
        connectedWaiting: "Connected and waiting for work.",
      },
    },
    dataRecovery: {
      backupFile: {
        title: "Encrypted backup file",
        description:
          "The exported backup contains your shared settings, summary profiles, saved meeting sessions, transcripts, chat history, translations, and summaries. Device-local secrets such as the OpenAI API key stay out of the backup. Use it when cloud sync is unavailable or when you need a portable encrypted snapshot.",
        export: "Export all data",
        import: "Import backup file",
      },
      passphrase: {
        label: "Backup passphrase",
        placeholder: "Use at least 8 characters",
        show: "Show backup passphrase",
        hide: "Hide backup passphrase",
        hint:
          "Use the same passphrase for export and import. Without it, the backup cannot be decrypted.",
      },
      cards: {
        scope: {
          title: "Scope",
          description:
            "One encrypted file contains shared settings and the complete session archive, but not device-local secrets.",
        },
        restoreBehavior: {
          title: "Restore behavior",
          description:
            "Import replaces the current local archive and shared settings with the backup file you choose. Device-local secrets such as the OpenAI API key must still be entered on the device after restore.",
        },
        useCase: {
          title: "Use case",
          description:
            "Best for machine migration, fallback recovery, and archive portability.",
        },
      },
      deleteArchive: {
        title: "Delete saved archive",
        syncedDescription:
          "Delete the synced archive from this device, your connected cloud providers, and other synced devices. Your OpenAI setup, preferences, and summary profiles stay intact.",
        localDescription:
          "Remove all saved meeting sessions from local storage. This keeps your OpenAI setup, preferences, and summary profiles.",
      },
      confirmDelete: {
        syncedTitle: "Delete synced archive everywhere?",
        localTitle: "Clear saved session data?",
        syncedLabel: "Delete archive everywhere",
        localLabel: "Clear saved sessions",
        syncedDescription:
          "This permanently deletes every saved meeting session, transcript, chat record, translation, and summary from this device, your other synced devices, and your connected cloud accounts. Your settings stay untouched.",
        localDescription:
          "This removes every saved meeting session, transcript, chat record, translation, and summary from local storage. Your settings stay untouched.",
      },
    },
    diagnostics: {
      launcherTitle: "Diagnostics",
      launcherSubtitle: "Console",
      closeConsole: "Close diagnostics console",
      drawerLabel: "Diagnostics console",
      closeDrawer: "Close diagnostics drawer",
      actions: {
        enableSession: "Enable this session",
        disableSession: "Disable this session",
        copyVisible: "Copy visible logs",
        copiedVisible: "Copied visible logs",
        refresh: "Refresh diagnostics",
        clear: "Clear diagnostics",
        enableSessionDiagnostics: "Enable session diagnostics",
      },
      filters: {
        all: "All",
        searchPlaceholder:
          "Search title, summary, key, domain, feature, provider",
        visibleCounts: "Visible counts:",
        error: "Error",
        warn: "Warn",
        info: "Info",
        debug: "Debug",
        trace: "Trace",
      },
      summary: {
        loadedWindowTitle: "Loaded window",
        loadedWindowBody: "Latest {limit} canonical events max.",
        visibleNowTitle: "Visible now",
        visibleNowBody: "Filters and search update client-side only.",
        snapshotsTitle: "Snapshots",
        noProvider: "no provider",
        noResolvedSnapshot: "No resolved snapshot in the current payload.",
        lastSyncTitle: "Last sync",
        waiting: "Waiting",
        lastSyncBody: "Refreshes pause while this tab is hidden.",
        eventOne: "{count} event",
        eventOther: "{count} events",
        snapshotOne: "{count} snapshot",
        snapshotOther: "{count} snapshots",
      },
      row: {
        session: "Session",
        request: "Request",
        correlation: "Correlation",
        tab: "Tab",
        frame: "Frame",
        document: "Document",
        origin: "Origin",
        copied: "Copied",
        copyRow: "Copy row",
        showDetails: "Show details",
        hideDetails: "Hide details",
        senderUrl: "Sender URL",
        eventKey: "Event key",
        description: "Description",
        eventData: "Event data",
      },
      states: {
        requestErrorPrefix:
          "Runtime refresh failed. The last successful payload stays visible until the next retry.",
        captureOffTitle: "Diagnostics capture is off for this session.",
        captureOffBody:
          "The viewer is available, but no new logs will arrive until you enable diagnostics for this session. Production keeps its baseline capture policy off unless you intentionally override it here.",
        waitingTitle: "Waiting for diagnostics events.",
        waitingBody:
          "The drawer is connected to the canonical collector. Once the extension emits new structured diagnostics, they will appear here automatically.",
        noMatchesTitle: "No events match the current filters.",
        noMatchesBody:
          "Try a broader level filter or clear the search box to bring events back into view.",
      },
      status: {
        unavailableLabel: "Unavailable",
        unavailableDescription:
          "Diagnostics viewer is not enabled for this environment.",
        syncIssueLabel: "Sync issue",
        syncIssueDescription:
          "The viewer could not refresh diagnostics from the runtime.",
        connectingLabel: "Connecting",
        connectingDescription:
          "The viewer is loading the current diagnostics configuration.",
        sessionOffLabel: "Session off",
        sessionOffDescription:
          "Diagnostics capture is currently disabled for this session. Existing captured events remain visible.",
        pausedLabel: "Paused",
        pausedDescription:
          "Polling pauses while the options tab is hidden and resumes when it becomes visible again.",
        liveLabel: "Live",
        liveDescription:
          "The viewer is polling the latest canonical diagnostics payload.",
        readyLabel: "Ready",
        readyDescription:
          "Open the drawer to inspect the latest canonical diagnostics.",
      },
      requestErrors: {
        runtimeUnavailable:
          "Runtime messaging is unavailable in the current context.",
        loadConfigFailed: "Could not load diagnostics config.",
        loadPayloadFailed: "Could not load diagnostics payload.",
        updateConfigFailed: "Could not update diagnostics config.",
        clearFailed: "Could not clear diagnostics.",
      },
    },
    runtime: {
      save: {
        loading: "Loading settings...",
        saving: "Saving changes automatically...",
        saved: "All changes saved automatically.",
        loadFailed: "Could not load your saved settings.",
        autosaveFailed:
          "Autosave failed. Your last change is still local to this tab.",
      },
      connection: {
        addApiKey: "Add your OpenAI API key, then test the connection.",
        runTest:
          "Run Test Connection to verify your OpenAI key and selected model.",
        testing: "Testing the current OpenAI setup...",
        apiKeyRequired:
          "OpenAI API key is required before the connection can be tested.",
        modelRequired: "Choose an OpenAI model before testing the connection.",
        apiKeyRejected: "OpenAI rejected the API key.",
        modelUnavailable:
          "OpenAI model not available to this key: {model}.",
        requestFailed: "OpenAI request failed with {status}.",
        networkFailed:
          "Could not reach OpenAI. Check your network connection and try again.",
        reachable: "OpenAI is reachable and {model} is available.",
      },
      dataTransfer: {
        idle:
          "Use encrypted backup as a fallback recovery path for settings and session history, or remove the saved archive everywhere when cloud sync is connected.",
        exporting:
          "Preparing a fallback encrypted archive with settings and session history...",
        exportSuccess:
          "Encrypted backup exported with {count} saved session{suffix}.",
        exportFailed: "Failed to export the data bundle.",
        importing:
          "Decrypting the backup and restoring settings and session history...",
        importSuccess: "Backup imported. Restored {count} session{suffix}.",
        importFailed: "Failed to import the data bundle.",
        clearingSynced:
          "Deleting the synced archive from this device and propagating the removal to connected cloud providers...",
        clearingLocal: "Removing all saved sessions from local storage...",
        clearSuccessSynced:
          "The archive was deleted from this device and the removal has been queued for your connected cloud providers. Your settings were preserved.",
        clearSuccessLocal:
          "Saved sessions were removed. Your settings were preserved.",
        clearFailed: "Failed to clear the saved session archive.",
      },
      cloudSync: {
        idleAvailable:
          "Cloud sync is available when you connect Google Drive or OneDrive.",
        idleConnected: "Cloud sync status is up to date.",
        idleDisconnected:
          "Connect a cloud provider to protect your archive automatically.",
        loadFailed: "Could not load cloud sync state.",
        updated: "Cloud sync status updated.",
        actionFailed: "Cloud sync action failed.",
        connecting: "Connecting cloud provider...",
        disconnecting: "Disconnecting cloud provider...",
        retrying: "Retrying cloud sync...",
        reconnecting: "Refreshing cloud provider access...",
        resolvingChoice: "Applying the shared settings choice...",
      },
    },
  },
  history: {
    page: {
      archiveEyebrow: "Archive",
      title: "Meeting History",
      subtitle:
        "Browse saved sessions, reopen transcript details, export records, and manage local storage without leaving the extension.",
      openSettings: "Open settings",
      searchLabel: "Search sessions",
      searchPlaceholder:
        "Search titles, meeting IDs, speakers, captions, or translations...",
      clearSearch: "Clear search",
      sortLabel: "Sort",
      providerFilterLabel: "Filter by provider",
      statusFilterLabel: "Filter by status",
      resetFilters: "Reset filters",
      resultCountOne: "{count} meeting",
      resultCountOther: "{count} meetings",
      resultCountFiltered: "{filtered} of {total} meetings",
      translatedCaptionCountOne:
        "{count} translated caption stored across your archive.",
      translatedCaptionCountOther:
        "{count} translated captions stored across your archive.",
      archiveSnapshotTitle: "Archive snapshot",
      archiveSnapshotSessions: "Sessions",
      archiveSnapshotCurrentView: "Current view",
      archiveSnapshotProviderFocus: "Provider focus",
      archiveSnapshotStarFilter: "Star filter",
      archiveSnapshotUrlHint:
        "Search state, filters, sorting, and the currently opened session stay reflected in the page URL so refresh and navigation feel predictable.",
      storageFullTitle: "Local storage is getting full",
      storageFullDescription:
        "Your archive is using {percentage}% of the local extension quota. Review older sessions or export important records from Settings before storage becomes a constraint.",
      reviewOldestSessions: "Review oldest sessions",
      loadingTitle: "Loading meeting history",
      loadingDescription:
        "Fetching your saved sessions, storage state, and summary job metadata.",
      detailLoadingTitle: "Loading session details",
      detailLoadingDescription:
        "Preparing the full transcript, metadata, summaries, and job state for this meeting.",
      emptyInitialTitle: "No meeting history yet",
      emptyInitialDescription:
        "Meeting sessions appear here automatically after the extension captures captions in a supported browser meeting. Once you join a call and captions are flowing, the archive will start building itself.",
      emptyFilteredTitle: "No meetings match this view",
      emptyFilteredDescription:
        "The current search, provider filter, or sort view did not match any saved sessions. Reset the current view or review your oldest sessions to continue browsing.",
      deleteSessionTitle: "Delete this meeting session?",
      deleteSessionDescription:
        "This removes \"{title}\" from local history. This action cannot be undone.",
      deleteSessionConfirm: "Delete session",
    },
    dependency: {
      title: "OpenAI needs attention",
      actionRequired: "Action required",
      needsVerification: "Needs verification",
      impact:
        "{message} Summary generation, saved-caption translation, and assistant review stay unavailable until the service is ready again.",
    },
    filters: {
      providerAll: "All providers",
      providerGoogleMeet: "Google Meet",
      providerMicrosoftTeams: "Microsoft Teams Web",
      providerZoomWeb: "Zoom Web App",
      sortNewest: "Newest first",
      sortOldest: "Oldest first",
      starAll: "All sessions",
      starStarred: "Starred only",
      activeQuery: 'Query: "{query}"',
      activeViewingOldest: "Viewing oldest meetings first",
    },
    storageIndicator: {
      usage: "{used} of {quota}",
      highUsage: "High usage",
      reviewSoon: "Review soon",
      healthy: "Healthy",
    },
    confirmDialog: {
      closeDialog: "Close dialog",
      confirmAction: "Confirm action",
    },
    sessionList: {
      today: "Today",
      yesterday: "Yesterday",
      justNow: "Just now",
      inProgress: "In progress",
      noPreview:
        "No captured captions or meeting chat messages are available for this session yet.",
      removeStar: "Remove star",
      starSession: "Star session",
      openDetails: "Open details",
      deleteSession: "Delete session",
      generatingSummary: "Generating summary",
      starred: "Starred",
      captionCountOne: "{count} caption",
      captionCountOther: "{count} captions",
      translatedOriginalOnly: "Original only",
      translatedCount: "{count} translated",
      chatCountOne: "{count} chat",
      chatCountOther: "{count} chats",
      directCall: "Direct call",
      hideIdentifiers: "Hide identifiers",
      showIdentifiers: "Show identifiers",
      loadingMore: "Loading more meetings...",
    },
    detail: {
      backToHistory: "Back to history",
      reviewDescription:
        "Review captured transcript, saved translations, extraction coverage, and AI summaries for this meeting.",
      inProgress: "In progress",
      durationShort: {
        hours: "{count}h",
        minutes: "{count}m",
        seconds: "{count}s",
        hoursMinutes: "{hours}h {minutes}m",
        minutesSeconds: "{minutes}m {seconds}s",
      },
      actions: {
        saveTitle: "Save title",
        cancelTitleEditing: "Cancel title editing",
        renameSession: "Rename session",
        retry: "Retry",
      },
      exportMenu: {
        open: "Open export options",
        close: "Close export options",
        title: "Export transcript",
        description:
          "Choose whether saved translations and saved summaries should be included in the Markdown export.",
        includeTranslationsLabel: "Include saved translations",
        includeTranslationsAvailable:
          "Saved translations will be included in the export file.",
        includeTranslationsUnavailable:
          "No saved translations are available for this session yet.",
        includeSummariesLabel: "Include saved summaries",
        includeSummariesAvailable:
          "Saved meeting summaries will be appended to the export file.",
        includeSummariesUnavailable:
          "No saved meeting summaries are available for this session yet.",
        export: "Download Markdown",
      },
      metadataLabels: {
        provider: "Provider",
        callTitle: "Call title",
        meetingTitle: "Meeting title",
        meetingUrl: "Meeting URL",
        started: "Started",
        ended: "Ended",
        status: "Status",
        primaryId: "Primary ID",
        meetingCode: "Meeting code",
        meetingId: "Meeting ID",
        conferenceId: "Conference ID",
        meetingNumber: "Meeting number",
        threadId: "Thread ID",
        callType: "Call type",
      },
      status: {
        ended: "Ended",
        live: "Live",
      },
      sections: {
        metadata: {
          title: "Meeting metadata",
          description:
            "Review the meeting identity, timing, and stored identifiers for this saved session.",
          expand: "Show metadata",
          collapse: "Hide metadata",
        },
        continuations: {
          title: "Session continuations",
          description:
            "Inspect each rejoin and the total time spent away before the same session resumed.",
          expand: "Show continuations",
          collapse: "Hide continuations",
        },
        extraction: {
          title: "Extraction report",
          description:
            "Inspect transcript coverage, speaker extraction, and integrity fingerprints for the saved archive.",
          expand: "Show extraction report",
          collapse: "Hide extraction report",
        },
        summary: {
          title: "Meeting summary",
          description:
            "Generate or review saved AI summaries for this meeting profile and language.",
          expand: "Show summary",
          collapse: "Hide summary",
        },
        transcript: {
          title: "Transcript",
          description:
            "Review saved captions, meeting chat, translations, and assistant outputs in timeline order.",
        },
      },
      stats: {
        capturedCaptions: "Captured captions",
        translatedCaptions: "Translated captions",
        duration: "Duration",
        meetingChatMessages: "Meeting chat messages",
        rejoins: "Rejoins",
        totalAwayTime: "Total away time",
        lastRejoin: "Last rejoin",
        canonicalEvents: "Canonical events",
        uniqueSpeakers: "Unique speakers",
        metadataCoverage: "Metadata coverage",
        providerIds: "Provider IDs",
      },
      rejoin: {
        label: "Rejoin {index}",
        awayFor: "Away for {gap}",
        leftMeeting: "Left meeting",
        returnedToMeeting: "Returned to meeting",
      },
      extraction: {
        eventLogFingerprint: "Event log fingerprint",
        searchFingerprint: "Search fingerprint",
        summaryFingerprint: "Summary fingerprint",
        timelineRange: "Timeline range",
        lastEvent: "Last event",
        noEvents: "No events",
        coverageBreakdown: "Coverage breakdown",
        sessionOffsets: "Session offsets",
        translatedEvents: "Translated events",
        finalCaptionEvents: "Final caption events",
        speakers: "Speakers",
        noSpeakers: "No speakers detected.",
        warnings: "Warnings",
      },
      summaryJob: {
        states: {
          preflighting: "Preparing summary",
          extracting: "Analyzing transcript",
          merging: "Merging evidence",
          synthesizing: "Writing summary",
          continuing: "Continuing summary",
          reconciling: "Reconciling output",
          completed: "Summary ready",
          failed: "Summary failed",
          cancelled: "Summary cancelled",
          default: "Preparing summary",
        },
        progress: {
          ready: "Ready",
          preparing: "Preparing evidence",
          step: "Step {current} of {total}",
          mergingEvidence: "Merging evidence",
          preparingFinal: "Preparing final summary",
          continuation: "Continuation {current} of {total}",
          continuing: "Continuing generation",
          finalChecks: "Running final checks",
        },
      },
      summary: {
        openAiUnavailable: "OpenAI unavailable",
        unavailable: "Summary generation is unavailable",
        generating: "Generating summary",
        generateAnother: "Generate another summary",
        generate: "Generate meeting summary",
        generateWithProfile:
          "Use {profile} to create or refresh a saved meeting summary.",
        selectMeetingType:
          "Select a meeting profile and output language before generating a summary.",
        generateAnotherAction: "Generate another {profile} summary",
        generateAction: "Generate {profile} summary",
        genericProfile: "selected profile",
        inProgress: "Summary generation is still in progress.",
        noSummaryYet: "No saved {profile} summary in {language} yet.",
        noSummaryHint:
          "Generate one now or switch the meeting profile or language to review another saved version.",
        latestSaved: "Latest saved summary: {profile} in {language}.",
        evidenceChunks: "{count} evidence chunks",
        continuations: "{count} continuations",
        reconciled: "Reconciled",
        executionStrategy: {
          singleShot: "Single shot",
          structuredSingleShot: "Structured single shot",
          multiStage: "Multi-stage",
        },
        version: {
          latest: "Latest · {time}",
          automatic: "Automatic",
          manual: "Manual",
          auto: "Auto",
          alt: "Alt profile",
          session: "Session profile",
          default: "Default profile",
          sessionProfile: "Session profile: {name}",
          unknownProfile: "Unknown profile",
          generatedWithAnotherProfile: "Generated with another profile",
          generatedAt: "Generated {time}",
        },
      },
      transcript: {
        savedCaptionTranslationUnavailable:
          "Saved-caption translation is unavailable",
        translatingAllCaptions: "Translating all captions",
        translateAllCaptions: "Translate all captions",
        batchTranslateSubtitle:
          "Create saved translations for every caption in {language}.",
        translateAllCaptionsTo: "Translate all captions to {language}",
        emptyTitle: "No transcript or chat items",
        emptyDescription:
          "This session does not have any saved captions or meeting chat messages yet.",
        meetingChat: "Meeting chat",
        translationAvailable: "Translation saved",
        message: "Message",
        caption: "Caption",
        translation: "Translation",
        noChatTranslation:
          "No saved translation for this chat message yet.",
        noCaptionTranslation:
          "No saved translation for this caption yet.",
        translatingChatMessage: "Translating chat message",
        translatingCaption: "Translating caption",
        translateChatMessage: "Translate chat message",
        translateCaption: "Translate caption",
        translateThisItem: "Translate this {item} to {language}",
        aiAssistant: "AI assistant",
        triggeredByChat: "Triggered by this chat message",
        triggeredByCaption: "Triggered by this caption",
      },
      export: {
        sessionDetailsHeading: "Session details",
        titleLabel: "Title",
        providerLabel: "Provider",
        startedLabel: "Started",
        primaryIdLabel: "Primary ID",
        endedLabel: "Ended",
        durationLabel: "Duration",
        statusLabel: "Status",
        capturedChatMessagesLabel: "Captured chat messages",
        savedTranslationsLabel: "Saved translations",
        totalAwayBeforeRejoinsLabel: "Total away time before rejoins",
        savedSummariesHeading: "Saved summaries",
        generatedLabel: "Generated",
        modelLabel: "Model",
        summaryEffortLabel: "Summary effort",
        executionStrategyLabel: "Execution strategy",
        evidenceChunksLabel: "Evidence chunks",
        continuationsLabel: "Continuations",
        reconciledLabel: "Reconciled",
        coveredCaptionsLabel: "Covered captions",
        yes: "Yes",
        sessionContinuationsHeading: "Session continuations",
        leftAtLabel: "Left at",
        rejoinedAtLabel: "Rejoined at",
        awayForLabel: "Away for",
        sessionResumeHeading:
          "Session {index} resumed at {time} after {gap}",
      },
    },
    runtime: {
      settingsLoadFailed: "Failed to load extension settings.",
      loadHistoryFailed: "Failed to load meeting history.",
      loadSessionDetailFailed: "Failed to load the meeting session details.",
      sessionDeleted: "Session deleted.",
      sessionDeleteFailed: "Failed to delete the session.",
      titleUpdated: "Title updated.",
      titleUpdateFailed: "Failed to update the title.",
      starUpdateFailed: "Failed to update the star.",
      sessionNotFound: "Meeting session not found.",
      chatMessageNotFound: "Chat message not found.",
      captionNotFound: "Caption line not found.",
      translationFailed: "Translation failed.",
      captionTranslated: "Caption translated to {language}.",
      chatTranslated: "Chat message translated to {language}.",
      captionTranslateFailed: "Failed to translate the caption.",
      chatTranslateFailed: "Failed to translate the chat message.",
      analyzingTranscript: "Analyzing transcript",
      noSummarySource:
        "No transcript or meeting chat content is available for summarization.",
      summaryGenerationFailed: "Summary generation failed.",
      summaryGenerated: "Summary generated in {language}.",
      summaryCancelFailed: "Failed to cancel summary generation.",
      batchTranslationFailed: "Failed to translate all captions.",
      allCaptionsAlreadyTranslated:
        "All captions already have {language} translations.",
      batchTranslatedOne:
        "{count} caption translated to {language}{suffix}.",
      batchTranslatedOther:
        "{count} captions translated to {language}{suffix}.",
      batchSkippedSuffix: ", {count} skipped",
      errorOutdated:
        "{fallback} Details: The extension runtime is out of date. Reload the extension and try again.",
      errorNoDetails:
        "{fallback} Details: No additional error details were returned.",
      errorModelStopped:
        "{fallback} Details: The model stopped before the summary could be completed. The app now retries automatically, but this response still could not be fully recovered. Try regenerating or using a model with a larger output budget.",
      errorNoProviderDetails:
        "{fallback} Details: No additional provider details were returned.",
      errorWithDetails: "{fallback} Details: {details}",
    },
  },
  content: {
    copyFeedback: "Copied!",
    timeline: {
      meetingChat: "Meeting chat",
    },
    translation: {
      errorFallback: "Error",
      requestFailed: "Translation failed",
      retryAction: "Retry translation",
    },
    empty: {
      waitingForCaptionsTitle: "Waiting for captions...",
      waitingForCaptionsBody:
        "Enable captions in your meeting to start capturing text",
      waitingForCaptionsGoogleMeet:
        "Turn on captions in Google Meet to start capturing text",
      waitingForCaptionsTeams:
        "Open More > Language and speech > Show live captions to start capturing text",
      waitingForCaptionsZoom:
        "Open More > Captions > Show Captions to start capturing text",
      capturePendingTitle: "Capture is waiting for you",
      capturePendingBody:
        "Answer the startup prompt to allow this meeting to start capturing.",
      captureStartingTitle: "Starting capture",
      captureStartingBody:
        "Preparing the meeting session and startup observers now.",
      captureDismissedTitle: "Capture stayed off",
      captureDismissedBody:
        "This meeting was dismissed from the startup prompt and will remain off.",
      sessionEndedTitle: "Session ended",
      sessionEndedBody: "This meeting is no longer active on this page.",
      waitingToJoinTitle: "Waiting to join meeting",
      waitingToJoinBody:
        "Join the meeting to start the session timer and capture flow.",
      enablingCaptionsTitle: "Enabling live captions",
      enablingCaptionsBody:
        "CaptionArc is trying to turn captions on for this meeting now.",
      readyTitle: "Capture is ready",
      readyBody:
        "Start speaking and caption lines will appear here as the meeting continues.",
      close: "Close",
    },
    sessionSeparator: {
      title: "Session {index}",
      detail: "Rejoined {time} · Away {gap}",
      ariaLabel: "Session {index} resumed",
    },
    header: {
      compactStatus: {
        aiNeedsAttentionTitle: "AI needs attention",
        finishOpenAiSetup: "Finish OpenAI setup",
        openAiUnavailable: "OpenAI is unavailable",
        capturePendingTitle: "Capture pending",
        waitingForAnswer: "Waiting for your answer",
        startingCaptureTitle: "Starting capture",
        preparingMeeting: "Preparing this meeting",
        captureSkippedTitle: "Capture skipped",
        meetingStaysOff: "This meeting stays off",
        sessionEndedTitle: "Session ended",
        rejoinToContinue: "Rejoin to continue or restart",
        waitingToJoinTitle: "Waiting to join",
        sessionStartsAfterJoin: "Session starts after join",
        enablingCaptionsTitle: "Enabling captions",
        tryingLiveCaptions: "Trying to switch on live captions",
        setupRequiredTitle: "Setup required",
        turnOnMeetingCaptions: "Turn on meeting captions",
        translationIssueTitle: "Translation issue",
        retryAvailable: "Retry is available",
        translatingLiveTitle: "Translating live",
        liveTranslationTitle: "Live translation",
        capturingLiveTitle: "Capturing live",
        originalCaptionsOnly: "Original captions only",
        readyToCaptureTitle: "Ready to capture",
        waitingForSpeech: "Waiting for speech",
        waitingForCaptionsTitle: "Waiting for captions",
      },
      main: {
        captureOnHoldTitle: "Capture on hold",
        waitingForAnswer: "Waiting for your answer",
        startingCaptureTitle: "Starting capture",
        preparingMeeting: "Preparing this meeting",
        captureSkippedTitle: "Capture skipped",
        meetingStaysOff: "This meeting stays off",
        sessionEndedTitle: "Session ended",
        rejoinToContinue: "Rejoin to continue or restart",
        waitingToJoinTitle: "Waiting to join",
        meetingOverlay: "Meeting overlay",
        enablingLiveCaptionsTitle: "Enabling live captions",
        preparingCapture: "Preparing capture",
        liveCaptureTitle: "Live Capture",
      },
      profileControl: {
        defaultBadge: "Default",
      },
      translationToggle: {
        label: "Auto",
      },
      translationDock: {
        eyebrow: "Live Translation",
        consent: {
          title: "Capture needs confirmation",
          body: "Approve the startup prompt to begin capturing this meeting.",
          badge: "Waiting",
        },
        starting: {
          title: "Starting capture",
          body: "Preparing the session and observer pipeline now.",
          badge: "Starting",
        },
        dismissed: {
          title: "Capture stayed off",
          body: "This meeting was dismissed from the startup prompt.",
          badge: "Off",
        },
        setup: {
          title: "OpenAI setup required",
          body: "Finish OpenAI setup in Settings to enable live translation.",
          badge: "Setup",
        },
        unavailable: {
          title: "OpenAI is unavailable",
          body: "Check the OpenAI setup in Settings before live translation can resume.",
          badge: "Issue",
        },
        off: {
          title: "Translation is off",
          body: "Target: {language}. Turn it on for live output.",
          badge: "Off",
        },
        error: {
          title: "Translation needs attention",
          body: "Some lines failed. Retry is available on the affected cards.",
          badge: "Issue",
        },
        translating: {
          title: "Translating to {language}",
          body: "New lines are being translated live.",
          badge: "Working",
        },
        live: {
          title: "Live translation active",
          body: "Rendering live output in {language}.",
        },
        ready: {
          title: "Translation is armed",
          body: "Captions are on. New lines will translate to {language}.",
          badge: "Ready",
        },
        waiting: {
          title: "Waiting for captions",
          body: "Turn on meeting captions to start translation.",
          badge: "Waiting",
        },
      },
      tooltips: {
        compactAiSetup:
          "Finish OpenAI setup in Settings to restore translation, summaries, and assistant guidance.",
        compactAiIssue:
          "{message} OpenAI-dependent features stay paused until the issue is resolved.",
        translationOff: "Turn live translation off",
        translationOn: "Turn live translation on",
        translationSetup:
          "Finish OpenAI setup in Settings to enable live translation.",
        translationUnavailable:
          "Live translation is paused until OpenAI is available again.",
        captureHelp: "Capture Help",
        hideCaptureHelp: "Hide capture help",
        switchToCompactView: "Switch to compact view",
        expandOverlay: "Expand overlay",
        openProfilePicker: "Open meeting profile picker",
      },
    },
    captureGuide: {
      eyebrow: "Capture setup",
      title: "Capture Help",
      statusReady: "Capture starts when ready",
      footer:
        "CaptionArc will start capturing as soon as live captions appear in this tab.",
      stepsCount: "{count} steps",
      waitingTitle: "Waiting for live captions",
      closeAriaLabel: "Close capture guide",
      startsAutomatically: "Starts automatically",
      tooltipOpen: "Capture Help",
      tooltipClose: "Hide capture help",
      providers: {
        googleMeet: {
          title: "Enable Capture In Google Meet",
          body:
            "CaptionArc can start once Google Meet captions are turned on in this browser meeting.",
          status: "Starts automatically",
          footer:
            "CaptionArc will start capturing automatically as soon as live captions appear in this tab.",
          troubleshooting:
            "If you do not see a captions control, check whether the meeting or browser state is still loading.",
          steps: {
            openControls: {
              title: "Open the meeting controls",
              detail: "Move your mouse to reveal the bottom meeting toolbar.",
            },
            openCaptions: {
              title: "Open captions controls",
              detail: "Click the captions or CC control in the meeting toolbar.",
            },
            turnOn: {
              title: "Turn captions on",
              detail:
                "Once captions are enabled, CaptionArc will start capturing text automatically.",
            },
          },
        },
        microsoftTeams: {
          title: "Enable Capture In Microsoft Teams",
          body:
            "CaptionArc can start once live captions are turned on from the Teams meeting toolbar.",
          status: "Starts automatically",
          footer:
            "CaptionArc will start capturing automatically as soon as live captions appear in this tab.",
          troubleshooting:
            "If captions are unavailable, the organizer or admin policy may be restricting caption controls.",
          steps: {
            openMore: {
              title: "Open More",
              detail: "Use the top meeting toolbar and open the More menu.",
            },
            openLanguage: {
              title: "Open Language and speech",
              detail: "Inside More, choose Language and speech.",
            },
            chooseCaptions: {
              title: "Choose Show live captions",
              detail:
                "Select Show live captions and CaptionArc will detect the captions window automatically.",
            },
          },
        },
        zoomWeb: {
          title: "Enable Capture In Zoom Web App",
          body:
            "CaptionArc can start once Zoom Web App captions are enabled in this browser meeting.",
          status: "Enable captions manually",
          footer:
            "CaptionArc will start capturing as soon as Zoom captions appear in this tab.",
          troubleshooting:
            "Some Zoom meetings may prefer the desktop app or restrict caption controls based on host settings.",
          steps: {
            openControls: {
              title: "Open meeting controls",
              detail:
                "Use the in-meeting toolbar at the bottom of the Zoom Web App window.",
            },
            openMore: {
              title: "Open More",
              detail: "Open the More menu from the in-meeting toolbar.",
            },
            openCaptions: {
              title: "Open Captions",
              detail: "Inside More, open the Captions submenu.",
            },
            chooseShow: {
              title: "Choose Show Captions",
              detail:
                "Select Show Captions to make the Zoom subtitle surface available in this tab.",
            },
          },
        },
      },
    },
    footer: {
      sessionFallbackTitle: "Meeting session",
      turns: "{count} turns",
      chat: "{count} chat",
      chatCaptureTooltip:
        "Meeting chat capture is enabled. New supported meeting chat messages will be saved with this session.",
      autoSummarySetupTooltip:
        "Automatic summaries stay paused until OpenAI setup is complete.",
      autoSummaryUnavailableTooltip:
        "Automatic summaries are paused until OpenAI is available again.",
      autoSummaryReadyTooltip:
        "{profile} will run automatically when this meeting ends.",
      aiAlertSetupTooltip:
        "Finish OpenAI setup in Settings to restore translation, summaries, and assistant guidance.",
      aiAlertUnavailableTooltip:
        "{message} OpenAI-dependent meeting tools stay paused until the issue is resolved.",
      liveState: {
        awaitingReply: {
          label: "Awaiting reply",
          tooltip:
            "Capture is waiting for your startup decision for this meeting.",
        },
        starting: {
          label: "Starting",
          tooltip:
            "Capture was approved and the meeting session is being prepared.",
        },
        off: {
          label: "Off",
          tooltip:
            "Capture was dismissed for this meeting from the startup prompt.",
        },
        ended: {
          label: "Ended",
          tooltip:
            "This session has ended. Rejoin to continue the last session or start a new one.",
        },
        lobby: {
          label: "Lobby",
          tooltip:
            "Join the meeting to start the session timer and capture flow.",
        },
        live: {
          label: "Live",
          tooltip: "Captions are currently being captured in this meeting.",
        },
        armed: {
          label: "Armed",
          tooltip:
            "Captions are enabled and the overlay is waiting for the next lines.",
        },
        waiting: {
          label: "Waiting",
          tooltip: "Meeting captions are not enabled yet.",
        },
      },
    },
    prompts: {
      defaultTimeoutHint: "Defaults to the standard action",
      timeoutHint: "Defaults to {action}",
      captureConsent: {
        title: "Enable capture for this meeting?",
        body: "If you skip this, capture stays off for this meeting visit.",
        ariaLabel: "Capture startup confirmation",
        secondaryAction: "Not now",
        primaryAction: "Enable",
      },
      sessionContinuation: {
        title: "Continue the previous session?",
        body:
          "You rejoined the same meeting shortly after leaving. No response starts a new session.",
        ariaLabel: "Session continuation confirmation",
        secondaryAction: "New session",
        primaryAction: "Continue",
      },
      sessionEnded: {
        title: "Session ended",
        body:
          "Stay to review captured items here, or close the overlay. No response closes it.",
        ariaLabel: "Session ended confirmation",
        secondaryAction: "Close",
        primaryAction: "Stay here",
      },
    },
    assistant: {
      statusLabel: {
        queued: "Queued",
        working: "Working",
        ready: "Ready",
        paused: "Paused",
        issue: "Issue",
        unavailable: "Unavailable",
        watching: "Watching",
      },
      statusDescription: {
        queued: "A useful moment was detected.",
        working: "Generating live guidance.",
        latestReady: "Latest assistant guidance is ready.",
        ready: "Assistant is ready for the next moment.",
        paused: "Assistant is off for this session.",
        issue: "Assistant needs attention.",
        unavailable: "OpenAI is unavailable right now.",
        watching: "Waiting for a useful moment.",
      },
      emptyState: {
        setupTitle: "Finish OpenAI setup to use the assistant",
        setupBody:
          "OpenAI setup is incomplete, so live guidance cannot run yet.",
        unavailableTitle: "Assistant is temporarily unavailable",
        unavailableBody:
          "{message} The assistant will resume after OpenAI is healthy again.",
        watchingTitle: "Assistant is watching this meeting",
        watchingBody:
          "When a useful question, request, or risk appears, live guidance will show up here.",
        offTitle: "Assistant is off for this session",
        offBody:
          "Turn it back on whenever you want live guidance to resume.",
        errorTitle: "Assistant needs attention",
        errorBody:
          "A generation issue interrupted live guidance. The next valid moment will retry.",
        preparingTitle: "Assistant is preparing guidance",
        preparingBody:
          "A useful moment was detected and the first live guidance is being queued now.",
        workingTitle: "Assistant is working",
        workingBody:
          "Live guidance is being generated for the current meeting moment.",
      },
      footer: {
        setup: "Complete OpenAI setup",
        unavailable: "OpenAI is unavailable",
        sessionStartsAfterJoin: "Session starts after join",
        workingLiveGuidance: "Working on live guidance",
        turnedOffForSession: "Turned off for this session",
        generationNeedsAttention: "Generation needs attention",
        latestGuidanceReady: "Latest guidance is ready",
        watchingSession: "Watching this session",
        notes: "{count} notes",
        liveCount: "{count} live",
        aiAlertSetup:
          "Finish OpenAI setup in Settings before assistant guidance can run.",
        aiAlertUnavailable:
          "{message} Assistant guidance stays paused until OpenAI is available again.",
      },
      source: {
        meetingChat: "Meeting chat",
        caption: "Caption",
        unknownSpeaker: "Unknown",
      },
      pendingReply: "Assistant is preparing a reply for this moment.",
      ui: {
        toggleLiveLabel: "Live",
        readyTitle: "Assistant is ready",
        watchingSession: "Watching this session",
        watching: "Watching",
        waitingForMoment: "Waiting for a useful moment.",
        headerTitle: "AI Assistant",
        footerTitle: "AI assistant",
        panelAriaLabel: "AI assistant live guidance",
        openSettings: "Open assistant settings",
        setupBeforeEnable: "Finish OpenAI setup before turning assistant on",
        unavailableUntilOpenAi:
          "Assistant is unavailable until OpenAI is available again",
        turnOffForSession: "Turn assistant off for this session",
        turnOnForSession: "Turn assistant on for this session",
        openPanel: "Open assistant panel",
        collapsePanel: "Collapse assistant panel",
        resizePanel: "Resize assistant panel",
      },
    },
  },
  popup: {
    header: {
      devBadge: "Dev",
      openMeetingHistory: "Open meeting history",
      openSettings: "Open settings",
    },
    setup: {
      verificationNotTested: "Not tested",
      notConfigured: "OpenAI not configured",
      setupRequired: {
        label: "Setup required",
        description: "Add your OpenAI API key and choose a model.",
      },
      needsAttention: {
        label: "Needs attention",
        description: "Review the OpenAI setup in Settings.",
      },
      ready: {
        label: "Ready",
        description: "OpenAI, model, and target language are ready for live output.",
      },
      verifySetup: {
        label: "Verify setup",
        description: "Run one connection test in Settings to confirm the OpenAI setup.",
      },
    },
    overlay: {
      badge: "Overlay",
      title: "Live visibility",
      switchAriaLabel: "Toggle live overlay visibility",
      switchDisabledTitle:
        "Enable capture startup in Settings to use live visibility.",
      state: {
        inactive: "Inactive",
        visible: "Visible",
        hidden: "Hidden",
      },
      mode: {
        captureStartupOff: "Capture startup is off",
        available: "Overlay stays available",
        hidden: "Overlay stays hidden",
      },
      helper: {
        captureStartupOff:
          "Live visibility becomes available after Startup is set to Ask or Always in Settings.",
        instantToggle:
          "Instant toggle for open meetings. Position, size, and compact state are remembered per meeting app.",
      },
    },
    pulse: {
      title: "Workspace Pulse",
    },
    rows: {
      live: {
        capturing: {
          label: "Capturing live",
          detail: "{platform} is actively listening in this tab.",
          badge: "Live",
        },
        lobby: {
          label: "Ready when you join",
          detail: "{platform} is open and standing by in the lobby.",
          badge: "Lobby",
        },
        startupOff: {
          label: "Capture startup is off",
          detail: "Turn Startup back to Ask or Always when you want live listening again.",
          badge: "Off",
        },
        idle: {
          label: "No live meeting",
          detail: "Open a supported meeting tab and CaptionArc will wake up here.",
          badge: "Idle",
        },
      },
      summary: {
        busy: {
          label: "AI summary is working",
          detail: "A meeting recap is being assembled in the background.",
          badge: "Busy",
        },
        failed: {
          label: "Summary needs attention",
          detail: "The last summary did not finish cleanly.",
          badge: "Retry",
        },
        automatic: {
          label: "Auto summary is armed",
          detail: "{profileName} will start a recap on its own after each meeting ends.",
          badge: "Auto",
        },
        manual: {
          label: "Manual summary mode",
          detail: "Nothing is queued right now. Summaries only run when you ask for one.",
          badge: "Manual",
        },
        defaultProfileName: "The default profile",
      },
      archive: {
        empty: {
          label: "Archive is still empty",
          detail: "Your saved meetings and summaries will start collecting here once capture runs.",
          badge: "New",
        },
        ready: {
          label: "{count} meetings saved",
          detail: "{used} used. {updated}.",
        },
      },
    },
    relativeTime: {
      noMeetingsSaved: "No meetings saved yet",
      updatedJustNow: "Updated just now",
      updatedMinutesAgo: "Updated {minutes}m ago",
      updatedHoursAgo: "Updated {hours}h ago",
      updatedDaysAgo: "Updated {days}d ago",
    },
    meta: {
      aiService: "AI service",
      model: "Model",
      target: "Target",
      startup: "Startup",
      modelNotSelected: "Not selected",
      pendingIndicator: "OpenAI has not been verified yet.",
      startupValues: {
        off: "Off",
        always: "Always",
        ask: "Ask",
      },
    },
    footer: {
      version: "v{version}",
      copyright: "© {year} CaptionArc",
    },
  },
} as const satisfies MessageTree;
