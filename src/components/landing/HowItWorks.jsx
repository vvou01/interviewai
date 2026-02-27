import React from "react";
import { FileText, MonitorPlay, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { num: "01", icon: FileText, title: "Prepare", desc: "Upload your CV, enter the job details, and select the interview type. InterviewAI builds a personalized coaching strategy.", color: "bg-violet-100 text-violet-600" },
  { num: "02", icon: MonitorPlay, title: "Interview", desc: "Activate the Chrome extension during your video call. AI listens and provides real-time answer frameworks — only visible to you.", color: "bg-purple-100 text-purple-600" },
  { num: "03", icon: BarChart3, title: "Debrief", desc: "After the interview, get a full performance report with scoring, strengths, missed opportunities, and a follow-up email draft.", color: "bg-indigo-100 text-indigo-600" },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">How It <span className="gradient-text">Works</span></h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">Three simple steps to supercharge your next interview</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-md hover:border-violet-200 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center mb-6`}>
                <step.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-slate-400 mb-2 block">{step.num}</span>
              <h3 className="text-xl font-semibold mb-3 text-slate-900">{step.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}