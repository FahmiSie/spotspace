"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ArrowLeft } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message is too short (minimum 10 characters)"),
});

type FormData = z.infer<typeof schema>;

export default function ContactPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await api.post("/contact", data);
      setSuccess(true);
      reset();
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Failed to send message. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-stone/20 pt-24 pb-12 px-6">
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1"/>
          <span>Back</span>
        </button>
      </div>
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-stone p-8 md:p-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold text-ink mb-4">Contact Us</h1>
          <p className="text-ink">
            Have questions about SpotSpace? Want to list your coworking space? Send us a message and we'll get back to you as soon as possible.
          </p>
        </div>

        {success ? (
          <div className="bg-status-success/10 border border-status-success/20 rounded-xl p-8 text-center flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-status-success mb-4" />
            <h3 className="font-display text-xl font-bold text-ink mb-2">Message Sent!</h3>
            <p className="text-ink mb-6">
              Thank you for reaching out. We have received your message and will respond shortly.
            </p>
            <Button onClick={() => setSuccess(false)} variant="outline">
              Send another message
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Name</label>
                <Input placeholder="Your full name" {...register("name")} />
                {errors.name && <p className="text-sm text-status-cancelled mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Email</label>
                <Input placeholder="your.email@example.com" type="email" {...register("email")} />
                {errors.email && <p className="text-sm text-status-cancelled mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">Subject</label>
              <Input placeholder="What is this regarding?" {...register("subject")} />
              {errors.subject && <p className="text-sm text-status-cancelled mt-1">{errors.subject.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-2">Message</label>
              <Textarea 
                placeholder="Write your message here..." 
                className="min-h-[150px] resize-y"
                {...register("message")} 
              />
              {errors.message && <p className="text-sm text-status-cancelled mt-1">{errors.message.message}</p>}
            </div>

            {serverError && (
              <div className="p-4 bg-status-cancelled/10 text-status-cancelled rounded-lg text-sm">
                {serverError}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full bg-[#EF6905] hover:bg-[#EF6905]/90 py-6 text-base font-semibold text-white"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
