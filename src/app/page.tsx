import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  { id: 'vetrumai', name: 'Vetrumai', tamil: 'வேற்றுமை' },
  { id: 'seyyul_pazhamozhi', name: 'Poetry/Proverbs', tamil: 'செய்யுள்/பழமொழி' },
  { id: 'adaimozhi_echcham', name: 'Adjectives', tamil: 'அடைமொழி/எச்சம்' },
  { id: 'comprehension', name: 'Comprehension', tamil: 'படிப்புணர்வு' },
  { id: 'sorporul', name: 'Word Meanings', tamil: 'சொற்பொருள்' },
  { id: 'oli_verupaadu', name: 'Sound Diff', tamil: 'ஒலி வேறுபாடு' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-orange-600">TamilPSLE</span>
            <span className="font-tamil text-lg text-orange-500">தமிழ்</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Master Tamil for{' '}
          <span className="text-orange-600">PSLE</span>
        </h1>
        <p className="font-tamil mb-2 text-2xl text-orange-600">தமிழ் PSLE பயிற்சி</p>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
          Practice MCQ questions, get instant word meanings, and track your progress.
          Designed for Singapore primary school students preparing for PSLE Tamil.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
              Start Practicing Free
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Log in
            </Button>
          </Link>
        </div>
      </section>

      {/* Practice Sections */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-8 text-center text-2xl font-semibold text-gray-900">
          Practice Sections
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Card key={section.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{section.name}</CardTitle>
                <CardDescription className="font-tamil text-base">
                  {section.tamil}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/login?redirect=/practice/${section.id}`}>
                  <Button variant="outline" className="w-full">
                    Practice
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-orange-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-2xl font-semibold text-gray-900">
            Why TamilPSLE?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="mb-2 font-semibold">PSLE-Aligned Questions</h3>
              <p className="text-sm text-gray-600">
                Practice with questions designed to match the PSLE Tamil exam format.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <span className="text-2xl">📖</span>
              </div>
              <h3 className="mb-2 font-semibold">Instant Word Meanings</h3>
              <p className="text-sm text-gray-600">
                Tap any Tamil word to see its meaning in context. Save words to review later.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="mb-2 font-semibold">Track Progress</h3>
              <p className="text-sm text-gray-600">
                See your scores, review mistakes, and watch your improvement over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; 2026 TamilPSLE. Built for Singapore students.</p>
        </div>
      </footer>
    </div>
  );
}
