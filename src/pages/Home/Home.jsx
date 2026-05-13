import Hero from '@/components/home/Hero/Hero';
import ProblemStats from '@/components/home/ProblemStats/ProblemStats';
import HowItWorks from '@/components/home/HowItWorks/HowItWorks';
import LiveAlerts from '@/components/home/LiveAlerts/LiveAlerts';
import MapPreview from '@/components/home/MapPreview/MapPreview';
import Testimonials from '@/components/home/Testimonials/Testimonials';
import CTAFinal from '@/components/home/CTAFinal/CTAFinal';

export default function Home() {
  return (
    <main>
      <Hero />
      <ProblemStats />
      <HowItWorks />
      <LiveAlerts />
      <MapPreview />
      <Testimonials />
      <CTAFinal />
    </main>
  );
}
