import { anthropic } from "@ai-sdk/anthropic";
import {
  LanguageModelV1,
  LanguageModelV1StreamPart,
  LanguageModelV1Message,
} from "@ai-sdk/provider";

const MODEL = "claude-haiku-4-5";

export class MockLanguageModel implements LanguageModelV1 {
  readonly specificationVersion = "v1" as const;
  readonly provider = "mock";
  readonly modelId: string;
  readonly defaultObjectGenerationMode = "tool" as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractUserPrompt(messages: LanguageModelV1Message[]): string {
    // Find the last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "user") {
        const content = message.content;
        if (Array.isArray(content)) {
          // Extract text from content parts
          const textParts = content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          return textParts.join(" ");
        } else if (typeof content === "string") {
          return content;
        }
      }
    }
    return "";
  }

  private getLastToolResult(messages: LanguageModelV1Message[]): any {
    // Find the last tool message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "tool") {
        const content = messages[i].content;
        if (Array.isArray(content) && content.length > 0) {
          return content[0];
        }
      }
    }
    return null;
  }

  private async *generateMockStream(
    messages: LanguageModelV1Message[],
    userPrompt: string
  ): AsyncGenerator<LanguageModelV1StreamPart> {
    // Count tool messages to determine which step we're on
    const toolMessageCount = messages.filter((m) => m.role === "tool").length;

    // Determine component type from the original user prompt
    const promptLower = userPrompt.toLowerCase();
    let componentType = "counter";
    let componentName = "Counter";

    if (promptLower.includes("form")) {
      componentType = "form";
      componentName = "ContactForm";
    } else if (promptLower.includes("profile")) {
      componentType = "profile";
      componentName = "ProfileCard";
    } else if (promptLower.includes("card")) {
      componentType = "card";
      componentName = "Card";
    }

    // Step 1: Create component file
    if (toolMessageCount === 1) {
      const text = `Setting up the component structure...`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_1`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: `/components/${componentName}.jsx`,
          file_text: this.getComponentCode(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 2: Enhance component
    if (toolMessageCount === 2) {
      const text = `Applying styles and finishing touches...`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(25);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_2`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "str_replace",
          path: `/components/${componentName}.jsx`,
          old_str: this.getOldStringForReplace(componentType),
          new_str: this.getNewStringForReplace(componentType),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 3: Create App.jsx
    if (toolMessageCount === 0) {
      const text = `On it! I'll put together a ${componentName} component for you.`;
      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(15);
      }

      yield {
        type: "tool-call",
        toolCallType: "function",
        toolCallId: `call_3`,
        toolName: "str_replace_editor",
        args: JSON.stringify({
          command: "create",
          path: "/App.jsx",
          file_text: this.getAppCode(componentName),
        }),
      };

      yield {
        type: "finish",
        finishReason: "tool-calls",
        usage: {
          promptTokens: 50,
          completionTokens: 30,
        },
      };
      return;
    }

    // Step 4: Final summary (no tool call)
    if (toolMessageCount >= 3) {
      const text = `Your ${componentName} component is ready! Check out the live preview on the right.`;

      for (const char of text) {
        yield { type: "text-delta", textDelta: char };
        await this.delay(30);
      }

      yield {
        type: "finish",
        finishReason: "stop",
        usage: {
          promptTokens: 50,
          completionTokens: 50,
        },
      };
      return;
    }
  }

  private getComponentCode(componentType: string): string {
    switch (componentType) {
      case "form":
        return `import React, { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-10 bg-gradient-to-br from-emerald-950 to-teal-900 rounded-2xl text-center">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Message sent!</h2>
        <p className="text-emerald-300 text-sm">We'll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden">
      <div className="px-8 pt-8 pb-4">
        <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase mb-1">Get in touch</p>
        <h2 className="text-3xl font-black text-white tracking-tight">Contact Us</h2>
      </div>
      <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
          <input
            type="text" name="name" value={formData.name} onChange={handleChange} required
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
          <input
            type="email" name="email" value={formData.email} onChange={handleChange} required
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Message</label>
          <textarea
            name="message" value={formData.message} onChange={handleChange} required rows={4}
            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
            placeholder="What's on your mind?"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 px-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] tracking-wide"
        >
          Send Message
        </button>
      </form>
    </div>
  );
};

export default ContactForm;`;

      case "profile":
        return `import React from 'react';

const ProfileCard = ({
  name = "Alex Rivera",
  handle = "@alexrivera",
  bio = "Product designer & creative developer. Building things that feel good to use.",
  followers = 12400,
  following = 348,
  posts = 92,
  avatarInitials = "AR",
}) => {
  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;

  return (
    <div className="w-80 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50">
      <div className="h-24 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500" />
      <div className="px-6 pb-6">
        <div className="-mt-10 mb-4 flex items-end justify-between">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white text-2xl font-black border-4 border-slate-900">
            {avatarInitials}
          </div>
          <button className="mb-1 px-4 py-1.5 rounded-full bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 transition-all hover:scale-105 active:scale-95">
            Follow
          </button>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-black text-white tracking-tight">{name}</h2>
          <p className="text-fuchsia-400 text-sm font-medium">{handle}</p>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mb-6">{bio}</p>
        <div className="flex justify-between border-t border-slate-700/50 pt-4">
          {[['Posts', posts], ['Followers', followers], ['Following', following]].map(([label, val]) => (
            <div key={label} className="text-center">
              <p className="text-white text-lg font-black">{fmt(val)}</p>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;`;

      case "card":
        return `import React from 'react';

const Card = ({
  title = "Introducing Horizon",
  description = "A new way to think about your workflow. Faster, smarter, and built for teams that ship.",
  tag = "New",
  actions,
}) => {
  return (
    <div className="w-80 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/40">
      <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-500" />
      <div className="p-7">
        {tag && (
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">
            {tag}
          </span>
        )}
        <h3 className="text-2xl font-black text-white tracking-tight mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">{description}</p>
        {actions ? (
          <div>{actions}</div>
        ) : (
          <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 font-bold text-sm tracking-wide hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]">
            Learn More
          </button>
        )}
      </div>
    </div>
  );
};

export default Card;`;

      default:
        return `import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center gap-8 p-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/40 w-64">
      <div>
        <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase text-center mb-1">Counter</p>
        <div className="text-7xl font-black text-white tabular-nums tracking-tight">{count}</div>
      </div>
      <div className="flex gap-3 w-full">
        <button
          onClick={() => setCount(c => c - 1)}
          className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-lg transition-all hover:scale-105 active:scale-95"
        >−</button>
        <button
          onClick={() => setCount(0)}
          className="px-3 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 font-bold text-xs tracking-widest uppercase transition-all"
        >Reset</button>
        <button
          onClick={() => setCount(c => c + 1)}
          className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-lg transition-all hover:scale-105 active:scale-95"
        >+</button>
      </div>
    </div>
  );
};

export default Counter;`;
    }
  }

  private getOldStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    setSubmitted(true);";
      case "profile":
        return "  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;";
      case "card":
        return '        <h3 className="text-2xl font-black text-white tracking-tight mb-2">{title}</h3>';
      default:
        return "  const increment = () => setCount(count + 1);";
    }
  }

  private getNewStringForReplace(componentType: string): string {
    switch (componentType) {
      case "form":
        return "    setSubmitted(true);\n    console.log('Form submitted:', formData);";
      case "profile":
        return "  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);";
      case "card":
        return '        <h3 className="text-2xl font-black text-white tracking-tight mb-2 leading-tight">{title}</h3>';
      default:
        return "  const increment = () => setCount(prev => prev + 1);";
    }
  }

  private getAppCode(componentName: string): string {
    if (componentName === "ProfileCard") {
      return `import ProfileCard from '@/components/ProfileCard';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <ProfileCard />
    </div>
  );
}`;
    }

    if (componentName === "Card") {
      return `import Card from '@/components/Card';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <Card />
    </div>
  );
}`;
    }

    return `import ${componentName} from '@/components/${componentName}';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <${componentName} />
    </div>
  );
}`;
  }

  async doGenerate(
    options: Parameters<LanguageModelV1["doGenerate"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doGenerate"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);

    // Collect all stream parts
    const parts: LanguageModelV1StreamPart[] = [];
    for await (const part of this.generateMockStream(
      options.prompt,
      userPrompt
    )) {
      parts.push(part);
    }

    // Build response from parts
    const textParts = parts
      .filter((p) => p.type === "text-delta")
      .map((p) => (p as any).textDelta)
      .join("");

    const toolCalls = parts
      .filter((p) => p.type === "tool-call")
      .map((p) => ({
        toolCallType: "function" as const,
        toolCallId: (p as any).toolCallId,
        toolName: (p as any).toolName,
        args: (p as any).args,
      }));

    // Get finish reason from finish part
    const finishPart = parts.find((p) => p.type === "finish") as any;
    const finishReason = finishPart?.finishReason || "stop";

    return {
      text: textParts,
      toolCalls,
      finishReason: finishReason as any,
      usage: {
        promptTokens: 100,
        completionTokens: 200,
      },
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        },
      },
    };
  }

  async doStream(
    options: Parameters<LanguageModelV1["doStream"]>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV1["doStream"]>>> {
    const userPrompt = this.extractUserPrompt(options.prompt);
    const self = this;

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        try {
          const generator = self.generateMockStream(options.prompt, userPrompt);
          for await (const chunk of generator) {
            controller.enqueue(chunk);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return {
      stream,
      warnings: [],
      rawCall: {
        rawPrompt: options.prompt,
        rawSettings: {},
      },
      rawResponse: { headers: {} },
    };
  }
}

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.log("No ANTHROPIC_API_KEY found, using mock provider");
    return new MockLanguageModel("mock-claude-sonnet-4-0");
  }

  return anthropic(MODEL);
}
