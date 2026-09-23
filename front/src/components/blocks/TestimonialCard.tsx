import { text } from '@/lib/text';
import Image from 'next/image';
import { Quote } from 'lucide-react';
import type { Testimonial } from '@/lib/types';

export async function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const t = text('home.testimonials.types');

  return (
    <figure className="flex h-full flex-col rounded-card border border-ink/10 bg-paper p-5">
      <Quote className="size-5 shrink-0 fill-gold/25 text-gold" aria-hidden />

      <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-ink/85">
        {testimonial.content}
      </blockquote>

      <figcaption className="mt-6 flex items-center gap-3 border-t border-ink/10 pt-5">
        {testimonial.image ? (
          <Image
            src={testimonial.image}
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span aria-hidden className="size-10 shrink-0 rounded-full bg-sand" />
        )}

        <span className="leading-tight">
          <span className="block font-display text-sm font-bold text-ink">{testimonial.name}</span>
          <span className="block text-[0.8125rem] text-muted">
            {testimonial.role ?? t(testimonial.type)}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
