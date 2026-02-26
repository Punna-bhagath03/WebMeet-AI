import React from 'react';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import PsychologyAltOutlinedIcon from '@mui/icons-material/PsychologyAltOutlined';
import ScreenShareOutlinedIcon from '@mui/icons-material/ScreenShareOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';

export default function LandingPage() {
  const router = useNavigate();

  return (
    <div className="landingPageContainer">
      <header className="landingHeader">
        <div className="landingBrand">
          <div className="landingBrandIcon">
            <VideocamOutlinedIcon fontSize="small" />
          </div>
          <h2>WebMeet AI</h2>
        </div>
        <div className="landingNavActions">
          <button
            type="button"
            className="landingNavTextButton"
            onClick={() => {
              router('/aljk23');
            }}
          >
            Join Meeting
          </button>
          <button
            type="button"
            className="landingPrimaryButton landingHeaderButton"
            onClick={() => {
              router('/auth');
            }}
          >
            Get Started
          </button>
        </div>
      </header>

      <main className="landingContent">
        <section className="landingHeroSection">
          <div className="landingHeroBadge">
            <span className="landingHeroBadgeDot" />
            Secure Professional Meetings
          </div>

          <h1 className="landingHeroTitle">
            Productive meetings
            <span>reimagined for teams.</span>
          </h1>

          <p className="landingHeroDescription">
            Experience clean, stable, and professional video conferencing.
            <br />
            Designed for clarity and effortless collaboration.
          </p>
        </section>

        <section className="landingFeatureSection">
          <div className="landingFeatureActions">
            <button
              type="button"
              className="landingPrimaryButton landingFeatureActionButton"
              onClick={() => {
                router('/auth');
              }}
            >
              Create Meeting
              <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="landingSecondaryButton landingFeatureActionButton"
              onClick={() => {
                router('/aljk23');
              }}
            >
              Join Meeting
            </button>
          </div>

          <div className="landingFeatureGrid">
          <article className="landingFeatureCard">
            <div className="landingFeatureIconWrap">
              <VideocamOutlinedIcon />
            </div>
            <h3>Real-time Video</h3>
            <p>
              Ultra-low latency HD video
              <br />
              calling powered by WebRTC.
            </p>
          </article>

          <article className="landingFeatureCard">
            <div className="landingFeatureIconWrap">
              <PsychologyAltOutlinedIcon />
            </div>
            <h3>AI-ready insights</h3>
            <p>
              Built for the future with scalable
              <br />
              architecture for AI integration.
            </p>
          </article>

          <article className="landingFeatureCard">
            <div className="landingFeatureIconWrap">
              <ScreenShareOutlinedIcon />
            </div>
            <h3>Screen Sharing</h3>
            <p>
              Share your screen instantly with
              <br />
              high-fidelity streaming.
            </p>
          </article>

          <article className="landingFeatureCard">
            <div className="landingFeatureIconWrap">
              <ChatBubbleOutlineOutlinedIcon />
            </div>
            <h3>Live Chat</h3>
            <p>
              Integrated real-time messaging
              <br />
              during your meetings.
            </p>
          </article>

          <article className="landingFeatureCard">
            <div className="landingFeatureIconWrap">
              <ShieldOutlinedIcon />
            </div>
            <h3>Secure Rooms</h3>
            <p>
              End-to-end encrypted peer-to-
              <br />
              peer media streams.
            </p>
          </article>
          </div>
        </section>
      </main>
    </div>
  );
}
