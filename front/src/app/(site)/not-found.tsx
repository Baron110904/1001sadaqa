import { text } from '@/lib/text';
import { ActionLink } from '@/components/ui/Button';

export default function NotFound() {
  const t = text('notFound');

  return (
    <section className="bg-ink-gradient relative isolate flex min-h-[70vh] items-center overflow-hidden">
      <div className="grain absolute inset-0" aria-hidden />

      <div className="container-page relative text-center">
        <p className="font-display text-7xl font-bold tracking-tight text-gold/35 tabular md:text-9xl">
          {t('code')}
        </p>

        <h1 className="text-title mt-6 text-paper">{t('title')}</h1>

        <p className="mx-auto mt-4 max-w-md text-[0.9375rem] text-paper/70">{t('body')}</p>

        <div className="mt-9 flex justify-center">
          <ActionLink href="/">{t('cta')}</ActionLink>
        </div>
      </div>
    </section>
  );
}
