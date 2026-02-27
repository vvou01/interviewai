import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "Can the interviewer see the coaching overlay?",
    a: "Absolutely not. The coaching overlay runs as a Chrome extension floating window visible only on your screen. It never appears in your video feed or shared screen.",
  },
  {
    q: "Which video call platforms are supported?",
    a: "InterviewAI works with Google Meet, Zoom (web version), and Microsoft Teams. Any browser-based video call tool is supported.",
  },
  {
    q: "How does the AI know what to coach me on?",
    a: "Before the interview, you provide your CV and the job description. The AI uses this context along with the live transcript to generate personalized answer frameworks and suggestions.",
  },
  {
    q: "Is my data private and secure?",
    a: "Yes. All transcripts and coaching data are encrypted and strictly private to your account. We never share your interview data with anyone, including the companies you interview with.",
  },
  {
    q: "What happens if I'm on the Free plan?",
    a: "Free users get transcript capture and a basic debrief report for up to 2 interviews per month. To unlock real-time AI coaching, upgrade to Pro or Pro+.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium text-slate-200 pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}