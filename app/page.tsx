/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */
import { Mic, FileText, Zap, MessageCircleQuestion, MessageCircleMore } from 'lucide-react';
import { demoLogin, geminiLogin } from '@/lib/actions/demo-login';
import WaitlistForm from '@/components/landing/waitlist-form';
import NestEmbed from '@/components/nest/nest-embed';
import './landing.css';

export const metadata = {
  title: { absolute: 'Magpie · Collect curiosities. Talk them through.' },
  description:
    'A personal wiki for the things you find interesting, with a conversation partner who remembers. Collect curiosities and talk them through.',
  openGraph: {
    title: 'Magpie · Collect curiosities. Talk them through.',
    description:
      'See your nest of curiosities and topics as a living constellation. A personal wiki for the things you find interesting, with a conversation partner who remembers.',
    url: 'https://magpie.wiki',
    siteName: 'Magpie',
    type: 'website',
    images: [
      {
        url: '/brand/og-nest.png',
        width: 1200,
        height: 630,
        alt: 'The Magpie community nest: a constellation of curiosities across subjects.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Magpie · Collect curiosities. Talk them through.',
    description: 'See your nest of curiosities and topics as a living constellation.',
    images: ['/brand/og-nest.png'],
  },
};

export default function LandingPage() {
  // Open demo access (one-click into the dogsled account) is on unless locked
  // down. Set DEMO_OPEN=false in Vercel to hide the "Try the demo" CTA.
  const demoOpen = process.env.DEMO_OPEN !== 'false';

  return (
    <main className="magpie-landing">
      <nav className="topnav">
        <div className="navwrap">
          <a href="#top" className="navlogo">
            <img src="/brand/magpie-mark.png" alt="Magpie" />
            <span className="nm">
              Magpie<span className="dot">.</span>
            </span>
          </a>
          <div className="navlinks">
            <a href="#how">How it works</a>
            <a href="#modes">Modes</a>
            <a href="#features">Features</a>
            <a href="#join" className="navcta">
              Join the waitlist
            </a>
          </div>
        </div>
      </nav>

      <header className="hero" id="top">
        <img className="mark" src="/brand/magpie-mark.png" alt="" />
        <h1 className="wordmark">
          Magpie<span className="dot">.</span>
        </h1>
        <p className="herotag">Collect curiosities. Talk them through.</p>
        <p className="herosub">
          A personal wiki for the things you find interesting, with a conversation partner who
          remembers.
        </p>
        <p className="heroline">
          Visualize connections in the <span className="accent">nest</span>.
        </p>
        <div className="hero-cta">
          <div className="herobtns">
            {demoOpen && (
              <form action={demoLogin} style={{ display: 'contents' }}>
                <input type="hidden" name="goNest" value="1" />
                <button type="submit" className="btn-secondary">
                  See the community nest
                </button>
              </form>
            )}
            <a href="/gemini" className="btn-primary">
              Enter the Gemini nest
            </a>
            {demoOpen ? (
              <form action={demoLogin} style={{ display: 'contents' }}>
                <input type="hidden" name="openAdd" value="1" />
                <button type="submit" className="btn-secondary">
                  Add a curiosity
                </button>
              </form>
            ) : (
              <a href="#how" className="btn-secondary">
                See how it works
              </a>
            )}
          </div>
          <a href="/gemini" className="hero-qr" aria-label="Scan or tap to enter the Gemini meetup nest">
            <img src="/brand/qr-gemini.svg" alt="QR code for magpie.wiki/gemini" />
            <p>scan for the Gemini meetup nest</p>
          </a>
        </div>
        <p className="scrollcue">scroll to explore</p>
      </header>

      <section id="nest-showcase">
        <div className="wrap">
          <p className="eyebrow">The Nest</p>
          <h2 className="section-title">
            See your nest of curiosities and topics as a living constellation.
          </h2>
          <p className="section-lede">
            Every dot is a real curiosity someone wanted to talk through, every thread a connection
            between them. Add yours and watch the nest grow.
          </p>
          <div className="nest-stage">
            <NestEmbed />
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <p className="eyebrow">Share the nest</p>
          <h2 className="section-title">Build a nest together.</h2>
          <p className="section-lede">
            Curiosity is more fun with company. Group accounts are coming: share a nest with
            friends, family, or your team, collect together, and watch one constellation grow from
            everyone's ideas. The community nest above is what that looks like.
          </p>
        </div>
      </section>

      <section id="gemini">
        <div className="wrap">
          <p className="eyebrow">Live at the Gemini meetup</p>
          <h2 className="section-title">Join the meetup nest.</h2>
          <p className="section-lede">
            We're presenting Magpie at the Gemini meetup and building a group nest live. Scan the
            code or tap the button and you're in: one shared account, one constellation, fed by
            the whole room.
          </p>
          <div className="gemini-row">
            <div className="gemini-qr">
              <img src="/brand/qr-gemini.svg" alt="QR code linking to magpie.wiki/gemini" />
              <p className="gemini-link">magpie.wiki/gemini</p>
            </div>
            <div className="gemini-action">
              <form action={geminiLogin} style={{ display: 'contents' }}>
                <button type="submit" className="btn-primary">
                  Enter the Gemini nest
                </button>
              </form>
              <p className="gemini-note">
                A shared account just for the meetup. Add a curiosity during the talk and watch it
                land in the constellation on screen.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="nest-cta-band">
        <div className="wrap">
          <p className="nest-count">150+ curiosities across 15 subjects, and growing.</p>
          <WaitlistForm />
        </div>
      </section>

      <section className="problem">
        <div className="wrap">
          <p className="big-quote">
            We have <span className="em">more thoughts</span> than we have places to put them. Most
            of them never come back when we need them.
          </p>
          <p className="below">
            Magpie is where the half-formed stuff goes to become something. A collection of your
            curiosities, with a conversation partner who remembers.
          </p>
        </div>
      </section>

      <section id="how">
        <div className="wrap">
          <p className="eyebrow">How it works</p>
          <h2 className="section-title">Three dimensions. One simple shape.</h2>
          <p className="section-lede">
            Every thought finds its place in a wiki that grows with you.{' '}
            <em>Subject. Topic. Facet.</em> Add bullets when something hits, then explore from any
            angle.
          </p>

          <div className="how-grid">
            <div className="how-step">
              <div className="num">01</div>
              <h3>Subject</h3>
              <p>
                The big buckets you care about. Books, history, AI, music, philosophy, whatever
                pulls you.
              </p>
              <p className="step-detail">your curiosity, organized</p>
            </div>
            <div className="how-step">
              <div className="num">02</div>
              <h3>Topic</h3>
              <p>
                A specific thread inside a subject. "Why do crows give gifts to the people who feed
                them?" Capture bullets as they come.
              </p>
              <p className="step-detail">a conversation you'd want to have</p>
            </div>
            <div className="how-step">
              <div className="num">03</div>
              <h3>Facet</h3>
              <p>
                Cross-cutting tags that connect topics across subjects. Paradoxes. Counterintuitive
                findings. Convergent ideas.
              </p>
              <p className="step-detail">where unexpected connections live</p>
            </div>
          </div>
        </div>
      </section>

      <section id="modes">
        <div className="wrap">
          <p className="eyebrow">Five modes</p>
          <h2 className="section-title">Five ways to look at any thought.</h2>
          <p className="section-lede">
            Every topic opens with the same five tabs. <em>Talk it through</em>, brief yourself, get
            challenged, find better questions, or pile up thoughts as they come.
          </p>

          <div className="modes-grid">
            <div className="mode-card">
              <div className="mode-icon">
                <MessageCircleMore size={20} />
              </div>
              <h3>Maggie</h3>
              <p>
                Talk it through with Maggie. She opens with a question made for your topic and riffs
                back with takes of her own.
              </p>
            </div>
            <div className="mode-card blue">
              <div className="mode-icon">
                <FileText size={20} />
              </div>
              <h3>Brief</h3>
              <p>
                A short, smart primer on the topic. The thing you wish a friend would send you
                before a dinner party.
              </p>
            </div>
            <div className="mode-card amber">
              <div className="mode-icon">
                <Zap size={20} />
              </div>
              <h3>Challenge</h3>
              <p>
                A hot take, a steelman, or a paradox you didn't see coming. Sharpens your thinking
                by pushing back on it.
              </p>
            </div>
            <div className="mode-card purple">
              <div className="mode-icon">
                <MessageCircleQuestion size={20} />
              </div>
              <h3>Questions</h3>
              <p>
                Open questions you could ask anyone. The kind that make other people feel
                interesting, not interrogated.
              </p>
            </div>
            <div className="mode-card red">
              <div className="mode-icon">
                <Mic size={20} />
              </div>
              <h3>Thoughts</h3>
              <p>
                Capture bullets as they come. Type or talk, every thought saves itself the moment
                you add it. When the pile gets interesting, Maggie organizes it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="secondbeat">
        <div className="wrap">
          <p className="line">
            What you collect <span className="em">comes out</span> in conversation.
          </p>
        </div>
      </section>

      <section id="features">
        <div className="wrap">
          <p className="eyebrow">What makes Magpie different</p>
          <h2 className="section-title">A thinking partner that compounds.</h2>
          <p className="section-lede">
            Most note apps are filing cabinets. Most AI chat is amnesia. Magpie is built so the
            things you capture <em>come back to you</em> when they matter.
          </p>

          <div className="feature-row">
            <div className="feature-text">
              <span className="feature-tag">Glints</span>
              <span className="soon">Coming soon</span>
              <h3>The connections you didn't notice.</h3>
              <p>
                A glint is light catching something shiny you already collected. As your wiki
                grows, Maggie catches them for you: things you wrote months ago that connect to
                whatever you're thinking about now.
              </p>
              <p>
                Not "Recommended for you." Not a feed. <em>"You wrote about this when..."</em>
              </p>
              <p>
                It starts with Rediscover, live in the app today: one tap spins you back to a
                curiosity you'd forgotten. Glints make the trip back smart.
              </p>
            </div>
            <div className="feature-visual">
              <p className="vh">Glints</p>
              <p className="vsub">worth a look this week</p>
              <div className="glint-item">
                <p className="glint-why">you wrote about this when Red Rising clicked for you</p>
                <p className="glint-title">Brave New World was the more accurate prediction</p>
              </div>
              <div className="glint-item">
                <p className="glint-why">from your Stoicism thread last Tuesday</p>
                <p className="glint-title">Why Nietzsche is wildly misread as a nihilist</p>
              </div>
              <div className="glint-item">
                <p className="glint-why">paired with your wolves topic</p>
                <p className="glint-title">Crows hold grudges for years</p>
              </div>
            </div>
          </div>

          <div className="feature-row reverse">
            <div className="feature-text">
              <span className="feature-tag purple">Draw Out</span>
              <span className="soon">Coming soon</span>
              <h3>Practice making someone else brilliant.</h3>
              <p>
                A role-play mode where you talk with a character who has something interesting to
                say but won't volunteer it. Your job is to draw it out.
              </p>
              <p>
                At the end, you get scored on conversational generosity.{' '}
                <em>Did the other person light up?</em>
              </p>
              <p>
                Be the most interesting person in the room by making everyone else feel like one.
              </p>
            </div>
            <div className="feature-visual">
              <p className="chat-meta">DIANE · retired air traffic controller</p>
              <div className="chat-bubble them">
                there was a night in 1997. the weather was bad, we had 14 planes in the pattern, one
                had a hydraulic issue. that's the one i remember most.
              </div>
              <div className="chat-bubble you">what happened that night?</div>
              <div className="chat-bubble them">
                we got them all down. nobody died. i went home and did not sleep for two days.
              </div>
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
                <div className="score-row">
                  <span className="lbl">Question ratio</span>
                  <span className="val">5 of 6</span>
                </div>
                <div className="score-row">
                  <span className="lbl">Did Diane light up?</span>
                  <span className="val">yes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <p className="eyebrow">Why Magpie</p>
          <h2 className="section-title">Notes that come back to you.</h2>
          <p className="section-lede">
            No streaks. No engagement metrics. No feed. Just the things you find interesting, and a
            partner who helps you turn them into <em>something you can say out loud</em>.
          </p>

          <div className="why-grid">
            <div className="why-card">
              <h3>Pull, never push</h3>
              <p>
                No notifications. No alerts. Magpie shows up when you do. The shiny things wait for
                you.
              </p>
            </div>
            <div className="why-card">
              <h3>No ads. Ever.</h3>
              <p>
                What you collect is yours. The connections Maggie surfaces serve you, not
                advertisers. Period.
              </p>
            </div>
            <div className="why-card">
              <h3>Yours to keep</h3>
              <p>
                Your wiki is your data, not ours. Export is coming, and Magpie will never lock you
                in.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="join" className="cta-block">
        <div className="wrap">
          <h2>
            Get on the <em>list</em>.
          </h2>
          <p>Magpie opens soon at magpie.wiki. Drop your email and you'll be among the first in.</p>
          <WaitlistForm />
          <p className="cta-note">No spam. No marketing emails. Just one note when it's ready.</p>
        </div>
      </section>

      <footer>
        <div className="footwrap">
          <div>
            <div className="footbrand">
              <img src="/brand/magpie-mark.png" alt="Magpie" />
              <span className="fw">
                Magpie<span className="dot">.</span>
              </span>
            </div>
            <p className="foottag">Collect curiosities. Talk them through.</p>
            <p className="footcontact">
              Built by Chris and Jessica at{' '}
              <a href="https://dogsled.dev" target="_blank" rel="noreferrer">
                dogsled.dev
              </a>
              <br />
              Questions?{' '}
              <a href="https://www.linkedin.com/in/dougherty4/" target="_blank" rel="noreferrer">
                ask Chris
              </a>
            </p>
          </div>
          <div className="footcol">
            <h4>Product</h4>
            <a href="#how">How it works</a>
            <a href="#modes">Five modes</a>
            <a href="#features">Glints &amp; Draw Out</a>
            <a href="#join">Join waitlist</a>
          </div>
          <div className="footcol">
            <h4>About</h4>
            <a href="https://dogsled.dev" target="_blank" rel="noreferrer">
              dogsled.dev
            </a>
            <a href="https://www.linkedin.com/in/dougherty4/" target="_blank" rel="noreferrer">
              Chris
            </a>
          </div>
        </div>
        <div className="footbottom">
          <span className="cright">© 2026 Magpie. All rights reserved.</span>
          <span className="built">
            Crafted at{' '}
            <a href="https://dogsled.dev" target="_blank" rel="noreferrer">
              dogsled.dev
            </a>
          </span>
        </div>
      </footer>
    </main>
  );
}
