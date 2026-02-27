import React from "react";
import { FileText, MonitorPlay, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    icon: FileText,
    title: "Prepare",
    desc: "Upload your CV, enter the job details, and select the interview type. InterviewAI builds a personalized coaching strategy.",
    color: "from-indigo-500 to-blue-500",
  },
  {
    num: "02",
    icon: MonitorPlay,
    title: "Interview",
    desc: "Activate the Chrome extension during your video call. AI listens and provides real-time answer frameworks and coaching — only visible to you.",
    color: "from-violet-500 to-purple-500",
  },
  {
    num: "03",
    icon: BarChart3,
    title: "Debrief",
    desc: "After the interview, get a full performance report with scoring, strengths, missed opportunities, and a ready-to-send follow-up email.",
    color: "from-blue-500 to-cyan-500",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Three simple steps to supercharge your next interview
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card p-8 group glass-card-hover"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-mono text-slate-600 mb-2 block">{step.num}</span>
              <h3 className="text-xl font-semibold mb-3 text-white">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}