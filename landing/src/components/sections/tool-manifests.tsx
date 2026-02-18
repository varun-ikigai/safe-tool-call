"use client";

import { motion } from "framer-motion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { TOOL_MANIFEST_FEATURES } from "@/lib/constants";

const CODE_EXAMPLE = `defineTool({
  name: "get_customer",                   
  description: "Retrieve a customer by ID",
  classification: "read",                 
  
  permissions: {
    required: ["customer-data:read"],    
  },

  input: z.object({
    customerId: z.string().uuid(),        
  }),

  outputPolicy: {
    ".customer.id": "allow",
    ".customer.status": "allow",
    ".customer.fullName": "mask",        
    "..email": "redact",               
  },

  handler: cliCommand({                    
    command: "customer-cli",
    argsBuilder: (input) => ["get", input.customerId],
  }),
})`;

const ANNOTATIONS = [
  { line: 1, text: "snake_case, LLM function name", color: "text-brand-purple" },
  { line: 3, text: "read | write | destructive", color: "text-brand-cyan" },
  { line: 6, text: "JWT must have this", color: "text-brand-muted" },
  { line: 9, text: "Zod validates before execution", color: "text-brand-cyan" },
  { line: 14, text: '"J*** S****"', color: "text-brand-purple" },
  { line: 15, text: "stripped entirely", color: "text-brand-purple" },
  { line: 19, text: "or grpcMethod()", color: "text-brand-muted" },
];

export function ToolManifests() {
  return (
    <section className="bg-brand-dark py-24 md:py-32">
      <motion.div
        className="mx-auto max-w-7xl px-6 lg:px-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div variants={fadeInUp} className="mb-4">
          <Eyebrow>DEVELOPER EXPERIENCE</Eyebrow>
        </motion.div>

        <motion.h2
          variants={fadeInUp}
          className="mb-6 text-4xl font-light tracking-tight text-white md:text-5xl"
        >
          15 lines of TypeScript.
          <br />
          That&apos;s your entire tool manifest.
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="mb-12 max-w-2xl text-lg text-brand-muted"
        >
          Author manifests alongside your capabilities. Type-safe, validated, and
          enforceable. The proxy handles authentication, transport, and audit.
        </motion.p>

        {/* Code block */}
        <motion.div variants={fadeInUp} className="mb-12">
          <div className="rounded-xl border border-brand-dark-quaternary/40 bg-[#0a0020] overflow-hidden">
            {/* Title bar */}
            <div className="flex items-center justify-between border-b border-brand-dark-quaternary/30 px-4 py-2">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500/60" />
                <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                <div className="h-2 w-2 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-brand-muted/40">tool-manifest.ts</span>
            </div>

            {/* Code */}
            <div className="relative p-4 overflow-x-auto">
              <pre className="text-sm font-mono leading-relaxed">
                {CODE_EXAMPLE.split("\n").map((line, i) => {
                  const lineNum = i + 1;
                  const annotation = ANNOTATIONS.find((a) => a.line === lineNum);
                  return (
                    <div key={i} className="group relative">
                      <code className="text-brand-muted/80">{line}</code>
                      {annotation && (
                        <span
                          className={`absolute left-full ml-4 whitespace-nowrap text-xs opacity-0 transition-opacity group-hover:opacity-100 ${annotation.color}`}
                        >
                          {annotation.text}
                        </span>
                      )}
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap justify-center gap-4"
        >
          {TOOL_MANIFEST_FEATURES.map((feature, i) => (
            <span
              key={i}
              className="rounded-full bg-brand-dark-tertiary/50 px-4 py-2 text-sm text-brand-muted"
            >
              {feature}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
